const express = require('express')
const { verifyToken, adminOnly } = require('../controllers/userController')
const {
  viewCoupon,
  viewCoupons,
  addCoupon,
  editCoupon,
} = require('../controllers/couponController')

const router = express.Router()

router.get('/viewCoupon/:name', viewCoupon)
router.get('/viewCoupons', verifyToken, viewCoupons)
router.post('/addCoupon', verifyToken, addCoupon)
router.patch('/editCoupon', verifyToken, editCoupon)


module.exports = router
