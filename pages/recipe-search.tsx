import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { Search, Plus, X, Filter, Clock, Users } from 'lucide-react';
import { Recipe } from '../lib/spoonacular';
import styles from '../styles/RecipeSearch.module.css';

const RecipeSearch = () => {
  const router = useRouter();
  const [ingredients, setIngredients] = useState<string[]>([]);
  const [currentIngredient, setCurrentIngredient] = useState('');
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    diet: '',
    maxTime: '',
    cuisine: '',
    ranking: 1
  });
  const [showFilters, setShowFilters] = useState(false);

  const dietOptions = [
    { value: '', label: 'Any Diet' },
    { value: 'vegetarian', label: 'Vegetarian' },
    { value: 'vegan', label: 'Vegan' },
    { value: 'gluten-free', label: 'Gluten Free' },
    { value: 'ketogenic', label: 'Keto' },
    { value: 'paleo', label: 'Paleo' },
    { value: 'whole30', label: 'Whole30' }
  ];

  const cuisineOptions = [
    { value: '', label: 'Any Cuisine' },
    { value: 'italian', label: 'Italian' },
    { value: 'mexican', label: 'Mexican' },
    { value: 'asian', label: 'Asian' },
    { value: 'american', label: 'American' },
    { value: 'mediterranean', label: 'Mediterranean' },
    { value: 'indian', label: 'Indian' },
    { value: 'french', label: 'French' },
    { value: 'thai', label: 'Thai' },
    { value: 'chinese', label: 'Chinese' },
    { value: 'japanese', label: 'Japanese' }
  ];

  const timeOptions = [
    { value: '', label: 'Any Time' },
    { value: '15', label: '15 minutes' },
    { value: '30', label: '30 minutes' },
    { value: '45', label: '45 minutes' },
    { value: '60', label: '1 hour' },
    { value: '120', label: '2 hours' }
  ];

  useEffect(() => {
    // Check for ingredients in URL params (from pantry)
    if (router.query.ingredients) {
      const urlIngredients = (router.query.ingredients as string)
        .split(',')
        .map(ing => ing.trim())
        .filter(ing => ing.length > 0);
      setIngredients(urlIngredients);
    }
  }, [router.query]);

  useEffect(() => {
    // Auto-search if ingredients are loaded from URL
    if (ingredients.length > 0 && router.query.ingredients) {
      searchRecipes();
    }
  }, [ingredients]);

  // Trigger search when filters change if we already have ingredients
  useEffect(() => {
    if (ingredients.length > 0 && recipes.length > 0) {
      searchRecipes();
    }
  }, [filters]);

  const addIngredient = () => {
    if (currentIngredient.trim() && !ingredients.includes(currentIngredient.trim())) {
      setIngredients([...ingredients, currentIngredient.trim()]);
      setCurrentIngredient('');
    }
  };

  const removeIngredient = (ingredientToRemove: string) => {
    setIngredients(ingredients.filter(ingredient => ingredient !== ingredientToRemove));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      addIngredient();
    }
  };

  const searchRecipes = async () => {
    if (ingredients.length === 0) return;

    setLoading(true);
    try {
      const response = await fetch('/api/recipes/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ingredients,
          number: 12,
          ranking: filters.ranking,
          ignorePantry: true,
          diet: filters.diet,
          cuisine: filters.cuisine,
          maxReadyTime: filters.maxTime ? parseInt(filters.maxTime) : undefined
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to search recipes: ${response.statusText}`);
      }

      const results = await response.json();
      setRecipes(results);
    } catch (error) {
      console.error('Error searching recipes:', error);
    } finally {
      setLoading(false);
    }
  };

  const clearAll = () => {
    setIngredients([]);
    setRecipes([]);
    setCurrentIngredient('');
  };

  const loadFromPantry = async () => {
    try {
      const { getPantryItems } = await import('../lib/database');
      const pantryItems = await getPantryItems();
      const pantryIngredients = pantryItems.map((item: any) => item.name);
      setIngredients(pantryIngredients);
    } catch (error) {
      console.error('Error loading pantry items:', error);
      alert('Failed to load pantry items. Please try again.');
    }
  };

  return (
    <div className={styles.container}>
      <Head>
        <title>Recipe Search - Recipe Remix</title>
        <meta name="description" content="Find recipes based on your ingredients" />
      </Head>

      <nav className={styles.nav}>
        <Link href="/" className={styles.logo}>
          Recipe Remix
        </Link>
        <div className={styles.navLinks}>
          <Link href="/recipe-search" className={styles.active}>Recipe Search</Link>
          <Link href="/ai-remix">AI Remix</Link>
          <Link href="/pantry">Pantry</Link>
          <Link href="/meal-planner">Meal Planner</Link>
        </div>
      </nav>

      <div className={styles.header}>
        <div className={styles.headerContent}>
          <Search size={32} />
          <div>
            <h1>Recipe Search</h1>
            <p>Find delicious recipes using ingredients you already have</p>
          </div>
        </div>
      </div>

      <main className={styles.main}>

        <div className={styles.searchSection}>
          <div className={styles.inputSection}>
            <div className={styles.ingredientInput}>
              <input
                type="text"
                value={currentIngredient}
                onChange={(e) => setCurrentIngredient(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Enter an ingredient (e.g., chicken, tomatoes)"
                className={styles.input}
              />
              <button onClick={addIngredient} className={styles.addButton}>
                <Plus size={20} />
                Add
              </button>
            </div>

            <div className={styles.quickActions}>
              <button onClick={loadFromPantry} className={styles.pantryButton}>
                Load from Pantry
              </button>
              <button 
                onClick={() => setShowFilters(!showFilters)} 
                className={styles.filterButton}
              >
                <Filter size={20} />
                Filters
              </button>
              {ingredients.length > 0 && (
                <button onClick={clearAll} className={styles.clearButton}>
                  Clear All
                </button>
              )}
            </div>
          </div>

          {showFilters && (
            <div className={styles.filtersSection}>
              <div className={styles.filterGrid}>
                <div>
                  <label>Diet</label>
                  <select 
                    value={filters.diet} 
                    onChange={(e) => setFilters({...filters, diet: e.target.value})}
                  >
                    {dietOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label>Cuisine</label>
                  <select 
                    value={filters.cuisine} 
                    onChange={(e) => setFilters({...filters, cuisine: e.target.value})}
                  >
                    {cuisineOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label>Max Cooking Time</label>
                  <select 
                    value={filters.maxTime} 
                    onChange={(e) => setFilters({...filters, maxTime: e.target.value})}
                  >
                    {timeOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label>Ranking</label>
                  <select 
                    value={filters.ranking} 
                    onChange={(e) => setFilters({...filters, ranking: parseInt(e.target.value)})}
                  >
                    <option value={1}>Maximize used ingredients</option>
                    <option value={2}>Minimize missing ingredients</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          <div className={styles.ingredientsList}>
            {ingredients.map((ingredient, index) => (
              <span key={index} className={styles.ingredientTag}>
                {ingredient}
                <button onClick={() => removeIngredient(ingredient)} className={styles.removeButton}>
                  <X size={16} />
                </button>
              </span>
            ))}
          </div>

          <button 
            onClick={searchRecipes} 
            disabled={ingredients.length === 0 || loading}
            className={styles.searchButton}
          >
            {loading ? 'Searching...' : `Find Recipes (${ingredients.length} ingredients)`}
          </button>
        </div>

        <div className={styles.resultsSection}>
          {loading && (
            <div className={styles.loading}>
              <Search size={32} />
              <p>Searching for recipes...</p>
            </div>
          )}

          {recipes.length > 0 && !loading && (
            <>
              <div className={styles.resultsHeader}>
                <h2>Found {recipes.length} recipes</h2>
                <p>Recipes are sorted by how well they match your ingredients</p>
              </div>
              <div className={styles.recipesGrid}>
                {recipes.map((recipe) => (
                  <div key={recipe.id} className={styles.recipeCard}>
                    <img 
                      src={recipe.image} 
                      alt={recipe.title}
                      className={styles.recipeImage}
                    />
                    <div className={styles.recipeInfo}>
                      <h3 className={styles.recipeTitle}>{recipe.title}</h3>
                      
                      <div className={styles.recipeStats}>
                        <div className={styles.ingredientStats}>
                          <span className={styles.usedIngredients}>
                            ✓ {recipe.usedIngredientCount} ingredients you have
                          </span>
                          {recipe.missedIngredientCount > 0 && (
                            <span className={styles.missedIngredients}>
                              + {recipe.missedIngredientCount} more needed
                            </span>
                          )}
                        </div>
                        
                        {recipe.likes > 0 && (
                          <div className={styles.popularity}>
                            <Users size={16} />
                            {recipe.likes} likes
                          </div>
                        )}
                      </div>

                      {recipe.missedIngredients && recipe.missedIngredients.length > 0 && (
                        <div className={styles.missedIngredientsList}>
                          <strong>Missing:</strong> {recipe.missedIngredients.map(ing => ing.name).join(', ')}
                        </div>
                      )}

                      <Link 
                        href={`/recipe/${recipe.id}`} 
                        className={styles.viewRecipeButton}
                      >
                        View Recipe
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {recipes.length === 0 && !loading && ingredients.length > 0 && (
            <div className={styles.noResults}>
              <Search size={64} />
              <h2>No recipes found</h2>
              <p>Try adjusting your ingredients or filters to find more recipes</p>
            </div>
          )}

          {recipes.length === 0 && !loading && ingredients.length === 0 && (
            <div className={styles.emptyState}>
              <Search size={64} />
              <h2>Start by adding ingredients</h2>
              <p>Add the ingredients you have available, and we'll find matching recipes for you!</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default RecipeSearch;
