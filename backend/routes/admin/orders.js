// routes/admin/orders.js
const express = require("express");
const router = express.Router();
const orderController = require("../../controllers/orderManagement");
const { checkAdminRole } = require("../../middleware/checkAdmin");

router.get('/', checkAdminRole,
    orderController.getAllOrders
)

router.get('/:id', checkAdminRole,
    orderController.getOrderById
)

router.put('/:id', checkAdminRole, 
    orderController.updateOrder
)

router.delete('/:id', checkAdminRole,
    orderController.deleteOrder
)

module.exports = router;