/**
 * Recipe Search API Endpoint
 * 
 * This API endpoint handles recipe search requests based on ingredients and filters.
 * It provides two search modes:
 * 1. Simple ingredient-based search (when no filters are applied)
 * 2. Complex search with filters (diet, cuisine, cooking time)
 * 
 * The endpoint expects a POST request with ingredients and optional filters in the body.
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { searchRecipesByIngredients, searchRecipes } from '../../../lib/spoonacular';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Only allow POST requests for this endpoint
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Extract search parameters from request body
    const { 
      ingredients, 
      number = 12,      // Default to 12 results
      ranking = 1,      // Default to maximizing used ingredients
      ignorePantry = true,  // Default to ignoring common pantry items
      diet,             // Optional diet filter (vegetarian, vegan, etc.)
      cuisine,          // Optional cuisine filter (italian, asian, etc.)
      maxReadyTime      // Optional maximum cooking time in minutes
    } = req.body;

    // Validate that ingredients array is provided
    if (!ingredients || !Array.isArray(ingredients)) {
      return res.status(400).json({ message: 'Ingredients array is required' });
    }

    // Determine which search method to use based on filters
    if (diet || cuisine || maxReadyTime) {
      // CASE 1: Use complex search when filters are applied
      // This provides more advanced filtering but may be slower
      const results = await searchRecipes(
        ingredients.join(','), // Convert ingredients array to comma-separated string
        diet,
        cuisine,
        maxReadyTime,
        number
      );
      
      // Return the recipes from the results object
      return res.status(200).json(results.results || []);
    } else {
      // CASE 2: Use simple ingredient-based search when no filters are applied
      // This is optimized for ingredient matching and is usually faster
      const recipes = await searchRecipesByIngredients(
        ingredients,
        number,
        ranking,
        ignorePantry
      );
      
      return res.status(200).json(recipes);
    }
  } catch (error: any) {
    // Handle and log any errors that occur during the search process
    console.error('Recipe search error:', error);
    res.status(500).json({ 
      message: 'Failed to search recipes',
      error: error.message 
    });
  }
}
