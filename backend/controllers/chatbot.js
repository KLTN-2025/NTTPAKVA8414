// controllers/chatbot.js

const openaiService = require('../services/openaiService');
const spoonacularService = require('../services/spoonacularService');
const productMatcher = require('../services/productMatcher');
const prompts = require('../services/systemPrompts');

// Flow step sequences
const NUTRITION_STEPS = ['height', 'weight', 'age', 'gender', 'activityDays', 'goal', 'allergies', 'complete'];
const RECIPE_STEPS = ['dish', 'servings', 'confirm', 'select', 'owned', 'matching', 'show_products', 'cart_confirm', 'complete'];

//
const USER_DONT_HAVE_KEYWORDS = ['none', 'nothing', 'no', 'n/a', 'na', "i don't have anything", "don't have anything"]

/**
 * POST /api/chatbot/message
 */
exports.handleMessage = async (req, res) => {
  try {
    const {
      message,
      conversationHistory = [],
      currentFlow = null,
      flowState = {},
    } = req.body;
    
    // Validate input
    if (!message || typeof message !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Message is required',
      });
    }
    
    const trimmedMessage = message.trim();
    if (trimmedMessage.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Message cannot be empty',
      });
    }
    
    // Limit conversation history to last 20 messages
    const limitedHistory = conversationHistory.slice(-20);
    
    // Determine user intent
    const intent = await determineIntent(trimmedMessage, currentFlow, flowState);
    
    let response;
    
    switch (intent) {
      case 'restart':
        response = handleRestart();
        break;
        
      case 'nutrition':
      case 'switch_nutrition':
        response = await handleNutritionFlow(trimmedMessage, { ...flowState, currentStep: 'height' }, true);
        break;
        
      case 'recipe':
      case 'switch_recipe':
        response = await handleRecipeFlow(trimmedMessage, { ...flowState, currentStep: 'dish' }, true, req);
        break;
        
      case 'continue':
        if (currentFlow === 'nutrition') {
          response = await handleNutritionFlow(trimmedMessage, flowState, false);
        } else if (currentFlow === 'recipe') {
          response = await handleRecipeFlow(trimmedMessage, flowState, false, req);
        } else {
          // No active flow, treat as out of scope
          response = handleOutOfScope(null);
        }
        break;
        
      case 'out_of_scope':
      default:
        response = handleOutOfScope(currentFlow, flowState);
        break;
    }
    
    return res.status(200).json({
      success: true,
      ...response,
    });
    
  } catch (error) {
    console.error('Chatbot error:', error);
    return res.status(500).json({
      success: false,
      reply: prompts.MESSAGES.ERROR_GENERIC,
      currentFlow: req.body.currentFlow || null,
      flowState: req.body.flowState || {},
    });
  }
};

/**
 * Determine user intent using GPT
 */
async function determineIntent(message, currentFlow, flowState) {
  const lowerMessage = message.toLowerCase().trim();
  
  if (['restart', 'start over', 'reset', 'begin again'].some(k => lowerMessage.includes(k))) {
    return 'restart';
  }
  
  if (currentFlow && flowState?.currentStep) {
    const step = flowState.currentStep;
    
    if (isValidInputForStep(message, currentFlow, step)) {
      return 'continue';
    }
  }
  
  if (['nutrition', 'diet', 'calorie', 'calories', 'health advice', 'eating', 'macro'].some(k => lowerMessage.includes(k))) {
    return currentFlow === 'nutrition' ? 'continue' : 'nutrition';
  }
  
  if (['recipe', 'cook', 'make food', 'dish', 'ingredient', 'ingredients', 'meal'].some(k => lowerMessage.includes(k))) {
    return currentFlow === 'recipe' ? 'continue' : 'recipe';
  }
  
  // If in a flow, assume they're continuing unless clearly off-topic
  if (currentFlow) {
    const result = await openaiService.detectIntent(message, currentFlow);
    return result.intent || 'continue';
  }
  
  if (['1', '2', 'first', 'second', 'one', 'two'].some(k => lowerMessage === k)) {
    if (lowerMessage === '1' || lowerMessage === 'first' || lowerMessage === 'one') {
      return 'nutrition';
    }
    if (lowerMessage === '2' || lowerMessage === 'second' || lowerMessage === 'two') {
      return 'recipe';
    }
  }
  
  // Use GPT for intent detection
  const result = await openaiService.detectIntent(message, currentFlow);
  return result.intent || 'out_of_scope';
}

/**
 * Check if input is valid for current step
 */
function isValidInputForStep(message, flow, step) {
  const trimmed = message.trim();
  
  if (flow === 'nutrition') {
    switch (step) {
      case 'height':
      case 'weight':
      case 'age':
      case 'activityDays':
        return /^\d+(\.\d+)?$/.test(trimmed);
      case 'gender':
        return ['male', 'female', 'm', 'f', '1', '2'].includes(trimmed.toLowerCase());
      case 'goal':
        return ['1', '2', '3', '4', 'lose', 'gain', 'maintain', 'eat', 'healthier'].some(k => 
          trimmed.toLowerCase().includes(k)
        );
      case 'allergies':
        return true; // Any text is valid
      default:
        return false;
    }
  }
  
  if (flow === 'recipe') {
    switch (step) {
      case 'dish':
        return trimmed.length > 1; // Any dish name
      case 'servings':
        return /^[1-6]$/.test(trimmed);
      case 'confirm':
        return ['yes', 'no', 'y', 'n', 'ok', 'sure', 'yeah', 'nope'].some(k => 
          trimmed.toLowerCase().includes(k)
        );
      case 'select':
        return /^[1-9]$/.test(trimmed);
      case 'owned':
        return true; // Any text is valid
      case 'cart_confirm':
        return ['yes', 'no', 'y', 'n', 'ok', 'sure', 'add', 'skip'].some(k => 
          trimmed.toLowerCase().includes(k)
        );
      default:
        return false;
    }
  }
  
  return false;
}

/**
 * Handle restart
 */
function handleRestart() {
  return {
    reply: prompts.MESSAGES.GREETING,
    currentFlow: null,
    flowState: {},
    suggestions: ['Nutrition Guidance', 'Build a Recipe'],
  };
}

/**
 * Handle out of scope messages
 */
function handleOutOfScope(currentFlow, flowState = {}) {
  if (!currentFlow) {
    return {
      reply: prompts.MESSAGES.OUT_OF_SCOPE_INITIAL,
      currentFlow: null,
      flowState: {},
      suggestions: ['Nutrition Guidance', 'Build a Recipe'],
    };
  }
  
  // In a flow - remind them of the current question
  const currentStep = flowState.currentStep;
  let currentQuestion = '';
  
  if (currentFlow === 'nutrition' && prompts.NUTRITION_QUESTIONS[currentStep]) {
    currentQuestion = prompts.NUTRITION_QUESTIONS[currentStep].message;
  } else if (currentFlow === 'recipe' && prompts.RECIPE_QUESTIONS[currentStep]) {
    currentQuestion = prompts.RECIPE_QUESTIONS[currentStep].message;
  }
  
  return {
    reply: `${prompts.MESSAGES.OUT_OF_SCOPE_IN_FLOW}${currentQuestion}`,
    currentFlow,
    flowState,
    suggestions: getSuggestionsForStep(currentFlow, currentStep),
  };
}

/**
 * Handle nutrition flow
 */
async function handleNutritionFlow(message, flowState, isNewFlow) {
  let state = { ...flowState };
  
  // Starting new flow
  if (isNewFlow) {
    const disclaimer = prompts.MESSAGES.MEDICAL_DISCLAIMER_START;
    const firstQuestion = prompts.NUTRITION_QUESTIONS.height.message;
    
    return {
      reply: `${disclaimer}\n\n${firstQuestion}`,
      currentFlow: 'nutrition',
      flowState: { currentStep: 'height' },
      suggestions: null,
    };
  }
  
  const currentStep = state.currentStep || 'height';
  
  // Validate and process input for current step
  const validation = validateNutritionInput(message, currentStep);
  
  if (!validation.valid) {
    return {
      reply: validation.error,
      currentFlow: 'nutrition',
      flowState: state,
      suggestions: getSuggestionsForStep('nutrition', currentStep),
    };
  }
  
  // Store the value
  state[currentStep] = validation.value;
  
  // Move to next step
  const currentIndex = NUTRITION_STEPS.indexOf(currentStep);
  const nextStep = NUTRITION_STEPS[currentIndex + 1];
  
  if (nextStep === 'complete') {
    // Generate nutrition advice
    const advice = generateNutritionAdvice(state);
    return {
      reply: advice + prompts.MESSAGES.MEDICAL_DISCLAIMER_END + '\n\n' + prompts.MESSAGES.END_MESSAGE,
      currentFlow: null,
      flowState: {},
      suggestions: ['Nutrition Guidance', 'Build a Recipe'],
    };
  }
  
  // Ask next question
  state.currentStep = nextStep;
  const nextQuestion = prompts.NUTRITION_QUESTIONS[nextStep];
  
  return {
    reply: nextQuestion.message,
    currentFlow: 'nutrition',
    flowState: state,
    suggestions: nextQuestion.options || null,
  };
}

/**
 * Validate nutrition flow input
 */
function validateNutritionInput(message, step) {
  const trimmed = message.trim();
  const question = prompts.NUTRITION_QUESTIONS[step];
  
  if (!question) {
    return { valid: false, error: prompts.MESSAGES.ERROR_GENERIC };
  }
  
  switch (step) {
    case 'height': {
      const num = parseFloat(trimmed);
      if (isNaN(num) || num < 50 || num > 250) {
        return { valid: false, error: question.errorMessage };
      }
      return { valid: true, value: num };
    }
    
    case 'weight': {
      const num = parseFloat(trimmed);
      if (isNaN(num) || num < 10 || num > 300) {
        return { valid: false, error: question.errorMessage };
      }
      return { valid: true, value: num };
    }
    
    case 'age': {
      const num = parseInt(trimmed);
      if (isNaN(num) || num < 1 || num > 80) {
        return { valid: false, error: question.errorMessage };
      }
      return { valid: true, value: num };
    }
    
    case 'gender': {
      const lower = trimmed.toLowerCase();
      if (['male', 'm', '1'].includes(lower)) {
        return { valid: true, value: 'Male' };
      }
      if (['female', 'f', '2'].includes(lower)) {
        return { valid: true, value: 'Female' };
      }
      return { valid: false, error: question.errorMessage };
    }
    
    case 'activityDays': {
      const num = parseInt(trimmed);
      if (isNaN(num) || num < 0 || num > 7) {
        return { valid: false, error: question.errorMessage };
      }
      return { valid: true, value: num };
    }
    
    case 'goal': {
      const lower = trimmed.toLowerCase();
      const goals = ['Lose weight', 'Gain muscle', 'Maintain weight', 'Eat healthier'];
      
      // Check for number selection
      const num = parseInt(trimmed);
      if (num >= 1 && num <= 4) {
        return { valid: true, value: goals[num - 1] };
      }
      
      // Check for text match
      for (const goal of goals) {
        if (lower.includes(goal.toLowerCase().split(' ')[0])) {
          return { valid: true, value: goal };
        }
      }
      
      return { valid: false, error: question.errorMessage };
    }
    
    case 'allergies': {
      return { valid: true, value: trimmed || 'None' };
    }
    
    default:
      return { valid: false, error: prompts.MESSAGES.ERROR_GENERIC };
  }
}

/**
 * Generate nutrition advice based on collected data
 */
function generateNutritionAdvice(data) {
  const { height, weight, age, gender, activityDays, goal, allergies } = data;
  
  // Calculate BMR using Mifflin-St Jeor equation
  let bmr;
  if (gender === 'Male') {
    bmr = 10 * weight + 6.25 * height - 5 * age + 5;
  } else {
    bmr = 10 * weight + 6.25 * height - 5 * age - 161;
  }
  
  // Activity multiplier
  let activityMultiplier;
  if (activityDays === 0) activityMultiplier = 1.2;
  else if (activityDays <= 2) activityMultiplier = 1.375;
  else if (activityDays <= 4) activityMultiplier = 1.55;
  else if (activityDays <= 6) activityMultiplier = 1.725;
  else activityMultiplier = 1.9;
  
  let tdee = Math.round(bmr * activityMultiplier);
  
  // Goal adjustment
  let goalCalories = tdee;
  let proteinPercent, carbPercent, fatPercent;
  let advice = [];
  
  switch (goal) {
    case 'Lose weight':
      goalCalories = tdee - 500;
      proteinPercent = [25, 30];
      carbPercent = [40, 45];
      fatPercent = [25, 30];
      advice = [
        'Focus on lean proteins like chicken breast, fish, and eggs',
        'Fill half your plate with vegetables at each meal',
        'Reduce processed foods and added sugars',
        'Stay hydrated - aim for 8 glasses of water daily',
        'Consider smaller, more frequent meals to manage hunger',
      ];
      break;
      
    case 'Gain muscle':
      goalCalories = tdee + 300;
      proteinPercent = [25, 35];
      carbPercent = [40, 50];
      fatPercent = [20, 25];
      advice = [
        'Prioritize protein at every meal (chicken, fish, eggs, tofu)',
        'Eat complex carbs for energy (brown rice, quinoa, oats)',
        'Include healthy fats from nuts, avocado, and olive oil',
        'Time your protein intake around workouts',
        'Don\'t skip meals - consistency is key for muscle building',
      ];
      break;
      
    case 'Maintain weight':
      proteinPercent = [20, 25];
      carbPercent = [45, 55];
      fatPercent = [25, 30];
      advice = [
        'Maintain a balanced diet with variety',
        'Include protein, carbs, and healthy fats in each meal',
        'Stay active with regular exercise',
        'Monitor portion sizes to maintain balance',
        'Focus on whole, unprocessed foods',
      ];
      break;
      
    case 'Eat healthier':
    default:
      proteinPercent = [20, 30];
      carbPercent = [45, 55];
      fatPercent = [25, 30];
      advice = [
        'Increase vegetable intake to 5+ servings daily',
        'Choose whole grains over refined carbs',
        'Limit processed foods and added sugars',
        'Include a variety of colorful fruits and vegetables',
        'Cook at home more often for better control over ingredients',
      ];
      break;
  }
  
  // Calculate macros
  const proteinGrams = [
    Math.round((goalCalories * proteinPercent[0] / 100) / 4),
    Math.round((goalCalories * proteinPercent[1] / 100) / 4)
  ];
  const carbGrams = [
    Math.round((goalCalories * carbPercent[0] / 100) / 4),
    Math.round((goalCalories * carbPercent[1] / 100) / 4)
  ];
  const fatGrams = [
    Math.round((goalCalories * fatPercent[0] / 100) / 9),
    Math.round((goalCalories * fatPercent[1] / 100) / 9)
  ];
  
  // Build response
  let response = `Based on your information:\n`;
  response += `- Height: ${height}cm | Weight: ${weight}kg | Age: ${age} | ${gender}\n`;
  response += `- Activity: ${activityDays} days/week | Goal: ${goal}\n`;
  response += `- Allergies: ${allergies}\n\n`;
  
  response += `Daily Recommendations:\n`;
  response += `- Calories: ~${goalCalories.toLocaleString()} kcal/day\n`;
  response += `- Protein: ${proteinGrams[0]}-${proteinGrams[1]}g (${proteinPercent[0]}-${proteinPercent[1]}%)\n`;
  response += `- Carbs: ${carbGrams[0]}-${carbGrams[1]}g (${carbPercent[0]}-${carbPercent[1]}%)\n`;
  response += `- Fat: ${fatGrams[0]}-${fatGrams[1]}g (${fatPercent[0]}-${fatPercent[1]}%)\n\n`;
  
  response += `General Advice:\n`;
  advice.forEach(tip => {
    response += `- ${tip}\n`;
  });
  
  return response;
}

/**
 * Handle recipe flow
 */
async function handleRecipeFlow(message, flowState, isNewFlow, req) {
  let state = { ...flowState };
  
  // Starting new flow
  if (isNewFlow) {
    return {
      reply: prompts.RECIPE_QUESTIONS.dish.message,
      currentFlow: 'recipe',
      flowState: { currentStep: 'dish' },
      suggestions: null,
    };
  }
  
  const currentStep = state.currentStep || 'dish';
  
  switch (currentStep) {
    case 'dish':
      return await handleDishInput(message, state);
      
    case 'servings':
      return await handleServingsInput(message, state);
      
    case 'confirm':
      return await handleRecipeConfirm(message, state);
      
    case 'select':
      return await handleRecipeSelection(message, state);
      
    case 'owned':
      return await handleOwnedIngredients(message, state, req);
      
    case 'cart_confirm':
      return await handleCartConfirm(message, state);
      
    default:
      return {
        reply: prompts.MESSAGES.ERROR_GENERIC,
        currentFlow: 'recipe',
        flowState: state,
      };
  }
}

/**
 * Handle dish name input
 */
async function handleDishInput(message, state) {
  const dishName = message.trim();
  
  if (dishName.length < 2) {
    return {
      reply: prompts.RECIPE_QUESTIONS.dish.errorMessage,
      currentFlow: 'recipe',
      flowState: state,
    };
  }
  
  // Translate if needed
  const translation = await openaiService.translateToEnglish(dishName);
  const englishDish = translation.success ? translation.translation : dishName;
  
  state.dishName = dishName;
  state.englishDishName = englishDish;
  state.currentStep = 'servings';
  
  return {
    reply: prompts.RECIPE_QUESTIONS.servings.message,
    currentFlow: 'recipe',
    flowState: state,
  };
}

/**
 * Handle servings input
 */
async function handleServingsInput(message, state) {
  const num = parseInt(message.trim());
  
  if (isNaN(num) || num < 1 || num > 6) {
    return {
      reply: prompts.RECIPE_QUESTIONS.servings.errorMessage,
      currentFlow: 'recipe',
      flowState: state,
    };
  }
  
  state.servings = num;
  return await handleRecipeConfirm(message, state);
}

/**
 * Handle recipe confirmation and search
 */
async function handleRecipeConfirm(message, state) {
  // Search for recipe
  const searchResult = await spoonacularService.findRecipeWithIngredients(
    state.englishDishName || state.dishName,
    state.servings
  );
  
  if (!searchResult.success) {
    // Try GPT fallback
    return await handleRecipeFallback(state);
  }
  
  // Multiple recipes - need selection
  if (searchResult.needsSelection && searchResult.alternatives) {
    state.alternatives = searchResult.alternatives;
    state.currentStep = 'select';
    
    let message = `I found several recipes for "${state.dishName}":\n\n`;
    searchResult.alternatives.forEach((recipe, idx) => {
      message += `${idx + 1}. ${recipe.title}\n`;
    });
    message += `\nWhich one would you like? (Enter the number)`;
    
    return {
      reply: message,
      currentFlow: 'recipe',
      flowState: state,
      suggestions: searchResult.alternatives.map((_, idx) => `${idx + 1}`),
    };
  }
  
  // Single recipe found
  if (searchResult.recipe) {
    return processRecipeFound(searchResult.recipe, state);
  }
  
  // No results
  return await handleRecipeFallback(state);
}

/**
 * Handle recipe selection from multiple options
 */
async function handleRecipeSelection(message, state) {
  const selection = parseInt(message.trim());
  
  if (isNaN(selection) || selection < 1 || selection > (state.alternatives?.length || 0)) {
    return {
      reply: `Please select a number between 1 and ${state.alternatives?.length || 5}.`,
      currentFlow: 'recipe',
      flowState: state,
      suggestions: state.alternatives?.map((_, idx) => `${idx + 1}`),
    };
  }
  
  const selectedRecipe = state.alternatives[selection - 1];
  
  // Get full recipe details
  const detailsResult = await spoonacularService.getRecipeDetails(selectedRecipe.id, state.servings);
  
  if (!detailsResult.success) {
    return {
      reply: `Sorry, I couldn't get the details for that recipe. ${detailsResult.error}`,
      currentFlow: 'recipe',
      flowState: state,
    };
  }
  
  return processRecipeFound(detailsResult.recipe, state);
}

/**
 * Process a found recipe and show ingredients
 */
async function processRecipeFound(recipe, state) {
  state.recipe = recipe;
  state.ingredients = recipe.ingredients;
  state.currentStep = 'owned';
  
  // Format ingredients for display
  const { displayed, remaining } = spoonacularService.formatIngredientsForDisplay(recipe.ingredients, 10);
  
  let message = `Great! Here are the ingredients for ${recipe.title} (${recipe.servings} servings):\n\n`;
  displayed.forEach((ing, idx) => {
    message += `${idx + 1}. ${ing.display}\n`;
  });
  
  if (remaining > 0) {
    message += `\n...and ${remaining} more ingredients.\n`;
  }
  
  message += `\n${prompts.RECIPE_QUESTIONS.owned.message}`;
  
  return {
    reply: message,
    currentFlow: 'recipe',
    flowState: state,
  };
}

/**
 * Handle GPT fallback for recipe generation
 */
async function handleRecipeFallback(state) {
  const prompt = prompts.generateRecipeFallbackPrompt(state.dishName, state.servings);
  
  const result = await openaiService.chat({
    systemPrompt: prompt,
    messages: [{ role: 'user', content: `Generate a recipe for ${state.dishName}` }],
    temperature: 0.6,
    maxTokens: 1000,
    jsonMode: true,
  });
  
  if (!result.success) {
    return {
      reply: `Sorry, I couldn't find a recipe for "${state.dishName}". Would you like to try a different dish?`,
      currentFlow: 'recipe',
      flowState: { currentStep: 'dish' },
    };
  }
  
  const parsed = openaiService.parseJsonResponse(result.content);
  
  if (!parsed || !parsed.ingredients) {
    return {
      reply: `Sorry, I couldn't generate a recipe for "${state.dishName}". Would you like to try a different dish?`,
      currentFlow: 'recipe',
      flowState: { currentStep: 'dish' },
    };
  }
  
  // Create recipe object similar to Spoonacular format
  const recipe = {
    title: parsed.title || state.dishName,
    servings: parsed.servings || state.servings,
    readyInMinutes: parsed.readyInMinutes || 30,
    ingredients: parsed.ingredients.map(ing => ({
      name: ing.name,
      amount: ing.amount,
      unit: ing.unit || '',
      original: ing.original || `${ing.amount} ${ing.unit || ''} ${ing.name}`.trim(),
    })),
    isGenerated: true,
  };
  
  return processRecipeFound(recipe, state);
}

/**
 * Handle owned ingredients input
 */
async function handleOwnedIngredients(message, state, req) {
  const lowerMessage = message.toLowerCase().trim();
  const ingredientNames = state.ingredients.map(ing => ing.name.toLowerCase());
  
  let owned = [];
  
  // Pattern 1: "everything except X" or "all but X"
  const exceptMatch = lowerMessage.match(
    /(?:i have\s+)?(?:everything|all|most)(?:\s+(?:except|but|besides|other than|except for))(?:\s+(?:for)?)?\s+(.+)/i
  );
  
  if (exceptMatch) {
    // User has everything EXCEPT what they listed
    const exceptItems = exceptMatch[1]
      .split(/[,;]|\band\b/)
      .map(s => s.trim().replace(/^the\s+/, '')) // remove "the"
      .filter(s => s.length > 0);
    
    
    // Owned = all ingredients EXCEPT the ones they mentioned needing
    owned = ingredientNames.filter(ingName => {
      const isExcepted = exceptItems.some(except => 
        ingName.includes(except) || except.includes(ingName)
      );
      return !isExcepted;
    });
    
  } 
  // Pattern 2: "none" or "nothing"
  else if (USER_DONT_HAVE_KEYWORDS.includes(lowerMessage)) {
    owned = [];
  }
  // Pattern 3: Normal list of owned items
  else {
    owned = productMatcher.parseOwnedIngredients(message);
  }
  
  state.ownedIngredients = owned;
  state.confirmedOwned = owned;
  
  // Match ingredients to products
  const apiBaseUrl = `${req.protocol}://${req.get('host')}`;
  
  const matchResult = await productMatcher.matchRecipeToStore(
    state.ingredients,
    state.confirmedOwned,
    apiBaseUrl
  );

  
  if (matchResult.message === 'You already have all the ingredients!') {
    return {
      reply: prompts.MESSAGES.ALL_INGREDIENTS_OWNED + '\n\n' + prompts.MESSAGES.END_MESSAGE,
      currentFlow: null,
      flowState: {},
      suggestions: ['Nutrition Guidance', 'Build a Recipe'],
    };
  }
  
  if (matchResult.products.length === 0) {
    // More helpful error message
    let errorMsg = prompts.MESSAGES.NO_PRODUCTS_AVAILABLE;
    if (matchResult.unavailable?.length > 0) {
      errorMsg = `Sorry, I couldn't find these items in our store: ${matchResult.unavailable.join(', ')}. Would you like to try a different recipe?`;
    }
    
    return {
      reply: errorMsg,
      currentFlow: 'recipe',
      flowState: { currentStep: 'dish' },
      suggestions: null,
    };
  }
  
  state.matchedProducts = matchResult.products;
  state.unavailableIngredients = matchResult.unavailable;
  state.cartTotal = matchResult.total;
  state.currentStep = 'cart_confirm';
  
  // Build product list message
  let replyMessage = `I found these items in our store:\n\n`;
  
  matchResult.products.forEach((product, idx) => {
    replyMessage += `${idx + 1}. ${product.name} (${product.size}${product.unit}) - ${formatPrice(product.price)}\n`;
    if (product.note) {
      replyMessage += `   ${product.note}\n`;
    }
  });
  
  if (matchResult.unavailable.length > 0) {
    replyMessage += `\nNot available in our store:\n`;
    matchResult.unavailable.forEach(item => {
      replyMessage += `- ${item}\n`;
    });
  }
  
  replyMessage += `\nTotal for available items: ${formatPrice(matchResult.total)}`;
  replyMessage += `\n\nWould you like to add the available items to your cart?`;
  
  return {
    reply: replyMessage,
    currentFlow: 'recipe',
    flowState: state,
    suggestions: ['Yes', 'No'],
  };
}

/**
 * Handle cart confirmation
 */
async function handleCartConfirm(message, state) {
  const lower = message.toLowerCase().trim();
  
  const isYes = ['yes', 'y', 'ok', 'sure', 'yeah', 'add', 'yep'].some(k => lower.includes(k));
  const isNo = ['no', 'n', 'nope', 'skip', 'cancel'].some(k => lower.includes(k));
  
  if (!isYes && !isNo) {
    return {
      reply: 'Would you like to add these items to your cart? Please answer yes or no.',
      currentFlow: 'recipe',
      flowState: state,
      suggestions: ['Yes', 'No'],
    };
  }
  
  if (isNo) {
    return {
      reply: `No problem! ${prompts.MESSAGES.END_MESSAGE}`,
      currentFlow: null,
      flowState: {},
      suggestions: ['Nutrition Guidance', 'Build a Recipe'],
    };
  }
  
  // User wants to add to cart - return action for frontend
  return {
    reply: null, // Frontend will handle the message after cart action
    currentFlow: null,
    flowState: {},
    action: {
      type: 'addToCart',
      products: state.matchedProducts.map(p => ({
        productId: p.productId,
        name: p.name,
        price: p.price,
        quantity: p.quantity,
        image: p.image,
        size: p.size,
        unit: p.unit,
        stock: p.stock,
      })),
      total: state.cartTotal,
    },
    suggestions: ['Nutrition Guidance', 'Build a Recipe'],
  };
}

/**
 * Get suggestions for current step
 */
function getSuggestionsForStep(flow, step) {
  if (flow === 'nutrition') {
    const question = prompts.NUTRITION_QUESTIONS[step];
    return question?.options || null;
  }
  
  if (flow === 'recipe') {
    if (step === 'cart_confirm' || step === 'confirm') {
      return ['Yes', 'No'];
    }
  }
  
  return null;
}

/**
 * Format price using Vietnamese format
 */
function formatPrice(price) {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND'
  }).format(price);
}

/**
 * Get initial greeting
 * GET /api/chatbot/greeting
 */
exports.getGreeting = (req, res) => {
  return res.status(200).json({
    success: true,
    reply: prompts.MESSAGES.GREETING,
    currentFlow: null,
    flowState: {},
    suggestions: ['Nutrition Guidance', 'Build a Recipe'],
  });
};

module.exports = exports;