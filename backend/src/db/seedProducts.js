// Inserts the demo products and their variants. Called by seed.js.
import { sizedCategories, sizes, colorCodes, specialStock, products, imageColors } from './seedData.js';

// A tall placeholder picture (4:5, like clothing photos) in the product's first colour.
function makeImageUrl(product) {
  const colours = imageColors[product.colors[0]] || imageColors.Grey;
  return 'https://placehold.co/600x750/' + colours.background + '/' + colours.text + '?text=' + encodeURIComponent(product.name);
}

// Sized categories get size x colour variants; the others get one variant per colour.
function makeVariants(product) {
  const list = [];
  const sizeList = sizedCategories.includes(product.category) ? sizes : [null];

  for (const color of product.colors) {
    for (const size of sizeList) {
      let sku = 'TN-' + product.code + '-' + colorCodes[color];
      if (size) {
        sku = sku + '-' + size;
      }
      list.push({ sku: sku, size: size, color: color });
    }
  }
  return list;
}

// categoryIds looks like { 'T-shirts': 1, Hoodies: 2 } so a product can find its category id.
export async function addProducts(client, categoryIds) {
  let variantCount = 0;

  for (const product of products) {
    const image = makeImageUrl(product);
    const result = await client.query(
      'INSERT INTO products (category_id, name, description, image_url, price_cents) VALUES ($1, $2, $3, $4, $5) RETURNING id',
      [categoryIds[product.category], product.name, 'Everyday basics from Threadnest.', image, product.price_cents]
    );
    const productId = result.rows[0].id;

    for (const variant of makeVariants(product)) {
      // A fixed number from 10 to 50, so every seed run gives the same data.
      let stock = 10 + ((variantCount * 7) % 41);
      if (specialStock[variant.sku] !== undefined) {
        stock = specialStock[variant.sku];
      }
      variantCount = variantCount + 1;

      await client.query(
        'INSERT INTO variants (product_id, sku, size, color, stock_qty) VALUES ($1, $2, $3, $4, $5)',
        [productId, variant.sku, variant.size, variant.color, stock]
      );
    }
  }
}
