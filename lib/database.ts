/**
 * Database Operations Module
 * 
 * This module provides a comprehensive set of functions for interacting with the Supabase database.
 * It handles all CRUD operations for various entities in the application:
 * - Recipes
 * - Meal Plans
 * - Pantry Items
 * - AI Remix History
 * - Shopping List
 * 
 * Each function is designed to handle a specific database operation and includes proper error handling.
 */

import { supabase } from './supabase';

//=============================
// Recipe Operations
//=============================

/**
 * Saves or updates a recipe in the database
 * @param recipe - Recipe object with details from Spoonacular API
 * @returns The saved recipe data
 */
export const saveRecipe = async (recipe: any) => {
  const { data, error } = await supabase
    .from('recipes')
    .upsert({
      spoonacular_id: recipe.id,
      title: recipe.title,
      image: recipe.image,
      servings: recipe.servings,
      ready_in_minutes: recipe.readyInMinutes
    }, {
      onConflict: 'spoonacular_id'
    })
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

/**
 * Retrieves all saved recipes from the database
 * @returns Array of saved recipes, sorted by creation date (newest first)
 */
export const getSavedRecipes = async () => {
  const { data, error } = await supabase
    .from('recipes')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data;
};

/**
 * Deletes a recipe from the database
 * @param id - The database ID of the recipe to delete
 */
export const deleteRecipe = async (id: number) => {
  const { error } = await supabase
    .from('recipes')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
};

//=============================
// Meal Plan Operations
//=============================

/**
 * Saves a meal plan entry to the database
 * @param mealPlan - Object containing meal plan details
 * @returns The saved meal plan data
 */
export const saveMealPlan = async (mealPlan: any) => {
  const { data, error } = await supabase
    .from('meal_plans')
    .insert({
      date: mealPlan.date,
      meal_type: mealPlan.mealType,
      recipe_id: mealPlan.recipeId,
      recipe_name: mealPlan.recipeName,
      recipe_image: mealPlan.recipeImage,
      cooking_time: mealPlan.cookingTime
    })
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

/**
 * Retrieves all meal plans from the database
 * @returns Array of meal plans, sorted by date (ascending)
 */
export const getMealPlans = async () => {
  const { data, error } = await supabase
    .from('meal_plans')
    .select('*')
    .order('date', { ascending: true });
  
  if (error) throw error;
  return data;
};

/**
 * Deletes a meal plan from the database
 * @param id - The database ID of the meal plan to delete
 */
export const deleteMealPlan = async (id: string) => {
  const { error } = await supabase
    .from('meal_plans')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
};

//=============================
// Pantry Operations
//=============================

/**
 * Saves a new pantry item to the database
 * @param item - Object containing pantry item details
 * @returns The saved pantry item data
 */
export const savePantryItem = async (item: any) => {
  const { data, error } = await supabase
    .from('pantry_items')
    .insert({
      name: item.name,
      category: item.category,
      quantity: item.quantity,
      expiry_date: item.expiryDate
    })
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

/**
 * Retrieves all pantry items from the database
 * @returns Array of pantry items, sorted by date added (newest first)
 */
export const getPantryItems = async () => {
  const { data, error } = await supabase
    .from('pantry_items')
    .select('*')
    .order('date_added', { ascending: false });
  
  if (error) throw error;
  return data;
};

/**
 * Deletes a pantry item from the database
 * @param id - The database ID of the pantry item to delete
 */
export const deletePantryItem = async (id: string) => {
  const { error } = await supabase
    .from('pantry_items')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
};

//=============================
// AI Remix History Operations
//=============================

/**
 * Saves an AI recipe remix history entry to the database
 * @param historyEntry - Object containing AI remix details and results
 * @returns The saved history entry data
 */
export const saveAIRemixHistory = async (historyEntry: any) => {
  const { data, error } = await supabase
    .from('ai_remix_history')
    .insert({
      user_id: historyEntry.userId || 'anonymous',
      ingredients: historyEntry.ingredients,
      remix_type: historyEntry.remixType,
      suggestions: historyEntry.suggestions
    })
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

/**
 * Retrieves AI remix history for a specific user
 * @param userId - The user ID to retrieve history for (defaults to 'anonymous')
 * @returns Array of history entries, limited to 10 most recent entries
 */
export const getAIRemixHistory = async (userId: string = 'anonymous') => {
  const { data, error } = await supabase
    .from('ai_remix_history')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(10); // Keep only last 10 entries
  
  if (error) throw error;
  return data;
};

/**
 * Deletes a specific AI remix history entry
 * @param id - The database ID of the history entry to delete
 */
export const deleteAIRemixHistory = async (id: string) => {
  const { error } = await supabase
    .from('ai_remix_history')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
};

/**
 * Clears all AI remix history for a specific user
 * @param userId - The user ID to clear history for (defaults to 'anonymous')
 */
export const clearAllAIRemixHistory = async (userId: string = 'anonymous') => {
  const { error } = await supabase
    .from('ai_remix_history')
    .delete()
    .eq('user_id', userId);
  
  if (error) throw error;
};

//=============================
// Shopping List Operations
//=============================

/**
 * Saves a new shopping list item to the database
 * @param item - Object containing shopping item details
 * @returns The saved shopping item data
 */
export const saveShoppingItem = async (item: any) => {
  const { data, error } = await supabase
    .from('shopping_list')
    .insert({
      name: item.name,
      category: item.category,
      needed: item.needed
    })
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

/**
 * Retrieves all shopping list items from the database
 * @returns Array of shopping items, sorted by creation date (newest first)
 */
export const getShoppingList = async () => {
  const { data, error } = await supabase
    .from('shopping_list')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data;
};

/**
 * Updates the 'needed' status of a shopping list item
 * @param id - The database ID of the shopping item to update
 * @param needed - Boolean indicating whether the item is needed
 * @returns The updated shopping item data
 */
export const updateShoppingItem = async (id: string, needed: boolean) => {
  const { data, error } = await supabase
    .from('shopping_list')
    .update({ needed })
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

/**
 * Deletes a shopping list item from the database
 * @param id - The database ID of the shopping item to delete
 */
export const deleteShoppingItem = async (id: string) => {
  const { error } = await supabase
    .from('shopping_list')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
};
