const orderModel = require('../models/orderModel')
const joi = require('joi')

const makeOrder = async (req, res) => {
  try {
    const schema = joi.object({
      name: joi.string().min(3).max(50).required(),
      government: joi
        .string()
        .valid(
          'Alexandria',
          'Aswan',
          'Assiut',
          'Beheira',
          'Beni Suef',
          'Cairo',
          'Dakahlia',
          'Damietta',
          'Fayoum',
          'Gharbia',
          'Giza',
          'Ismailia',
          'Kafr El Sheikh',
          'Luxor',
          'Matrouh',
          'Minya',
          'Monufia',
          'New Valley',
          'North Sinai',
          'Port Said',
          'Qalyubia',
          'Qena',
          'Red Sea',
          'Sharqia',
          'Sohag',
          'South Sinai',
          'Suez'
        )
        .required(),
      city: joi.string().min(2).max(100).required(),
      address: joi.string().min(2).max(255).required(),
      phone: joi
        .string()
        .pattern(/^(\+?\d{1,3}[- ]?)?\d{10,15}$/)
        .required(),
      second_phone: joi
        .string()
        .pattern(/^(\+?\d{1,3}[- ]?)?\d{10,15}$/)
        .allow('')
        .optional(),
      notes: joi.string().max(2000).allow('').optional(),
      items: joi
        .array()
        .items(
          joi
            .object({
              product_id: joi.number().integer().min(0).required(),
              attributes: joi.object().unknown(true),
            })
            .unknown(true)
        )
        .required(),
      coupon: joi
        .string()
        .custom((value, helpers) => {
            if (value == '') return null
            return value
        })
        .allow('')
        .optional(),
    })

    const { error, value } = schema.validate(req.body, {
      abortEarly: true,
      convert: true,
    })
    if (error) return res.status(400).json({ error: error.details[0].message })

    const order = await orderModel.makeOrder(
      value.name,
      value.government,
      value.city,
      value.address,
      value.phone,
      value.second_phone,
      value.notes,
      value.coupon,
      value.items
    )
    if (order.error) {
      return res.status(400).json(order)
    }

    return res.status(200).json(order)
  } catch (error) {
    console.error('makeOrder error:', error)
    return res
      .status(500)
      .json({ error: 'Internal server error, Please try again' })
  }
}

const viewOrderAsAdmin = async (req, res) => {
  try {
    const id = parseInt(req.params.id)
    if (isNaN(id) || id < 1) {
      return res.status(400).json({ error: 'Enter valid ID' })
    }
    const result = await orderModel.viewOrderAsAdmin(id)
    if (result.error) {
      return res.status(400).json({ error: result.error })
    }
    return res.status(200).json(result)
  } catch (error) {
    console.error('viewOrderAsAdmin error:', error)
    return res
      .status(500)
      .json({ error: 'Internal server error, Please try again' })
  }
}

const updateOrderStatus = async (req, res) => {
  try {
    const id = parseInt(req.body.id)
    if (isNaN(id) || id < 1) {
      return res.status(400).json({ error: 'Enter valid ID' })
    }
    await orderModel.updateOrderStatus(id)
    return res
      .status(200)
      .json({ success: 'Order status is updated successfully' })
  } catch (error) {
    console.error('updateOrderStatus error:', error)
    return res
      .status(500)
      .json({ error: 'Internal server error, Please try again' })
  }
}

const cancelOrder = async (req, res) => {
  try {
    const id = parseInt(req.body.id)
    if (isNaN(id) || id < 1) {
      return res.status(400).json({ error: 'Enter valid ID' })
    }
    await orderModel.cancelOrder(id)
    return res
      .status(200)
      .json({ success: 'Order status is updated successfully' })
  } catch (error) {
    console.error('cancelOrder error:', error)
    return res
      .status(500)
      .json({ error: 'Internal server error, Please try again' })
  }
}

const confirmOrder = async (req, res) => {
  try {
    const id = req.body.id
    if (!id || id < 1) {
      return res.status(400).json({ error: 'Enter valid ID' })
    }
    const result = await orderModel.confirmOrder(id)
    if (result.error) {
      return res.status(400).json(result)
    }
    return res
      .status(200)
      .json({ success: 'Order status is updated successfully' })
  } catch (error) {
    console.error('cancelOrder error:', error)
    return res
      .status(500)
      .json({ error: 'Internal server error, Please try again' })
  }
}

const viewOrdersListAsAdmin = async (req, res) => {
  try {
    const schema = joi.object({
      phoneNumber: joi
        .string()
        .pattern(/^(\+?\d{1,3}[- ]?)?\d{10,15}$/)
        .optional(),
      page: joi.number().integer().min(1).optional().default(1),
      limit: joi.number().integer().min(1).optional().default(10),
      status: joi.string().optional(),
    })
    const { error, value } = schema.validate(req.query, {
      abortEarly: true,
      convert: true,
    })
    if (error) return res.status(400).json({ error: error.details[0].message })
    const result = await orderModel.viewOrdersListAsAdmin(
      value.page,
      value.limit,
      value.status,
      value.phoneNumber
    )
    if (result.error) {
      return res.status(400).json({ error: result.error })
    }
    return res.status(200).json(result)
  } catch (error) {
    console.error('viewOrdersListAsAdmin error:', error)
    return res
      .status(500)
      .json({ error: 'Internal server error, Please try again' })
  }
}

module.exports = {
  makeOrder,
  viewOrderAsAdmin,
  updateOrderStatus,
  cancelOrder,
  confirmOrder,
  viewOrdersListAsAdmin,
}
