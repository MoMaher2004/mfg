const express = require('express')
const { verifyToken, adminOnly } = require('../controllers/userController')
const {
  getPayments,
  setPayments,
  getDelivery,
  setDelivery,
} = require('../controllers/settingController')

const router = express.Router()

router.get('/payments', getPayments)
router.patch('/payments', verifyToken, adminOnly, setPayments)

router.get('/deliveryCost', getDelivery)
router.patch('/deliveryCost', verifyToken, adminOnly, setDelivery)

module.exports = router
