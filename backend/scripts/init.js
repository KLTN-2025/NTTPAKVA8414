// Dữ liệu mẫu cho website

const mongoose = require('mongoose')

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
]

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
]

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
]

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
]



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
    description: 'Premium cold-pressed extra virgin olive oil with rich flavor and high antioxidants',
    size: mongoose.Types.Decimal128.fromString('500'),
    unit: 'ml',
    cost_price: 85000,
    selling_price: 129900,
    current_stock: 150,
    image_urls: ['https://plus.unsplash.com/premium_photo-1668772053691-6efcb5365332?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=600'],
    attributes: [attributes[3]._id, attributes[9]._id]
  },
  {
    _id: new mongoose.Types.ObjectId(),
    type_id: productTypes[0]._id,
    brand_id: brands[4]._id,
    SKU: 'OIL-EVOO-1L-ORG',
    name: 'Organic Extra Virgin Olive Oil',
    description: 'Certified organic first cold-pressed olive oil from sustainable farms',
    size: mongoose.Types.Decimal128.fromString('1000'),
    unit: 'ml',
    cost_price: 150000,
    selling_price: 229900,
    current_stock: 85,
    image_urls: ['https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=600'],
    attributes: [attributes[4]._id, attributes[3]._id, attributes[9]._id]
  },
  
  // Coconut Oils
  {
    _id: new mongoose.Types.ObjectId(),
    type_id: productTypes[1]._id,
    brand_id: brands[5]._id,
    SKU: 'OIL-COCO-500-VRG',
    name: 'Virgin Coconut Oil',
    description: 'Unrefined virgin coconut oil perfect for cooking and baking',
    size: mongoose.Types.Decimal128.fromString('500'),
    unit: 'ml',
    cost_price: 90000,
    selling_price: 149900,
    current_stock: 120,
    image_urls: ['https://producersmarket.com/blog/wp-content/uploads/2020/05/Types-Of-Coconut-Oil-And-Their-Uses--1024x1024.jpg'],
    attributes: [attributes[2]._id, attributes[3]._id, attributes[6]._id, attributes[9]._id]
  },
  
  // MCT Oil
  {
    _id: new mongoose.Types.ObjectId(),
    type_id: productTypes[3]._id,
    brand_id: brands[5]._id,
    SKU: 'OIL-MCT-500',
    name: 'Pure MCT Oil',
    description: '100% pure medium-chain triglycerides for energy and mental clarity',
    size: mongoose.Types.Decimal128.fromString('500'),
    unit: 'ml',
    cost_price: 120000,
    selling_price: 189900,
    current_stock: 95,
    image_urls: ['https://cdn.xaxi.vn/tpcn/img/nature-s-way-organic-mct-oil-30-fl-oz-887-ml-77645.jpg'],
    attributes: [attributes[2]._id, attributes[3]._id, attributes[9]._id]
  },
  
  // Leafy Greens
  {
    _id: new mongoose.Types.ObjectId(),
    type_id: productTypes[4]._id,
    brand_id: brands[2]._id,
    SKU: 'VEG-SPIN-250-ORG',
    name: 'Organic Baby Spinach',
    description: 'Tender organic baby spinach leaves, perfect for salads and smoothies',
    size: mongoose.Types.Decimal128.fromString('250'),
    unit: 'g',
    cost_price: 25000,
    selling_price: 49900,
    current_stock: 200,
    image_urls: ['https://www.lottemart.vn/media/catalog/product/cache/0x0/9/3/9350336000092-1-1.jpg.webp'],
    attributes: [attributes[0]._id, attributes[4]._id, attributes[6]._id, attributes[3]._id]
  },
  {
    _id: new mongoose.Types.ObjectId(),
    type_id: productTypes[4]._id,
    brand_id: brands[4]._id,
    SKU: 'VEG-KALE-200-ORG',
    name: 'Organic Curly Kale',
    description: 'Nutrient-dense organic curly kale packed with vitamins and minerals',
    size: mongoose.Types.Decimal128.fromString('200'),
    unit: 'g',
    cost_price: 30000,
    selling_price: 54900,
    current_stock: 140,
    image_urls: ['https://www.rte.ie/images/000a7649-700.jpg'],
    attributes: [attributes[0]._id, attributes[4]._id, attributes[6]._id, attributes[2]._id]
  },
  
  // Cruciferous
  {
    _id: new mongoose.Types.ObjectId(),
    type_id: productTypes[5]._id,
    brand_id: brands[2]._id,
    SKU: 'VEG-BROC-500',
    name: 'Fresh Broccoli Florets',
    description: 'Fresh cut broccoli florets rich in fiber and antioxidants',
    size: mongoose.Types.Decimal128.fromString('500'),
    unit: 'g',
    cost_price: 20000,
    selling_price: 39900,
    current_stock: 180,
    image_urls: ['https://www.earthboundfarm.com/wp-content/uploads/2024/04/EBF-Broccoli-Florets-32ozv2.png'],
    attributes: [attributes[0]._id, attributes[6]._id, attributes[3]._id]
  },
  {
    _id: new mongoose.Types.ObjectId(),
    type_id: productTypes[5]._id,
    brand_id: brands[4]._id,
    SKU: 'VEG-CAUL-600-ORG',
    name: 'Organic Cauliflower',
    description: 'Fresh organic cauliflower head, versatile low-carb vegetable',
    size: mongoose.Types.Decimal128.fromString('600'),
    unit: 'g',
    cost_price: 28000,
    selling_price: 49900,
    current_stock: 160,
    image_urls: ['https://www.eatright.org/-/media/images/eatright-articles/cauliflower.jpg?h=520&w=780&rev=191288b7b711444f8664c03e0f71de4c&hash=37C2D644029F833F13CEEB84A9745903'],
    attributes: [attributes[0]._id, attributes[4]._id, attributes[2]._id, attributes[6]._id]
  },
  
  // Berries
  {
    _id: new mongoose.Types.ObjectId(),
    type_id: productTypes[8]._id,
    brand_id: brands[2]._id,
    SKU: 'FRT-BLUE-250-ORG',
    name: 'Organic Blueberries',
    description: 'Sweet organic blueberries loaded with antioxidants and vitamins',
    size: mongoose.Types.Decimal128.fromString('250'),
    unit: 'g',
    cost_price: 45000,
    selling_price: 79900,
    current_stock: 110,
    image_urls: ['https://thumb.photo-ac.com/a6/a6745379604484254508acfa9ef7eaff_t.jpeg'],
    attributes: [attributes[4]._id, attributes[6]._id, attributes[3]._id]
  },
  {
    _id: new mongoose.Types.ObjectId(),
    type_id: productTypes[8]._id,
    brand_id: brands[4]._id,
    SKU: 'FRT-STRAW-300',
    name: 'Fresh Strawberries',
    description: 'Juicy fresh strawberries, naturally sweet and vitamin C rich',
    size: mongoose.Types.Decimal128.fromString('300'),
    unit: 'g',
    cost_price: 35000,
    selling_price: 64900,
    current_stock: 130,
    image_urls: ['https://media.post.rvohealth.io/wp-content/uploads/2020/09/strawberries-732x549-thumbnail.jpg'],
    attributes: [attributes[6]._id, attributes[3]._id, attributes[8]._id]
  },
  
  // Chicken
  {
    _id: new mongoose.Types.ObjectId(),
    type_id: productTypes[12]._id,
    brand_id: brands[1]._id,
    SKU: 'PROT-CHKB-500',
    name: 'Skinless Chicken Breast',
    description: 'Lean skinless chicken breast, high in protein and low in fat',
    size: mongoose.Types.Decimal128.fromString('500'),
    unit: 'g',
    cost_price: 50000,
    selling_price: 89900,
    current_stock: 220,
    image_urls: ['https://media.istockphoto.com/id/492787098/photo/chicken-breasts-on-cutting-board.jpg?s=612x612&w=0&k=20&c=l1O94YCSRMUgj58WVPpOQFzuzRVwFHDeL6GF6dXFsFg='],
    attributes: [attributes[1]._id, attributes[0]._id, attributes[8]._id, attributes[3]._id]
  },
  {
    _id: new mongoose.Types.ObjectId(),
    type_id: productTypes[12]._id,
    brand_id: brands[4]._id,
    SKU: 'PROT-CHKB-1KG-ORG',
    name: 'Organic Chicken Breast',
    description: 'Premium organic chicken breast from free-range farms',
    size: mongoose.Types.Decimal128.fromString('1000'),
    unit: 'g',
    cost_price: 110000,
    selling_price: 169900,
    current_stock: 95,
    image_urls: ['https://media.istockphoto.com/id/492787098/photo/chicken-breasts-on-cutting-board.jpg?s=612x612&w=0&k=20&c=l1O94YCSRMUgj58WVPpOQFzuzRVwFHDeL6GF6dXFsFg='],
    attributes: [attributes[1]._id, attributes[4]._id, attributes[0]._id, attributes[9]._id]
  },
  
  // Fish
  {
    _id: new mongoose.Types.ObjectId(),
    type_id: productTypes[13]._id,
    brand_id: brands[1]._id,
    SKU: 'PROT-SALM-400',
    name: 'Atlantic Salmon Fillet',
    description: 'Fresh Atlantic salmon fillet rich in omega-3 fatty acids',
    size: mongoose.Types.Decimal128.fromString('400'),
    unit: 'g',
    cost_price: 80000,
    selling_price: 139900,
    current_stock: 80,
    image_urls: ['https://images.squarespace-cdn.com/content/v1/5d88ca022c11de1fd1d94810/1611176619595-J6ZH74FNWZ4ICJCY98O5/Salmon+Fillet+with+Ice+and+Lime.jpg?format=600w'],
    attributes: [attributes[1]._id, attributes[0]._id, attributes[2]._id, attributes[9]._id]
  },
  
  // Eggs
  {
    _id: new mongoose.Types.ObjectId(),
    type_id: productTypes[14]._id,
    brand_id: brands[4]._id,
    SKU: 'PROT-EGGS-12-FR',
    name: 'Free-Range Eggs (12 pack)',
    description: 'Farm-fresh free-range eggs from cage-free hens',
    size: mongoose.Types.Decimal128.fromString('12'),
    unit: 'pcs',
    cost_price: 40000,
    selling_price: 69900,
    current_stock: 300,
    image_urls: ['https://media.post.rvohealth.io/wp-content/uploads/2020/09/health-benefits-of-eggs-732x549-thumbnail-732x549.jpg'],
    attributes: [attributes[1]._id, attributes[0]._id, attributes[2]._id, attributes[3]._id]
  },
  
  // Plant Protein
  {
    _id: new mongoose.Types.ObjectId(),
    type_id: productTypes[15]._id,
    brand_id: brands[7]._id,
    SKU: 'PROT-TOFU-400-ORG',
    name: 'Organic Firm Tofu',
    description: 'Organic firm tofu made from non-GMO soybeans, excellent plant protein',
    size: mongoose.Types.Decimal128.fromString('400'),
    unit: 'g',
    cost_price: 25000,
    selling_price: 44900,
    current_stock: 175,
    image_urls: ['https://www.foodinjapan.org/wp-content/uploads/2023/02/25378446_m-1.jpg'],
    attributes: [attributes[1]._id, attributes[6]._id, attributes[4]._id, attributes[3]._id, attributes[5]._id]
  },
  
  // Quinoa
  {
    _id: new mongoose.Types.ObjectId(),
    type_id: productTypes[16]._id,
    brand_id: brands[4]._id,
    SKU: 'GRN-QUIN-500-ORG',
    name: 'Organic Tri-Color Quinoa',
    description: 'Organic tri-color quinoa blend, complete protein source with all essential amino acids',
    size: mongoose.Types.Decimal128.fromString('500'),
    unit: 'g',
    cost_price: 40000,
    selling_price: 74900,
    current_stock: 140,
    image_urls: ['https://jenniferskitchen.com/wp-content/uploads/quinoa-colors-2-1024x819.jpg'],
    attributes: [attributes[4]._id, attributes[1]._id, attributes[3]._id, attributes[6]._id]
  },
  
  // Brown Rice
  {
    _id: new mongoose.Types.ObjectId(),
    type_id: productTypes[17]._id,
    brand_id: brands[2]._id,
    SKU: 'GRN-RICE-1KG',
    name: 'Whole Grain Brown Rice',
    description: 'Nutritious whole grain brown rice with natural fiber and minerals',
    size: mongoose.Types.Decimal128.fromString('1000'),
    unit: 'g',
    cost_price: 35000,
    selling_price: 59900,
    current_stock: 200,
    image_urls: ['https://images.unsplash.com/photo-1613728913341-8f29b02b8253?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=600'],
    attributes: [attributes[6]._id, attributes[3]._id, attributes[5]._id]
  },
  
  // Oats
  {
    _id: new mongoose.Types.ObjectId(),
    type_id: productTypes[18]._id,
    brand_id: brands[8]._id,
    SKU: 'GRN-OATS-750-GF',
    name: 'Gluten-Free Steel Cut Oats',
    description: 'Certified gluten-free steel cut oats for hearty breakfast bowls',
    size: mongoose.Types.Decimal128.fromString('750'),
    unit: 'g',
    cost_price: 45000,
    selling_price: 79900,
    current_stock: 125,
    image_urls: ['https://nadiashealthykitchen.com/wp-content/uploads/2024/08/scrambled-oats-recipe_square-min.jpg'],
    attributes: [attributes[3]._id, attributes[6]._id, attributes[5]._id]
  },
  
  // Greek Yogurt
  {
    _id: new mongoose.Types.ObjectId(),
    type_id: productTypes[20]._id,
    brand_id: brands[1]._id,
    SKU: 'DAIRY-GYOG-500-PLN',
    name: 'Plain Greek Yogurt',
    description: 'Thick and creamy plain Greek yogurt with high protein content',
    size: mongoose.Types.Decimal128.fromString('500'),
    unit: 'g',
    cost_price: 30000,
    selling_price: 54900,
    current_stock: 180,
    image_urls: ['https://images.unsplash.com/photo-1564149503905-7fef56abc1f2?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=600'],
    attributes: [attributes[1]._id, attributes[0]._id, attributes[3]._id]
  },
  
  // Almond Milk
  {
    _id: new mongoose.Types.ObjectId(),
    type_id: productTypes[21]._id,
    brand_id: brands[7]._id,
    SKU: 'DAIRY-ALMK-1L-UNSW',
    name: 'Unsweetened Almond Milk',
    description: 'Creamy unsweetened almond milk, dairy-free and low in calories',
    size: mongoose.Types.Decimal128.fromString('1000'),
    unit: 'ml',
    cost_price: 25000,
    selling_price: 44900,
    current_stock: 210,
    image_urls: ['https://images.unsplash.com/photo-1601436423474-51738541c1b1?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=600'],
    attributes: [attributes[6]._id, attributes[10]._id, attributes[7]._id, attributes[0]._id]
  },
  
  // Cottage Cheese
  {
    _id: new mongoose.Types.ObjectId(),
    type_id: productTypes[23]._id,
    brand_id: brands[1]._id,
    SKU: 'DAIRY-COTT-400-LF',
    name: 'Low-Fat Cottage Cheese',
    description: 'Low-fat cottage cheese with high protein and minimal fat',
    size: mongoose.Types.Decimal128.fromString('400'),
    unit: 'g',
    cost_price: 28000,
    selling_price: 49900,
    current_stock: 165,
    image_urls: ['https://homesteadingfamily.com/wp-content/uploads/2025/03/Cottage-Cheese_HF-683x1024.jpg'],
    attributes: [attributes[1]._id, attributes[8]._id, attributes[3]._id]
  },
  
  // Nuts
  {
    _id: new mongoose.Types.ObjectId(),
    type_id: productTypes[24]._id,
    brand_id: brands[7]._id,
    SKU: 'SNK-ALMD-250-RAW',
    name: 'Raw Almonds',
    description: 'Premium raw almonds, rich in healthy fats and vitamin E',
    size: mongoose.Types.Decimal128.fromString('250'),
    unit: 'g',
    cost_price: 50000,
    selling_price: 84900,
    current_stock: 190,
    image_urls: ['https://images.unsplash.com/photo-1600188999986-331bec5f9a8d?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=600'],
    attributes: [attributes[1]._id, attributes[6]._id, attributes[3]._id, attributes[2]._id]
  },
  {
    _id: new mongoose.Types.ObjectId(),
    type_id: productTypes[24]._id,
    brand_id: brands[7]._id,
    SKU: 'SNK-WLNT-200',
    name: 'Raw Walnuts',
    description: 'Raw walnuts packed with omega-3s and antioxidants',
    size: mongoose.Types.Decimal128.fromString('200'),
    unit: 'g',
    cost_price: 60000,
    selling_price: 99900,
    current_stock: 145,
    image_urls: ['https://images.unsplash.com/photo-1597919926163-9419065218b4?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=600'],
    attributes: [attributes[6]._id, attributes[3]._id, attributes[2]._id, attributes[9]._id]
  },
  
  // Protein Bars
  {
    _id: new mongoose.Types.ObjectId(),
    type_id: productTypes[25]._id,
    brand_id: brands[6]._id,
    SKU: 'SNK-PBAR-60-CHOC',
    name: 'Chocolate Protein Bar',
    description: 'Delicious chocolate protein bar with 20g protein and no added sugar',
    size: mongoose.Types.Decimal128.fromString('60'),
    unit: 'g',
    cost_price: 15000,
    selling_price: 29900,
    current_stock: 350,
    image_urls: ['https://images.unsplash.com/photo-1622484212850-eb596d769edc?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=600'],
    attributes: [attributes[1]._id, attributes[7]._id, attributes[3]._id]
  },
  {
    _id: new mongoose.Types.ObjectId(),
    type_id: productTypes[25]._id,
    brand_id: brands[6]._id,
    SKU: 'SNK-PBAR-60-PB',
    name: 'Peanut Butter Protein Bar',
    description: 'Creamy peanut butter protein bar with natural ingredients',
    size: mongoose.Types.Decimal128.fromString('60'),
    unit: 'g',
    cost_price: 15000,
    selling_price: 29900,
    current_stock: 320,
    image_urls: ['https://images.unsplash.com/photo-1554886729-fe8d4499a108?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=600'],
    attributes: [attributes[1]._id, attributes[7]._id, attributes[3]._id]
  },
  
  // Veggie Chips
  {
    _id: new mongoose.Types.ObjectId(),
    type_id: productTypes[26]._id,
    brand_id: brands[3]._id,
    SKU: 'SNK-KCHP-100',
    name: 'Baked Kale Chips',
    description: 'Crispy baked kale chips, a healthy alternative to potato chips',
    size: mongoose.Types.Decimal128.fromString('100'),
    unit: 'g',
    cost_price: 30000,
    selling_price: 54900,
    current_stock: 155,
    image_urls: ['https://medinsteadofmeds.com/wp-content/uploads/2018/04/Kale_Chips-768x1024.jpg'],
    attributes: [attributes[6]._id, attributes[3]._id, attributes[8]._id, attributes[0]._id]
  },
  
  // Dark Chocolate
  {
    _id: new mongoose.Types.ObjectId(),
    type_id: productTypes[27]._id,
    brand_id: brands[3]._id,
    SKU: 'SNK-DCHOC-85-SF',
    name: 'Sugar-Free Dark Chocolate 85%',
    description: 'Intense 85% dark chocolate sweetened with natural alternatives',
    size: mongoose.Types.Decimal128.fromString('100'),
    unit: 'g',
    cost_price: 35000,
    selling_price: 64900,
    current_stock: 175,
    image_urls: ['https://images.unsplash.com/photo-1523035274455-b2e5c6d5c2e0?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=600'],
    attributes: [attributes[7]._id, attributes[2]._id, attributes[6]._id]
  },
  
  // Protein Shakes
  {
    _id: new mongoose.Types.ObjectId(),
    type_id: productTypes[28]._id,
    brand_id: brands[6]._id,
    SKU: 'BEV-PSHK-330-VAN',
    name: 'Vanilla Protein Shake',
    description: 'Ready-to-drink vanilla protein shake with 25g protein per serving',
    size: mongoose.Types.Decimal128.fromString('330'),
    unit: 'ml',
    cost_price: 25000,
    selling_price: 44900,
    current_stock: 240,
    image_urls: ['https://images.unsplash.com/photo-1542444592-0d5997f202eb?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=600'],
    attributes: [attributes[1]._id, attributes[7]._id, attributes[3]._id, attributes[8]._id]
  },
  {
    _id: new mongoose.Types.ObjectId(),
    type_id: productTypes[28]._id,
    brand_id: brands[6]._id,
    SKU: 'BEV-PSHK-330-CHOC',
    name: 'Chocolate Protein Shake',
    description: 'Rich chocolate protein shake, convenient post-workout nutrition',
    size: mongoose.Types.Decimal128.fromString('330'),
    unit: 'ml',
    cost_price: 25000,
    selling_price: 44900,
    current_stock: 260,
    image_urls: ['https://greenheartlove.com/wp-content/uploads/2024/02/chocolate-milk-shake-8.jpg'],
    attributes: [attributes[1]._id, attributes[7]._id, attributes[3]._id, attributes[8]._id]
  },
  
  // Green Tea
  {
    _id: new mongoose.Types.ObjectId(),
    type_id: productTypes[29]._id,
    brand_id: brands[9]._id,
    SKU: 'BEV-GTEA-100-ORG',
    name: 'Organic Green Tea (100 bags)',
    description: 'Premium organic green tea bags with natural antioxidants',
    size: mongoose.Types.Decimal128.fromString('100'),
    unit: 'bags',
    cost_price: 60000,
    selling_price: 99900,
    current_stock: 135,
    image_urls: ['https://img.freepik.com/free-vector/tea-ad-with-watercolor-decoration_52683-30486.jpg?semt=ais_hybrid&w=600&q=80'],
    attributes: [attributes[4]._id, attributes[6]._id, attributes[7]._id, attributes[3]._id]
  },
  
  // Kombucha
  {
    _id: new mongoose.Types.ObjectId(),
    type_id: productTypes[30]._id,
    brand_id: brands[9]._id,
    SKU: 'BEV-KOMB-500-GNGR',
    name: 'Ginger Kombucha',
    description: 'Probiotic-rich ginger kombucha for gut health and digestion',
    size: mongoose.Types.Decimal128.fromString('500'),
    unit: 'ml',
    cost_price: 30000,
    selling_price: 54900,
    current_stock: 110,
    image_urls: ['https://brewbuch.com/wp-content/uploads/2019/11/lemon-ginger-kombucha-1.jpg'],
    attributes: [attributes[6]._id, attributes[4]._id, attributes[10]._id]
  },
  
  // Coconut Water
  {
    _id: new mongoose.Types.ObjectId(),
    type_id: productTypes[31]._id,
    brand_id: brands[7]._id,
    SKU: 'BEV-COCW-1L',
    name: '100% Pure Coconut Water',
    description: 'Natural hydrating coconut water with electrolytes, no added sugar',
    size: mongoose.Types.Decimal128.fromString('1000'),
    unit: 'ml',
    cost_price: 35000,
    selling_price: 59900,
    current_stock: 185,
    image_urls: ['https://images.unsplash.com/photo-1588413336009-1f4219f2d5dd?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=600'],
    attributes: [attributes[6]._id, attributes[7]._id, attributes[3]._id, attributes[10]._id]
  }
]


//Seeding method
async function seedDatabase() {
  try {
    // Connect to MongoDB
    await mongoose.connect('mongodb://localhost:27017/HealthyCrave', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    })
        
    const ProductCategory = require('../models/ProductCategories')
    const ProductType = require('../models/ProductTypes')
    const Brand = require('../models/Brands')
    const Attribute = require('../models/Attributes')
    const Product = require('../models/Products')
    const Review = require('../models/Reviews')
    const CO = require('../models/CustomerOrders')
    const COI = require('../models/CustomerOrderItems')
    const SO = require('../models/SupplyOrders')
    const SOI = require('../models/SupplyOrderItems')

    await Review.deleteMany({})
    await Product.deleteMany({})
    await ProductType.deleteMany({})
    await ProductCategory.deleteMany({})
    await Brand.deleteMany({})
    await Attribute.deleteMany({})
    await CO.deleteMany({})
    await COI.deleteMany({})
    await SO.deleteMany({})
    await SOI.deleteMany({})

    await ProductCategory.insertMany(productCategories)
    await ProductType.insertMany(productTypes)
    await Brand.insertMany(brands)
    await Attribute.insertMany(attributes)
    await Product.create(products)

    
    console.log('\nDatabase seeded successfully!')
    console.log(`- ${productCategories.length} Product Categories`)
    console.log(`- ${productTypes.length} Product Types`)
    console.log(`- ${brands.length} Brands`)
    console.log(`- ${attributes.length} Attributes`)
    console.log(`- ${products.length} Products`)
    
  } catch (error) {
    console.error('Error seeding database:', error)
  } finally {
    await mongoose.connection.close()
    console.log('\nDatabase connection closed')
  }
}

// Run the seeding function
seedDatabase()

module.exports = {
  productCategories,
  productTypes,
  brands,
  attributes,
  products,
}