const express = require('express')
const { verifyToken, adminOnly } = require('../controllers/userController')
const {
  viewOffers,
    addOffer,
    deleteOffer
} = require('../controllers/offerController')
const mediaUtils = require('../utils/mediaUtils')

const router = express.Router()

router.get('/viewOffers', viewOffers)
router.post(
  '/addOffer',
  verifyToken,
  mediaUtils.uploadMedia('offers', false).single('file'),
  addOffer,
)
router.delete('/deleteOffer/:id', verifyToken, deleteOffer)

module.exports = router
