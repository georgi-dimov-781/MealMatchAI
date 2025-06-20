import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { format, startOfWeek, addDays, isSameDay } from 'date-fns';
import { 
  DndContext, 
  DragEndEvent, 
  DragOverlay, 
  DragStartEvent,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  defaultDropAnimationSideEffects,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Calendar, Plus, ShoppingCart, ChevronLeft, ChevronRight, Clock } from 'lucide-react';
import styles from '../styles/MealPlanner.module.css';
import { 
  saveMealPlan, 
  getMealPlans, 
  deleteMealPlan,
  getSavedRecipes,
  deleteRecipe,
  saveShoppingItem,
  getShoppingList,
  updateShoppingItem,
  deleteShoppingItem
} from '../lib/database';

interface MealPlan {
  id: string;
  date: Date;
  meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  recipe_id?: number;
  recipe_name: string;
  recipe_image?: string;
  cooking_time?: number;
}

interface ShoppingListItem {
  id: string;
  name: string;
  category: string;
  needed: boolean;
}

const SortableItem = ({ id, children }: { id: string; children: React.ReactNode }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    touchAction: 'none', // Prevents scrolling while trying to drag on touch devices
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      {children}
    </div>
  );
};

const MealPlanner = () => {
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [mealPlans, setMealPlans] = useState<MealPlan[]>([]);
  const [showAddMeal, setShowAddMeal] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedMealType, setSelectedMealType] = useState<'breakfast' | 'lunch' | 'dinner' | 'snack'>('dinner');
  const [recipeName, setRecipeName] = useState('');
  const [cookingTime, setCookingTime] = useState('');
  const [shoppingList, setShoppingList] = useState<ShoppingListItem[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [savedRecipes, setSavedRecipes] = useState<any[]>([]);
  const [newShoppingItem, setNewShoppingItem] = useState('');
  const [newItemCategory, setNewItemCategory] = useState('Vegetables');
  const [showAddToCalendar, setShowAddToCalendar] = useState(false);
  const [selectedRecipeForCalendar, setSelectedRecipeForCalendar] = useState<any>(null);
  const [calendarDate, setCalendarDate] = useState('');
  const [calendarMealType, setCalendarMealType] = useState<'breakfast' | 'lunch' | 'dinner' | 'snack'>('dinner');
  const [loading, setLoading] = useState(true);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px of movement required before drag starts
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250, // 250ms delay for touch devices
        tolerance: 5, // 5px of movement allowed during delay
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 0 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const mealTypes = ['breakfast', 'lunch', 'dinner', 'snack'] as const;

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [mealPlansData, savedRecipesData, shoppingListData] = await Promise.all([
        getMealPlans(),
        getSavedRecipes(),
        getShoppingList()
      ]);

      const plans = mealPlansData.map((plan: any) => ({
        ...plan,
        date: new Date(plan.date + 'T00:00:00') // Parse in local timezone to avoid shifting
      }));
      
      setMealPlans(plans);
      setSavedRecipes(savedRecipesData);
      setShoppingList(shoppingListData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const addMealPlan = async () => {
    if (!selectedDate || !recipeName.trim()) return;

    try {
      // Format date as YYYY-MM-DD to ensure consistency
      const year = selectedDate.getFullYear();
      const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
      const day = String(selectedDate.getDate()).padStart(2, '0');
      const dateString = `${year}-${month}-${day}`;

      const newPlan = {
        date: dateString,
        mealType: selectedMealType,
        recipeName: recipeName.trim(),
        cookingTime: cookingTime ? parseInt(cookingTime) : undefined
      };

      const savedPlan = await saveMealPlan(newPlan);
      const planWithDate = {
        ...savedPlan,
        date: new Date(savedPlan.date + 'T00:00:00') // Ensure date is parsed in local timezone
      };
      
      setMealPlans([...mealPlans, planWithDate]);
      setShowAddMeal(false);
      setRecipeName('');
      setCookingTime('');
      setSelectedDate(null);
    } catch (error) {
      console.error('Error adding meal plan:', error);
      alert('Failed to add meal plan. Please try again.');
    }
  };

  const removeMealPlan = async (id: string) => {
    try {
      await deleteMealPlan(id);
      setMealPlans(mealPlans.filter(plan => plan.id !== id));
    } catch (error) {
      console.error('Error removing meal plan:', error);
      alert('Failed to remove meal plan. Please try again.');
    }
  };

  const getMealsForDate = (date: Date) => {
    return mealPlans.filter(plan => isSameDay(plan.date, date));
  };

  const addShoppingItem = async () => {
    if (!newShoppingItem.trim()) return;

    try {
      const newItem = {
        name: newShoppingItem.trim(),
        category: newItemCategory,
        needed: true
      };

      const savedItem = await saveShoppingItem(newItem);
      setShoppingList([savedItem, ...shoppingList]);
      setNewShoppingItem('');
    } catch (error) {
      console.error('Error adding shopping item:', error);
      alert('Failed to add shopping item. Please try again.');
    }
  };

  const removeShoppingItem = async (id: string) => {
    try {
      await deleteShoppingItem(id);
      setShoppingList(shoppingList.filter(item => item.id !== id));
    } catch (error) {
      console.error('Error removing shopping item:', error);
      alert('Failed to remove shopping item. Please try again.');
    }
  };

  const toggleItemNeeded = async (id: string, needed: boolean) => {
    try {
      await updateShoppingItem(id, needed);
      const updatedList = shoppingList.map(item =>
        item.id === id ? { ...item, needed } : item
      );
      setShoppingList(updatedList);
    } catch (error) {
      console.error('Error updating shopping item:', error);
      alert('Failed to update shopping item. Please try again.');
    }
  };

  const navigateWeek = (direction: 'prev' | 'next') => {
    const newWeek = new Date(currentWeek);
    newWeek.setDate(newWeek.getDate() + (direction === 'next' ? 7 : -7));
    setCurrentWeek(newWeek);
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      const activeIndex = mealPlans.findIndex(plan => plan.id === active.id);
      const overIndex = mealPlans.findIndex(plan => plan.id === over.id);
      
      setMealPlans((items) => arrayMove(items, activeIndex, overIndex));
    }
    
    setActiveId(null);
  };

  const activeMeal = mealPlans.find(plan => plan.id === activeId);

  const addRecipeToCalendar = async () => {
    if (!selectedRecipeForCalendar || !calendarDate) return;

    try {
      const newPlan = {
        date: calendarDate,
        mealType: calendarMealType,
        recipeId: selectedRecipeForCalendar.id, // Use database ID, not spoonacular_id
        recipeName: selectedRecipeForCalendar.title,
        recipeImage: selectedRecipeForCalendar.image,
        cookingTime: selectedRecipeForCalendar.ready_in_minutes
      };

      const savedPlan = await saveMealPlan(newPlan);
      const planWithDate = {
        ...savedPlan,
        date: new Date(savedPlan.date)
      };
      
      setMealPlans([...mealPlans, planWithDate]);
      setShowAddToCalendar(false);
      setSelectedRecipeForCalendar(null);
      setCalendarDate('');
    } catch (error) {
      console.error('Error adding recipe to calendar:', error);
      alert('Failed to add recipe to calendar. Please try again.');
    }
  };

  const removeSavedRecipe = async (id: number) => {
    try {
      await deleteRecipe(id);
      setSavedRecipes(savedRecipes.filter(recipe => recipe.id !== id));
    } catch (error) {
      console.error('Error removing saved recipe:', error);
      alert('Failed to remove saved recipe. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Loading meal planner...</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <Head>
        <title>Meal Planner - Recipe Remix</title>
        <meta name="description" content="Plan your weekly meals" />
      </Head>

      <nav className={styles.nav}>
        <Link href="/" className={styles.logo}>
          Recipe Remix
        </Link>
        <div className={styles.navLinks}>
          <Link href="/recipe-search">Recipe Search</Link>
          <Link href="/ai-remix">AI Remix</Link>
          <Link href="/pantry">Pantry</Link>
          <Link href="/meal-planner" className={styles.active}>Meal Planner</Link>
        </div>
      </nav>

      <main className={styles.main}>
        <div className={styles.header}>
          <div className={styles.headerContent}>
            <Calendar size={32} />
            <h1>Weekly Meal Planner</h1>
            <p>Organize your meals and generate shopping lists</p>
          </div>
          <button 
            onClick={() => setShowAddMeal(true)}
            className={styles.addButton}
          >
            <Plus size={20} />
            Add Meal
          </button>
        </div>

        <div className={styles.weekNavigation}>
          <button onClick={() => navigateWeek('prev')} className={styles.navButton}>
            <ChevronLeft size={20} />
          </button>
          <h2>{format(weekStart, 'MMM d')} - {format(addDays(weekStart, 6), 'MMM d, yyyy')}</h2>
          <button onClick={() => navigateWeek('next')} className={styles.navButton}>
            <ChevronRight size={20} />
          </button>
        </div>

        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          autoScroll={{
            threshold: {
              x: 0,
              y: 0.2, // Start scrolling when 20% away from edge
            },
          }}
        >
          <div className={styles.calendar}>
            {weekDays.map(day => (
              <div key={day.toISOString()} className={styles.dayColumn}>
                <div className={styles.dayHeader}>
                  <h3>{format(day, 'EEE')}</h3>
                  <span>{format(day, 'MMM d')}</span>
                </div>
                
                <div className={styles.mealsContainer}>
                  {mealTypes.map(mealType => {
                    const mealsForType = getMealsForDate(day).filter(meal => meal.meal_type === mealType);
                    return (
                      <div key={mealType} className={styles.mealTypeSection}>
                        <h4>{mealType.charAt(0).toUpperCase() + mealType.slice(1)}</h4>
                        <SortableContext 
                          items={mealsForType.map(meal => meal.id)}
                          strategy={verticalListSortingStrategy}
                        >
                          {mealsForType.map(meal => (
                            <SortableItem key={meal.id} id={meal.id}>
                              <div className={styles.mealCard}>
                                <div className={styles.mealInfo}>
                                  <span className={styles.mealName}>{meal.recipe_name}</span>
                                  {meal.cooking_time && (
                                    <span className={styles.cookingTime}>
                                      <Clock size={12} />
                                      {meal.cooking_time}m
                                    </span>
                                  )}
                                </div>
                                <button
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    removeMealPlan(meal.id);
                                  }}
                                  onPointerDown={(e) => e.stopPropagation()}
                                  onMouseDown={(e) => e.stopPropagation()}
                                  className={styles.removeMealButton}
                                >
                                  ×
                                </button>
                              </div>
                            </SortableItem>
                          ))}
                        </SortableContext>
                        <button
                          onClick={() => {
                            setSelectedDate(day);
                            setSelectedMealType(mealType);
                            setShowAddMeal(true);
                          }}
                          className={styles.addMealToSlot}
                        >
                          <Plus size={16} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          <DragOverlay>
            {activeMeal ? (
              <div className={styles.dragOverlay}>
                <div className={styles.mealCard}>
                  <div className={styles.mealInfo}>
                    <span className={styles.mealName}>{activeMeal.recipe_name}</span>
                    {activeMeal.cooking_time && (
                      <span className={styles.cookingTime}>
                        <Clock size={12} />
                        {activeMeal.cooking_time}m
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>

        {showAddMeal && (
          <div className={styles.modal}>
            <div className={styles.modalContent}>
              <div className={styles.modalHeader}>
                <h2>Add Meal</h2>
                <button onClick={() => setShowAddMeal(false)}>×</button>
              </div>
              <div className={styles.formGrid}>
                <div>
                  <label>Recipe Name</label>
                  <input
                    type="text"
                    value={recipeName}
                    onChange={(e) => setRecipeName(e.target.value)}
                    placeholder="Enter recipe name"
                    autoFocus
                  />
                </div>
                <div>
                  <label>Meal Type</label>
                  <select
                    value={selectedMealType}
                    onChange={(e) => setSelectedMealType(e.target.value as any)}
                  >
                    {mealTypes.map(type => (
                      <option key={type} value={type}>
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label>Cooking Time (minutes)</label>
                  <input
                    type="number"
                    value={cookingTime}
                    onChange={(e) => setCookingTime(e.target.value)}
                    placeholder="30"
                  />
                </div>
                <div>
                  <label>Date</label>
                  <input
                    type="date"
                    value={selectedDate ? format(selectedDate, 'yyyy-MM-dd') : ''}
                    onChange={(e) => {
                      if (e.target.value) {
                        // Create date in local timezone to avoid shifting
                        const [year, month, day] = e.target.value.split('-').map(Number);
                        setSelectedDate(new Date(year, month - 1, day));
                      }
                    }}
                  />
                </div>
              </div>
              <div className={styles.modalActions}>
                <button onClick={() => setShowAddMeal(false)} className={styles.cancelButton}>
                  Cancel
                </button>
                <button onClick={addMealPlan} className={styles.saveButton}>
                  Add Meal
                </button>
              </div>
            </div>
          </div>
        )}

        {showAddToCalendar && selectedRecipeForCalendar && (
          <div className={styles.modal}>
            <div className={styles.modalContent}>
              <div className={styles.modalHeader}>
                <h2>Add to Calendar</h2>
                <button onClick={() => setShowAddToCalendar(false)}>×</button>
              </div>
              <div className={styles.recipePreview}>
                <img src={selectedRecipeForCalendar.image} alt={selectedRecipeForCalendar.title} className={styles.previewImage} />
                <div className={styles.previewInfo}>
                  <h3>{selectedRecipeForCalendar.title}</h3>
                  <p>{selectedRecipeForCalendar.servings} servings • {selectedRecipeForCalendar.ready_in_minutes} mins</p>
                </div>
              </div>
              <div className={styles.formGrid}>
                <div>
                  <label>Date</label>
                  <input
                    type="date"
                    value={calendarDate}
                    onChange={(e) => setCalendarDate(e.target.value)}
                    min={format(new Date(), 'yyyy-MM-dd')}
                    autoFocus
                  />
                </div>
                <div>
                  <label>Meal Type</label>
                  <select
                    value={calendarMealType}
                    onChange={(e) => setCalendarMealType(e.target.value as any)}
                  >
                    {mealTypes.map(type => (
                      <option key={type} value={type}>
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className={styles.modalActions}>
                <button onClick={() => setShowAddToCalendar(false)} className={styles.cancelButton}>
                  Cancel
                </button>
                <button 
                  onClick={addRecipeToCalendar} 
                  className={styles.saveButton}
                  disabled={!calendarDate}
                >
                  Add to Calendar
                </button>
              </div>
            </div>
          </div>
        )}

        {savedRecipes.length > 0 && (
          <div className={styles.savedRecipesSection}>
            <div className={styles.savedRecipesHeader}>
              <Calendar size={24} />
              <h2>Saved Recipes</h2>
            </div>
            <div className={styles.savedRecipesList}>
              {savedRecipes.map((recipe) => (
                <div key={recipe.id} className={styles.savedRecipeCard}>
                  <img src={recipe.image} alt={recipe.title} className={styles.savedRecipeImage} />
                  <div className={styles.savedRecipeInfo}>
                    <h3>{recipe.title}</h3>
                    <p>{recipe.servings} servings • {recipe.ready_in_minutes} mins</p>
                  </div>
                  <div className={styles.savedRecipeActions}>
                    <button
                      onClick={() => {
                        setSelectedRecipeForCalendar(recipe);
                        setShowAddToCalendar(true);
                      }}
                      className={styles.addToCalendarButton}
                    >
                      <Calendar size={16} />
                      Add to Calendar
                    </button>
                    <button
                      onClick={() => removeSavedRecipe(recipe.id)}
                      className={styles.removeRecipeButton}
                    >
                      ×
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className={styles.shoppingSection}>
          <div className={styles.shoppingHeader}>
            <ShoppingCart size={24} />
            <h2>Shopping List</h2>
          </div>
          <div className={styles.addItemSection}>
            <div className={styles.addItemForm}>
              <input
                type="text"
                value={newShoppingItem}
                onChange={(e) => setNewShoppingItem(e.target.value)}
                placeholder="Add shopping item..."
                className={styles.addItemInput}
                onKeyPress={(e) => e.key === 'Enter' && addShoppingItem()}
              />
              <select
                value={newItemCategory}
                onChange={(e) => setNewItemCategory(e.target.value)}
                className={styles.categorySelect}
              >
                <option value="Vegetables">Vegetables</option>
                <option value="Protein">Protein</option>
                <option value="Grains">Grains</option>
                <option value="Condiments">Condiments</option>
                <option value="Other">Other</option>
              </select>
              <button onClick={addShoppingItem} className={styles.addItemButton}>
                <Plus size={16} />
              </button>
            </div>
          </div>

          <div className={styles.shoppingList}>
            {shoppingList.length === 0 ? (
              <p>No items in shopping list. Add some items above!</p>
            ) : (
              shoppingList.map((item) => (
                <div key={item.id} className={`${styles.shoppingItem} ${!item.needed ? styles.inPantry : ''}`}>
                  <div className={styles.itemInfo} onClick={() => toggleItemNeeded(item.id, !item.needed)}>
                    <span>{item.name}</span>
                    <span className={styles.category}>{item.category}</span>
                    {!item.needed && <span className={styles.inPantryLabel}>Got it!</span>}
                  </div>
                  <button
                    onClick={() => removeShoppingItem(item.id)}
                    className={styles.removeItemButton}
                  >
                    ×
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default MealPlanner;
