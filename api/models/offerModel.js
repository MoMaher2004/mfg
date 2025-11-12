const conn = require('../config/db')

const viewOffers = async () => {
  try {
    const {rows} = await conn.query(
      `SELECT * FROM offers ORDER BY id DESC`,
      []
    )
    return rows
  } catch (error) {
    console.error('Error during viewOffers:', error)
    throw new Error('Something went wrong')
  }
}

const addOffer = async (fileName, url) => {
  try {
    const {rows, rowCount} = await conn.query(
      `INSERT INTO offers (file_name, url) VALUES ($1, $2) RETURNING *`,
      [fileName, url]
    )
    if (rowCount === 0) {
      throw new Error('Something went wrong')
    }
    return rows[0]
  } catch (error) {
    console.error('Error during addOffer:', error)
    throw new Error('Something went wrong')
  }
}

const deleteOffer = async (id) => {
  try {
    const {rows, rowCount} = await conn.query(
      `DELETE FROM offers WHERE id = $1 RETURNING *`,
      [id]
    )
    if (rowCount === 0) {
      throw new Error('Something went wrong')
    }
    return rows[0]
  } catch (error) {
    console.error('Error during deleteOffer:', error)
    throw new Error('Something went wrong')
  }
}

module.exports = {
  viewOffers,
  addOffer,
  deleteOffer
}