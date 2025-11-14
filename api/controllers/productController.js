const productModel = require('../models/productModel')
const subCategoriesModel = require('../models/subCategoryModel')
const fs = require('fs').promises
const path = require('path')
const joi = require('joi')
const { standardizeArabic } = require('../utils/standardizeArabic')

const getProductsList = async (req, res) => {
  try {
    const schema = joi.object({
      page: joi.number().integer().min(1).optional().default(1),
      limit: joi.number().integer().min(1).optional().default(20),
      maxPrice: joi.number().optional(),
      minPrice: joi.number().min(1).optional(),
      subCategories: joi
        .string()
        .custom((value, helpers) => {
          const categories = value.split(',').map(parseInt((v) => v.trim()))

          for (const cat of categories) {
            if (isNaN(cat) || cat < 1) {
              return helpers.error('any.invalid', { value: cat })
            }
          }

          return value
        })
        .optional()
        .default(''),
      categories: joi
        .string()
        .custom((value, helpers) => {
          const categories = value.split(',').map(parseInt((v) => v.trim()))

          for (const cat of categories) {
            if (isNaN(cat) || cat < 1) {
              return helpers.error('any.invalid', { value: cat })
            }
          }

          return value
        })
        .optional()
        .default(''),
      orderBy: joi.string().optional(),
      search: joi.string().max(100).allow('').optional(),
    })
    const { error, value } = schema.validate(req.query, {
      abortEarly: true,
      convert: true,
    })
    if (error) return res.status(400).json({ error: error.details[0].message })

    const products = await productModel.getProductsList(
      req.user != undefined,
      value.page,
      value.limit,
      value.maxPrice,
      value.minPrice,
      value.subCategories.split(','),
      value.categories.split(','),
      value.orderBy,
      standardizeArabic(value.search).split(',')
    )

    if (products.length === 0) {
      return res.status(200).json({ data: [], length: 0, filters: {} })
    }

    return res.status(200).json({
      data: products['rows'],
      length: products['count'],
      filters: products['filters'],
    })
  } catch (error) {
    console.error('getProductsList error:', error)
    return res
      .status(500)
      .json({ error: 'Internal server error, Please try again' })
  }
}

const getProductById = async (req, res) => {
  try {
    const id = parseInt(req.params.id)

    if (isNaN(id) || id < 1) {
      return res.status(404).json({ error: 'Product not found' })
    }
    const product = await productModel.getProductById(id)

    if (!product) {
      return res.status(404).json({ error: 'Product not found' })
    }

    return res.status(200).json({ data: product })
  } catch (error) {
    console.error('getProductById error:', error)
    return res
      .status(500)
      .json({ error: 'Internal server error, Please try again' })
  }
}

const addProduct = async (req, res) => {
  try {
    const attributeSchema = joi
      .object({
        stock: joi.number().integer().min(0).required(),
      })
      .unknown(true)
    const schema = joi.object({
      name: joi.string().trim().min(3).max(50).required(),
      ar_name: joi.string().trim().min(3).max(50).required(),
      brand: joi.string().trim().min(2).max(30).required(),
      ar_brand: joi.string().trim().min(2).max(30).required(),
      warranty: joi.string().trim().min(1).max(30).required(),
      ar_warranty: joi.string().trim().min(1).max(30).required(),
      description: joi.string().trim().max(1000).required(),
      ar_description: joi.string().trim().max(1000).required(),
      price: joi.number().precision(2).min(1.0).max(99999999.99).required(),
      deposite: joi.number().precision(2).min(1.0).max(99999999.99).required(),
      discount: joi.number().precision(4).min(0).max(0.99).default(0),
      weight: joi.number().integer().min(0).required(),
      sub_category_id: joi.required(),
      attributes: joi
        .array()
        .items(attributeSchema)
        .min(1)
        .required()
        .custom((value, helpers) => {
          if (value.length === 0) return value

          const firstKeys = Object.keys(value[0])
            .filter((key) => key !== 'stock')
            .sort()

          for (let i = 1; i < value.length; i++) {
            const currentKeys = Object.keys(value[i])
              .filter((key) => key !== 'stock')
              .sort()

            if (JSON.stringify(firstKeys) !== JSON.stringify(currentKeys)) {
              return helpers.error('array.custom', {
                message: `All attribute objects must have the same keys. Row 0 has [${firstKeys.join(', ')}] but row ${i} has [${currentKeys.join(', ')}]`,
              })
            }
          }

          const seen = new Set()
          for (let i = 0; i < value.length; i++) {
            const signature = firstKeys.map((key) => value[i][key]).join('|')

            if (seen.has(signature)) {
              return helpers.error('array.custom', {
                message: `Redundant attribute combination at index ${i}`,
              })
            }
            seen.add(signature)
          }

          return value
        }, 'Attributes consistency validation'),
    })
    const { error, value } = schema.validate(req.body, {
      abortEarly: true,
      convert: true,
    })
    if (error) return res.status(400).json({ error: error.details[0].message })
    const subCat = await subCategoriesModel.viewSubCategory(
      value.sub_category_id
    )
    const searchText = standardizeArabic(
      `${value.name} ${value.ar_name} ${value.brand} ${value.ar_brand} ${value.warranty} ${value.ar_warranty} ${subCat['sub_category_name']} ${subCat['sub_category_ar_name']} ${subCat['category_name']} ${subCat['category_ar_name']}`
    )
    const result = await productModel.addProduct(
      value.name,
      value.ar_name,
      value.brand,
      value.ar_brand,
      value.warranty,
      value.ar_warranty,
      value.description,
      value.ar_description,
      value.price,
      value.discount,
      value.sub_category_id,
      value.deposite,
      value.weight,
      value.attributes,
      searchText
    )

    if (result.error) {
      return res.status(400).json({ error: result.error })
    }

    return res.status(201).json({
      success: 'Product was added successfully',
      productId: result.productId,
    })
  } catch (error) {
    console.error('addProduct error:', error)
    return res
      .status(500)
      .json({ error: 'Internal server error, Please try again' })
  }
}

const editProduct = async (req, res) => {
  try {
    const attributeSchema = joi
      .object({
        stock: joi.number().integer().min(0).required(),
      })
      .unknown(true)
    const schema = joi.object({
      id: joi.number().integer().min(1).required(),
      name: joi.string().trim().min(3).max(50).required(),
      ar_name: joi.string().trim().min(3).max(50).required(),
      brand: joi.string().trim().min(2).max(30).required(),
      ar_brand: joi.string().trim().min(2).max(30).required(),
      warranty: joi.string().trim().min(1).max(30).required(),
      ar_warranty: joi.string().trim().min(1).max(30).required(),
      description: joi.string().trim().max(1000).required(),
      ar_description: joi.string().trim().max(1000).required(),
      price: joi.number().precision(2).min(1.0).max(99999999.99).required(),
      deposite: joi.number().precision(2).min(1.0).max(99999999.99).required(),
      discount: joi.number().precision(4).min(0).max(0.99).default(0),
      weight: joi.number().integer().min(0).required(),
      sub_category_id: joi.required(),
      attributes: joi
        .array()
        .items(attributeSchema)
        .min(1)
        .required()
        .custom((value, helpers) => {
          if (value.length === 0) return value

          const firstKeys = Object.keys(value[0])
            .filter((key) => key !== 'stock')
            .sort()

          for (let i = 1; i < value.length; i++) {
            const currentKeys = Object.keys(value[i])
              .filter((key) => key !== 'stock')
              .sort()

            if (JSON.stringify(firstKeys) !== JSON.stringify(currentKeys)) {
              return helpers.error('array.custom', {
                message: `All attribute objects must have the same keys. Row 0 has [${firstKeys.join(', ')}] but row ${i} has [${currentKeys.join(', ')}]`,
              })
            }
          }

          const seen = new Set()
          for (let i = 0; i < value.length; i++) {
            const signature = firstKeys.map((key) => value[i][key]).join('|')

            if (seen.has(signature)) {
              return helpers.error('array.custom', {
                message: `Redundant attribute combination at index ${i}`,
              })
            }
            seen.add(signature)
          }

          return value
        }, 'Attributes consistency validation'),
    })
    const { error, value } = schema.validate(req.body, {
      abortEarly: true,
      convert: true,
    })
    if (error) return res.status(400).json({ error: error.details[0].message })
    const subCat = await subCategoriesModel.viewSubCategory(
      value.sub_category_id
    )

    const searchText = standardizeArabic(
      `${value.name} ${value.ar_name} ${value.brand} ${value.ar_brand} ${value.warranty} ${value.ar_warranty} ${subCat['sub_category_name']} ${subCat['sub_category_ar_name']} ${subCat['category_name']} ${subCat['category_ar_name']}`
    )

    const product = await productModel.getProductById(value.id)
    if (!product) {
      return res.status(404).json({ error: 'Product not found' })
    }

    const result = await productModel.editProduct(
      value.id,
      value.name,
      value.ar_name,
      value.brand,
      value.ar_brand,
      value.warranty,
      value.ar_warranty,
      value.description,
      value.ar_description,
      value.price,
      value.discount,
      value.sub_category_id,
      value.deposite,
      value.weight,
      value.attributes,
      searchText
    )

    if (result.error) {
      return res.status(400).json({ error: result.error })
    }

    return res.status(200).json(result)
  } catch (error) {
    console.error('editProduct error:', error)
    return res
      .status(500)
      .json({ error: 'Internal server error, Please try again' })
  }
}

const deleteProduct = async (req, res) => {
  try {
    const id = parseInt(req.params.id)
    if (isNaN(id) || id <= 0) {
      return res.status(400).json({ error: 'Valid product ID is required' })
    }
    const row = await productModel.deleteProduct(id)
    for (const file of row.media) {
      const filePath = path.join(__dirname, '../../media/products/', file['file_name'])
      await fs.unlink(filePath)
    }
    return res.status(200).json({ success: 'Product was deleted successfully' })
  } catch (error) {
    console.error('deleteProduct error:', error)
    return res
      .status(500)
      .json({ error: 'Internal server error, Please try again' })
  }
}
const uploadMedia = async (req, res) => {
  try {
    const productId = parseInt(Object.values(req.body)[0])
    if (isNaN(productId) || productId < 1) {
      return res.status(400).json({ message: 'Product ID is invalid' })
    }
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'No files uploaded' })
    }

    for (const file of req.files) {
      await productModel.uploadMedia(productId, file.filename)
    }

    return res.status(200).json({ success: 'Media were uploaded successfully' })
  } catch (error) {
    console.error(error)
    return res
      .status(500)
      .json({ message: 'Internal server error, Please try again' })
  }
}

const deleteMedia = async (req, res) => {
  try {
    const fileName = req.params.fileName
    const result = await productModel.deleteMedia(fileName)
    if (result.error) {
      return res.status(400).json({ error: result.error })
    }
    const filePath = path.join(__dirname, '../../media', fileName)
    await fs.unlink(filePath)
    return res.status(200).json({ success: 'Media were deleted successfully' })
  } catch (error) {
    console.error(error)
    return res
      .status(500)
      .json({ message: 'Internal server error, Please try again' })
  }
}

module.exports = {
  getProductsList,
  getProductById,
  addProduct,
  editProduct,
  deleteProduct,
  uploadMedia,
  deleteMedia,
}
