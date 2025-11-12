const settingsModel = require('../models/settingModel')
const joi = require('joi')

const getPayments = async (req, res) => {
  try {
    const data = await settingsModel.getPayments()
    return res.status(200).json(data)
  } catch (error) {
    console.error(error)
    return res
      .status(500)
      .json({ error: 'Internal server error, Please try again' })
  }
}

const setPayments = async (req, res) => {
  try {
    const schema = joi.object({
      payments: joi.object().required()
    })
    const { error, value } = schema.validate(req.body, {
      abortEarly: true,
      convert: true,
    })
    if (error) return res.status(400).json({ error: error.details[0].message })

    const row = await settingsModel.setPayments(
      value.payments
    )

    return res
      .status(200)
      .json({ success: 'Payments are edited successfully', row })
  } catch (error) {
    console.error(error)
    return res
      .status(500)
      .json({ error: 'Internal server error, Please try again' })
  }
}

const getDelivery = async (req, res) => {
  try {
    const data = await settingsModel.getDelivery()
    return res.status(200).json(data)
  } catch (error) {
    console.error(error)
    return res
      .status(500)
      .json({ error: 'Internal server error, Please try again' })
  }
}

const setDelivery = async (req, res) => {
  try {
    const schema = joi.object({
      base: joi.number().min(0).required(),
      increasement: joi.number().min(0).required()
    })
    const { error, value } = schema.validate(req.body, {
      abortEarly: true,
      convert: true,
    })
    if (error) return res.status(400).json({ error: error.details[0].message })

    const row = await settingsModel.setDelivery(
      value.base,
      value.increasement
    )

    return res
      .status(200)
      .json({ success: 'Delivery cost is edited successfully', row })
  } catch (error) {
    console.error(error)
    return res
      .status(500)
      .json({ error: 'Internal server error, Please try again' })
  }
}

module.exports = {
  getPayments,
  setPayments,
  getDelivery,
  setDelivery,
}
