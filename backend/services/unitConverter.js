// services/unitConverter.js

const CONVERSIONS = {
  volume: {
    ml: 1,
    l: 1000,
    liter: 1000,
    liters: 1000,
    cup: 240,
    cups: 240,
    tbsp: 15,
    tablespoon: 15,
    tablespoons: 15,
    tsp: 5,
    teaspoon: 5,
    teaspoons: 5,
    'fl oz': 30,
    'fluid ounce': 30,
    'fluid ounces': 30,
  },
  
  weight: {
    g: 1,
    gram: 1,
    grams: 1,
    kg: 1000,
    kilogram: 1000,
    kilograms: 1000,
    oz: 28,
    ounce: 28,
    ounces: 28,
    lb: 454,
    lbs: 454,
    pound: 454,
    pounds: 454,
  },
  
  count: {
    pcs: 1,
    piece: 1,
    pieces: 1,
    unit: 1,
    units: 1,
    pack: 1,
    packs: 1,
    bag: 1,
    bags: 1,
    box: 1,
    boxes: 1,
    bottle: 1,
    bottles: 1,
    can: 1,
    cans: 1,
    jar: 1,
    jars: 1,
    head: 1,
    heads: 1,
    bunch: 1,
    bunches: 1,
    clove: 1,
    cloves: 1,
    slice: 1,
    slices: 1,
    egg: 1,
    eggs: 1,
  }
};


function detectUnitType(unit) {
  if (!unit) return null;
  const normalizedUnit = unit.toLowerCase().trim();
  
  if (CONVERSIONS.volume[normalizedUnit]) return 'volume';
  if (CONVERSIONS.weight[normalizedUnit]) return 'weight';
  if (CONVERSIONS.count[normalizedUnit]) return 'count';
  
  return null;
}

function convertUnit(amount, fromUnit, toUnit) {
  if (!amount || amount <= 0) {
    return { success: false, amount: 0, note: 'Invalid amount' };
  }
  
  const fromNormalized = fromUnit?.toLowerCase().trim() || '';
  const toNormalized = toUnit?.toLowerCase().trim() || '';
  
  if (fromNormalized === toNormalized) {
    return { success: true, amount, note: null };
  }
  
  const fromType = detectUnitType(fromNormalized);
  const toType = detectUnitType(toNormalized);
  
  if (!fromType || !toType || fromType !== toType) {
    return { 
      success: false, 
      amount, 
      note: `Cannot convert ${fromUnit} to ${toUnit}` 
    };
  }
  
  if (fromType === 'count') {
    return { success: true, amount, note: null };
  }
  
  const conversionTable = CONVERSIONS[fromType];
  const fromFactor = conversionTable[fromNormalized];
  const toFactor = conversionTable[toNormalized];
  
  const baseAmount = amount * fromFactor;
  const convertedAmount = baseAmount / toFactor;
  
  return { 
    success: true, 
    amount: Math.round(convertedAmount * 100) / 100,
    note: null 
  };
}

function calculateQuantityNeeded(recipeAmount, recipeUnit, productSize, productUnit) {
  if (!recipeAmount || !productSize) {
    return { quantity: 1, note: 'Could not calculate exact quantity', convertible: false };
  }
  
  const conversion = convertUnit(recipeAmount, recipeUnit, productUnit);
  
  if (!conversion.success) {
    return { 
      quantity: 1, 
      note: `Recipe needs ${recipeAmount} ${recipeUnit}`,
      convertible: false 
    };
  }
  
  const quantityNeeded = Math.ceil(conversion.amount / productSize);
  const totalProvided = quantityNeeded * productSize;
  const extra = totalProvided - conversion.amount;
  
  let note = null;
  if (extra > 0 && extra < totalProvided) {
    const extraFormatted = extra % 1 === 0 ? extra : extra.toFixed(1);
    note = ``;
  }
  
  return { 
    quantity: Math.max(1, quantityNeeded), 
    note,
    convertible: true 
  };
}


function normalizeUnit(unit) {
  if (!unit) return '';
  
  const normalized = unit.toLowerCase().trim();
  
  const mappings = {
    'gram': 'g',
    'grams': 'g',
    'kilogram': 'kg',
    'kilograms': 'kg',
    'milliliter': 'ml',
    'milliliters': 'ml',
    'liter': 'l',
    'liters': 'l',
    'piece': 'pcs',
    'pieces': 'pcs',
    'tablespoon': 'tbsp',
    'tablespoons': 'tbsp',
    'teaspoon': 'tsp',
    'teaspoons': 'tsp',
  };
  
  return mappings[normalized] || normalized;
}


function parseAmountAndUnit(str) {
  if (!str) return null;
  
  const match = str.match(/^([\d./]+)\s*(.+)?$/);
  
  if (!match) return null;
  
  let amount = match[1];
  const unit = match[2]?.trim() || '';
  
  if (amount.includes('/')) {
    const [numerator, denominator] = amount.split('/').map(Number);
    amount = numerator / denominator;
  } else {
    amount = parseFloat(amount);
  }
  
  if (isNaN(amount)) return null;
  
  return { amount, unit };
}

module.exports = {
  convertUnit,
  calculateQuantityNeeded,
  normalizeUnit,
  parseAmountAndUnit,
  detectUnitType,
  CONVERSIONS
};