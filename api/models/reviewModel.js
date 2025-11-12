const conn = require('../config/db')

const viewReviews = async () => {
  try {
    const {rows} = await conn.query(
      `SELECT * FROM reviews ORDER BY id DESC`,
      []
    )
    return rows
  } catch (error) {
    console.error('Error during viewReviews:', error)
    throw new Error('Something went wrong')
  }
}

const addReview = async (file_name, content, ar_content, rate) => {
  try {
    const {rows, rowCount} = await conn.query(
      `INSERT INTO reviews (file_name, content, ar_content, rate) VALUES ($1, $2, $3, $4) RETURNING *`,
      [file_name, content, ar_content, rate]
    )
    if (rowCount === 0) {
      throw new Error('Something went wrong')
    }
    return rows[0]
  } catch (error) {
    console.error('Error during addReview:', error)
    throw new Error('Something went wrong')
  }
}

const deleteReview = async (id) => {
  try {
    const {rows, rowCount} = await conn.query(
      `DELETE FROM reviews WHERE id = $1 RETURNING *`,
      [id]
    )
    if (rowCount === 0) {
      throw new Error('Something went wrong')
    }
    return rows[0]
  } catch (error) {
    console.error('Error during deleteReview:', error)
    throw new Error('Something went wrong')
  }
}

module.exports = {
  viewReviews,
  addReview,
  deleteReview
}