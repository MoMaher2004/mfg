const conn = require('../config/db')

const viewCategories = async (page = 1, limit = 10) => {
  try {
    const offset = (page - 1) * limit
    const {rows} = await conn.query(
      `SELECT id, name, ar_name, 
      CASE 
      WHEN file_name IS NULL THEN NULL
      ELSE CONCAT('${process.env.PROTOCOL}://${process.env.URL}/media/categories/', file_name)
      END AS file_name FROM public.categories ORDER BY name LIMIT $1 OFFSET $2`,
      [limit, offset],
    )
    return rows
  } catch (error) {
    console.error('Error during viewCategories:', error)
    throw new Error('Something went wrong')
  }
}

const addCategory = async (name, ar_name) => {
  try {
    const {rows, rowCount} = await conn.query(
      `INSERT INTO public.categories (name, ar_name) VALUES ($1, $2) RETURNING *`,
      [name, ar_name],
    )
    if (rowCount === 0) {
      throw new Error('Something went wrong')
    }
    return rows[0]
  } catch (error) {
    console.error('Error during addCategory:', error)
    throw new Error('Something went wrong')
  }
}

const editCategory = async (id, name, ar_name) => {
  try {
    const {rows, rowCount} = await conn.query(
      `UPDATE public.categories SET name = $1, ar_name = $2 WHERE id = $3 RETURNING *`,
      [name, ar_name, id],
    )
    if (rowCount === 0) {
      throw new Error('Something went wrong')
    }
    return rows[0]
  } catch (error) {
    console.error('Error during editCategory:', error)
    throw new Error('Something went wrong')
  }
}

const deleteCategory = async (id) => {
  try {
    const {rows, rowCount} = await conn.query(`DELETE FROM public.categories WHERE id = $1 RETURNING *`, [id])
    if (rowCount === 0) {
      throw new Error('Something went wrong')
    }
    return rows[0]
  } catch (error) {
    console.error('Error during deleteCategory:', error)
    throw new Error('Something went wrong')
  }
}

const updateMedia = async (id, file_name) => {
  try {
    const {rows:file} = await conn.query(
      `SELECT file_name FROM public.categories WHERE id = $1`,
      [id],
    )
    const {rowCount} = await conn.query(
      `UPDATE public.categories SET file_name = $1 WHERE id = $2`,
      [file_name, id],
    )
    if (rowCount === 0) {
      throw new Error('Something went wrong')
    }
    return { success: 'Category is edited successfully', file_name: file[0].file_name }
  } catch (error) {
    console.error('Error during updateMedia:', error)
    throw new Error('Something went wrong')
  }
}

module.exports = {
  viewCategories,
  addCategory,
  editCategory,
  deleteCategory,
  updateMedia,
}
