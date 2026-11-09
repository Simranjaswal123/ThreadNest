-- Migration 003: the shopping cart.
-- Each user has one cart, so we store its lines directly with the user id.

CREATE TABLE cart_items (
  id         SERIAL PRIMARY KEY,
  -- If the user is deleted, their cart lines are deleted too.
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  variant_id INTEGER NOT NULL REFERENCES variants(id),
  -- A cart line must have at least 1 item.
  quantity   INTEGER NOT NULL CHECK (quantity > 0),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  -- The same variant can appear only once per user. Adding it again
  -- should increase the quantity instead of making a second row.
  UNIQUE (user_id, variant_id)
);

-- The UNIQUE constraint above already speeds up "all lines of one user".
