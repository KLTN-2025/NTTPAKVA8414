// controllers/productManagement.js
const Product = require("../models/Products");
const ProductType = require("../models/ProductTypes");
const Brand = require("../models/Brands");
const Attribute = require("../models/Attributes");
const mongoose = require("mongoose");
const fs = require("fs/promises");
const path = require("path");

// Helper function to delete image files
async function deleteImageFiles(imageUrls) {
  if (!imageUrls || imageUrls.length === 0) return;

  for (const url of imageUrls) {
    try {
      // Extract file path from URL
      const filePath = path.join(__dirname, "..", url);
      await fs.unlink(filePath);
    } catch (err) {
      console.error(`Failed to delete image: ${url}`, err);
    }
  }
}

// CREATE - Add new product
exports.createProduct = async (req, res) => {
  try {
    const {
      type_id,
      brand_id,
      SKU,
      name,
      description,
      size,
      unit,
      cost_price,
      selling_price,
      current_stock,
      attributes,
    } = req.body;
    // Validate required fields
    if (
      !type_id ||
      !SKU ||
      !name ||
      !description ||
      cost_price === undefined ||
      selling_price === undefined ||
      current_stock === undefined
    ) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
      });
    }

    // Validate type_id exists
    const typeExists = await ProductType.findById(type_id);
    if (!typeExists) {
      return res.status(400).json({
        success: false,
        message: "Invalid product type ID",
      });
    }
    // Validate brand_id if provided
    if (brand_id) {
      const brandExists = await Brand.findById(brand_id);
      if (!brandExists) {
        return res.status(400).json({
          success: false,
          message: "Invalid brand ID",
        });
      }
    }
    // Validate attributes if provided
    if (attributes && Array.isArray(attributes) && attributes.length > 0) {
          const ids = attributes.map(id => new mongoose.Types.ObjectId(id))      
          const validAttributes = await Attribute.find({ _id: { $in: ids } });
      if (validAttributes.length !== attributes.length) {
        return res.status(400).json({
          success: false,
          message: "One or more invalid attribute IDs",
        });
      }
    }
    // Handle image uploads
    let image_urls = [];
    if (req.files && req.files.length > 0) {
      image_urls = req.files.map((file) => {
        const relativePath = file.path.split("uploads")[1];
        return `/uploads${relativePath}`;
      });
    }
    const product = new Product({
      type_id,
      brand_id: brand_id || null,
      SKU,
      name,
      description,
      size: size || null,
      unit: unit || "",
      cost_price: parseFloat(cost_price),
      selling_price: parseFloat(selling_price),
      current_stock: parseInt(current_stock),
      image_urls,
      attributes: attributes || [],
    });
    await product.save();
    res.status(201).json({
      success: true,
      message: "Product created successfully",
    });

  } catch (error) {
    console.error(error);
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        try {
          await fs.unlink(file.path);
        } catch (err) {
          console.error("Failed to delete uploaded file:", err);
        }
      }
    }

    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json({
        success: false,
        message: `${field} already exists`,
      });
    }

    res.status(500).json({
      success: false,
      message: "Error creating product",
      error: error.message,
    });
  }
};

exports.getAllProducts = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      type_id,
      brand_id,
      category_id,
      attributes,
      search,
      sort = "-createdAt",
      min_price,
      max_price,
      in_stock,
    } = req.query;

    const filter = {};

    if (brand_id) filter.brand_id = brand_id;

    if (category_id) {
      //filter.category_id = category_id
      const types = await ProductType.find({ category_id: category_id }).select("_id");
      filter.type_id = { $in: types.map((t) => t._id) };
    }
    if (type_id){ 
      filter.type_id = type_id;
    }

    if (attributes) {
      const attrArray = attributes.split(",");
      filter.attributes = { $all: attrArray };
    }

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { SKU: { $regex: search, $options: "i" } }
      ];
    }

    if (min_price || max_price) {
      filter.selling_price = {};
      if (min_price) filter.selling_price.$gte = parseFloat(min_price);
      if (max_price) filter.selling_price.$lte = parseFloat(max_price);
    }

    if (in_stock === "true") {
      filter.current_stock = { $gt: 0 };
    } else if (in_stock === "false") {
      filter.current_stock = 0;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const products = await Product.find(filter)
      .select('-slug -size -unit -description -__v -createdAt')
      .populate('attributes', 'description')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Product.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: products,
      pagination: {
        current_page: parseInt(page),
        total_pages: Math.ceil(total / parseInt(limit)),
        total_items: total,
        items_per_page: parseInt(limit),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching products",
      error: error.message,
    });
  }
};

// READ - Get single product by ID
exports.getProductById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID",
      });
    }

    const product = await Product.findById(id)
      .populate({
        path: "type_id",
        select: "name description category_id",
        populate: {
          path: "category_id",
          select: "category_name description",
        },
      })
      .populate("brand_id", "name")
      .populate("attributes", "description slug");

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    res.status(200).json({
      success: true,
      data: product,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching product",
      error: error.message,
    });
  }
};

// READ - Get product by slug
exports.getProductBySlug = async (req, res) => {
  try {
    const { slug } = req.params;

    const product = await Product.findOne({ slug })
      .populate({
        path: "type_id",
        select: "name description category_id",
        populate: {
          path: "category_id",
          select: "category_name description",
        },
      })
      .populate("brand_id", "name")
      .populate("attributes", "description slug");

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    res.status(200).json({
      success: true,
      data: product,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching product",
      error: error.message,
    });
  }
};

// UPDATE - Update product
exports.updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      type_id,
      brand_id,
      SKU,
      name,
      description,
      size,
      unit,
      cost_price,
      selling_price,
      current_stock,
      attributes,
      remove_images, 
    } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID",
      });
    }

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    if (type_id) {
      const typeExists = await ProductType.findById(type_id);
      if (!typeExists) {
        return res.status(400).json({
          success: false,
          message: "Invalid product type ID",
        });
      }
      product.type_id = type_id;
    }

    if (brand_id !== undefined) {
      if (brand_id === null || brand_id === "") {
        product.brand_id = null;
      } else {
        const brandExists = await Brand.findById(brand_id);
        if (!brandExists) {
          return res.status(400).json({
            success: false,
            message: "Invalid brand ID",
          });
        }
        product.brand_id = brand_id;
      }
    }

    if (attributes) {
      const attrArray = Array.isArray(attributes)
        ? attributes
        : JSON.parse(attributes);
      if (attrArray.length > 0) {
        const validAttributes = await Attribute.find({
          _id: { $in: attrArray },
        });
        if (validAttributes.length !== attrArray.length) {
          return res.status(400).json({
            success: false,
            message: "One or more invalid attribute IDs",
          });
        }
      }
      product.attributes = attrArray;
    }

    if (SKU !== undefined) product.SKU = SKU;
    if (name !== undefined) product.name = name;
    if (description !== undefined) product.description = description;
    if (size !== undefined) product.size = size || null;
    if (unit !== undefined) product.unit = unit || "";
    if (cost_price !== undefined) product.cost_price = parseFloat(cost_price);
    if (selling_price !== undefined)
      product.selling_price = parseFloat(selling_price);
    if (current_stock !== undefined)
      product.current_stock = parseInt(current_stock);

    if (
      remove_images &&
      Array.isArray(remove_images) &&
      remove_images.length > 0
    ) {
      await deleteImageFiles(remove_images);
      product.image_urls = product.image_urls.filter(
        (url) => !remove_images.includes(url)
      );
    }

    if (req.files && req.files.length > 0) {
      const newImageUrls = req.files.map((file) => {
        const relativePath = file.path.split("uploads")[1];
        return `/uploads${relativePath}`;
      });
      product.image_urls = [...product.image_urls, ...newImageUrls];
    }

    await product.save();

    await product.populate([
      { path: "type_id", select: "name category_id" },
      { path: "brand_id", select: "name" },
      { path: "attributes", select: "description slug" },
    ]);

    res.status(200).json({
      success: true,
      message: "Product updated successfully",
      data: product,
    });
  } catch (error) {
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        try {
          await fs.unlink(file.path);
        } catch (err) {
          console.error("Failed to delete uploaded file:", err);
        }
      }
    }

    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json({
        success: false,
        message: `${field} already exists`,
      });
    }

    res.status(500).json({
      success: false,
      message: "Error updating product",
      error: error.message,
    });
  }
};

// DELETE - Delete product
exports.deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID",
      });
    }

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    await deleteImageFiles(product.image_urls);
    await Product.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: "Product deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error deleting product",
      error: error.message,
    });
  }
};

// DELETE - Bulk delete products
exports.bulkDeleteProducts = async (req, res) => {
  try {
    const { product_ids } = req.body;

    // Validate input
    if (!product_ids || !Array.isArray(product_ids) || product_ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid product_ids. Must be a non-empty array'
      });
    }

    // Validate all IDs
    const invalidIds = product_ids.filter(id => !mongoose.Types.ObjectId.isValid(id));
    if (invalidIds.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'One or more invalid product IDs',
        invalid_ids: invalidIds
      });
    }

    // Find all products to delete (to get their images)
    const products = await Product.find({ _id: { $in: product_ids } });

    if (products.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No products found with the provided IDs'
      });
    }

    // Collect all image URLs to delete
    const allImageUrls = [];
    products.forEach(product => {
      if (product.image_urls && product.image_urls.length > 0) {
        allImageUrls.push(...product.image_urls);
      }
    });

    // Delete all images
    if (allImageUrls.length > 0) {
      await deleteImageFiles(allImageUrls);
    }

    // Delete all products
    const deleteResult = await Product.deleteMany({ _id: { $in: product_ids } });

    res.status(200).json({
      success: true,
      message: `${deleteResult.deletedCount} products deleted successfully`,
      deleted_count: deleteResult.deletedCount,
      requested_count: product_ids.length
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting products',
      error: error.message
    });
  }
};

// INVENTORY - Adjust product stock
exports.adjustInventory = async (req, res) => {
  try {
    const { id } = req.params;
    const { adjustment, reason } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID",
      });
    }

    if (adjustment === undefined || typeof adjustment !== "number") {
      return res.status(400).json({
        success: false,
        message:
          "Invalid adjustment value. Must be a number (positive or negative)",
      });
    }

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    const newStock = product.current_stock + adjustment;

    if (newStock < 0) {
      return res.status(400).json({
        success: false,
        message: "Adjustment would result in negative stock",
        current_stock: product.current_stock,
        attempted_adjustment: adjustment,
      });
    }

    product.current_stock = newStock;
    await product.save();

    res.status(200).json({
      success: true,
      message: "Inventory adjusted successfully",
      data: {
        product_id: product._id,
        SKU: product.SKU,
        name: product.name,
        previous_stock: product.current_stock - adjustment,
        adjustment: adjustment,
        current_stock: product.current_stock,
        reason: reason || "No reason provided",
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error adjusting inventory",
      error: error.message,
    });
  }
};

// INVENTORY - Set exact stock level
exports.setInventory = async (req, res) => {
  try {
    const { id } = req.params;
    const { stock, reason } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID",
      });
    }

    if (stock === undefined || typeof stock !== "number" || stock < 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid stock value. Must be a non-negative number",
      });
    }

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    const previousStock = product.current_stock;
    product.current_stock = parseInt(stock);
    await product.save();

    res.status(200).json({
      success: true,
      message: "Inventory set successfully",
      data: {
        product_id: product._id,
        SKU: product.SKU,
        name: product.name,
        previous_stock: previousStock,
        current_stock: product.current_stock,
        difference: product.current_stock - previousStock,
        reason: reason || "No reason provided",
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error setting inventory",
      error: error.message,
    });
  }
};