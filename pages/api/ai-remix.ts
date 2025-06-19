/**
 * AI Recipe Remix Fallback API Endpoint
 * 
 * This API endpoint serves as a fallback for generating recipe suggestions when the
 * primary AI service (Gemini) is unavailable or encounters an error.
 * 
 * It creates template-based recipe suggestions using the provided ingredients,
 * ensuring the application can continue to function even if the AI service is down.
 */

import type { NextApiRequest, NextApiResponse } from 'next';

/**
 * Interface defining the structure of a recipe suggestion
 */
interface RemixSuggestion {
  id: string;
  type: 'substitution' | 'variation' | 'new_recipe';
  title: string;
  description: string;
  ingredients: string[];
  instructions?: string[];
}

/**
 * Creates template-based recipe suggestions using the provided ingredients
 * 
 * @param ingredients - Comma-separated string of ingredients
 * @param remixType - Type of remix to generate (substitution, variation, or new_recipe)
 * @returns Array of recipe suggestions based on templates
 */
function createFallbackSuggestions(ingredients: string, remixType: string): RemixSuggestion[] {
  // Parse ingredient list from comma-separated string
  const ingredientList = ingredients.split(',').map(ing => ing.trim()).filter(ing => ing.length > 0);
  // Take up to 4 main ingredients to feature in the recipes
  const mainIngredients = ingredientList.slice(0, 4);

  const suggestions: RemixSuggestion[] = [];

  // Template recipes that can be customized with the user's ingredients
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

  // Create suggestion objects from the templates
  for (let i = 0; i < 3; i++) {
    const suggestion = recipeSuggestions[i];
    suggestions.push({
      id: `fallback-${Date.now()}-${i}`,
      type: remixType as any,
      title: suggestion.title,
      description: suggestion.description,
      // Add some common pantry items to the ingredient list
      ingredients: [...ingredientList, 'olive oil', 'salt', 'black pepper', 'garlic (optional)'],
      instructions: suggestion.instructions
    });
  }

  return suggestions;
}

/**
 * API endpoint handler for generating fallback recipe suggestions
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  // Extract ingredients and remix type from request body
  const { ingredients, remixType } = req.body;

  // Validate that ingredients are provided
  if (!ingredients) {
    return res.status(400).json({ message: 'Ingredients are required' });
  }

  try {
    console.log('Fallback API called with:', { ingredients, remixType });

    // Generate fallback suggestions based on templates
    const fallbackSuggestions = createFallbackSuggestions(ingredients, remixType);

    // Return the generated suggestions with a note that these are fallback recipes
    return res.status(200).json({ 
      suggestions: fallbackSuggestions,
      note: 'Using backup recipe generator.'
    });
  } catch (error: any) {
    console.error('Fallback API error:', error);

    // Handle any errors that occur during generation
    return res.status(500).json({ 
      message: 'Failed to generate fallback suggestions',
      error: error?.message
    });
  }
}