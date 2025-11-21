// routes/admin/customerManagement.js
const express = require("express");
const router = express.Router();
const customerManagementController = require("../../controllers/customerManagement");
const { checkAdminRole } = require("../../middleware/checkAdmin");

router.get(
  "/",
  checkAdminRole,
  customerManagementController.getAllCustomers
);

router.put(
  "/:id/lock",
  checkAdminRole,
  customerManagementController.lockAccount
);

router.put(
  "/:id/unlock",
  checkAdminRole,
  customerManagementController.unlockAccount
);

module.exports = router;