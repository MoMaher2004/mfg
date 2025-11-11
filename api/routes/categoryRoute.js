const express = require('express')
const { verifyToken, adminOnly } = require('../controllers/userController')
const {
  viewCategories,
  addCategory,
  deleteCategory,
  editCategory,
  updateMedia,
} = require('../controllers/categoryController')
const mediaUtils = require('../utils/mediaUtils')

const router = express.Router()

router.get('/viewCategories', viewCategories)
router.post('/addCategory', verifyToken, addCategory)
router.patch('/editCategory', verifyToken, editCategory)
router.delete('/deleteCategory/:id', verifyToken, deleteCategory)

router.patch(
  '/updateMedia',
  verifyToken,
  mediaUtils.uploadMedia('categories', false).single('file'),
  updateMedia,
)

module.exports = router
