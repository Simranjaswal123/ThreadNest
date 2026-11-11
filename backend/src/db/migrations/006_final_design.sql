-- Migration 006: changes needed by the final design.

-- Payments can also be 'pending' or 'refunded' (cancelling refunds a paid order).
ALTER TABLE payments DROP CONSTRAINT payments_status_check;
ALTER TABLE payments ADD CONSTRAINT payments_status_check
  CHECK (status IN ('pending', 'succeeded', 'failed', 'refunded'));

-- Categories get a unique, URL-friendly slug.
ALTER TABLE categories ADD COLUMN slug VARCHAR(100);
UPDATE categories SET slug = lower(replace(name, ' ', '-'));
ALTER TABLE categories ALTER COLUMN slug SET NOT NULL;
ALTER TABLE categories ADD CONSTRAINT categories_slug_key UNIQUE (slug);

-- Audit details are small JSON objects.
ALTER TABLE audit_log ALTER COLUMN details TYPE JSONB USING to_jsonb(details);

-- Indexes for the order lists, the admin order filters and the audit page.
CREATE INDEX idx_orders_user_created ON orders(user_id, created_at DESC);
CREATE INDEX idx_orders_status_created ON orders(status, created_at);
CREATE INDEX idx_audit_log_entity ON audit_log(entity_type, entity_id);
