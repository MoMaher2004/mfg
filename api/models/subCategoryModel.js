const conn = require('../config/db')

const viewSubCategory = async (sub_category_id = 0) => {
  try {
    const { rows } = await conn.query(
      `SELECT
      s.name AS sub_category_name,
      s.ar_name AS sub_category_ar_name,
      c.name AS category_name,
      c.ar_name AS category_ar_name
      FROM public.sub_categories s
      LEFT JOIN public.categories c ON c.id = s.category_id
      WHERE s.id = $1`,
      [sub_category_id]
    )
    return rows[0]
  } catch (error) {
    console.error('Error during viewSubCategory:', error)
    throw new Error('Something went wrong')
  }
}

const viewSubCategories = async (page = 1, limit = 10, category_id = 0) => {
  try {
    const offset = (page - 1) * limit
    if (category_id <= 0 || category_id == undefined) {
      category_id = 0
    }
    const { rows } = await conn.query(
      `SELECT id, name, ar_name, CASE 
      WHEN file_name IS NULL THEN NULL
      ELSE CONCAT('${process.env.PROTOCOL}://${process.env.URL}/media/subCategories/', file_name)
      END AS file_name
      FROM sub_categories WHERE ${category_id > 0 ? 'category_id = $1' : '0 = $1'} ORDER BY name LIMIT $2 OFFSET $3`,
      [category_id, limit, offset]
    )
    return rows
  } catch (error) {
    console.error('Error during viewSubCategories:', error)
    throw new Error('Something went wrong')
  }
}

const viewSubCategoriesFamily = async (rtl = false) => {
  try {
    const { rows } = await conn.query(
      `SELECT 
    c.id AS category_id,
    c.name AS category_name,
    c.ar_name AS category_ar_name,
    CASE 
      WHEN c.file_name IS NULL THEN NULL
      ELSE CONCAT('${process.env.PROTOCOL}://${process.env.URL}/media/categories/', c.file_name)
    END AS category_file_name,
    COALESCE(
      JSON_AGG(
        JSON_BUILD_OBJECT(
          'id', s.id,
          'name', s.name,
          'ar_name', s.ar_name,
          'file_name', 
            CASE 
              WHEN s.file_name IS NULL THEN NULL
              ELSE CONCAT('${process.env.PROTOCOL}://${process.env.URL}/media/subCategories/', s.file_name)
            END
        )
        ORDER BY s.${rtl ? 'ar_name' : 'name'}
      ) FILTER (WHERE s.id IS NOT NULL),
      '[]'::JSON
    ) AS sub_categories
  FROM categories c
  LEFT JOIN sub_categories s ON s.category_id = c.id
  GROUP BY c.id, c.name, c.ar_name, c.file_name
  ORDER BY c.${rtl ? 'ar_name' : 'name'}`,
      []
    )
    return rows
  } catch (error) {
    console.error('Error during viewSubCategoriesFamily:', error)
    throw new Error('Something went wrong')
  }
}

const addSubCategory = async (name, ar_name, category_id) => {
  try {
    const { rows, rowCount } = await conn.query(
      `INSERT INTO sub_categories (name, ar_name, category_id) VALUES ($1, $2, $3) RETURNING *`,
      [name, ar_name, category_id]
    )
    if (rowCount === 0) {
      throw new Error('Something went wrong')
    }
    return rows[0]
  } catch (error) {
    console.error('Error during addSubCategory:', error)
    throw new Error('Something went wrong')
  }
}

const editSubCategory = async (id, name, ar_name, category_id) => {
  try {
    const { rows, rowCount } = await conn.query(
      `UPDATE sub_categories SET name = $1, ar_name = $2, category_id = $3 WHERE id = $4 RETURNING *`,
      [name, ar_name, category_id, id]
    )
    if (rowCount === 0) {
      throw new Error('Something went wrong')
    }
    return rows[0]
  } catch (error) {
    console.error('Error during editSubCategory:', error)
    throw new Error('Something went wrong')
  }
}

const deleteSubCategory = async (id) => {
  try {
    const { rows, rowCount } = await conn.query(
      `DELETE FROM sub_categories WHERE id = $1 RETURNING *`,
      [id]
    )
    if (rowCount === 0) {
      throw new Error('Something went wrong')
    }
    return rows[0]
  } catch (error) {
    console.error('Error during deleteSubCategory:', error)
    throw new Error('Something went wrong')
  }
}

const updateMedia = async (id, file_name) => {
  try {
    const { rows: file } = await conn.query(
      `SELECT file_name FROM sub_categories WHERE id = $1`,
      [id]
    )
    const { rowCount } = await conn.query(
      `UPDATE sub_categories SET file_name = $1 WHERE id = $2`,
      [file_name, id]
    )
    if (rowCount === 0) {
      throw new Error('Something went wrong')
    }
    return {
      success: 'Subcategory is edited successfully',
      file_name: file[0].file_name,
    }
  } catch (error) {
    console.error('Error during updateMedia:', error)
    throw new Error('Something went wrong')
  }
}

module.exports = {
  viewSubCategory,
  viewSubCategories,
  addSubCategory,
  editSubCategory,
  deleteSubCategory,
  updateMedia,
  viewSubCategoriesFamily,
}
