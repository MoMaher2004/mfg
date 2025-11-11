const express = require('express')
const { verifyToken, adminOnly } = require('../controllers/userController')
const { viewSubCategories, addSubCategory, deleteSubCategory, editSubCategory, updateMedia, viewSubCategoriesFamily } = require('../controllers/subCategoryController')
const mediaUtils = require('../utils/mediaUtils')

const router = express.Router()

router.get('/viewSubCategories', viewSubCategories)
router.get('/viewSubCategoriesFamily', viewSubCategoriesFamily)
router.post('/addSubCategory', verifyToken, addSubCategory)
router.patch('/editSubCategory', verifyToken, editSubCategory)
router.delete('/deleteSubCategory/:id', verifyToken, deleteSubCategory)

router.patch(
  '/updateMedia',
  verifyToken,
  mediaUtils.uploadMedia('subCategories', false).single('file'),
  updateMedia,
)

module.exports = router
