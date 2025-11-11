const conn = require('../config/db')

const viewCoupon = async (name) => {
  try {
    const {rows} = await conn.query(
      `SELECT discount FROM coupons WHERE name = $1 AND max_uses > current_uses AND deadline > CURRENT_TIMESTAMP`, [name]
    )
    return rows[0]
  } catch (error) {
    console.error('Error during viewCoupons:', error)
    throw new Error('Something went wrong')
  }
}

const viewCoupons = async (page = 1, limit = 10, orderBy = 'dateReverse') => {
  try {
    if(orderBy == 'name'){
        orderBy = 'name'
    }else if(orderBy == 'nameReverse'){
        orderBy = 'name DESC'
    }else if(orderBy == 'date'){
        orderBy = 'created_at'
    }else{
        orderBy = 'created_at DESC'
    }

    const offset = (page - 1) * limit
    const {rows} = await conn.query(
      `SELECT * FROM public.coupons ORDER BY ${orderBy} LIMIT $1 OFFSET $2`,
      [limit, offset],
    )
    return rows
  } catch (error) {
    console.error('Error during viewCoupons:', error)
    throw new Error('Something went wrong')
  }
}

const addCoupon = async (name, discount, max_uses, deadline) => {
  try {
    const {rows, rowCount} = await conn.query(
      `INSERT INTO public.coupons (name, discount, max_uses, deadline, created_at) VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [name, discount, max_uses, deadline, new Date().toISOString()],
    )
    if (rowCount === 0) {
      throw new Error('Something went wrong')
    }
    return rows[0]
  } catch (error) {
    console.error('Error during addCoupon:', error)
    throw new Error('Something went wrong')
  }
}

const editCoupon = async (name, discount, max_uses, deadline) => {
  try {
    const {rows, rowCount} = await conn.query(
      `UPDATE public.coupons SET discount = $2, max_uses = $3, deadline = $4 WHERE name = $1 RETURNING *`,
      [name, discount, max_uses, deadline],
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
  viewCoupon,
  viewCoupons,
  addCoupon,
  editCoupon,
}
