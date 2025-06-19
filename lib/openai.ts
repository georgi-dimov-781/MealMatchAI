/*
 * AI Integration Module for Recipe Generation
 * 
 * This module provides a unified interface for AI text generation services.
 * Currently implemented with Google's Gemini API for demo purposes (as it offers free access),
 * but can be easily adapted to work with other AI models like:
 * - OpenAI's GPT models
 * - Anthropic's Claude
 * - Open source models via local API or services like Hugging Face
 * 
 * The interface is designed to be model-agnostic, accepting messages in a standard format
 * and returning content in a consistent structure that can be used throughout the application.
 * 
 * To adapt this file for a different AI model:
 * 1. Update the API endpoint URL
 * 2. Modify the request payload format to match the target API
 * 3. Update the response parsing logic
 * 4. Adjust environment variable names as needed
 */

interface Message {
  role: string;
  content: string;
}

interface AIOptions {
  model?: string;
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
}

// Try to use server-side env var first, then client-side, then fallback to empty string
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY || '';
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent';

const ai = {
  chat: async (messages: Message[], options: AIOptions = {}) => {
    try {
      console.log('Using Gemini API service for recipe generation...');
      
      // Check if API key is available
      if (!GEMINI_API_KEY) {
        throw new Error('Gemini API key is not configured. Please check your environment variables.');
      }

      // Extract the user message and system message
      const userMessage = messages.find(m => m.role === 'user')?.content || '';
      const systemMessage = messages.find(m => m.role === 'system')?.content || '';

      // Combine system and user messages into a single prompt for Gemini
      const prompt = systemMessage ? `${systemMessage}\n\n${userMessage}` : userMessage;

      // Prepare the request body for Gemini API
      const requestBody = {
        contents: [
          {
            parts: [
              {
                text: prompt
              }
            ]
          }
        ],
        generationConfig: {
          temperature: options.temperature || 0.7,
          maxOutputTokens: options.max_tokens || 1000,
          topP: 0.8,
          topK: 10
        }
      };

      // Make the API call to Gemini
      const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log('Gemini API response received successfully:', data);

      // Extract content from Gemini response
      let content = '';
      if (data.candidates && data.candidates.length > 0) {
        const candidate = data.candidates[0];
        if (candidate.content && candidate.content.parts && candidate.content.parts.length > 0) {
          content = candidate.content.parts[0].text;
        }
      }

      if (!content) {
        throw new Error('Empty response from Gemini API service');
      }

      // Return the response in the expected format
      return {
        content: content
      };

    } catch (error) {
      console.error('Gemini API service error:', error);
      throw error;
    }
  }
};

export default ai;
