import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { Plus, X, Package, Search, Filter } from 'lucide-react';
import styles from '../styles/Pantry.module.css';
import { savePantryItem, getPantryItems, deletePantryItem } from '../lib/database';

interface PantryItem {
  id: string;
  name: string;
  category: string;
  quantity?: string;
  expiry_date?: string;
  date_added: string;
}

const CATEGORIES = [
  'Vegetables',
  'Fruits',
  'Proteins',
  'Grains',
  'Dairy',
  'Spices & Herbs',
  'Condiments',
  'Oils & Vinegars',
  'Pantry Staples',
  'Other'
];

const Pantry = () => {
  const [pantryItems, setPantryItems] = useState<PantryItem[]>([]);
  const [newItem, setNewItem] = useState({
    name: '',
    category: 'Pantry Staples',
    quantity: '',
    expiryDate: ''
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [showAddForm, setShowAddForm] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPantryItems();
  }, []);

  const loadPantryItems = async () => {
    try {
      setLoading(true);
      const items = await getPantryItems();
      setPantryItems(items);
    } catch (error) {
      console.error('Error loading pantry items:', error);
    } finally {
      setLoading(false);
    }
  };

  const addItem = async () => {
    if (!newItem.name.trim()) return;

    try {
      const item = {
        name: newItem.name.trim(),
        category: newItem.category,
        quantity: newItem.quantity.trim() || undefined,
        expiryDate: newItem.expiryDate || undefined
      };

      const savedItem = await savePantryItem(item);
      setPantryItems([savedItem, ...pantryItems]);
      setNewItem({ name: '', category: 'Pantry Staples', quantity: '', expiryDate: '' });
      setShowAddForm(false);
    } catch (error) {
      console.error('Error adding pantry item:', error);
      alert('Failed to add item. Please try again.');
    }
  };

  const removeItem = async (id: string) => {
    try {
      await deletePantryItem(id);
      setPantryItems(pantryItems.filter(item => item.id !== id));
    } catch (error) {
      console.error('Error removing pantry item:', error);
      alert('Failed to remove item. Please try again.');
    }
  };

  const filteredItems = pantryItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const groupedItems = CATEGORIES.reduce((acc, category) => {
    const items = filteredItems.filter(item => item.category === category);
    if (items.length > 0) {
      acc[category] = items;
    }
    return acc;
  }, {} as Record<string, PantryItem[]>);

  const generateIngredientsList = () => {
    return pantryItems.map(item => item.name).join(', ');
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Loading pantry items...</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <Head>
        <title>Digital Pantry - Recipe Remix</title>
        <meta name="description" content="Manage your pantry ingredients" />
      </Head>

      <nav className={styles.nav}>
        <Link href="/" className={styles.logo}>
          Recipe Remix
        </Link>
        <div className={styles.navLinks}>
          <Link href="/recipe-search">Recipe Search</Link>
          <Link href="/ai-remix">AI Remix</Link>
          <Link href="/pantry" className={styles.active}>Pantry</Link>
          <Link href="/meal-planner">Meal Planner</Link>
        </div>
      </nav>

      <main className={styles.main}>
        <div className={styles.header}>
          <div className={styles.headerContent}>
            <Package size={32} />
            <h1>Digital Pantry</h1>
            <p>Keep track of your ingredients and never run out of meal ideas</p>
          </div>
          <button 
            onClick={() => setShowAddForm(true)}
            className={styles.addButton}
          >
            <Plus size={20} />
            Add Item
          </button>
        </div>

        <div className={styles.controls}>
          <div className={styles.searchBox}>
            <Search size={20} />
            <input
              type="text"
              placeholder="Search ingredients..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className={styles.filterBox}>
            <Filter size={20} />
            <select 
              value={selectedCategory} 
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              <option value="All">All Categories</option>
              {CATEGORIES.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>
        </div>

        {pantryItems.length > 0 && (
          <div className={styles.quickActions}>
            <Link 
              href={`/recipe-search?ingredients=${encodeURIComponent(generateIngredientsList())}`}
              className={styles.findRecipesButton}
            >
              Find Recipes with My Ingredients
            </Link>
          </div>
        )}

        {showAddForm && (
          <div className={styles.modal}>
            <div className={styles.modalContent}>
              <div className={styles.modalHeader}>
                <h2>Add New Item</h2>
                <button onClick={() => setShowAddForm(false)}>
                  <X size={24} />
                </button>
              </div>
              <div className={styles.formGrid}>
                <div>
                  <label>Ingredient Name *</label>
                  <input
                    type="text"
                    value={newItem.name}
                    onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                    placeholder="e.g., Chicken breast"
                    autoFocus
                  />
                </div>
                <div>
                  <label>Category</label>
                  <select
                    value={newItem.category}
                    onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
                  >
                    {CATEGORIES.map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label>Quantity (Optional)</label>
                  <input
                    type="text"
                    value={newItem.quantity}
                    onChange={(e) => setNewItem({ ...newItem, quantity: e.target.value })}
                    placeholder="e.g., 1 lb, 500g"
                  />
                </div>
                <div>
                  <label>Expiry Date (Optional)</label>
                  <input
                    type="date"
                    value={newItem.expiryDate}
                    onChange={(e) => setNewItem({ ...newItem, expiryDate: e.target.value })}
                  />
                </div>
              </div>
              <div className={styles.modalActions}>
                <button onClick={() => setShowAddForm(false)} className={styles.cancelButton}>
                  Cancel
                </button>
                <button onClick={addItem} className={styles.saveButton}>
                  Add Item
                </button>
              </div>
            </div>
          </div>
        )}

        <div className={styles.itemsSection}>
          {Object.keys(groupedItems).length === 0 ? (
            <div className={styles.emptyState}>
              {pantryItems.length === 0 ? (
                <>
                  <Package size={64} />
                  <h2>Your pantry is empty</h2>
                  <p>Start adding ingredients to keep track of what you have and discover new recipes!</p>
                  <button onClick={() => setShowAddForm(true)} className={styles.emptyStateButton}>
                    Add Your First Item
                  </button>
                </>
              ) : (
                <>
                  <h2>No items match your search</h2>
                  <p>Try adjusting your search terms or category filter</p>
                </>
              )}
            </div>
          ) : (
            Object.entries(groupedItems).map(([category, items]) => (
              <div key={category} className={styles.categorySection}>
                <h2>{category} ({items.length})</h2>
                <div className={styles.itemsGrid}>
                  {items.map(item => (
                    <div key={item.id} className={styles.itemCard}>
                      <div className={styles.itemInfo}>
                        <h3>{item.name}</h3>
                        {item.quantity && <p className={styles.quantity}>{item.quantity}</p>}
                        {item.expiry_date && (
                          <p className={styles.expiry}>
                            Expires: {new Date(item.expiry_date).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => removeItem(item.id)}
                        className={styles.removeButton}
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
};

export default Pantry;
