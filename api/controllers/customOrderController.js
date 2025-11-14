const customOrderModel = require('../models/customOrderModel')
const joi = require('joi')

const viewCustomOrders = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1
    const limit = parseInt(req.query.limit) || 20

    if (isNaN(page) || page < 1 || isNaN(limit) || limit < 1) {
      return res.status(400).json({ error: 'Invalid pagination parameters' })
    }
    if (limit > 100) {
      return res.status(400).json({ error: 'Limit cannot exceed 100' })
    }
    const data = await customOrderModel.viewCustomOrders(page, limit)
    return res.status(200).json({ data })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ message: 'Internal server error, Please try again' })
  }
}

const addCustomOrder = async (req, res) => {
  try {
    const productListSchema = joi.object({
      name: joi.string().min(2).max(150).required(),
      phone: joi
        .string()
        .pattern(/^(\+?\d{1,3}[- ]?)?\d{10,15}$/)
        .required(),
      message: joi.string().min(5).max(200).required(),
    })
    const { error, value } = productListSchema.validate(req.body, {
      abortEarly: true,
      convert: true,
    })
    // if (error) return res.status(400).json({ errors: error.details })
    if (error) return res.status(400).json({ error: error.details[0].message })

    await customOrderModel.addCustomOrder(
      value.name,
      value.phone,
      value.message,
    )
    return res.status(200).json({ success: 'Custom order is sent successfully' })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ message: 'Internal server error, Please try again' })
  }
}

const deleteCustomOrder = async (req, res) => {
  try {
    const id = req.params.id
    const result = await customOrderModel.deleteCustomOrder(id)
    if (result.error) {
      return res.status(400).json({ error: result.error })
    }
    return res.status(200).json({ success: 'Custom order is deleted successfully' })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ message: 'Internal server error, Please try again' })
  }
}

module.exports = {
  viewCustomOrders,
  addCustomOrder,
  deleteCustomOrder,
}
