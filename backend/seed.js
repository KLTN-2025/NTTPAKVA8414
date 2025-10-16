// Dữ liệu mẫu cho website
// Run this file with: node seed.js

const mongoose = require('mongoose');

// ============================================
// 1. PRODUCT CATEGORIES 
// ============================================
const productCategories = [
  {
    _id: new mongoose.Types.ObjectId(),
    category_name: 'Oils & Fats',
    description: 'Healthy cooking oils and natural fats for various dietary needs'
  },
  {
    _id: new mongoose.Types.ObjectId(),
    category_name: 'Vegetables',
    description: 'Fresh and organic vegetables, low in calories and rich in nutrients'
  },
  {
    _id: new mongoose.Types.ObjectId(),
    category_name: 'Fruits',
    description: 'Natural fruits and berries, perfect for healthy snacking'
  },
  {
    _id: new mongoose.Types.ObjectId(),
    category_name: 'Proteins',
    description: 'High-protein foods including lean meats, fish, and plant-based options'
  },
  {
    _id: new mongoose.Types.ObjectId(),
    category_name: 'Grains & Cereals',
    description: 'Whole grains, low-carb alternatives, and healthy breakfast options'
  },
  {
    _id: new mongoose.Types.ObjectId(),
    category_name: 'Dairy & Alternatives',
    description: 'Low-fat dairy products and plant-based alternatives'
  },
  {
    _id: new mongoose.Types.ObjectId(),
    category_name: 'Snacks',
    description: 'Healthy snacks and treats for guilt-free munching'
  },
  {
    _id: new mongoose.Types.ObjectId(),
    category_name: 'Beverages',
    description: 'Sugar-free and healthy drink options'
  }
];

// ============================================
// 2. PRODUCT TYPES
// ============================================
const productTypes = [
  // Oils & Fats
  { _id: new mongoose.Types.ObjectId(), category_id: productCategories[0]._id, name: 'Olive Oil', description: 'Extra virgin and refined olive oils' },
  { _id: new mongoose.Types.ObjectId(), category_id: productCategories[0]._id, name: 'Coconut Oil', description: 'Virgin and refined coconut oil products' },
  { _id: new mongoose.Types.ObjectId(), category_id: productCategories[0]._id, name: 'Avocado Oil', description: 'Premium avocado oils for cooking' },
  { _id: new mongoose.Types.ObjectId(), category_id: productCategories[0]._id, name: 'MCT Oil', description: 'Medium-chain triglyceride oils for keto diets' },
  
  // Vegetables
  { _id: new mongoose.Types.ObjectId(), category_id: productCategories[1]._id, name: 'Leafy Greens', description: 'Spinach, kale, lettuce and other greens' },
  { _id: new mongoose.Types.ObjectId(), category_id: productCategories[1]._id, name: 'Cruciferous', description: 'Broccoli, cauliflower, cabbage' },
  { _id: new mongoose.Types.ObjectId(), category_id: productCategories[1]._id, name: 'Root Vegetables', description: 'Carrots, beets, sweet potatoes' },
  { _id: new mongoose.Types.ObjectId(), category_id: productCategories[1]._id, name: 'Zucchini & Squash', description: 'Low-carb vegetable options' },
  
  // Fruits
  { _id: new mongoose.Types.ObjectId(), category_id: productCategories[2]._id, name: 'Berries', description: 'Strawberries, blueberries, raspberries' },
  { _id: new mongoose.Types.ObjectId(), category_id: productCategories[2]._id, name: 'Citrus', description: 'Oranges, lemons, grapefruits' },
  { _id: new mongoose.Types.ObjectId(), category_id: productCategories[2]._id, name: 'Apples', description: 'Various apple varieties' },
  { _id: new mongoose.Types.ObjectId(), category_id: productCategories[2]._id, name: 'Tropical Fruits', description: 'Pineapple, mango, papaya' },
  
  // Proteins
  { _id: new mongoose.Types.ObjectId(), category_id: productCategories[3]._id, name: 'Chicken', description: 'Lean chicken breast and cuts' },
  { _id: new mongoose.Types.ObjectId(), category_id: productCategories[3]._id, name: 'Fish', description: 'Fresh and frozen fish fillets' },
  { _id: new mongoose.Types.ObjectId(), category_id: productCategories[3]._id, name: 'Eggs', description: 'Free-range and organic eggs' },
  { _id: new mongoose.Types.ObjectId(), category_id: productCategories[3]._id, name: 'Plant Protein', description: 'Tofu, tempeh, and plant-based meats' },
  
  // Grains & Cereals
  { _id: new mongoose.Types.ObjectId(), category_id: productCategories[4]._id, name: 'Quinoa', description: 'Organic quinoa varieties' },
  { _id: new mongoose.Types.ObjectId(), category_id: productCategories[4]._id, name: 'Brown Rice', description: 'Whole grain brown rice' },
  { _id: new mongoose.Types.ObjectId(), category_id: productCategories[4]._id, name: 'Oats', description: 'Steel-cut and rolled oats' },
  { _id: new mongoose.Types.ObjectId(), category_id: productCategories[4]._id, name: 'Low-Carb Alternatives', description: 'Cauliflower rice, shirataki noodles' },
  
  // Dairy & Alternatives
  { _id: new mongoose.Types.ObjectId(), category_id: productCategories[5]._id, name: 'Greek Yogurt', description: 'High-protein Greek yogurt' },
  { _id: new mongoose.Types.ObjectId(), category_id: productCategories[5]._id, name: 'Almond Milk', description: 'Unsweetened almond milk' },
  { _id: new mongoose.Types.ObjectId(), category_id: productCategories[5]._id, name: 'Cheese', description: 'Low-fat cheese options' },
  { _id: new mongoose.Types.ObjectId(), category_id: productCategories[5]._id, name: 'Cottage Cheese', description: 'Low-fat cottage cheese' },
  
  // Snacks
  { _id: new mongoose.Types.ObjectId(), category_id: productCategories[6]._id, name: 'Nuts', description: 'Raw and roasted nuts' },
  { _id: new mongoose.Types.ObjectId(), category_id: productCategories[6]._id, name: 'Protein Bars', description: 'Low-sugar protein bars' },
  { _id: new mongoose.Types.ObjectId(), category_id: productCategories[6]._id, name: 'Veggie Chips', description: 'Baked vegetable chips' },
  { _id: new mongoose.Types.ObjectId(), category_id: productCategories[6]._id, name: 'Dark Chocolate', description: 'Sugar-free dark chocolate' },
  
  // Beverages
  { _id: new mongoose.Types.ObjectId(), category_id: productCategories[7]._id, name: 'Protein Shakes', description: 'Ready-to-drink protein shakes' },
  { _id: new mongoose.Types.ObjectId(), category_id: productCategories[7]._id, name: 'Green Tea', description: 'Organic green tea' },
  { _id: new mongoose.Types.ObjectId(), category_id: productCategories[7]._id, name: 'Kombucha', description: 'Probiotic fermented tea' },
  { _id: new mongoose.Types.ObjectId(), category_id: productCategories[7]._id, name: 'Coconut Water', description: 'Natural coconut water' }
];

// ============================================
// 3. BRANDS
// ============================================
const brands = [
  { _id: new mongoose.Types.ObjectId(), name: 'NutriLife' },
  { _id: new mongoose.Types.ObjectId(), name: 'PureHealth' },
  { _id: new mongoose.Types.ObjectId(), name: 'GreenValley' },
  { _id: new mongoose.Types.ObjectId(), name: 'FitChoice' },
  { _id: new mongoose.Types.ObjectId(), name: 'OrganicFarms' },
  { _id: new mongoose.Types.ObjectId(), name: 'KetoKing' },
  { _id: new mongoose.Types.ObjectId(), name: 'ProteinPlus' },
  { _id: new mongoose.Types.ObjectId(), name: 'NaturePath' },
  { _id: new mongoose.Types.ObjectId(), name: 'HealthFirst' },
  { _id: new mongoose.Types.ObjectId(), name: 'VitaGreen' }
];

// ============================================
// 4. ATTRIBUTES
// ============================================
const attributes = [
  { _id: new mongoose.Types.ObjectId(), description: 'Low-Carb' },
  { _id: new mongoose.Types.ObjectId(), description: 'High-Protein' },
  { _id: new mongoose.Types.ObjectId(), description: 'Keto-Friendly' },
  { _id: new mongoose.Types.ObjectId(), description: 'Gluten-Free' },
  { _id: new mongoose.Types.ObjectId(), description: 'Organic' },
  { _id: new mongoose.Types.ObjectId(), description: 'Non-GMO' },
  { _id: new mongoose.Types.ObjectId(), description: 'Vegan' },
  { _id: new mongoose.Types.ObjectId(), description: 'Sugar-Free' },
  { _id: new mongoose.Types.ObjectId(), description: 'Low-Fat' },
  { _id: new mongoose.Types.ObjectId(), description: 'Paleo' },
  { _id: new mongoose.Types.ObjectId(), description: 'Dairy-Free' },
  { _id: new mongoose.Types.ObjectId(), description: 'Low-Sodium' }
];

// ============================================
// 5. PRODUCTS 
// ============================================
const products = [
  // Olive Oils
  {
    _id: new mongoose.Types.ObjectId(),
    type_id: productTypes[0]._id,
    brand_id: brands[0]._id,
    SKU: 'OIL-EVOO-500',
    name: 'Extra Virgin Olive Oil',
    size: mongoose.Types.Decimal128.fromString('500'),
    unit: 'ml',
    cost_price: 8.50,
    selling_price: 12.99,
    current_stock: 150,
    image_urls: ['https://example.com/images/olive-oil-500ml.jpg']
  },
  {
    _id: new mongoose.Types.ObjectId(),
    type_id: productTypes[0]._id,
    brand_id: brands[4]._id,
    SKU: 'OIL-EVOO-1L-ORG',
    name: 'Organic Extra Virgin Olive Oil',
    size: mongoose.Types.Decimal128.fromString('1000'),
    unit: 'ml',
    cost_price: 15.00,
    selling_price: 22.99,
    current_stock: 85,
    image_urls: ['https://example.com/images/organic-olive-oil-1l.jpg']
  },
  
  // Coconut Oils
  {
    _id: new mongoose.Types.ObjectId(),
    type_id: productTypes[1]._id,
    brand_id: brands[5]._id,
    SKU: 'OIL-COCO-500-VRG',
    name: 'Virgin Coconut Oil',
    size: mongoose.Types.Decimal128.fromString('500'),
    unit: 'ml',
    cost_price: 9.00,
    selling_price: 14.99,
    current_stock: 120,
    image_urls: ['https://example.com/images/coconut-oil-virgin.jpg']
  },
  
  // MCT Oil
  {
    _id: new mongoose.Types.ObjectId(),
    type_id: productTypes[3]._id,
    brand_id: brands[5]._id,
    SKU: 'OIL-MCT-500',
    name: 'Pure MCT Oil',
    size: mongoose.Types.Decimal128.fromString('500'),
    unit: 'ml',
    cost_price: 12.00,
    selling_price: 18.99,
    current_stock: 95,
    image_urls: ['https://example.com/images/mct-oil.jpg']
  },
  
  // Leafy Greens
  {
    _id: new mongoose.Types.ObjectId(),
    type_id: productTypes[4]._id,
    brand_id: brands[2]._id,
    SKU: 'VEG-SPIN-250-ORG',
    name: 'Organic Baby Spinach',
    size: mongoose.Types.Decimal128.fromString('250'),
    unit: 'g',
    cost_price: 2.50,
    selling_price: 4.99,
    current_stock: 200,
    image_urls: ['https://example.com/images/baby-spinach.jpg']
  },
  {
    _id: new mongoose.Types.ObjectId(),
    type_id: productTypes[4]._id,
    brand_id: brands[4]._id,
    SKU: 'VEG-KALE-200-ORG',
    name: 'Organic Curly Kale',
    size: mongoose.Types.Decimal128.fromString('200'),
    unit: 'g',
    cost_price: 3.00,
    selling_price: 5.49,
    current_stock: 140,
    image_urls: ['https://example.com/images/curly-kale.jpg']
  },
  
  // Cruciferous
  {
    _id: new mongoose.Types.ObjectId(),
    type_id: productTypes[5]._id,
    brand_id: brands[2]._id,
    SKU: 'VEG-BROC-500',
    name: 'Fresh Broccoli Florets',
    size: mongoose.Types.Decimal128.fromString('500'),
    unit: 'g',
    cost_price: 2.00,
    selling_price: 3.99,
    current_stock: 180,
    image_urls: ['https://example.com/images/broccoli-florets.jpg']
  },
  {
    _id: new mongoose.Types.ObjectId(),
    type_id: productTypes[5]._id,
    brand_id: brands[4]._id,
    SKU: 'VEG-CAUL-600-ORG',
    name: 'Organic Cauliflower',
    size: mongoose.Types.Decimal128.fromString('600'),
    unit: 'g',
    cost_price: 2.80,
    selling_price: 4.99,
    current_stock: 160,
    image_urls: ['https://example.com/images/cauliflower.jpg']
  },
  
  // Berries
  {
    _id: new mongoose.Types.ObjectId(),
    type_id: productTypes[8]._id,
    brand_id: brands[2]._id,
    SKU: 'FRT-BLUE-250-ORG',
    name: 'Organic Blueberries',
    size: mongoose.Types.Decimal128.fromString('250'),
    unit: 'g',
    cost_price: 4.50,
    selling_price: 7.99,
    current_stock: 110,
    image_urls: ['https://example.com/images/blueberries.jpg']
  },
  {
    _id: new mongoose.Types.ObjectId(),
    type_id: productTypes[8]._id,
    brand_id: brands[4]._id,
    SKU: 'FRT-STRAW-300',
    name: 'Fresh Strawberries',
    size: mongoose.Types.Decimal128.fromString('300'),
    unit: 'g',
    cost_price: 3.50,
    selling_price: 6.49,
    current_stock: 130,
    image_urls: ['https://example.com/images/strawberries.jpg']
  },
  
  // Chicken
  {
    _id: new mongoose.Types.ObjectId(),
    type_id: productTypes[12]._id,
    brand_id: brands[1]._id,
    SKU: 'PROT-CHKB-500',
    name: 'Skinless Chicken Breast',
    size: mongoose.Types.Decimal128.fromString('500'),
    unit: 'g',
    cost_price: 5.00,
    selling_price: 8.99,
    current_stock: 220,
    image_urls: ['https://example.com/images/chicken-breast.jpg']
  },
  {
    _id: new mongoose.Types.ObjectId(),
    type_id: productTypes[12]._id,
    brand_id: brands[4]._id,
    SKU: 'PROT-CHKB-1KG-ORG',
    name: 'Organic Chicken Breast',
    size: mongoose.Types.Decimal128.fromString('1000'),
    unit: 'g',
    cost_price: 11.00,
    selling_price: 16.99,
    current_stock: 95,
    image_urls: ['https://example.com/images/organic-chicken.jpg']
  },
  
  // Fish
  {
    _id: new mongoose.Types.ObjectId(),
    type_id: productTypes[13]._id,
    brand_id: brands[1]._id,
    SKU: 'PROT-SALM-400',
    name: 'Atlantic Salmon Fillet',
    size: mongoose.Types.Decimal128.fromString('400'),
    unit: 'g',
    cost_price: 8.00,
    selling_price: 13.99,
    current_stock: 80,
    image_urls: ['https://example.com/images/salmon-fillet.jpg']
  },
  
  // Eggs
  {
    _id: new mongoose.Types.ObjectId(),
    type_id: productTypes[14]._id,
    brand_id: brands[4]._id,
    SKU: 'PROT-EGGS-12-FR',
    name: 'Free-Range Eggs (12 pack)',
    size: mongoose.Types.Decimal128.fromString('12'),
    unit: 'pcs',
    cost_price: 4.00,
    selling_price: 6.99,
    current_stock: 300,
    image_urls: ['https://example.com/images/free-range-eggs.jpg']
  },
  
  // Plant Protein
  {
    _id: new mongoose.Types.ObjectId(),
    type_id: productTypes[15]._id,
    brand_id: brands[7]._id,
    SKU: 'PROT-TOFU-400-ORG',
    name: 'Organic Firm Tofu',
    size: mongoose.Types.Decimal128.fromString('400'),
    unit: 'g',
    cost_price: 2.50,
    selling_price: 4.49,
    current_stock: 175,
    image_urls: ['https://example.com/images/firm-tofu.jpg']
  },
  
  // Quinoa
  {
    _id: new mongoose.Types.ObjectId(),
    type_id: productTypes[16]._id,
    brand_id: brands[4]._id,
    SKU: 'GRN-QUIN-500-ORG',
    name: 'Organic Tri-Color Quinoa',
    size: mongoose.Types.Decimal128.fromString('500'),
    unit: 'g',
    cost_price: 4.00,
    selling_price: 7.49,
    current_stock: 140,
    image_urls: ['https://example.com/images/tricolor-quinoa.jpg']
  },
  
  // Brown Rice
  {
    _id: new mongoose.Types.ObjectId(),
    type_id: productTypes[17]._id,
    brand_id: brands[2]._id,
    SKU: 'GRN-RICE-1KG',
    name: 'Whole Grain Brown Rice',
    size: mongoose.Types.Decimal128.fromString('1000'),
    unit: 'g',
    cost_price: 3.50,
    selling_price: 5.99,
    current_stock: 200,
    image_urls: ['https://example.com/images/brown-rice.jpg']
  },
  
  // Oats
  {
    _id: new mongoose.Types.ObjectId(),
    type_id: productTypes[18]._id,
    brand_id: brands[8]._id,
    SKU: 'GRN-OATS-750-GF',
    name: 'Gluten-Free Steel Cut Oats',
    size: mongoose.Types.Decimal128.fromString('750'),
    unit: 'g',
    cost_price: 4.50,
    selling_price: 7.99,
    current_stock: 125,
    image_urls: ['https://example.com/images/steel-cut-oats.jpg']
  },
  
  // Greek Yogurt
  {
    _id: new mongoose.Types.ObjectId(),
    type_id: productTypes[20]._id,
    brand_id: brands[1]._id,
    SKU: 'DAIRY-GYOG-500-PLN',
    name: 'Plain Greek Yogurt',
    size: mongoose.Types.Decimal128.fromString('500'),
    unit: 'g',
    cost_price: 3.00,
    selling_price: 5.49,
    current_stock: 180,
    image_urls: ['https://example.com/images/greek-yogurt.jpg']
  },
  
  // Almond Milk
  {
    _id: new mongoose.Types.ObjectId(),
    type_id: productTypes[21]._id,
    brand_id: brands[7]._id,
    SKU: 'DAIRY-ALMK-1L-UNSW',
    name: 'Unsweetened Almond Milk',
    size: mongoose.Types.Decimal128.fromString('1000'),
    unit: 'ml',
    cost_price: 2.50,
    selling_price: 4.49,
    current_stock: 210,
    image_urls: ['https://example.com/images/almond-milk.jpg']
  },
  
  // Cottage Cheese
  {
    _id: new mongoose.Types.ObjectId(),
    type_id: productTypes[23]._id,
    brand_id: brands[1]._id,
    SKU: 'DAIRY-COTT-400-LF',
    name: 'Low-Fat Cottage Cheese',
    size: mongoose.Types.Decimal128.fromString('400'),
    unit: 'g',
    cost_price: 2.80,
    selling_price: 4.99,
    current_stock: 165,
    image_urls: ['https://example.com/images/cottage-cheese.jpg']
  },
  
  // Nuts
  {
    _id: new mongoose.Types.ObjectId(),
    type_id: productTypes[24]._id,
    brand_id: brands[7]._id,
    SKU: 'SNK-ALMD-250-RAW',
    name: 'Raw Almonds',
    size: mongoose.Types.Decimal128.fromString('250'),
    unit: 'g',
    cost_price: 5.00,
    selling_price: 8.49,
    current_stock: 190,
    image_urls: ['https://example.com/images/raw-almonds.jpg']
  },
  {
    _id: new mongoose.Types.ObjectId(),
    type_id: productTypes[24]._id,
    brand_id: brands[7]._id,
    SKU: 'SNK-WLNT-200',
    name: 'Raw Walnuts',
    size: mongoose.Types.Decimal128.fromString('200'),
    unit: 'g',
    cost_price: 6.00,
    selling_price: 9.99,
    current_stock: 145,
    image_urls: ['https://example.com/images/raw-walnuts.jpg']
  },
  
  // Protein Bars
  {
    _id: new mongoose.Types.ObjectId(),
    type_id: productTypes[25]._id,
    brand_id: brands[6]._id,
    SKU: 'SNK-PBAR-60-CHOC',
    name: 'Chocolate Protein Bar',
    size: mongoose.Types.Decimal128.fromString('60'),
    unit: 'g',
    cost_price: 1.50,
    selling_price: 2.99,
    current_stock: 350,
    image_urls: ['https://example.com/images/choc-protein-bar.jpg']
  },
  {
    _id: new mongoose.Types.ObjectId(),
    type_id: productTypes[25]._id,
    brand_id: brands[6]._id,
    SKU: 'SNK-PBAR-60-PB',
    name: 'Peanut Butter Protein Bar',
    size: mongoose.Types.Decimal128.fromString('60'),
    unit: 'g',
    cost_price: 1.50,
    selling_price: 2.99,
    current_stock: 320,
    image_urls: ['https://example.com/images/pb-protein-bar.jpg']
  },
  
  // Veggie Chips
  {
    _id: new mongoose.Types.ObjectId(),
    type_id: productTypes[26]._id,
    brand_id: brands[3]._id,
    SKU: 'SNK-KCHP-100',
    name: 'Baked Kale Chips',
    size: mongoose.Types.Decimal128.fromString('100'),
    unit: 'g',
    cost_price: 3.00,
    selling_price: 5.49,
    current_stock: 155,
    image_urls: ['https://example.com/images/kale-chips.jpg']
  },
  
  // Dark Chocolate
  {
    _id: new mongoose.Types.ObjectId(),
    type_id: productTypes[27]._id,
    brand_id: brands[3]._id,
    SKU: 'SNK-DCHOC-85-SF',
    name: 'Sugar-Free Dark Chocolate 85%',
    size: mongoose.Types.Decimal128.fromString('100'),
    unit: 'g',
    cost_price: 3.50,
    selling_price: 6.49,
    current_stock: 175,
    image_urls: ['https://example.com/images/dark-chocolate-85.jpg']
  },
  
  // Protein Shakes
  {
    _id: new mongoose.Types.ObjectId(),
    type_id: productTypes[28]._id,
    brand_id: brands[6]._id,
    SKU: 'BEV-PSHK-330-VAN',
    name: 'Vanilla Protein Shake',
    size: mongoose.Types.Decimal128.fromString('330'),
    unit: 'ml',
    cost_price: 2.50,
    selling_price: 4.49,
    current_stock: 240,
    image_urls: ['https://example.com/images/vanilla-shake.jpg']
  },
  {
    _id: new mongoose.Types.ObjectId(),
    type_id: productTypes[28]._id,
    brand_id: brands[6]._id,
    SKU: 'BEV-PSHK-330-CHOC',
    name: 'Chocolate Protein Shake',
    size: mongoose.Types.Decimal128.fromString('330'),
    unit: 'ml',
    cost_price: 2.50,
    selling_price: 4.49,
    current_stock: 260,
    image_urls: ['https://example.com/images/chocolate-shake.jpg']
  },
  
  // Green Tea
  {
    _id: new mongoose.Types.ObjectId(),
    type_id: productTypes[29]._id,
    brand_id: brands[9]._id,
    SKU: 'BEV-GTEA-100-ORG',
    name: 'Organic Green Tea (100 bags)',
    size: mongoose.Types.Decimal128.fromString('100'),
    unit: 'bags',
    cost_price: 6.00,
    selling_price: 9.99,
    current_stock: 135,
    image_urls: ['https://example.com/images/green-tea.jpg']
  },
  
  // Kombucha
  {
    _id: new mongoose.Types.ObjectId(),
    type_id: productTypes[30]._id,
    brand_id: brands[9]._id,
    SKU: 'BEV-KOMB-500-GNGR',
    name: 'Ginger Kombucha',
    size: mongoose.Types.Decimal128.fromString('500'),
    unit: 'ml',
    cost_price: 3.00,
    selling_price: 5.49,
    current_stock: 110,
    image_urls: ['https://example.com/images/ginger-kombucha.jpg']
  },
  
  // Coconut Water
  {
    _id: new mongoose.Types.ObjectId(),
    type_id: productTypes[31]._id,
    brand_id: brands[7]._id,
    SKU: 'BEV-COCW-1L',
    name: '100% Pure Coconut Water',
    size: mongoose.Types.Decimal128.fromString('1000'),
    unit: 'ml',
    cost_price: 3.50,
    selling_price: 5.99,
    current_stock: 185,
    image_urls: ['https://example.com/images/coconut-water.jpg']
  }
];

// ============================================
// 6. PRODUCT ATTRIBUTES (Relationships)
// ============================================
const productAttributes = [
  // Olive Oils - attributes
  { product_id: products[0]._id, attribute_id: attributes[3]._id }, // Gluten-Free
  { product_id: products[0]._id, attribute_id: attributes[9]._id }, // Paleo
  { product_id: products[1]._id, attribute_id: attributes[4]._id }, // Organic
  { product_id: products[1]._id, attribute_id: attributes[3]._id }, // Gluten-Free
  { product_id: products[1]._id, attribute_id: attributes[9]._id }, // Paleo
  
  // Coconut Oil
  { product_id: products[2]._id, attribute_id: attributes[2]._id }, // Keto-Friendly
  { product_id: products[2]._id, attribute_id: attributes[3]._id }, // Gluten-Free
  { product_id: products[2]._id, attribute_id: attributes[6]._id }, // Vegan
  { product_id: products[2]._id, attribute_id: attributes[9]._id }, // Paleo
  
  // MCT Oil
  { product_id: products[3]._id, attribute_id: attributes[2]._id }, // Keto-Friendly
  { product_id: products[3]._id, attribute_id: attributes[3]._id }, // Gluten-Free
  { product_id: products[3]._id, attribute_id: attributes[9]._id }, // Paleo
  
  // Spinach
  { product_id: products[4]._id, attribute_id: attributes[0]._id }, // Low-Carb
  { product_id: products[4]._id, attribute_id: attributes[4]._id }, // Organic
  { product_id: products[4]._id, attribute_id: attributes[6]._id }, // Vegan
  { product_id: products[4]._id, attribute_id: attributes[3]._id }, // Gluten-Free
  
  // Kale
  { product_id: products[5]._id, attribute_id: attributes[0]._id }, // Low-Carb
  { product_id: products[5]._id, attribute_id: attributes[4]._id }, // Organic
  { product_id: products[5]._id, attribute_id: attributes[6]._id }, // Vegan
  { product_id: products[5]._id, attribute_id: attributes[2]._id }, // Keto-Friendly
  
  // Broccoli
  { product_id: products[6]._id, attribute_id: attributes[0]._id }, // Low-Carb
  { product_id: products[6]._id, attribute_id: attributes[6]._id }, // Vegan
  { product_id: products[6]._id, attribute_id: attributes[3]._id }, // Gluten-Free
  
  // Cauliflower
  { product_id: products[7]._id, attribute_id: attributes[0]._id }, // Low-Carb
  { product_id: products[7]._id, attribute_id: attributes[4]._id }, // Organic
  { product_id: products[7]._id, attribute_id: attributes[2]._id }, // Keto-Friendly
  { product_id: products[7]._id, attribute_id: attributes[6]._id }, // Vegan
  
  // Blueberries
  { product_id: products[8]._id, attribute_id: attributes[4]._id }, // Organic
  { product_id: products[8]._id, attribute_id: attributes[6]._id }, // Vegan
  { product_id: products[8]._id, attribute_id: attributes[3]._id }, // Gluten-Free
  
  // Strawberries
  { product_id: products[9]._id, attribute_id: attributes[6]._id }, // Vegan
  { product_id: products[9]._id, attribute_id: attributes[3]._id }, // Gluten-Free
  { product_id: products[9]._id, attribute_id: attributes[8]._id }, // Low-Fat
  
  // Chicken Breast
  { product_id: products[10]._id, attribute_id: attributes[1]._id }, // High-Protein
  { product_id: products[10]._id, attribute_id: attributes[0]._id }, // Low-Carb
  { product_id: products[10]._id, attribute_id: attributes[8]._id }, // Low-Fat
  { product_id: products[10]._id, attribute_id: attributes[3]._id }, // Gluten-Free
  
  // Organic Chicken
  { product_id: products[11]._id, attribute_id: attributes[1]._id }, // High-Protein
  { product_id: products[11]._id, attribute_id: attributes[4]._id }, // Organic
  { product_id: products[11]._id, attribute_id: attributes[0]._id }, // Low-Carb
  { product_id: products[11]._id, attribute_id: attributes[9]._id }, // Paleo
  
  // Salmon
  { product_id: products[12]._id, attribute_id: attributes[1]._id }, // High-Protein
  { product_id: products[12]._id, attribute_id: attributes[0]._id }, // Low-Carb
  { product_id: products[12]._id, attribute_id: attributes[2]._id }, // Keto-Friendly
  { product_id: products[12]._id, attribute_id: attributes[9]._id }, // Paleo
  
  // Free-Range Eggs
  { product_id: products[13]._id, attribute_id: attributes[1]._id }, // High-Protein
  { product_id: products[13]._id, attribute_id: attributes[0]._id }, // Low-Carb
  { product_id: products[13]._id, attribute_id: attributes[2]._id }, // Keto-Friendly
  { product_id: products[13]._id, attribute_id: attributes[3]._id }, // Gluten-Free
  
  // Tofu
  { product_id: products[14]._id, attribute_id: attributes[1]._id }, // High-Protein
  { product_id: products[14]._id, attribute_id: attributes[6]._id }, // Vegan
  { product_id: products[14]._id, attribute_id: attributes[4]._id }, // Organic
  { product_id: products[14]._id, attribute_id: attributes[3]._id }, // Gluten-Free
  { product_id: products[14]._id, attribute_id: attributes[5]._id }, // Non-GMO
  
  // Quinoa
  { product_id: products[15]._id, attribute_id: attributes[4]._id }, // Organic
  { product_id: products[15]._id, attribute_id: attributes[1]._id }, // High-Protein
  { product_id: products[15]._id, attribute_id: attributes[3]._id }, // Gluten-Free
  { product_id: products[15]._id, attribute_id: attributes[6]._id }, // Vegan
  
  // Brown Rice
  { product_id: products[16]._id, attribute_id: attributes[6]._id }, // Vegan
  { product_id: products[16]._id, attribute_id: attributes[3]._id }, // Gluten-Free
  { product_id: products[16]._id, attribute_id: attributes[5]._id }, // Non-GMO
  
  // Steel Cut Oats
  { product_id: products[17]._id, attribute_id: attributes[3]._id }, // Gluten-Free
  { product_id: products[17]._id, attribute_id: attributes[6]._id }, // Vegan
  { product_id: products[17]._id, attribute_id: attributes[5]._id }, // Non-GMO
  
  // Greek Yogurt
  { product_id: products[18]._id, attribute_id: attributes[1]._id }, // High-Protein
  { product_id: products[18]._id, attribute_id: attributes[0]._id }, // Low-Carb
  { product_id: products[18]._id, attribute_id: attributes[3]._id }, // Gluten-Free
  
  // Almond Milk
  { product_id: products[19]._id, attribute_id: attributes[6]._id }, // Vegan
  { product_id: products[19]._id, attribute_id: attributes[10]._id }, // Dairy-Free
  { product_id: products[19]._id, attribute_id: attributes[7]._id }, // Sugar-Free
  { product_id: products[19]._id, attribute_id: attributes[0]._id }, // Low-Carb
  
  // Cottage Cheese
  { product_id: products[20]._id, attribute_id: attributes[1]._id }, // High-Protein
  { product_id: products[20]._id, attribute_id: attributes[8]._id }, // Low-Fat
  { product_id: products[20]._id, attribute_id: attributes[3]._id }, // Gluten-Free
  
  // Raw Almonds
  { product_id: products[21]._id, attribute_id: attributes[1]._id }, // High-Protein
  { product_id: products[21]._id, attribute_id: attributes[6]._id }, // Vegan
  { product_id: products[21]._id, attribute_id: attributes[3]._id }, // Gluten-Free
  { product_id: products[21]._id, attribute_id: attributes[2]._id }, // Keto-Friendly
  
  // Raw Walnuts
  { product_id: products[22]._id, attribute_id: attributes[6]._id }, // Vegan
  { product_id: products[22]._id, attribute_id: attributes[3]._id }, // Gluten-Free
  { product_id: products[22]._id, attribute_id: attributes[2]._id }, // Keto-Friendly
  { product_id: products[22]._id, attribute_id: attributes[9]._id }, // Paleo
  
  // Chocolate Protein Bar
  { product_id: products[23]._id, attribute_id: attributes[1]._id }, // High-Protein
  { product_id: products[23]._id, attribute_id: attributes[7]._id }, // Sugar-Free
  { product_id: products[23]._id, attribute_id: attributes[3]._id }, // Gluten-Free
  
  // Peanut Butter Protein Bar
  { product_id: products[24]._id, attribute_id: attributes[1]._id }, // High-Protein
  { product_id: products[24]._id, attribute_id: attributes[7]._id }, // Sugar-Free
  { product_id: products[24]._id, attribute_id: attributes[3]._id }, // Gluten-Free
  
  // Kale Chips
  { product_id: products[25]._id, attribute_id: attributes[6]._id }, // Vegan
  { product_id: products[25]._id, attribute_id: attributes[3]._id }, // Gluten-Free
  { product_id: products[25]._id, attribute_id: attributes[8]._id }, // Low-Fat
  { product_id: products[25]._id, attribute_id: attributes[0]._id }, // Low-Carb
  
  // Dark Chocolate
  { product_id: products[26]._id, attribute_id: attributes[7]._id }, // Sugar-Free
  { product_id: products[26]._id, attribute_id: attributes[2]._id }, // Keto-Friendly
  { product_id: products[26]._id, attribute_id: attributes[6]._id }, // Vegan
  
  // Vanilla Protein Shake
  { product_id: products[27]._id, attribute_id: attributes[1]._id }, // High-Protein
  { product_id: products[27]._id, attribute_id: attributes[7]._id }, // Sugar-Free
  { product_id: products[27]._id, attribute_id: attributes[3]._id }, // Gluten-Free
  { product_id: products[27]._id, attribute_id: attributes[8]._id }, // Low-Fat
  
  // Chocolate Protein Shake
  { product_id: products[28]._id, attribute_id: attributes[1]._id }, // High-Protein
  { product_id: products[28]._id, attribute_id: attributes[7]._id }, // Sugar-Free
  { product_id: products[28]._id, attribute_id: attributes[3]._id }, // Gluten-Free
  { product_id: products[28]._id, attribute_id: attributes[8]._id }, // Low-Fat
  
  // Green Tea
  { product_id: products[29]._id, attribute_id: attributes[4]._id }, // Organic
  { product_id: products[29]._id, attribute_id: attributes[6]._id }, // Vegan
  { product_id: products[29]._id, attribute_id: attributes[7]._id }, // Sugar-Free
  { product_id: products[29]._id, attribute_id: attributes[3]._id }, // Gluten-Free
  
  // Kombucha
  { product_id: products[30]._id, attribute_id: attributes[6]._id }, // Vegan
  { product_id: products[30]._id, attribute_id: attributes[4]._id }, // Organic
  { product_id: products[30]._id, attribute_id: attributes[10]._id }, // Dairy-Free
  
  // Coconut Water
  { product_id: products[31]._id, attribute_id: attributes[6]._id }, // Vegan
  { product_id: products[31]._id, attribute_id: attributes[7]._id }, // Sugar-Free
  { product_id: products[31]._id, attribute_id: attributes[3]._id }, // Gluten-Free
  { product_id: products[31]._id, attribute_id: attributes[10]._id }  // Dairy-Free
];

// ============================================
// SEEDING FUNCTION
// ============================================
async function seedDatabase() {
  try {
    // Connect to MongoDB
    await mongoose.connect('mongodb://localhost:27017/HealthyCrave', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    console.log('Connected to MongoDB');
    
    const ProductCategory = require('./models/ProductCategories');
    const ProductType = require('./models/ProductTypes');
    const Brand = require('./models/Brands');
    const Attribute = require('./models/Attributes');
    const Product = require('./models/Products');
    const ProductAttribute = require('./models/ProductAttributes');
    
    console.log('Clearing existing data...');
    await ProductAttribute.deleteMany({});
    await Product.deleteMany({});
    await ProductType.deleteMany({});
    await ProductCategory.deleteMany({});
    await Brand.deleteMany({});
    await Attribute.deleteMany({});
    
    console.log('Seeding ProductCategories...');
    await ProductCategory.insertMany(productCategories);
    console.log(`✓ Inserted ${productCategories.length} categories`);
    
    console.log('Seeding ProductTypes...');
    await ProductType.insertMany(productTypes);
    console.log(`✓ Inserted ${productTypes.length} product types`);
    
    console.log('Seeding Brands...');
    await Brand.insertMany(brands);
    console.log(`✓ Inserted ${brands.length} brands`);
    
    console.log('Seeding Attributes...');
    await Attribute.insertMany(attributes);
    console.log(`✓ Inserted ${attributes.length} attributes`);
    
    console.log('Seeding Products...');
    await Product.insertMany(products);
    console.log(`✓ Inserted ${products.length} products`);
    
    console.log('Seeding ProductAttributes...');
    await ProductAttribute.insertMany(productAttributes);
    console.log(`✓ Inserted ${productAttributes.length} product-attribute relationships`);
    
    console.log('\n✅ Database seeded successfully!');
    console.log('\nSummary:');
    console.log(`- ${productCategories.length} Product Categories`);
    console.log(`- ${productTypes.length} Product Types`);
    console.log(`- ${brands.length} Brands`);
    console.log(`- ${attributes.length} Attributes`);
    console.log(`- ${products.length} Products`);
    console.log(`- ${productAttributes.length} Product-Attribute Relationships`);
    
  } catch (error) {
    console.error('Error seeding database:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\nDatabase connection closed');
  }
}

// Run the seeding function
seedDatabase();

module.exports = {
  productCategories,
  productTypes,
  brands,
  attributes,
  products,
  productAttributes
};