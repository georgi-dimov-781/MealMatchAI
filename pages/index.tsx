
import Head from 'next/head';
import Link from 'next/link';
import { ChefHat, Search, Brain, Calendar, ShoppingCart, Package } from 'lucide-react';
import styles from '../styles/Home.module.css';

export default function Home() {
  const features = [
    {
      icon: <Search size={32} />,
      title: 'Recipe Search',
      description: 'Find recipes based on ingredients you already have',
      href: '/recipe-search',
      color: '#667eea'
    },
    {
      icon: <Brain size={32} />,
      title: 'AI Recipe Remix',
      description: 'Get AI-powered recipe variations and substitutions',
      href: '/ai-remix',
      color: '#764ba2'
    },
    {
      icon: <Package size={32} />,
      title: 'Digital Pantry',
      description: 'Manage your ingredients and pantry items',
      href: '/pantry',
      color: '#38a169'
    },
    {
      icon: <Calendar size={32} />,
      title: 'Meal Planner',
      description: 'Plan your weekly meals with drag-and-drop calendar',
      href: '/meal-planner',
      color: '#e53e3e'
    }
  ];

  return (
    <div className={styles.container}>
      <Head>
        <title>Recipe Remix - Your Pantry-First Meal Planner</title>
        <meta name="description" content="Transform your available ingredients into delicious meals with AI-powered recipe suggestions" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className={styles.main}>
        <header className={styles.header}>
          <div className={styles.hero}>
            <ChefHat size={64} className={styles.heroIcon} />
            <h1 className={styles.title}>Recipe Remix</h1>
            <p className={styles.subtitle}>
              Your Pantry-First Meal Planner
            </p>
            <p className={styles.description}>
              Transform your available ingredients into delicious meals with AI-powered recipe suggestions. 
              Never wonder "what's for dinner?" again!
            </p>
          </div>
        </header>

        <section className={styles.features}>
          <h2>What can you do?</h2>
          <div className={styles.featuresGrid}>
            {features.map((feature, index) => (
              <Link key={index} href={feature.href} className={styles.featureCard}>
                <div className={styles.featureIcon} style={{ color: feature.color }}>
                  {feature.icon}
                </div>
                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
              </Link>
            ))}
          </div>
        </section>

        <section className={styles.howItWorks}>
          <h2>How it works</h2>
          <div className={styles.stepsGrid}>
            <div className={styles.step}>
              <div className={styles.stepNumber}>1</div>
              <h3>Add Your Ingredients</h3>
              <p>Tell us what you have in your pantry, fridge, or what you want to use up</p>
            </div>
            <div className={styles.step}>
              <div className={styles.stepNumber}>2</div>
              <h3>Get Recipe Suggestions</h3>
              <p>Our AI analyzes your ingredients and suggests personalized recipes</p>
            </div>
            <div className={styles.step}>
              <div className={styles.stepNumber}>3</div>
              <h3>Plan Your Meals</h3>
              <p>Add recipes to your weekly meal planner and generate shopping lists</p>
            </div>
          </div>
        </section>

        <section className={styles.cta}>
          <h2>Ready to start cooking?</h2>
          <Link href="/recipe-search" className={styles.ctaButton}>
            Find Recipes Now
          </Link>
        </section>
      </main>
    </div>
  );
}
