const conn = require('../config/db')

const viewCustomOrders = async (page = 1, limit = 20) => {
  try {
    const offset = (page - 1) * limit
    const {rows} = await conn.query(`SELECT * FROM custom_orders LIMIT $1 OFFSET $2`, [limit, offset])
    return rows
  } catch (error) {
    console.error('Error during viewCustomOrders:', error)
    throw new Error('Something went wrong')
  }
}

const addCustomOrder = async (name, phone, message) => {
  try {
    const {rowCount} = await conn.query(
      `INSERT INTO custom_orders (name, phone, message) VALUES ($1, $2, $3)`,
      [name, phone, message],
    )
    if (rowCount === 0) {
      throw new Error('Something went wrong')
    }
    return { success: 'Custom order is sent successfully' }
  } catch (error) {
    console.error('Error during addCustomOrders:', error)
    throw new Error('Something went wrong')
  }
}

const deleteCustomOrder = async (id) => {
  try {
    const {rowCount} = await conn.query(`DELETE FROM custom_orders WHERE id = $1`, [id])
    if (rowCount === 0) {
      throw new Error('Something went wrong')
    }
    return true
  } catch (error) {
    console.error('Error during deleteCustomOrders:', error)
    throw new Error('Something went wrong')
  }
}

module.exports = {
  viewCustomOrders,
  addCustomOrder,
  deleteCustomOrder,
}
