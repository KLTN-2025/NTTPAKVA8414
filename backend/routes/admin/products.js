// routes/admin/products.js
const express = require("express");
const router = express.Router();
const createUpload = require("../../middleware/upload");
const productController = require("../../controllers/productManagement");
const { checkAdminRole } = require("../../middleware/checkAdmin");

const upload = createUpload({
  maxSize: 3 * 1024 * 1024, // 3MB
  allowedMime: ["image/jpeg", "image/png", "image/webp"],
});

router.post(
  "/",
  checkAdminRole,
  upload.array("images", 4),
  productController.createProduct
);

router.get(
  "/", checkAdminRole,
  productController.getAllProducts
);

router.delete(
  "/bulk-delete",
  checkAdminRole,
  productController.bulkDeleteProducts
);

router.get(
  '/search',
  productController.searchProducts
);

router.get(
  "/slug/:slug",
  checkAdminRole,
  productController.getProductBySlug
);

router.get(
  "/:id",
  checkAdminRole,
  productController.getProductById
);


router.put(
  "/:id",
  checkAdminRole,
  upload.array("images", 4),
  productController.updateProduct
);

router.delete(
  "/:id",
  checkAdminRole,
  productController.deleteProduct
);

router.patch(
  "/:id/inventory/adjust",
  checkAdminRole,
  productController.adjustInventory
);

router.patch(
  "/:id/inventory/set",
  checkAdminRole,
  productController.setInventory
);
module.exports = router;