const couponModel = require('../models/couponModel')
const joi = require('joi')

const viewCoupon = async (req, res) => {
  try {
    const schema = joi.object({
      name: joi.string().required(),
    })
    const { error, value } = schema.validate(req.params, {
      abortEarly: true,
      convert: true,
    })
    if (error) return res.status(400).json({ error: error.details[0].message })

    const data = await couponModel.viewCoupon(value.name)
    if (!data)
      return res.status(400).json({ error: 'Coupon is invalid or expired' })
    return res.status(200).json({ data })
  } catch (error) {
    console.error(error)
    return res
      .status(500)
      .json({ error: 'Internal server error, Please try again' })
  }
}

const viewCoupons = async (req, res) => {
  try {
    const schema = joi.object({
      page: joi.number().integer().min(1).optional().default(1),
      limit: joi.number().integer().min(1).optional().default(20),
      orderBy: joi
        .string()
        .trim()
        .valid('name', 'nameReverse', 'date', 'dateReverse')
        .optional()
        .default('dateReverse'),
    })
    const { error, value } = schema.validate(req.query, {
      abortEarly: true,
      convert: true,
    })
    if (error) return res.status(400).json({ error: error.details[0].message })

    const data = await couponModel.viewCoupons(
      value.page,
      value.limit,
      value.orderBy
    )
    return res.status(200).json({ data })
  } catch (error) {
    console.error(error)
    return res
      .status(500)
      .json({ error: 'Internal server error, Please try again' })
  }
}

const addCoupon = async (req, res) => {
  try {
    const schema = joi.object({
      name: joi.string().trim().min(2).max(255).required(),
      discount: joi.number().min(0).max(0.9999).required(),
      max_uses: joi.number().integer().min(0).required(),
      deadline: joi.date().required(),
    })
    const { error, value } = schema.validate(req.body, {
      abortEarly: true,
      convert: true,
    })
    if (error) return res.status(400).json({ error: error.details[0].message })

    const row = await couponModel.addCoupon(
      value.name,
      value.discount,
      value.max_uses,
      value.deadline
    )

    const data = await couponModel.viewCoupon(value.name)
    if (data)
      return res.status(400).json({ error: 'Coupon already exists' })

    return res
      .status(200)
      .json({ success: 'Coupon is added successfully', row })
  } catch (error) {
    console.error(error)
    return res
      .status(500)
      .json({ error: 'Internal server error, Please try again' })
  }
}

const editCoupon = async (req, res) => {
  try {
    const schema = joi.object({
      name: joi.string().trim().min(2).max(255).required(),
      discount: joi.number().min(0).max(0.9999).required(),
      max_uses: joi.number().integer().min(0).required(),
      deadline: joi.date().required(),
    })
    const { error, value } = schema.validate(req.body, {
      abortEarly: true,
      convert: true,
    })
    if (error) return res.status(400).json({ error: error.details[0].message })

    const row = await couponModel.editCoupon(
      value.name,
      value.discount,
      value.max_uses,
      value.deadline
    )

    return res
      .status(200)
      .json({ success: 'Coupon is edited successfully', row })
  } catch (error) {
    console.error(error)
    return res
      .status(500)
      .json({ error: 'Internal server error, Please try again' })
  }
}

module.exports = {
  viewCoupon,
  viewCoupons,
  editCoupon,
  addCoupon,
}
