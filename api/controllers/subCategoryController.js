const subCategoryModel = require('../models/subCategoryModel')
const joi = require('joi')
const path = require('path')
const fs = require('fs').promises

const viewSubCategoriesFamily = async (req, res) => {
  try {
    const rtl = (req.query.rtl === true)
    const data = await subCategoryModel.viewSubCategoriesFamily(rtl)
    return res.status(200).json({ data })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ error: 'Internal server error, Please try again' })
  }
}

const viewSubCategories = async (req, res) => {
  try {
    const schema = joi.object({
      page: joi.number().integer().min(1).optional().default(1),
      limit: joi.number().integer().min(1).optional().default(20),
      category_id: joi.number().integer().min(1).allow('').optional(),
    })
    const { error, value } = schema.validate(req.query, {
      abortEarly: true,
      convert: true,
    })
    if (error) return res.status(400).json({ error: error.details[0].subCategory })

    const data = await subCategoryModel.viewSubCategories(value.page, value.limit, value.category_id)
    return res.status(200).json({ data })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ error: 'Internal server error, Please try again' })
  }
}

const addSubCategory = async (req, res) => {
  try {
    const schema = joi.object({
      name: joi.string().trim().min(2).max(255).required(),
      ar_name: joi.string().trim().min(2).max(255).required(),
      category_id: joi.number().integer().min(1).required(),
    })
    const { error, value } = schema.validate(req.body, {
      abortEarly: true,
      convert: true,
    })
    if (error) return res.status(400).json({ error: error.details[0].subCategory })

    const row = await subCategoryModel.addSubCategory(
      value.name,
      value.ar_name,
      value.category_id,
    )

    return res.status(200).json({ success: 'SubCategory is added successfully', row })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ error: 'Internal server error, Please try again' })
  }
}

const editSubCategory = async (req, res) => {
  try {
    const schema = joi.object({
      id: joi.number().integer().min(1).required(),
      name: joi.string().trim().min(2).max(255).required(),
      ar_name: joi.string().trim().min(2).max(255).required(),
      category_id: joi.number().integer().min(1).required(),
    })
    const { error, value } = schema.validate(req.body, {
      abortEarly: true,
      convert: true,
    })
    if (error) return res.status(400).json({ error: error.details[0].subCategory })

    const row = await subCategoryModel.editSubCategory(
      value.id,
      value.name,
      value.ar_name,
      value.category_id,
    )

    return res.status(200).json({ success: 'SubCategory is edited successfully', row })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ error: 'Internal server error, Please try again' })
  }
}

const deleteSubCategory = async (req, res) => {
  try {
    const id = parseInt(req.params.id)
    if (isNaN(id) || id <= 0) {
      return res.status(400).json({ error: 'ID is not valid!' })
    }
    const result = await subCategoryModel.deleteSubCategory(id)
    if (result.error) {
      return res.status(400).json({ error: result.error })
    }
    try{
      const filePath = path.join(__dirname, '../../media/categories', result.file_name)
      await fs.unlink(filePath)
    } catch (error){}
    return res.status(200).json({ success: 'subCategory is deleted successfully', row: result })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ error: 'Internal server error, Please try again' })
  }
}

const updateMedia = async (req, res) => {
  try {
    const sub_category_id = parseInt(Object.values(req.body)[0])
    if (isNaN(sub_category_id) || sub_category_id < 1) {
      return res.status(400).json({ message: 'Category ID is invalid' })
    }
    if (!req.file || req.file.length === 0) {
      return res.status(400).json({ message: 'No file was uploaded' })
    }
    const result = await subCategoryModel.updateMedia(sub_category_id, req.file.filename)
    if (result.error) {
      return res.status(400).json({ error: result.error })
    }
    try{
      const filePath = path.join(__dirname, '../../media/subCategories', result.file_name)
      await fs.unlink(filePath)
    } catch (error){}

    return res.status(200).json({ success: 'Media were updated successfully' })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ error: 'Internal server error, Please try again' })
  }
}


module.exports = {
  viewSubCategories,
  editSubCategory,
  addSubCategory,
  deleteSubCategory,
  updateMedia,
  viewSubCategoriesFamily,
}
