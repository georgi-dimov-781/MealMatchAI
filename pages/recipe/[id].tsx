import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { Clock, Users, Heart, ArrowLeft, Calendar, Plus, ChefHat } from 'lucide-react';
import styles from '../../styles/Recipe.module.css';
import { saveRecipe, saveMealPlan } from '../../lib/database';
import { RecipeDetails } from '../../lib/spoonacular';

const RecipePage = () => {
  const router = useRouter();
  const { id } = router.query;
  const [recipe, setRecipe] = useState<RecipeDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      fetchRecipe(Number(id));
    }
  }, [id]);

  const fetchRecipe = async (recipeId: number) => {
    try {
      const response = await fetch(`/api/recipes/${recipeId}`);

      if (!response.ok) {
        throw new Error(`Failed to fetch recipe: ${response.statusText}`);
      }

      const recipeData = await response.json();
      setRecipe(recipeData);
    } catch (error) {
      console.error('Error fetching recipe:', error);
      setError('Failed to load recipe');
    } finally {
      setLoading(false);
    }
  };

  const addToMealPlan = async () => {
    if (!recipe) return;

    try {
      // First save the recipe to the database
      const savedRecipe = await saveRecipe({
        id: recipe.id,
        title: recipe.title,
        image: recipe.image,
        servings: recipe.servings,
        readyInMinutes: recipe.readyInMinutes
      });

      // Then add it to meal plan using the saved recipe's database ID
      const newMealPlan = {
        date: new Date().toISOString().split('T')[0],
        mealType: 'dinner',
        recipeId: savedRecipe.id,
        recipeName: recipe.title,
        recipeImage: recipe.image,
        cookingTime: recipe.readyInMinutes,
      };

      await saveMealPlan(newMealPlan);
      alert('Recipe saved and added to meal plan!');
    } catch (err) {
      console.error('Error saving meal plan:', err);
      alert('Failed to save meal plan.');
    }
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          <ChefHat size={48} />
          <p>Loading recipe...</p>
        </div>
      </div>
    );
  }

  if (error || !recipe) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>
          <h2>Recipe not found</h2>
          <p>{error || 'The recipe you are looking for could not be found.'}</p>
          <Link href="/recipe-search" className={styles.backButton}>
            ← Back to Search
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <Head>
        <title>{recipe.title} - Recipe Remix</title>
        <meta name="description" content={recipe.summary?.replace(/<[^>]*>/g, '') || recipe.title} />
      </Head>

      <header className={styles.header}>
        <Link href="/recipe-search" className={styles.backButton}>
          ← Back to Search
        </Link>
        <div className={styles.actions}>
          <button onClick={addToMealPlan} className={styles.addToMealPlan}>
            <Calendar size={20} />
            Add to Meal Plan
          </button>
        </div>
      </header>

      <main className={styles.main}>
        <div className={styles.recipeHeader}>
          <div className={styles.recipeImage}>
            <img src={recipe.image} alt={recipe.title} />
          </div>
          <div className={styles.recipeInfo}>
            <h1>{recipe.title}</h1>

            <div className={styles.recipeStats}>
              <div className={styles.stat}>
                <Clock size={20} />
                <span>{recipe.readyInMinutes} mins</span>
              </div>
              <div className={styles.stat}>
                <Users size={20} />
                <span>{recipe.servings} servings</span>
              </div>
              <div className={styles.stat}>
                <ChefHat size={20} />
                <span>Health Score: {recipe.healthScore}/100</span>
              </div>
            </div>

            {recipe.summary && (
              <div 
                className={styles.summary}
                dangerouslySetInnerHTML={{ __html: recipe.summary }}
              />
            )}

            <div className={styles.badges}>
              {recipe.vegetarian && <span className={styles.badge}>Vegetarian</span>}
              {recipe.vegan && <span className={styles.badge}>Vegan</span>}
              {recipe.glutenFree && <span className={styles.badge}>Gluten Free</span>}
              {recipe.dairyFree && <span className={styles.badge}>Dairy Free</span>}
              {recipe.veryHealthy && <span className={styles.badge}>Very Healthy</span>}
            </div>
          </div>
        </div>

        <div className={styles.recipeContent}>
          <div className={styles.ingredients}>
            <h2>Ingredients</h2>
            <ul>
              {recipe.extendedIngredients.map((ingredient, index) => (
                <li key={index}>
                  <span className={styles.amount}>
                    {ingredient.amount} {ingredient.unit}
                  </span>
                  <span className={styles.ingredientName}>
                    {ingredient.name}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div className={styles.instructions}>
            <h2>Instructions</h2>
            {recipe.analyzedInstructions && recipe.analyzedInstructions.length > 0 ? (
              <ol>
                {recipe.analyzedInstructions[0].steps.map((step, index) => (
                  <li key={index}>
                    <div className={styles.stepContent}>
                      <p>{step.step}</p>
                      {step.length && (
                        <div className={styles.stepTime}>
                          <Clock size={16} />
                          <span>{step.length.number} {step.length.unit}</span>
                        </div>
                      )}
                    </div>
                  </li>
                ))}
              </ol>
            ) : (
              <div 
                className={styles.instructionsText}
                dangerouslySetInnerHTML={{ __html: recipe.instructions }}
              />
            )}
          </div>
        </div>

        {recipe.sourceUrl && (
          <div className={styles.source}>
            <p>
              Recipe source: <a href={recipe.sourceUrl} target="_blank" rel="noopener noreferrer">
                {recipe.sourceName || 'View Original'}
              </a>
            </p>
          </div>
        )}
      </main>
    </div>
  );
};

export default RecipePage;