-- Migration 004: orders, their lines, payments and status history.

CREATE TABLE orders (
  id               SERIAL PRIMARY KEY,
  user_id          INTEGER NOT NULL REFERENCES users(id),
  -- The address is copied as text, so editing the address book later changes nothing.
  shipping_address TEXT NOT NULL,
  -- Only these statuses exist. The state machine decides which moves are legal.
  status           VARCHAR(20) NOT NULL DEFAULT 'placed'
                   CHECK (status IN ('placed', 'paid', 'packed', 'shipped', 'delivered', 'cancelled')),
  subtotal_cents   INTEGER NOT NULL CHECK (subtotal_cents >= 0),
  shipping_cents   INTEGER NOT NULL CHECK (shipping_cents >= 0),
  tax_cents        INTEGER NOT NULL CHECK (tax_cents >= 0),
  total_cents      INTEGER NOT NULL CHECK (total_cents >= 0),
  -- Rule 2: the same key from the same user can create only one order.
  idempotency_key  VARCHAR(100) NOT NULL,
  created_at       TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, idempotency_key)
);

CREATE TABLE order_items (
  id               SERIAL PRIMARY KEY,
  order_id         INTEGER NOT NULL REFERENCES orders(id),
  variant_id       INTEGER NOT NULL REFERENCES variants(id),
  -- Name, SKU and price are copied, so later catalogue changes do not alter old orders.
  product_name     VARCHAR(200) NOT NULL,
  sku              VARCHAR(50) NOT NULL,
  unit_price_cents INTEGER NOT NULL CHECK (unit_price_cents >= 0),
  quantity         INTEGER NOT NULL CHECK (quantity > 0)
);

CREATE TABLE payments (
  id           SERIAL PRIMARY KEY,
  order_id     INTEGER NOT NULL REFERENCES orders(id),
  amount_cents INTEGER NOT NULL CHECK (amount_cents >= 0),
  -- A declined card is saved as 'failed' and the order stays 'placed'.
  status       VARCHAR(20) NOT NULL CHECK (status IN ('succeeded', 'failed')),
  created_at   TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE order_status_history (
  id          SERIAL PRIMARY KEY,
  order_id    INTEGER NOT NULL REFERENCES orders(id),
  -- from_status is empty on the first row, when the order is created.
  from_status VARCHAR(20),
  to_status   VARCHAR(20) NOT NULL,
  -- Who made the change: the customer or an admin.
  changed_by  INTEGER NOT NULL REFERENCES users(id),
  created_at  TIMESTAMP NOT NULL DEFAULT NOW()
);

-- UNIQUE (user_id, idempotency_key) already makes "orders of one user" fast.
CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_payments_order_id ON payments(order_id);
CREATE INDEX idx_status_history_order_id ON order_status_history(order_id);
