function uniformItems(items) {
  ;`INPUT =
        [
      {
        product_id: 4,
        attributes: { color: 'ffffff', size: 'l' }
      },
      {
        product_id: 2,
        attributes: { color: '123123', size: 's' }
      },
      {
        product_id: 4,
        attributes: { size: 'l', color: 'ffffff' } // same specs, different key order
      }
    ]

    OUTPUT =
    [
        { product_id: 4, attributes: { color: 'ffffff', size: 'l' }, quantity: 2 },
        { product_id: 2, attributes: { color: '123123', size: 's' }, quantity: 1 }
    ]
    `
  items = items.map((item) => {
    return {
      product_id: item.product_id,
      attributes: item.attributes,
      quantity: 1,
    }
  })
  for (let i = 0; i < items.length - 1; i++) {
    secloop: for (let j = i + 1; j < items.length; j++) {
      if (items[i].product_id == items[j].product_id) {
        for (const key in items[i].attributes) {
          if (items[i].attributes[key] !== items[j].attributes[key])
            continue secloop
        }
        items[i].quantity += 1
        items.splice(j, 1)
        j--
      }
    }
  }
  return items
}

function attributesSearch(
  objToSearch,
  arrayOfObjects,
  arrayOfFieldsToIgnore = [],
) {
  for (const [i, product] of arrayOfObjects.entries()) {
    if (objToSearch.product_id != product.id) continue
    specLoop: for (const spec of product.attributes) {
      for (const key in objToSearch.attributes) {
        if (arrayOfFieldsToIgnore.includes(key)) continue
        if (objToSearch.attributes[key] != spec[key]) continue specLoop
      }
      return i
    }
  }
  return -1
}

function searchObject(objToSearch, arrayOfObjects, arrayOfFieldsToIgnore = []) {
  specLoop: for (const [i, product] of arrayOfObjects.entries()) {
    for (const key in objToSearch) {
      if (arrayOfFieldsToIgnore.includes(key)) continue
      if (objToSearch[key] != product[key]) {
        continue specLoop
      }
    }
    return i
  }
  return -1
}

module.exports = {
  uniformItems,
  attributesSearch,
  searchObject,
}
