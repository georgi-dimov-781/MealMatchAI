# MealMatchAI 🍳

**Your Pantry-First Meal Planner**

Transform your available ingredients into delicious meals with AI-powered recipe suggestions. Never wonder "what's for dinner?" again!

## 🌟 Features

### 🔍 Recipe Search
- Find recipes based on ingredients you already have
- Smart ingredient matching using the Spoonacular API
- Filter by dietary restrictions, cuisine type, and cooking time
- View detailed recipe instructions and nutritional information

### 🤖 AI Recipe Remix
- Get AI-powered recipe variations and substitutions
- Generate creative meal ideas from your available ingredients
- Powered by Google's Gemini AI for intelligent suggestions (Or your prefered model)
- Save and view your AI remix history

### 📦 Digital Pantry
- Manage your ingredients and pantry items
- Track expiration dates to reduce food waste
- Categorize items for better organization
- Add items directly to your shopping list

### 📅 Meal Planner
- Plan your weekly meals with an intuitive drag-and-drop calendar
- Schedule breakfast, lunch, and dinner
- Visual meal planning with recipe images
- Export meal plans and generate shopping lists

## 🛠️ Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: CSS Modules, Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **APIs**: 
  - Spoonacular API for recipe data
  - Google Gemini AI for recipe suggestions
- **UI Components**: Lucide React icons
- **Drag & Drop**: @dnd-kit for meal planning interface
- **HTTP Client**: Axios for API requests

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ installed
- npm or yarn package manager
- Supabase account (for database)
- Spoonacular API key
- Google Gemini API key

### Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# API Keys
SPOONACULAR_API_KEY=your_spoonacular_api_key
GEMINI_API_KEY=your_gemini_api_key
NEXT_PUBLIC_GEMINI_API_KEY=your_gemini_api_key
```

### Installation

1. **Clone the repository** (if applicable)
2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Set up your database**:
   - Create a new Supabase project
   - Set up the required tables (see Database Schema section)
   - Add your Supabase credentials to `.env.local`

4. **Get API keys**:
   - Sign up for [Spoonacular API](https://spoonacular.com/food-api)
   - Get a [Google Gemini API key](https://ai.google.dev/)
   - Add both keys to your `.env.local` file

5. **Run the development server**:
   ```bash
   npm run dev
   ```

6. **Open your browser** and navigate to `http://localhost:3000`

## 📊 Database Schema

The application uses Supabase with the following tables:

### `recipes`
- `id` (bigint, primary key)
- `spoonacular_id` (integer, unique)
- `title` (text)
- `image` (text)
- `servings` (integer)
- `ready_in_minutes` (integer)
- `created_at` (timestamp)

### `meal_plans`
- `id` (uuid, primary key)
- `date` (date)
- `meal_type` (text) - breakfast, lunch, dinner
- `recipe_id` (integer)
- `recipe_name` (text)
- `recipe_image` (text)
- `cooking_time` (integer)
- `created_at` (timestamp)

### `pantry_items`
- `id` (uuid, primary key)
- `name` (text)
- `category` (text)
- `quantity` (text)
- `expiry_date` (date)
- `date_added` (timestamp)

### `ai_remix_history`
- `id` (uuid, primary key)
- `user_id` (text)
- `ingredients` (text array)
- `remix_type` (text)
- `suggestions` (text)
- `created_at` (timestamp)

### `shopping_list`
- `id` (uuid, primary key)
- `name` (text)
- `category` (text)
- `needed` (boolean)
- `created_at` (timestamp)

## 🏗️ Project Structure

```
├── lib/                    # Utility libraries and API integrations
│   ├── database.ts        # Supabase database operations
│   ├── openai.ts          # AI integration (Gemini API)
│   ├── spoonacular.ts     # Recipe API integration
│   └── supabase.ts        # Supabase client configuration
├── pages/                 # Next.js pages and API routes
│   ├── api/               # API endpoints
│   ├── recipe/            # Dynamic recipe pages
│   ├── index.tsx          # Homepage
│   ├── recipe-search.tsx  # Recipe search page
│   ├── ai-remix.tsx       # AI recipe remix page
│   ├── pantry.tsx         # Pantry management page
│   └── meal-planner.tsx   # Meal planning page
├── styles/                # CSS modules for styling
├── public/                # Static assets
└── package.json           # Dependencies and scripts
```

## 🔧 Available Scripts

- `npm run dev` - Start development server on port 3000
- `npm run build` - Create production build
- `npm start` - Start production server
- `npm run lint` - Run ESLint for code quality

## 🌐 API Endpoints

### Recipe Endpoints
- `GET /api/recipes/search` - Search recipes by ingredients
- `GET /api/recipes/[id]` - Get detailed recipe information

### AI Endpoints
- `POST /api/ai-remix` - Generate AI-powered recipe suggestions

## 📱 Pages Overview

### Homepage (`/`)
- Feature overview and navigation
- Quick access to all main functions
- "How it works" guide

### Recipe Search (`/recipe-search`)
- Ingredient-based recipe search
- Advanced filtering options
- Save recipes to your collection

### AI Recipe Remix (`/ai-remix`)
- AI-powered recipe generation
- Ingredient substitution suggestions
- Creative meal ideas

### Digital Pantry (`/pantry`)
- Manage pantry inventory
- Track expiration dates
- Add items to shopping list

### Meal Planner (`/meal-planner`)
- Weekly meal planning interface
- Drag-and-drop functionality
- Visual meal calendar

## 🔑 Key Features Explained

### Intelligent Recipe Matching
The app uses the Spoonacular API to find recipes that maximize the use of your available ingredients while minimizing missing ingredients.

### AI-Powered Suggestions
Google's Gemini AI analyzes your ingredients and cooking preferences to suggest creative recipe variations and substitutions.

### Pantry-First Approach
Unlike traditional meal planners, Recipe Remix starts with what you have, helping reduce food waste and save money.

### Seamless Integration
All features work together - find recipes from your pantry, get AI suggestions, plan meals, and generate shopping lists.


## 🤝 Contributing

This is a personal meal planning project, but feel free to fork and customize it for your own needs!

## 📄 License

This project is for personal use and learning purposes.

## 🔗 External Services

- **Spoonacular API**: Recipe data and ingredient matching
- **Google Gemini AI**: AI-powered recipe suggestions
- **Supabase**: Database and backend services

---

**Happy cooking! 🍽️**