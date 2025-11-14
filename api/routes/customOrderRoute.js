const express = require('express')
const { verifyToken, adminOnly } = require('../controllers/userController')
const {
  viewCustomOrders,
  addCustomOrder,
  deleteCustomOrder,
} = require('../controllers/customOrderController')

const router = express.Router()

router.get('/viewCustomOrders', verifyToken, viewCustomOrders)
router.post(
  '/addCustomOrder',
  addCustomOrder
)
router.delete('/deleteCustomOrder/:id', verifyToken, deleteCustomOrder)

module.exports = router
