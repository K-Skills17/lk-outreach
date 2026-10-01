-- ============================================================
-- 16_painel_login_codes.sql
-- One-time WhatsApp codes for the client dashboard (/painel) login.
-- Codes are stored hashed; each code allows 5 attempts and expires in 10 min.
-- Idempotent — safe to run more than once.
-- ============================================================

CREATE TABLE IF NOT EXISTS painel_login_codes (
    id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id   uuid        NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    code_hash   text        NOT NULL,
    attempts    integer     NOT NULL DEFAULT 0,
    expires_at  timestamptz NOT NULL,
    used_at     timestamptz,
    created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS painel_login_codes_tenant_idx
    ON painel_login_codes (tenant_id, created_at DESC);

-- Housekeeping: rows older than a day are useless; delete them whenever convenient:
--   DELETE FROM painel_login_codes WHERE created_at < now() - interval '1 day';
