-- Migration 007: one-time tokens for "forgot password".

-- Only a SHA-256 hash of each token is stored. Someone who reads this table still
-- cannot build a working reset link from it.
CREATE TABLE password_reset_tokens (
  id         SERIAL PRIMARY KEY,
  -- If the user is deleted, their reset tokens are deleted too.
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash VARCHAR(64) NOT NULL UNIQUE,
  expires_at TIMESTAMP NOT NULL,
  -- Filled in when the link is used (or replaced by a newer link), so it works only once.
  used_at    TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_password_reset_tokens_user_id ON password_reset_tokens(user_id);
