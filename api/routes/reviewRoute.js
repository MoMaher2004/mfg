const express = require('express')
const { verifyToken, adminOnly } = require('../controllers/userController')
const {
  viewReviews,
    addReview,
    deleteReview
} = require('../controllers/reviewController')
const mediaUtils = require('../utils/mediaUtils')

const router = express.Router()

router.get('/viewReviews', viewReviews)
router.post(
  '/addReview',
  verifyToken,
  mediaUtils.uploadMedia('reviews', false).single('file'),
  addReview,
)
router.delete('/deleteReview/:id', verifyToken, deleteReview)

module.exports = router
