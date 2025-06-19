import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { Search, History, Trash2 } from 'lucide-react';
import styles from '../styles/AIRemix.module.css';
import ai from '../lib/openai';
import { saveAIRemixHistory, getAIRemixHistory, deleteAIRemixHistory, clearAllAIRemixHistory } from '../lib/database';

interface RemixSuggestion {
  id: string;
  type: 'substitution' | 'variation' | 'new_recipe';
  title: string;
  description: string;
  ingredients: string[];
  instructions?: string[];
}

export default function AIRemix() {
  const [ingredients, setIngredients] = useState('');
  const [originalRecipe, setOriginalRecipe] = useState('');
  const [remixType, setRemixType] = useState<'substitution' | 'variation' | 'new_recipe'>('new_recipe');
  const [suggestions, setSuggestions] = useState<RemixSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [history, setHistory] = useState<{
    id: string;
    timestamp: string;
    ingredients: string;
    remix_type: string;
    suggestions: RemixSuggestion[];
  }[]>([]);

  // Load history from Supabase on component mount
  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const data = await getAIRemixHistory();
      const formattedHistory = data.map(entry => ({
        id: entry.id,
        timestamp: entry.timestamp,
        ingredients: entry.ingredients,
        remix_type: entry.remix_type,
        suggestions: entry.suggestions
      }));
      setHistory(formattedHistory);
    } catch (error) {
      console.error('Error loading history from Supabase:', error);
    }
  };

  // Save to history when new suggestions are generated
  const saveToHistory = async (newSuggestions: RemixSuggestion[]) => {
    try {
      const historyEntry = {
        userId: 'anonymous', // Will be replaced with actual user ID when auth is implemented
        ingredients,
        remixType,
        suggestions: newSuggestions
      };

      await saveAIRemixHistory(historyEntry);
      await loadHistory(); // Reload history to get the latest data
    } catch (error) {
      console.error('Error saving history to Supabase:', error);
    }
  };

  // Clear all history
  const clearHistory = async () => {
    try {
      await clearAllAIRemixHistory();
      setHistory([]);
    } catch (error) {
      console.error('Error clearing history from Supabase:', error);
    }
  };

  // Remove single history entry
  const removeHistoryEntry = async (id: string) => {
    try {
      await deleteAIRemixHistory(id);
      await loadHistory(); // Reload history to reflect the changes
    } catch (error) {
      console.error('Error removing history entry from Supabase:', error);
    }
  };

  const generateRemix = async () => {
    if (!ingredients.trim()) return;

    setLoading(true);
    setError('');
    
    try {
      // Create the prompt based on remix type
      let userPrompt = '';
      switch (remixType) {
        case 'substitution':
          userPrompt = `I have these ingredients: ${ingredients}. ${originalRecipe ? `For this recipe: ${originalRecipe}` : ''} 
          Please suggest 3 different ingredient substitutions that would work well. For each suggestion, provide:
          1. A title
          2. A description of what you're substituting and why
          3. The modified ingredient list
          4. Brief cooking notes if needed
          
          Respond with a JSON object containing a "suggestions" array. Each suggestion should have: id, type, title, description, ingredients (array), and optionally instructions (array).`;
          break;

        case 'variation':
          userPrompt = `I have these ingredients: ${ingredients}. ${originalRecipe ? `Based on this recipe: ${originalRecipe}` : ''} 
          Please create 3 different recipe variations. For each variation, provide:
          1. A creative title
          2. A description of how it differs
          3. Complete ingredient list
          4. Step-by-step instructions
          
          Respond with a JSON object containing a "suggestions" array. Each suggestion should have: id, type, title, description, ingredients (array), and instructions (array).`;
          break;

        case 'new_recipe':
          userPrompt = `I have these ingredients: ${ingredients}. 
          Please create 3 completely new recipe ideas using primarily these ingredients. For each recipe, provide:
          1. A creative recipe name
          2. A description of the dish and cuisine style
          3. Complete ingredient list (you can add common pantry staples)
          4. Step-by-step cooking instructions
          
          Respond with a JSON object containing a "suggestions" array. Each suggestion should have: id, type, title, description, ingredients (array), and instructions (array).`;
          break;
      }

      const systemPrompt = "You are a creative chef AI that helps people create recipes. Always respond with valid JSON containing a 'suggestions' array. Each suggestion should have: id, type, title, description, ingredients (array), and optionally instructions (array). Generate exactly 3 suggestions.";

      console.log('Calling Gemini AI service...');
      
      // Call Gemini AI service
      const response = await ai.chat([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ], {
        temperature: 0.8,
        max_tokens: 2000
      });

      console.log('Gemini AI response:', response);

      let content = response.content;
      if (!content) {
        throw new Error('Empty response from Gemini AI service');
      }

      // Clean up markdown code blocks if present
      let cleanContent = content;
      if (typeof content === 'string') {
        // Remove markdown code blocks
        cleanContent = content.replace(/```json\s*|\s*```/g, '').trim();
      }

      console.log('Cleaned AI response:', cleanContent);

      // Parse the AI response as JSON
      let suggestions: RemixSuggestion[];
      try {
        const parsed = typeof cleanContent === 'string' ? JSON.parse(cleanContent) : cleanContent;
        suggestions = parsed.suggestions || parsed;
        
        if (!Array.isArray(suggestions)) {
          throw new Error('AI response is not in expected format (missing suggestions array)');
        }
      } catch (parseError) {
        console.error('Failed to parse AI response as JSON:', parseError);
        console.error('Raw AI response:', content);
        console.error('Cleaned AI response:', cleanContent);
        throw new Error('Invalid JSON response from AI service');
      }
      
      // Ensure each suggestion has required fields and proper ID
      suggestions = suggestions.map((suggestion, index) => ({
        ...suggestion,
        id: suggestion.id || `suggestion-${Date.now()}-${index}`,
        type: remixType
      }));

      console.log(`Generated ${suggestions.length} recipe suggestions successfully`);
      setSuggestions(suggestions);
      await saveToHistory(suggestions);

    } catch (error) {
      console.error('Error generating remix:', error);
      setError(error instanceof Error ? error.message : 'Failed to generate suggestions');
      
      // Create fallback suggestions if AI fails
      const fallbackSuggestions = createFallbackSuggestions();
      setSuggestions(fallbackSuggestions);
      await saveToHistory(fallbackSuggestions);
    } finally {
      setLoading(false);
    }
  };

  const createFallbackSuggestions = (): RemixSuggestion[] => {
    const ingredientList = ingredients.split(',').map(ing => ing.trim()).filter(ing => ing.length > 0);
    const mainIngredients = ingredientList.slice(0, 4);
    
    const suggestions: RemixSuggestion[] = [];
    
    const recipeSuggestions = [
      {
        title: `${mainIngredients[0] || 'Ingredient'} Stir-Fry`,
        description: `A quick and easy stir-fry featuring ${mainIngredients.slice(0, 3).join(', ')}. Perfect for a weeknight dinner.`,
        instructions: [
          'Heat oil in a large pan or wok over medium-high heat',
          `Add ${mainIngredients[0] || 'main ingredient'} and cook for 3-4 minutes`,
          'Add remaining vegetables and stir-fry for 2-3 minutes',
          'Season with salt, pepper, and your favorite sauce',
          'Serve hot over rice or noodles'
        ]
      },
      {
        title: `Hearty ${mainIngredients[0] || 'Ingredient'} Soup`,
        description: `A comforting soup that makes great use of ${mainIngredients.slice(0, 2).join(' and ')}. Warming and nutritious.`,
        instructions: [
          'In a large pot, heat oil and sauté aromatics',
          `Add ${mainIngredients[0] || 'main ingredient'} and cook until tender`,
          'Add broth and bring to a boil',
          'Add remaining ingredients and simmer for 15-20 minutes',
          'Season to taste and serve with bread'
        ]
      },
      {
        title: `Roasted ${mainIngredients[0] || 'Ingredient'} Bowl`,
        description: `A healthy bowl featuring roasted ${mainIngredients.slice(0, 2).join(' and ')}. Nutritious and satisfying.`,
        instructions: [
          'Preheat oven to 400°F (200°C)',
          'Chop ingredients into bite-sized pieces',
          'Toss with oil, salt, and pepper',
          'Roast for 20-25 minutes until tender and golden',
          'Serve over grains with your favorite dressing'
        ]
      }
    ];

    for (let i = 0; i < 3; i++) {
      const suggestion = recipeSuggestions[i];
      suggestions.push({
        id: `fallback-${Date.now()}-${i}`,
        type: remixType,
        title: suggestion.title,
        description: suggestion.description,
        ingredients: [...ingredientList, 'olive oil', 'salt', 'black pepper', 'garlic (optional)'],
        instructions: suggestion.instructions
      });
    }
    
    return suggestions;
  };

  return (
    <div className={styles.container}>
      <Head>
        <title>AI Recipe Remix - Recipe Remix</title>
      </Head>

      <nav className={styles.nav}>
        <Link href="/" className={styles.logo}>
          Recipe Remix
        </Link>
        <div className={styles.navLinks}>
          <Link href="/recipe-search">Recipe Search</Link>
          <Link href="/ai-remix" className={styles.active}>AI Remix</Link>
          <Link href="/pantry">Pantry</Link>
          <Link href="/meal-planner">Meal Planner</Link>
        </div>
      </nav>

      <div className={styles.header}>
          <div className={styles.headerContent}>
            <Search size={32} />
            <h1>AI Recipe Remix</h1>
            <p>Get creative variations and smart substitutions powered by AI</p>
          </div>
        </div>

      <main className={styles.main}>
        <div className={styles.inputSection}>
          <div className={styles.inputGroup}>
            <label htmlFor="ingredients">Your Available Ingredients</label>
            <textarea
              id="ingredients"
              value={ingredients}
              onChange={(e) => setIngredients(e.target.value)}
              placeholder="List your ingredients separated by commas (e.g., chicken breast, rice, broccoli, garlic, soy sauce)"
              className={styles.textarea}
              rows={3}
            />
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor="originalRecipe">Original Recipe (Optional)</label>
            <textarea
              id="originalRecipe"
              value={originalRecipe}
              onChange={(e) => setOriginalRecipe(e.target.value)}
              placeholder="Paste a recipe you want to modify or leave blank for new recipe ideas"
              className={styles.textarea}
              rows={4}
            />
          </div>

          <div className={styles.inputGroup}>
            <label>What would you like AI to do?</label>
            <div className={styles.remixOptions}>
              <label className={styles.radioOption}>
                <input
                  type="radio"
                  value="substitution"
                  checked={remixType === 'substitution'}
                  onChange={(e) => setRemixType(e.target.value as any)}
                />
                <span>Suggest ingredient substitutions</span>
              </label>
              <label className={styles.radioOption}>
                <input
                  type="radio"
                  value="variation"
                  checked={remixType === 'variation'}
                  onChange={(e) => setRemixType(e.target.value as any)}
                />
                <span>Create recipe variations</span>
              </label>
              <label className={styles.radioOption}>
                <input
                  type="radio"
                  value="new_recipe"
                  checked={remixType === 'new_recipe'}
                  onChange={(e) => setRemixType(e.target.value as any)}
                />
                <span>Generate new recipe ideas</span>
              </label>
            </div>
          </div>

          <button 
          onClick={generateRemix} 
          disabled={loading || !ingredients.trim()}
          className={styles.generateButton}
        >
          {loading ? 'Generating...' : 'Generate AI Remix'}
        </button>

        {error && (
          <p className={styles.error}>
            ⚠️ {error}
          </p>
        )}
        </div>

        <div className={styles.suggestionsSection}>
          {suggestions.length > 0 && (
            <>
              <h2>AI Suggestions</h2>
              <div className={styles.suggestionsList}>
                {suggestions.map((suggestion) => (
                  <div key={suggestion.id} className={styles.suggestionCard}>
                    <div className={styles.suggestionHeader}>
                      <h3>{suggestion.title}</h3>
                      <span className={styles.suggestionType}>
                        {suggestion.type.replace('_', ' ').toUpperCase()}
                      </span>
                    </div>
                    <p className={styles.suggestionDescription}>
                      {suggestion.description}
                    </p>
                    <div className={styles.suggestionIngredients}>
                      <h4>Ingredients:</h4>
                      <ul>
                        {suggestion.ingredients.map((ingredient, index) => (
                          <li key={index}>{ingredient}</li>
                        ))}
                      </ul>
                    </div>
                    {suggestion.instructions && (
                      <div className={styles.suggestionInstructions}>
                        <h4>Instructions:</h4>
                        <ol>
                          {suggestion.instructions.map((instruction, index) => (
                            <li key={index}>{instruction}</li>
                          ))}
                        </ol>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}

          {suggestions.length === 0 && !loading && (
            <div className={styles.emptyState}>
              <p>Enter your ingredients above and click "Generate AI Suggestions" to get started!</p>
            </div>
          )}
        </div>

        {/* History Section */}
        {history.length > 0 && (
          <div className={styles.historySection}>
            <div className={styles.historyHeader}>
              <div className={styles.historyTitle}>
                <History size={24} />
                <h2>History of AI Generated Recipes</h2>
              </div>
              <button 
                onClick={clearHistory}
                className={styles.clearHistoryButton}
                title="Clear all history"
              >
                <Trash2 size={16} />
                Clear All
              </button>
            </div>
            
            <div className={styles.historyList}>
              {history.map((entry) => (
                <div key={entry.id} className={styles.historyEntry}>
                  <div className={styles.historyEntryHeader}>
                    <div className={styles.historyEntryInfo}>
                      <span className={styles.historyDate}>
                        {new Date(entry.timestamp).toLocaleDateString()} at {new Date(entry.timestamp).toLocaleTimeString()}
                      </span>
                      <span className={styles.historyType}>
                        {entry.remix_type.replace('_', ' ').toUpperCase()}
                      </span>
                    </div>
                    <button 
                      onClick={() => removeHistoryEntry(entry.id)}
                      className={styles.removeHistoryButton}
                      title="Remove this entry"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                  
                  <div className={styles.historyIngredients}>
                    <strong>Ingredients used:</strong> {entry.ingredients}
                  </div>
                  
                  <div className={styles.historySuggestions}>
                    {entry.suggestions.map((suggestion, index) => (
                      <div key={suggestion.id} className={styles.historyCard}>
                        <h4>{suggestion.title}</h4>
                        <p className={styles.historyDescription}>
                          {suggestion.description}
                        </p>
                        <div className={styles.historyIngredientsList}>
                          <strong>Ingredients:</strong>
                          <span>{suggestion.ingredients.join(', ')}</span>
                        </div>
                        {suggestion.instructions && (
                          <div className={styles.historyInstructions}>
                            <strong>Instructions:</strong>
                            <ol>
                              {suggestion.instructions.map((instruction, idx) => (
                                <li key={idx}>{instruction}</li>
                              ))}
                            </ol>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}