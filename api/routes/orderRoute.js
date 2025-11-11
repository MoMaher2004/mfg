const express = require('express')
const { verifyToken, adminOnly } = require('../controllers/userController')
const {
  makeOrder,
  viewOrderAsAdmin,
  updateOrderStatus,
  cancelOrder,
  confirmOrder,
  viewOrdersListAsAdmin,
} = require('../controllers/orderController')

const router = express.Router()

router.post(
  '/makeOrder',
  makeOrder
)

router.get(
  '/viewOrderAsAdmin/:id',
  verifyToken,
  viewOrderAsAdmin
)

router.patch(
  '/confirmOrder',
  verifyToken,
  confirmOrder
)

router.patch(
  '/updateOrderStatus',
  verifyToken,
  updateOrderStatus
)

router.patch(
  '/cancelOrder',
  verifyToken,
  cancelOrder
)

router.get(
  '/viewOrdersListAsAdmin',
  verifyToken,
  viewOrdersListAsAdmin
)

module.exports = router