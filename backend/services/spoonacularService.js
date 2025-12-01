// services/spoonacularService.js

const axios = require('axios');
require('dotenv').config()

const SPOONACULAR_BASE_URL = 'https://api.spoonacular.com';
const API_KEY = process.env.SPOONACULAR_API_KEY;

/**
 * Search for recipes by query
 * @param {string} query - Search query (dish name)
 * @param {number} number - Number of results to return (default: 5)
 * @returns {Promise<{success: boolean, recipes: Array, error?: string}>}
 */
async function searchRecipes(query, number = 5) {
  try {
    const response = await axios.get(`${SPOONACULAR_BASE_URL}/recipes/complexSearch`, {
      params: {
        apiKey: API_KEY,
        query,
        number,
        addRecipeInformation: true,
        fillIngredients: false,
      },
      timeout: 10000, // 10 second timeout
    });
    
    const recipes = response.data.results.map(recipe => ({
      id: recipe.id,
      title: recipe.title,
      image: recipe.image,
      servings: recipe.servings,
      readyInMinutes: recipe.readyInMinutes,
      sourceUrl: recipe.sourceUrl,
    }));
    
    return {
      success: true,
      recipes,
      totalResults: response.data.totalResults,
    };
  } catch (error) {
    console.error('Spoonacular Search Error:', error.message);
    
    if (error.code === 'ECONNABORTED') {
      return {
        success: false,
        recipes: [],
        error: 'Recipe search timed out. Please try again.',
      };
    }
    
    if (error.response?.status === 402) {
      return {
        success: false,
        recipes: [],
        error: 'Recipe API limit reached. Please try again tomorrow.',
      };
    }
    
    return {
      success: false,
      recipes: [],
      error: 'Failed to search recipes. Please try again.',
    };
  }
}

/**
 * Get detailed recipe information including ingredients
 * @param {number} recipeId - Spoonacular recipe ID
 * @param {number} targetServings - Desired number of servings (for scaling)
 * @returns {Promise<{success: boolean, recipe: Object, error?: string}>}
 */
async function getRecipeDetails(recipeId, targetServings = null) {
  try {
    const response = await axios.get(`${SPOONACULAR_BASE_URL}/recipes/${recipeId}/information`, {
      params: {
        apiKey: API_KEY,
        includeNutrition: false,
      },
      timeout: 10000,
    });
    
    const recipe = response.data;
    let ingredients = recipe.extendedIngredients || [];
    
    const originalServings = recipe.servings || 1;
    if (targetServings && targetServings !== originalServings) {
      const scaleFactor = targetServings / originalServings;
      ingredients = ingredients.map(ing => ({
        ...ing,
        amount: Math.round(ing.amount * scaleFactor * 100) / 100,
      }));
    }
    
    const formattedIngredients = ingredients.map(ing => ({
      id: ing.id,
      name: ing.name,
      originalName: ing.originalName || ing.name,
      amount: ing.amount,
      unit: ing.unit || '',
      original: ing.original, 
      aisle: ing.aisle,
      meta: ing.meta || [], 
    }));
    
    return {
      success: true,
      recipe: {
        id: recipe.id,
        title: recipe.title,
        image: recipe.image,
        servings: targetServings || originalServings,
        originalServings,
        readyInMinutes: recipe.readyInMinutes,
        instructions: recipe.instructions,
        sourceUrl: recipe.sourceUrl,
        ingredients: formattedIngredients,
      },
    };
  } catch (error) {
    console.error('Spoonacular Recipe Details Error:', error.message);
    
    if (error.response?.status === 404) {
      return {
        success: false,
        recipe: null,
        error: 'Recipe not found.',
      };
    }
    
    return {
      success: false,
      recipe: null,
      error: 'Failed to get recipe details. Please try again.',
    };
  }
}

/**
 * Search recipes and get full details for the first result
 * @param {string} query - Search query
 * @param {number} servings - Desired servings
 * @returns {Promise<{success: boolean, recipe?: Object, alternatives?: Array, error?: string}>}
 */
async function findRecipeWithIngredients(query, servings) {
  const searchResult = await searchRecipes(query, 5);
  
  if (!searchResult.success) {
    return searchResult;
  }
  
  if (searchResult.recipes.length === 0) {
    return {
      success: false,
      error: 'no_results',
      message: `No recipes found for "${query}".`,
    };
  }
  
  if (searchResult.recipes.length === 1) {
    const detailsResult = await getRecipeDetails(searchResult.recipes[0].id, servings);
    return {
      success: detailsResult.success,
      recipe: detailsResult.recipe,
      alternatives: [],
      error: detailsResult.error,
    };
  }
  
  return {
    success: true,
    recipe: null,
    alternatives: searchResult.recipes,
    needsSelection: true,
  };
}

/**
 * Convert ingredient list to a simplified format for display
 */
function formatIngredientsForDisplay(ingredients, maxItems = 10) {
  const displayed = ingredients.slice(0, maxItems).map(ing => {
    let displayString = '';
    
    if (ing.amount) {
      const formattedAmount = ing.amount % 1 === 0 
        ? ing.amount 
        : ing.amount.toFixed(1);
      displayString += formattedAmount;
    }
    
    if (ing.unit) {
      displayString += ` ${ing.unit}`;
    }
    
    displayString += ` ${ing.name}`;
    
    return {
      name: ing.name,
      amount: ing.amount,
      unit: ing.unit,
      display: displayString.trim(),
    };
  });
  
  const remaining = Math.max(0, ingredients.length - maxItems);
  
  return { displayed, remaining };
}

module.exports = {
  searchRecipes,
  getRecipeDetails,
  findRecipeWithIngredients,
  formatIngredientsForDisplay,
};