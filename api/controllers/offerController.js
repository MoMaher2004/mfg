const offerModel = require('../models/offerModel')
const fs = require('fs').promises
const path = require('path')
const joi = require('joi')

const viewOffers = async (req, res) => {
  try {
    const data = await offerModel.viewOffers()
    return res.status(200).json(data)
  } catch (error) {
    console.error(error)
    return res
      .status(500)
      .json({ message: 'Internal server error, Please try again' })
  }
}

const addOffer = async (req, res) => {
  try {
    const schema = joi.object({
      url: joi.string().uri().required(),
    })

    const { error, value } = schema.validate(req.body)
    if (error) {
      return res.status(400).json({ error: error.details[0].message })
    }
    const url = value.url
    if (!req.file) {
      return res.status(400).json({ error: 'No files uploaded' })
    }
    const rows = await offerModel.addOffer(req.file.filename, url)

    return res.status(200).json({ success: 'Offer is added successfully', rows })
  } catch (error) {
    console.error('addOffer error:', error)
    return res
      .status(500)
      .json({ error: 'Internal server error, Please try again' })
  }
}

const deleteOffer = async (req, res) => {
  try {
    const id = req.params.id
    const result = await offerModel.deleteOffer(id)
    if (result.error) {
      return res.status(400).json({ error: result.error })
    }
    const filePath = path.join(__dirname, '../../media/offers', result.file_name)
    await fs.unlink(filePath)
    return res
      .status(200)
      .json({ success: 'offer is deleted successfully', rows: result })
  } catch (error) {
    console.error(error)
    return res
      .status(500)
      .json({ message: 'Internal server error, Please try again' })
  }
}

module.exports = {
  viewOffers,
  addOffer,
  deleteOffer,
}
