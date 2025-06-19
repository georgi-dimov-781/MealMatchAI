/**
 * Spoonacular API Integration Module
 * 
 * This module provides an interface to the Spoonacular API for recipe-related operations.
 * It handles various recipe search methods, detailed recipe information retrieval,
 * and proper typing for the API responses.
 * 
 * The API key is loaded from environment variables for security.
 */

import axios from 'axios';

// API configuration
const SPOONACULAR_API_KEY = process.env.SPOONACULAR_API_KEY || '';
const BASE_URL = 'https://api.spoonacular.com/recipes';

/**
 * Recipe interface defining the structure of a recipe returned from the findByIngredients endpoint
 */
export interface Recipe {
  id: number;
  title: string;
  image: string;
  usedIngredientCount: number;
  missedIngredientCount: number;
  missedIngredients: Array<{
    id: number;
    amount: number;
    unit: string;
    unitLong: string;
    unitShort: string;
    aisle: string;
    name: string;
    original: string;
    originalName: string;
    meta: string[];
    image: string;
  }>;
  usedIngredients: Array<{
    id: number;
    amount: number;
    unit: string;
    unitLong: string;
    unitShort: string;
    aisle: string;
    name: string;
    original: string;
    originalName: string;
    meta: string[];
    image: string;
  }>;
  unusedIngredients: any[];
  likes: number;
}

/**
 * RecipeDetails interface defining the structure of detailed recipe information
 * returned from the recipe information endpoint
 */
export interface RecipeDetails {
  id: number;
  title: string;
  image: string;
  servings: number;
  readyInMinutes: number;
  cookingMinutes: number;
  preparationMinutes: number;
  pricePerServing: number;
  extendedIngredients: Array<{
    id: number;
    aisle: string;
    image: string;
    consistency: string;
    name: string;
    nameClean: string;
    original: string;
    originalName: string;
    amount: number;
    unit: string;
    meta: string[];
    measures: {
      us: {
        amount: number;
        unitShort: string;
        unitLong: string;
      };
      metric: {
        amount: number;
        unitShort: string;
        unitLong: string;
      };
    };
  }>;
  analyzedInstructions: Array<{
    name: string;
    steps: Array<{
      number: number;
      step: string;
      ingredients: Array<{
        id: number;
        name: string;
        localizedName: string;
        image: string;
      }>;
      equipment: Array<{
        id: number;
        name: string;
        localizedName: string;
        image: string;
      }>;
      length?: {
        number: number;
        unit: string;
      };
    }>;
  }>;
  sourceName: string;
  sourceUrl: string;
  spoonacularSourceUrl: string;
  healthScore: number;
  spoonacularScore: number;
  aggregateLikes: number;
  cheap: boolean;
  creditsText: string;
  cuisines: string[];
  dairyFree: boolean;
  diets: string[];
  gaps: string;
  glutenFree: boolean;
  instructions: string;
  ketogenic: boolean;
  lowFodmap: boolean;
  occasions: string[];
  sustainable: boolean;
  vegan: boolean;
  vegetarian: boolean;
  veryHealthy: boolean;
  veryPopular: boolean;
  whole30: boolean;
  weightWatcherSmartPoints: number;
  dishTypes: string[];
  summary: string;
}

/**
 * Search for recipes based on available ingredients
 * 
 * @param ingredients - Array of ingredient names to search for
 * @param number - Number of results to return (default: 12)
 * @param ranking - Ranking parameter (1 = maximize used ingredients, 2 = minimize missing ingredients)
 * @param ignorePantry - Whether to ignore pantry items like salt, oil, etc.
 * @returns Promise containing an array of recipes that match the ingredients
 */
export const searchRecipesByIngredients = async (
  ingredients: string[],
  number: number = 12,
  ranking: number = 1,
  ignorePantry: boolean = true
): Promise<Recipe[]> => {
  try {
    const response = await axios.get(`${BASE_URL}/findByIngredients`, {
      params: {
        apiKey: SPOONACULAR_API_KEY,
        ingredients: ingredients.join(','),
        number,
        ranking,
        ignorePantry
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error searching recipes by ingredients:', error);
    throw error;
  }
};

/**
 * Get detailed information for a specific recipe by ID
 * 
 * @param id - The Spoonacular recipe ID
 * @returns Promise containing detailed recipe information
 */
export const getRecipeInformation = async (id: number): Promise<RecipeDetails> => {
  try {
    const response = await axios.get(`${BASE_URL}/${id}/information`, {
      params: {
        apiKey: SPOONACULAR_API_KEY,
        includeNutrition: false
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error getting recipe information:', error);
    throw error;
  }
};

/**
 * Search for recipes with complex filtering options
 * 
 * @param query - Text query or comma-separated list of ingredients
 * @param diet - Diet restriction (vegetarian, vegan, etc.)
 * @param cuisine - Cuisine type (italian, asian, etc.)
 * @param maxReadyTime - Maximum preparation time in minutes
 * @param number - Number of results to return (default: 12)
 * @returns Promise containing search results with recipe information
 */
export const searchRecipes = async (
  query: string,
  diet?: string,
  cuisine?: string,
  maxReadyTime?: number,
  number: number = 12
): Promise<any> => {
  try {
    const params: any = {
      apiKey: SPOONACULAR_API_KEY,
      number,
      addRecipeInformation: true
    };
    
    // Handle search by ingredients or by query differently
    if (query.includes(',')) {
      // If query contains commas, assume it's a list of ingredients
      params.includeIngredients = query;
      params.fillIngredients = true;
      params.sort = 'max-used-ingredients'; // Sort by maximum used ingredients
    } else {
      // Otherwise treat as normal text query
      params.query = query;
    }
    
    // Add optional filters
    if (diet) params.diet = diet;
    if (cuisine) params.cuisine = cuisine;
    if (maxReadyTime) params.maxReadyTime = maxReadyTime;
    
    const response = await axios.get(`${BASE_URL}/complexSearch`, { params });
    return response.data;
  } catch (error) {
    console.error('Error searching recipes:', error);
    throw error;
  }
};
