const pool = require('../config/db')
const {
  uniformItems,
  attributesSearch,
  searchObject,
} = require('../utils/attributesUtils')

const makeOrder = async (
  name,
  government,
  city,
  address,
  phone,
  second_phone = null,
  notes = null,
  coupon = null,
  items
) => {
  ;`[{
        product_id: 4,
        attributes: {
            color: 'ffffff',
            size: 'l'
        }
      },
      {
        product_id: 2,
        attributes: {
            color: '123123',
            size: 's'
        }
      }
    ]`
  const conn = await pool.connect()
  try {
    await conn.query('BEGIN')
    let { rows: discount } = await conn.query(
      `SELECT discount FROM coupons WHERE name = $1 AND max_uses > current_uses AND deadline > CURRENT_TIMESTAMP`, [coupon]
    )
    if(discount.length == 0) return {error: 'Coupon is invalid or expired'}
    discount = discount[0].discount
    items = uniformItems(items)
    const product_ids = items.map((e) => e.product_id)
    const placeholders = product_ids.map((_, i) => `$${i + 1}`).join(',')
    const { rows: products } = await conn.query(
      `SELECT * FROM public.products WHERE id IN (${placeholders}) AND is_deleted = false`,
      product_ids
    )

    const { rows: delivery } = await conn.query(
      `SELECT value FROM public.settings WHERE name = 'delivery_cost'`
    )

    let lowAmounts = []
    let total_products_price = 0
    let total_deposite = 0
    let delivery_price = delivery[0].value.base
    let itemsToInsert = []
    for (let i = 0; i < items.length; i++) {
      let idx = attributesSearch(items[i], products, ['quantity'])
      if (idx == -1) {
        lowAmounts.push({
          product: items[i],
          itemAttribute: items[i].attributes,
          stock: 0,
          requiredQuantity: items[i].quantity,
        })
        continue
      }
      let itemProduct = products[idx]
      let priceAfterDiscount = itemProduct.price * (1 - itemProduct.discount)
      total_products_price += items[i].quantity * priceAfterDiscount //WARNING
      total_deposite += itemProduct.deposite
      delivery_price += delivery[0].value.increasement * itemProduct.weight
      itemsToInsert.push([
        itemProduct.id,
        items[i].quantity,
        priceAfterDiscount,
        items[i].attributes,
      ])

      if (items[i].quantity > products[idx].stock) {
        lowAmounts.push({
          product: products[idx],
          stock: products[idx].stock,
          itemAttribute: items[i].attributes,
          requiredQuantity: items[i].quantity,
        })
      }
    }
    if (lowAmounts.length > 0) {
      await conn.query('ROLLBACK')
      return { error: 'Insufficient amounts', lowAmounts }
    }
    // add order
    const { rows: addOrderRes } = await conn.query(
      `INSERT INTO public.orders
        (name,
        government, 
        city, 
        address, 
        phone, 
        second_phone, 
        notes, 
        total_products_price, 
        delivery_price, 
        coupon, 
        discount, 
        total_deposite
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING *`,
      [
        name,
        government,
        city,
        address,
        phone,
        second_phone,
        notes,
        total_products_price,
        delivery_price,
        coupon,
        discount,
        total_deposite,
      ]
    )
    await conn.query(`UPDATE coupons SET current_uses = current_uses + 1 WHERE name = $1 AND max_uses > current_uses AND deadline > CURRENT_TIMESTAMP`, [coupon])
    const order_id = addOrderRes[0].id
    // add items
    for (const i of itemsToInsert) {
      delete i[3].stock
    }
    itemsToInsert = itemsToInsert.map((e) => [
      order_id,
      e[0],
      e[1],
      e[2],
      JSON.stringify(e[3]),
    ])
    const { rows: insertedItems } = await conn.query(
      `INSERT INTO public.items (order_id, product_id, quantity, price_per_unit, attributes) VALUES ${itemsToInsert
        .map(
          (_, i) =>
            `($${i * 5 + 1}, $${i * 5 + 2}, $${i * 5 + 3}, $${i * 5 + 4}, $${i * 5 + 5})`
        )
        .join(', ')} RETURNING *`,
      [...itemsToInsert.flat()]
    )
    await conn.query('COMMIT')

    return {
      success: 'Order is added successfully',
      order: addOrderRes[0],
      items: insertedItems,
    }
  } catch (error) {
    console.error('Error during makeOrder:', error)
    await conn.query('ROLLBACK')
    throw new Error('Something went wrong')
  } finally {
    conn.release()
  }
}

const viewOrderAsAdmin = async (order_id) => {
  try {
    const [rows] = await pool.query(
      `SELECT 
  o.id AS order_id,
  o.name, 
  o.government, 
  o.city, 
  o.address, 
  o.phone, 
  o.second_phone, 
  o.status, 
  o.created_at, 
  o.updated_at, 
  o.notes, 
  o.coupon, 
  o.discount, 
  o.delivery_price, 
  o.total_products_price,
  o.total_deposite,
  JSON_ARRAYAGG(
    JSON_OBJECT(
      'product_id', p.id,
      'product_name', p.name,
      'quantity', i.quantity,
      'price_per_unit', i.price_per_unit,
      'attributes', i.attributes,
      'productMedia', (
          SELECT JSON_ARRAYAGG(im.file_name)
          FROM media im
          WHERE im.product_id = p.id
      )
    )
  ) AS products
FROM orders o
JOIN items i ON o.id = i.order_id
JOIN products p ON p.id = i.product_id
WHERE o.id = $1
GROUP BY o.id`,
      [order_id]
    )
    if (rows.length == 0) {
      return null
    }
    return rows[0]
  } catch (error) {
    console.error('Error during viewOrderAsAdmin:', error)
    throw new Error('Something went wrong')
  }
}

const viewOrdersListAsAdmin = async (
  page = 1,
  limit = 20,
  status = null,
  phone = null
) => {
  try {
    const offset = (page - 1) * limit
    let filter = 'WHERE true'
    if (status == 'processing') {
      filter += ` AND status = 'processing'`
    } else if (status == 'pending') {
      filter += ` AND status = 'pending'`
    } else if (status == 'shipped') {
      filter += ` AND status = 'shipped'`
    } else if (status == 'delivered') {
      filter += ` AND status = 'delivered'`
    } else if (status == 'cancelled') {
      filter += ` AND status = 'cancelled'`
    }

    let phoneValues = []

    if (phone != null) {
      filter += ` AND (phone = $1 OR second_phone = $2)`
      phoneValues.push(phone, phone)
    }

    const { rows } = await pool.query(
      `SELECT 
  o.id AS order_id,
  o.name, 
  o.government, 
  o.city, 
  o.address, 
  o.phone, 
  o.second_phone, 
  o.status, 
  o.created_at, 
  o.updated_at, 
  o.notes, 
  o.coupon, 
  o.discount, 
  o.delivery_price, 
  o.total_deposite, 
  o.total_products_price
FROM orders o
LEFT JOIN items i ON o.id = i.order_id
${filter}
GROUP BY o.id
ORDER BY CASE o.status
    WHEN 'pending' THEN 1
    WHEN 'processing' THEN 2
    WHEN 'shipped' THEN 3
    WHEN 'delivered' THEN 4
    WHEN 'cancelled' THEN 5
  END
${phoneValues.length == 0 ? 'LIMIT $1 OFFSET $2' : 'LIMIT $3 OFFSET $4'}`,
      [...phoneValues, limit, offset]
    )
    if (rows.length == 0) {
      return { data: [], length: 0 }
    }
    const { rows: length } = await pool.query(
      `SELECT COUNT(*) AS count FROM orders ${filter}`,
      [...phoneValues]
    )
    return { data: rows, length: length[0].count }
  } catch (error) {
    console.error('Error during viewOrdersListAsAdmin:', error)
    throw new Error('Something went wrong')
  }
}

const updateOrderStatus = async (order_id) => {
  try {
    const [res] = await pool.query(
      `UPDATE orders
SET status = CASE status
    WHEN 'Processing' THEN 'Shipped'
    WHEN 'Shipped' THEN 'Delivered'
    ELSE status
END
WHERE id = $1`,
      [order_id]
    )
    if (res.affectedRows === 0) {
      throw new Error('Something went wrong')
    }
    return { success: 'order status is updated successfully' }
  } catch (error) {
    console.error('Error during updateOrderStatus:', error)
    throw new Error('Something went wrong')
  }
}

const confirmOrder = async (order_id) => {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    const { rows: orderRows } = await client.query(
      `SELECT * FROM orders WHERE id = $1 AND status = 'pending' FOR UPDATE`,
      [order_id]
    )

    if (orderRows.length === 0) {
      await client.query('ROLLBACK')
      return { error: 'Order not found or not pending' }
    }

    await client.query(
      `SELECT p.id FROM products p 
       JOIN items i ON p.id = i.product_id 
       WHERE i.order_id = $1 FOR UPDATE`,
      [order_id]
    )

    const { rows: items } = await client.query(
      `SELECT 
          i.product_id, 
          i.price_per_unit,
          p.name AS product_name,
          p.attributes AS product_attributes,
          JSON_AGG(
              JSON_BUILD_OBJECT(
                  'attributes', i.attributes,
                  'quantity', i.quantity
                  -- Removed 'item_id' since items table doesn't have id column
              )
          ) AS items
       FROM orders o
       JOIN items i ON o.id = i.order_id
       JOIN products p ON p.id = i.product_id
       WHERE o.id = $1 
         AND o.status = 'pending'
         AND p.is_deleted = false
       GROUP BY i.product_id, i.price_per_unit, p.name, p.attributes`,
      [order_id]
    )

    let lowAmounts = []
    const productsToUpdate = new Map()

    for (let i = 0; i < items.length; i++) {
      for (let j = 0; j < items[i].items.length; j++) {
        const item = items[i].items[j]
        const product = items[i]

        const idx = searchObject(item.attributes, product.product_attributes)

        if (
          idx === -1 ||
          product.product_attributes[idx].stock < item.quantity
        ) {
          lowAmounts.push({
            product_id: product.product_id,
            product_name: product.product_name,
            stock: idx > -1 ? product.product_attributes[idx].stock : 0,
            requiredQuantity: item.quantity,
          })
        } else {
          product.product_attributes[idx].stock -= item.quantity
          productsToUpdate.set(product.product_id, product)
        }
      }
    }

    if (lowAmounts.length > 0) {
      await client.query('ROLLBACK')
      return { error: 'Insufficient amounts', lowAmounts }
    }

    for (const [productId, product] of productsToUpdate) {
      await client.query(
        `UPDATE products 
         SET attributes = $1, sold_times = sold_times + 1 
         WHERE id = $2`,
        [JSON.stringify(product.product_attributes), productId]
      )
    }

    const { rowCount } = await client.query(
      `UPDATE orders 
       SET status = 'processing', updated_at = CURRENT_TIMESTAMP 
       WHERE id = $1 AND status = 'pending'`,
      [order_id]
    )

    if (rowCount === 0) {
      throw new Error('Order status update failed')
    }

    await client.query('COMMIT')
    return { success: 'Order confirmed and is being processed' }
  } catch (error) {
    console.error('Error during confirmOrder:', error)
    await client.query('ROLLBACK')
    throw new Error('Something went wrong')
  } finally {
    client.release()
  }
}

const cancelOrder = async (order_id) => {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    const { rows: orderRows } = await client.query(
      `SELECT * FROM orders WHERE id = $1 AND status != 'cancelled' FOR UPDATE`,
      [order_id]
    )

    if (orderRows.length === 0) {
      await client.query('ROLLBACK')
      return { error: 'Order not found or already cancelled' }
    }

    const order = orderRows[0]

    if (order.status === 'processing' || order.status === 'shipped') {
      const { rows: items } = await client.query(
        `SELECT 
            i.product_id,
            i.quantity,
            i.attributes as item_attributes,
            p.attributes as product_attributes
         FROM items i
         JOIN products p ON p.id = i.product_id
         WHERE i.order_id = $1
         FOR UPDATE OF p`,
        [order_id]
      )

      for (const item of items) {
        const idx = searchObject(item.item_attributes, item.product_attributes)

        if (idx !== -1) {
          item.product_attributes[idx].stock += item.quantity

          await client.query(
            `UPDATE products SET attributes = $1 WHERE id = $2`,
            [JSON.stringify(item.product_attributes), item.product_id]
          )
        }
      }
    }

    const { rowCount } = await client.query(
      `UPDATE orders 
       SET status = 'cancelled', updated_at = CURRENT_TIMESTAMP 
       WHERE id = $1`,
      [order_id]
    )

    if (rowCount === 0) {
      throw new Error('Order cancellation failed')
    }

    await client.query('COMMIT')
    return { success: 'Order cancelled successfully' }
  } catch (error) {
    console.error('Error during cancelOrder:', error)
    await client.query('ROLLBACK')
    throw new Error('Something went wrong')
  } finally {
    client.release()
  }
}

module.exports = {
  makeOrder,
  viewOrderAsAdmin,
  updateOrderStatus,
  confirmOrder,
  cancelOrder,
  viewOrdersListAsAdmin,
}
