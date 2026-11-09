-- Migration 001: users and their saved addresses.

CREATE TABLE users (
  id            SERIAL PRIMARY KEY,
  -- UNIQUE: two accounts cannot use the same email.
  email         VARCHAR(255) NOT NULL UNIQUE,
  -- We store only the hash, never the real password.
  password_hash VARCHAR(255) NOT NULL,
  full_name     VARCHAR(100) NOT NULL,
  -- CHECK: the database rejects any role other than these two.
  role          VARCHAR(20) NOT NULL DEFAULT 'customer'
                CHECK (role IN ('customer', 'admin')),
  created_at    TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE addresses (
  id          SERIAL PRIMARY KEY,
  -- If a user is deleted, their addresses are deleted too.
  user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  full_name   VARCHAR(100) NOT NULL,
  line1       VARCHAR(200) NOT NULL,
  line2       VARCHAR(200),
  city        VARCHAR(100) NOT NULL,
  postal_code VARCHAR(20) NOT NULL,
  country     VARCHAR(100) NOT NULL,
  phone       VARCHAR(30),
  created_at  TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Makes "find all addresses of one user" fast.
CREATE INDEX idx_addresses_user_id ON addresses(user_id);
