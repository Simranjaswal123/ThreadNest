-- Migration 005: the stock ledger and the audit log.

-- Every change to stock is written here, so stock_qty can be explained later.
CREATE TABLE inventory_movements (
  id         SERIAL PRIMARY KEY,
  variant_id INTEGER NOT NULL REFERENCES variants(id),
  -- Negative when stock leaves (a sale), positive when it comes back.
  change_qty INTEGER NOT NULL CHECK (change_qty <> 0),
  reason     VARCHAR(30) NOT NULL
             CHECK (reason IN ('order_placed', 'order_cancelled', 'admin_adjustment')),
  -- Filled for orders, empty for manual admin changes.
  order_id   INTEGER REFERENCES orders(id),
  created_by INTEGER NOT NULL REFERENCES users(id),
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- A record of who did what. Rows are added in the same transaction as the action.
CREATE TABLE audit_log (
  id          SERIAL PRIMARY KEY,
  user_id     INTEGER NOT NULL REFERENCES users(id),
  -- For example 'order.placed' or 'product.deactivated'.
  action      VARCHAR(50) NOT NULL,
  entity_type VARCHAR(50) NOT NULL,
  entity_id   INTEGER NOT NULL,
  -- Extra information written as plain text.
  details     TEXT,
  created_at  TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_inventory_movements_variant_id ON inventory_movements(variant_id);
-- The admin audit page shows the newest rows first.
CREATE INDEX idx_audit_log_created_at ON audit_log(created_at);
