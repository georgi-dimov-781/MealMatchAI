
import { NextApiRequest, NextApiResponse } from 'next';
import { getRecipeInformation } from '../../../lib/spoonacular';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { id } = req.query;

    if (!id || Array.isArray(id)) {
      return res.status(400).json({ message: 'Recipe ID is required' });
    }

    const recipe = await getRecipeInformation(Number(id));
    res.status(200).json(recipe);
  } catch (error: any) {
    console.error('Recipe details error:', error);
    res.status(500).json({ 
      message: 'Failed to get recipe details',
      error: error.message 
    });
  }
}
