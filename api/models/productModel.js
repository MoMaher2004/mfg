const conn = require('../config/db')

const getProductById = async (id) => {
  try {
    const { rows } = await conn.query(
      `SELECT 
    p.id, 
    p.name, 
    p.ar_name, 
    p.brand, 
    p.ar_brand,
    p.warranty, 
    p.ar_warranty, 
    p.description, 
    p.ar_description, 
    p.price, 
    p.discount, 
    p.sub_category_id, 
    p.attributes, 
    p.created_at, 
    s.id AS sub_category_id, 
    s.name AS sub_category_name, 
    s.ar_name AS sub_category_ar_name, 
    CASE 
      WHEN s.file_name IS NOT NULL 
      THEN CONCAT('${process.env.PROTOCOL}://${process.env.URL}/media/subCategories/' ,s.file_name)
      ELSE NULL
    END AS sub_category_file_name,
    c.id AS category_id, 
    c.name AS category_name, 
    c.ar_name AS category_ar_name, 
    CASE 
      WHEN s.file_name IS NOT NULL 
      THEN CONCAT('${process.env.PROTOCOL}://${process.env.URL}/media/categories/' ,c.file_name)
      ELSE NULL
    END AS category_file_name,
    COALESCE(
        ARRAY_AGG(
            CONCAT('${process.env.PROTOCOL}://${process.env.URL}/media/products/', i.file_name)
        ) FILTER (WHERE i.file_name IS NOT NULL),
        '{}'::TEXT[]
    ) AS media
FROM public.products p
LEFT JOIN public.product_media i ON p.id = i.product_id
LEFT JOIN public.sub_categories s ON s.id = p.sub_category_id
LEFT JOIN public.categories c ON c.id = s.category_id
WHERE is_deleted = false AND p.id = $1
GROUP BY 
    p.id,
    s.id,
    c.id
      `,
      [id],
    )
    if (rows.length === 0) {
      return null
    }
    return rows[0]
  } catch (error) {
    console.error('Error during getProductById:', error)
    throw new Error('Something went wrong')
  }
}

const getProductsList = async (
  isUser = false,
  page = 1,
  limit = 20,
  maxPrice,
  minPrice,
  subCategories,
  categories,
  orderBy = null,
  search
) => {
  try {
    const offset = (page - 1) * limit
    let orderByStmt
    if (orderBy == 'newAdded') {
      orderByStmt = ' ORDER BY p.id DESC'
    } else if (orderBy == 'mostBought') {
      orderByStmt = ' ORDER BY p.sold_times DESC'
    } else if (orderBy == 'highPrice') {
      orderByStmt = ' ORDER BY p.price DESC'
    } else if (orderBy == 'lowPrice') {
      orderByStmt = ' ORDER BY p.price'
    } else {
      orderByStmt = ' ORDER BY p.id'
    }

    const rowsParams = []

    let filter = ''
    let p = 1
    if (maxPrice) {
      filter += ` AND p.price <= $${p}`
      rowsParams.push(maxPrice)
      p++
    }

    if (minPrice) {
      filter += ` AND p.price >= $${p}`
      rowsParams.push(minPrice)
      p++
    }

    if (subCategories[0] !== '') {
      const placeholders = subCategories.map(() => `$${p++}`).join(',')
      filter += ` AND p.sub_category_id IN (${placeholders})`
      rowsParams.push(...subCategories)
    }

    if (categories[0] !== '') {
      const placeholders = categories.map(() => `$${p++}`).join(',')
      filter += ` AND s.category_id IN (${placeholders})`
      rowsParams.push(...categories)
    }

    if (search[0] !== '') {
      filter += search.map(() => ` AND p.search_text REGEXP $${p++}`).join('')
      rowsParams.push(...search)
    }

    const { rows } = await conn.query(
      `SELECT 
    p.id, 
    p.name, 
    p.ar_name, 
    p.brand, 
    p.ar_brand,
    p.description, 
    p.ar_description, 
    p.price, 
    p.discount, 
    p.sub_category_id, 
    p.attributes, 
    p.created_at, 
    s.id AS sub_category_id, 
    s.name AS sub_category_name, 
    s.ar_name AS sub_category_ar_name, 
    CASE 
      WHEN s.file_name IS NOT NULL 
      THEN CONCAT('${process.env.PROTOCOL}://${process.env.URL}/media/subCategories/' ,s.file_name)
      ELSE NULL
    END AS sub_category_file_name,
    c.id AS category_id, 
    c.name AS category_name, 
    c.ar_name AS category_ar_name, 
    CASE 
      WHEN s.file_name IS NOT NULL 
      THEN CONCAT('${process.env.PROTOCOL}://${process.env.URL}/media/categories/' ,c.file_name)
      ELSE NULL
    END AS category_file_name,
    COALESCE(
        ARRAY_AGG(
            CONCAT('${process.env.PROTOCOL}://${process.env.URL}/media/products/', i.file_name)
        ) FILTER (WHERE i.file_name IS NOT NULL),
        '{}'::TEXT[]
    ) AS media
    ${isUser ? ', p.sold_times AS sold_items' : ''}
FROM public.products p
LEFT JOIN public.product_media i ON p.id = i.product_id
LEFT JOIN public.sub_categories s ON p.sub_category_id = s.id
LEFT JOIN public.categories c ON s.category_id = c.id
WHERE is_deleted = false ${filter}
GROUP BY 
    p.id,
    p.name, 
    p.ar_name, 
    p.brand, 
    p.ar_brand,
    p.description, 
    p.ar_description, 
    p.price, 
    p.discount, 
    p.sub_category_id, 
    p.attributes, 
    p.created_at,
    s.id,
    s.name,
    s.ar_name,
    s.file_name,
    c.id,
    c.name,
    c.ar_name,
    c.file_name
    ${orderByStmt}
       LIMIT $1 OFFSET $2`,
      [...rowsParams, limit, offset],
    )
//     const { rows: metaData } = await conn.query(
//       `SELECT 
//     MIN(price) AS minPrice,
//     MAX(price) AS maxPrice,
//     JSON_AGG(DISTINCT sub_category_id) AS category_ids,
//     (
//         SELECT STRING_AGG(DISTINCT s.name, ',')
//         FROM public.sub_categories s
//         WHERE s.id IN (SELECT DISTINCT sub_category_id FROM public.products WHERE is_deleted = false)
//     ) AS category_names
// FROM public.products
// WHERE is_deleted = false`,
//       [],
//     )

    const { rows: count } = await conn.query(
      `SELECT COUNT(*) AS length
       FROM public.products
       WHERE is_deleted = false ${filter}`,
      [...rowsParams],
    )

    return {
      rows,
      count: count[0].length,
      // filters: {
      //   maxPrice: metaData[0].maxPrice,
      //   minPrice: metaData[0].minPrice,
      //   brands: metaData[0].brands,
      //   categories: metaData[0].categories,
      // },
    }
  } catch (error) {
    console.error('Error during getProductsList:', error)
    throw new Error('Something went wrong')
  }
}

const addProduct = async (
  name,
  ar_name,
  brand,
  ar_brand,
  warranty,
  ar_warranty,
  description,
  ar_description,
  price,
  discount,
  sub_category_id,
  deposite,
  weight,
  attributes,
  search_text
) => {
  try {
    const { rows, rowCount } = await conn.query(
      `INSERT INTO public.products 
      (name,
        ar_name,
        brand,
        ar_brand,
        warranty,
        ar_warranty,
        description,
        ar_description,
        price,
        discount,
        sub_category_id,
        deposite,
        weight,
        is_deleted,
        attributes,
        search_text)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, false, $14, $15) RETURNING *`,
      [
        name,
        ar_name,
        brand,
        ar_brand,
        warranty,
        ar_warranty,
        description,
        ar_description,
        price,
        discount,
        sub_category_id,
        deposite,
        weight,
        JSON.stringify(attributes),
        search_text
      ],
    )
    if (rowCount === 0) {
      throw new Error('Something went wrong')
    }
    rows[0].is_deleted = undefined
    return rows[0]
  } catch (error) {
    console.error('Error during addProduct:', error)
    throw new Error('Something went wrong')
  }
}

const editProduct = async (
  id,
  name,
  ar_name,
  brand,
  ar_brand,
  warranty,
  ar_warranty,
  description,
  ar_description,
  price,
  discount,
  sub_category_id,
  deposite,
  weight,
  attributes,
  search_text
) => {
  try {
    const { rows, rowCount } = await conn.query(
      `UPDATE public.products SET
        name = $1,
        ar_name = $2,
        brand = $3,
        ar_brand = $4,
        warranty = $5,
        ar_warranty = $6,
        description = $7,
        ar_description = $8,
        price = $9,
        discount = $10,
        sub_category_id = $11,
        deposite = $12,
        weight = $13,
        attributes = $14,
        search_text = $15
        WHERE id = $16 AND is_deleted = false RETURNING *`,
      [
        name,
        ar_name,
        brand,
        ar_brand,
        warranty,
        ar_warranty,
        description,
        ar_description,
        price,
        discount,
        sub_category_id,
        deposite,
        weight,
        JSON.stringify(attributes),
        search_text,
        id,
      ],
    )
    if (rowCount === 0) {
      throw new Error('Something went wrong')
    }
    rows[0].is_deleted = undefined
    return rows[0]
  } catch (error) {
    console.error('Error during editProduct:', error)
    throw new Error('Something went wrong')
  }
}

const deleteProduct = async (id) => {
  const transactionConn = await conn.getConnection()
  try {
    await transactionConn.beginTransaction()
    const { rows, rowCount } = await transactionConn.query(
      `UPDATE public.products SET is_deleted = 1 WHERE id = $1 AND is_deleted = false RETURNING *`,
      [id],
    )
    if (rowCount === 0) {
      throw new Error('Something went wrong')
    }
    await transactionConn.commit()
    return rows[0]
  } catch (error) {
    console.error('Error during deleteProduct:', error)
    await transactionConn.rollback()
    throw new Error('Something went wrong')
  }
}

const uploadMedia = async (getProductById, fileName) => {
  try {
    const { rows, rowCount } = await conn.query(
      `INSERT INTO public.product_media (product_id, file_name) VALUES ($1, $2) RETURNING *`,
      [getProductById, fileName],
    )
    if (rowCount === 0) {
      throw new Error('Something went wrong')
    }
    return rows[0]
  } catch (error) {
    console.error('Error during uploadMedia:', error)
    throw new Error('Something went wrong')
  }
}

const deleteMedia = async (fileName) => {
  try {
    const { rows, rowCount } = await conn.query(`DELETE FROM public.product_media WHERE file_name = $1 RETURNING *`, [
      fileName,
    ])
    if (rowCount === 0) {
      throw new Error('Something went wrong')
    }
    return rows[0]
  } catch (error) {
    console.error('Error during deleteMedia:', error)
    throw new Error('Something went wrong')
  }
}

module.exports = {
  getProductById,
  getProductsList,
  addProduct,
  editProduct,
  deleteProduct,
  uploadMedia,
  deleteMedia,
}
