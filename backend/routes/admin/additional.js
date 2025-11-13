// routes/admin/additionalManagement.js
const express = require("express");
const router = express.Router();
const pController = require("../../controllers/additionalManagement");
const { checkAdminRole } = require("../../middleware/checkAdmin");


router.get("/verify", checkAdminRole, pController.verifyAdminStatus);

// CATEGORY ROUTES
router.get(
  "/categories",
  pController.getAllCategories
);

// PRODUCT TYPE ROUTES
router.get(
  "/product-types",
  pController.getAllProductTypes
);

router.get(
  "/product-types/:id",
  pController.getProductTypeById
);

// BRAND ROUTES
router.get("/brands",  pController.getAllBrands);

router.get(
  "/brands/:id",
  pController.getBrandById
);

router.post("/brands", checkAdminRole, pController.createBrand);

router.put(
  "/brands/:id",
  checkAdminRole,
  pController.updateBrand
);

router.delete(
  "/brands/:id",
  checkAdminRole,
  pController.deleteBrand
);

// ATTRIBUTE ROUTES

router.get(
  "/attributes",
  pController.getAllAttributes
);

router.get(
  "/attributes/:id",
  pController.getAttributeById
);

module.exports = router;
