const express = require('express')
const { verifyToken, adminOnly } = require('../controllers/userController')
const {
  getProductsList,
  getProductById,
  editProductAttributes,
  addProduct,
  editProduct,
  deleteProduct,
  uploadMedia,
  deleteMedia,
} = require('../controllers/productController')
const mediaUtils = require('../utils/mediaUtils')

const router = express.Router()

router.get('/getProductsList', getProductsList)
router.get('/getProductById/:id', getProductById)
router.get('/getProductByIdAsAdmin/:id', verifyToken, getProductById)
router.post('/addProduct/', verifyToken, addProduct)
router.patch('/editProduct/', verifyToken, editProduct)
router.delete('/deleteProduct/:id', verifyToken, deleteProduct)

router.patch(
  '/uploadMedia',
  verifyToken,
  mediaUtils.uploadMedia('products', true).array('files'),
  uploadMedia,
)
router.delete('/deleteMedia/:fileName', verifyToken, deleteMedia)

module.exports = router
