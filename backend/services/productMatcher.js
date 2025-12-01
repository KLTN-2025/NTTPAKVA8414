// services/productMatcher.js

const openaiService = require('./openaiService');
const unitConverter = require('./unitConverter');
const axios = require('axios');

let productCache = {
  data: null,
  timestamp: null,
  ttl: 5 * 60 * 1000
};

/**
 * Fetch products from the store API
 * @param {string} baseUrl - Base URL for the API
 * @returns {Promise<Array>}
 */
async function fetchProducts(baseUrl = '') {
  if (productCache.data && productCache.timestamp) {
    const age = Date.now() - productCache.timestamp;
    if (age < productCache.ttl) {
      return productCache.data;
    }
  }
  
  try {
    const response = await axios.get(`${baseUrl}/api/products/search`, {
      params: {
        stock: 'available',
        limit: 100,
      },
      timeout: 10000,
    });
    
    if (response.data?.success && response.data?.data) {
      const products = response.data.data;
      
      productCache.data = products;
      productCache.timestamp = Date.now();
      
      return products;
    }
    
    return [];
  } catch (error) {
    console.error('Error fetching products:', error.message);
    return productCache.data || [];
  }
}

/**
 * Clear the product cache
 */
function clearProductCache() {
  productCache.data = null;
  productCache.timestamp = null;
}

/**
 * Build a simplified product list for GPT matching
 * @param {Array} products - Array of product objects from API
 * @returns {Array}
 */
function simplifyProductsForGPT(products) {
  return products.map(p => ({
    id: p._id,
    name: p.name,
    size: p.size,
    unit: p.unit,
    price: p.price,
    category: p.category?.name || '',
    type: p.type?.name || '',
  }));
}

/**
 * Use GPT to match recipe ingredients to store products
 * @param {Array} ingredients - Array of ingredient objects from recipe
 * @param {Array} products - Array of product objects from store
 * @returns {Promise<{matches: Array, unmatched: Array}>}
 */
async function matchIngredientsToProducts(ingredients, products) {
  if (!ingredients || ingredients.length === 0) {
    return { matches: [], unmatched: [] };
  }
  
  if (!products || products.length === 0) {
    return { 
      matches: [], 
      unmatched: ingredients.map(i => i.name) 
    };
  }
  
  const simplifiedProducts = simplifyProductsForGPT(products);
  
  const systemPrompt = `You are a product matching assistant for a grocery store.
Your task is to match recipe ingredients to available store products.

RULES:
1. Match each ingredient to the most appropriate product
2. If multiple products could match, choose the CHEAPEST one
3. If no product matches an ingredient, mark it as unmatched
4. Consider the ingredient name, not exact quantities
5. Be flexible with naming (e.g., "chicken" can match "Skinless Chicken Breast")

Available store products:
${JSON.stringify(simplifiedProducts, null, 2)}

Respond in JSON format:
{
  "matches": [
    {
      "ingredientName": "original ingredient name",
      "ingredientAmount": number,
      "ingredientUnit": "unit from recipe",
      "productId": "matched product id",
      "productName": "matched product name",
      "confidence": 0.0-1.0
    }
  ],
  "unmatched": ["ingredient1", "ingredient2"]
}

Only include ingredients in "matches" if you're reasonably confident (>0.5) they match.
Put anything uncertain in "unmatched".`;

  const ingredientList = ingredients.map(i => ({
    name: i.name,
    amount: i.amount,
    unit: i.unit,
    original: i.original || `${i.amount} ${i.unit} ${i.name}`,
  }));
  
  const userMessage = `Match these recipe ingredients to store products:\n${JSON.stringify(ingredientList, null, 2)}`;
  
  const result = await openaiService.chat({
    systemPrompt,
    messages: [{ role: 'user', content: userMessage }],
    temperature: 0.3,
    maxTokens: 1500,
    jsonMode: true,
  });
  
  if (!result.success) {
    console.error('GPT matching failed:', result.error);
    return { 
      matches: [], 
      unmatched: ingredients.map(i => i.name) 
    };
  }
  
  const parsed = openaiService.parseJsonResponse(result.content);
  
  if (!parsed) {
    return { 
      matches: [], 
      unmatched: ingredients.map(i => i.name) 
    };
  }
  
  return {
    matches: parsed.matches || [],
    unmatched: parsed.unmatched || [],
  };
}

/**
 * Calculate quantities and enrich matched products with full details
 * @param {Array} matches - Array of match objects from GPT
 * @param {Array} products - Full product objects from API
 * @returns {Array}
 */
function enrichMatchesWithQuantities(matches, products) {
  return matches.map(match => {
    const product = products.find(p => p._id === match.productId);
    
    if (!product) {
      return null;
    }
    
    const quantityInfo = unitConverter.calculateQuantityNeeded(
      match.ingredientAmount,
      match.ingredientUnit,
      product.size,
      product.unit
    );
    
    return {
      productId: product._id,
      name: product.name,
      price: product.price,
      size: product.size,
      unit: product.unit,
      image: product.images || product.image || null,
      stock: product.stock,
      quantity: quantityInfo.quantity,
      note: quantityInfo.note,
      ingredientName: match.ingredientName,
      ingredientAmount: match.ingredientAmount,
      ingredientUnit: match.ingredientUnit,
    };
  }).filter(Boolean);
}

/**
 * Main function: Match recipe ingredients to store products
 * @param {Array} ingredients - Ingredients from recipe
 * @param {Array} ownedIngredients - Ingredients user already has (strings)
 * @param {string} apiBaseUrl - Base URL for product API
 * @returns {Promise<{products: Array, unavailable: Array, total: number}>}
 */
async function matchRecipeToStore(ingredients, ownedIngredients = [], apiBaseUrl = '') {
  // Fetch current products
  const products = await fetchProducts(apiBaseUrl);
  
  if (products.length === 0) {
    return {
      products: [],
      unavailable: ingredients.map(i => i.name),
      total: 0,
      error: 'Could not fetch store products.',
    };
  }
  
  // Filter out ingredients the user already has
  const neededIngredients = filterOwnedIngredients(ingredients, ownedIngredients);
  
  if (neededIngredients.length === 0) {
    return {
      products: [],
      unavailable: [],
      total: 0,
      message: 'You already have all the ingredients!',
    };
  }
  
  // Use GPT to match ingredients to products
  const { matches, unmatched } = await matchIngredientsToProducts(neededIngredients, products);
  
  // Enrich matches with quantity calculations
  const enrichedProducts = enrichMatchesWithQuantities(matches, products);
  
  // Calculate total price
  const total = enrichedProducts.reduce((sum, p) => sum + (p.price * p.quantity), 0);
  
  return {
    products: enrichedProducts,
    unavailable: unmatched,
    total,
  };
}

/**
 * Filter out ingredients that the user already has
 * Uses fuzzy matching for user's owned ingredient list
 * @param {Array} ingredients - Full ingredient list
 * @param {Array} ownedIngredients - User's owned ingredients (strings)
 * @returns {Array}
 */
function filterOwnedIngredients(ingredients, ownedIngredients) {
  if (!ownedIngredients || ownedIngredients.length === 0) {
    return ingredients;
  }
  
  // Normalize owned ingredients for matching
  const normalizedOwned = ownedIngredients.map(ing => 
    ing.toLowerCase().trim()
  );
  
  return ingredients.filter(ing => {
    const ingNameLower = ing.name.toLowerCase();
    
    // Check if any owned ingredient matches
    return !normalizedOwned.some(owned => {
      // Exact match
      if (ingNameLower === owned) return true;
      
      // Partial match (ingredient contains owned or vice versa)
      if (ingNameLower.includes(owned) || owned.includes(ingNameLower)) return true;
      
      // Simple fuzzy match: check if most characters match
      const similarity = calculateSimilarity(ingNameLower, owned);
      return similarity > 0.7;
    });
  });
}

/**
 * Calculate string similarity 
 * @param {string} str1 
 * @param {string} str2 
 * @returns {number} 0-1 similarity score
 */
function calculateSimilarity(str1, str2) {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;
  
  if (longer.length === 0) return 1.0;
  
  const distance = levenshteinDistance(longer, shorter);
  return (longer.length - distance) / longer.length;
}

/**
 * Levenshtein distance calculation
 */
function levenshteinDistance(str1, str2) {
  const m = str1.length;
  const n = str2.length;
  const dp = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));
  
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (str1[i - 1] === str2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
      }
    }
  }
  
  return dp[m][n];
}

/**
 * Parse user's "I have..." message into ingredient list
 * @param {string} message - User's message about owned ingredients
 * @returns {Array<string>}
 */
function parseOwnedIngredients(message) {
  if (!message) return [];
  
  const lower = message.toLowerCase().trim();
  
  // Check for "none" or "nothing" responses
  if (['none', 'nothing', 'no', 'n/a', 'na', "don't have anything", "i don't have anything"].includes(lower)) {
    return [];
  }
  
  // Remove common prefixes
  let cleaned = lower
    .replace(/^(i have|i've got|i already have|already have|got|have)\s*/i, '')
    .replace(/^(i own|i possess)\s*/i, '')
    .trim();
  
  // Split by common delimiters
  const ingredients = cleaned
    .split(/[,;]|\band\b|\n/)
    .map(s => s.trim())
    .filter(s => s.length > 0 && s.length < 50); 
  
  return ingredients;
}

module.exports = {
  fetchProducts,
  clearProductCache,
  matchIngredientsToProducts,
  matchRecipeToStore,
  filterOwnedIngredients,
  parseOwnedIngredients,
  calculateSimilarity,
};