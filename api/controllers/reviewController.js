const reviewModel = require('../models/reviewModel')
const fs = require('fs').promises
const path = require('path')
const joi = require('joi')

const viewReviews = async (req, res) => {
  try {
    const data = await reviewModel.viewReviews()
    return res.status(200).json(data)
  } catch (error) {
    console.error(error)
    return res
      .status(500)
      .json({ message: 'Internal server error, Please try again' })
  }
}

const addReview = async (req, res) => {
  try {
    const schema = joi.object({
      content: joi.string().trim().optional(),
      ar_content: joi.string().trim().optional(),
      rate: joi.number().min(0).max(10).required(),
    })
    const { error, value } = schema.validate(req.body, {
      abortEarly: true,
      convert: true,
    })
    if (error) return res.status(400).json({ error: error.details[0].message })

    if (!req.file || req.file.length === 0) {
      return res.status(400).json({ message: 'No files uploaded' })
    }

    const rows = await reviewModel.addReview(
      req.file.filename,
      value.content,
      value.ar_content,
      value.rate
    )

    return res
      .status(200)
      .json({ success: 'Review is added successfully', rows })
  } catch (error) {
    console.error(error)
    return res
      .status(500)
      .json({ message: 'Internal server error, Please try again' })
  }
}

const deleteReview = async (req, res) => {
  try {
    const id = req.params.id
    const result = await reviewModel.deleteReview(id)
    if (result.error) {
      return res.status(400).json({ error: result.error })
    }
    const filePath = path.join(
      __dirname,
      '../../media/reviews',
      result.file_name
    )
    await fs.unlink(filePath)
    return res
      .status(200)
      .json({ success: 'review is deleted successfully', rows: result })
  } catch (error) {
    console.error(error)
    return res
      .status(500)
      .json({ message: 'Internal server error, Please try again' })
  }
}

module.exports = {
  viewReviews,
  addReview,
  deleteReview,
}
