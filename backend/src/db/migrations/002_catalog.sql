-- Migration 002: the catalogue (categories, products, variants).

CREATE TABLE categories (
  id   SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE
);

CREATE TABLE products (
  id          SERIAL PRIMARY KEY,
  category_id INTEGER NOT NULL REFERENCES categories(id),
  name        VARCHAR(200) NOT NULL,
  description TEXT,
  image_url   VARCHAR(500),
  -- Money is stored as whole cents (1999 = 19.99), never as decimals.
  price_cents INTEGER NOT NULL CHECK (price_cents >= 0),
  -- Admins deactivate a product instead of deleting it, so old orders stay valid.
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMP NOT NULL DEFAULT NOW()
);

-- A variant is the thing a customer really buys: one size and colour of a product.
CREATE TABLE variants (
  id         SERIAL PRIMARY KEY,
  product_id INTEGER NOT NULL REFERENCES products(id),
  sku        VARCHAR(50) NOT NULL UNIQUE,
  size       VARCHAR(20),
  color      VARCHAR(30),
  -- Stock can never go below zero. This is rule 1 of the five rules.
  stock_qty  INTEGER NOT NULL DEFAULT 0 CHECK (stock_qty >= 0),
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- These make "products of one category" and "variants of one product" fast.
CREATE INDEX idx_products_category_id ON products(category_id);
CREATE INDEX idx_variants_product_id ON variants(product_id);
