const conn = require('../config/db')

const getPayments = async () => {
  try {
    const {rows} = await conn.query(
      `SELECT value FROM settings WHERE name = 'payments'`
    )
    return rows[0].value
  } catch (error) {
    console.error('Error during viewCoupons:', error)
    throw new Error('Something went wrong')
  }
}

const setPayments = async (payments) => {
  try {
    console.log(payments)
    const {rows, rowCount} = await conn.query(
      `UPDATE settings SET value = $1::JSONB WHERE name = 'payments' RETURNING *`,
      [JSON.stringify(payments)],
    )
    if (rowCount === 0) {
      throw new Error('Something went wrong')
    }
    return rows[0]
  } catch (error) {
    console.error('Error during editCoupon:', error)
    throw new Error('Something went wrong')
  }
}

const getDelivery = async () => {
  try {
    const {rows} = await conn.query(
      `SELECT value FROM settings WHERE name = 'delivery_cost'`
    )
    return rows[0].value
  } catch (error) {
    console.error('Error during viewCoupons:', error)
    throw new Error('Something went wrong')
  }
}

const setDelivery = async (base, increasement) => {
  try {
    const value = {base, increasement}
    const {rows, rowCount} = await conn.query(
      `UPDATE settings SET value = $1 WHERE name = 'delivery_cost' RETURNING *`,
      [JSON.stringify(value)],
    )
    if (rowCount === 0) {
      throw new Error('Something went wrong')
    }
    return rows[0]
  } catch (error) {
    console.error('Error during editCoupon:', error)
    throw new Error('Something went wrong')
  }
}

module.exports = {
  getPayments,
  setPayments,
  getDelivery,
  setDelivery,
}