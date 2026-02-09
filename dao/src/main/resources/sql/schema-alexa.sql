-- Alexa Smart Home Integration Schema Migration
-- Copyright © 2024 PachiraMining

-- Alexa capabilities are stored in device.additional_info as JSON:
-- {
--   "alexaCapabilities": {
--     "enabled": true,
--     "category": "SWITCH",
--     "powerState": false,
--     "brightness": 100
--   }
-- }

-- Index for Alexa-enabled devices (using GIN index for JSONB queries)
-- This allows efficient queries for devices with Alexa capabilities enabled
CREATE INDEX IF NOT EXISTS idx_device_alexa_enabled ON device
USING gin ((additional_info))
WHERE additional_info IS NOT NULL
  AND additional_info::jsonb ? 'alexaCapabilities'
  AND (additional_info::jsonb->'alexaCapabilities'->>'enabled')::boolean = true;

-- ============================================
-- Alexa OAuth2 Authorization Tables
-- Supports OAuth2 Authorization Code Flow for Alexa Smart Home
-- ============================================

-- Table for storing OAuth2 access and refresh tokens
CREATE TABLE IF NOT EXISTS alexa_oauth2_tokens (
    id UUID NOT NULL CONSTRAINT alexa_oauth2_tokens_pkey PRIMARY KEY,
    tenant_id UUID NOT NULL,
    user_id UUID NOT NULL,
    alexa_user_id VARCHAR(255) NOT NULL,
    access_token TEXT NOT NULL,
    refresh_token TEXT,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_alexa_oauth_tenant FOREIGN KEY (tenant_id) REFERENCES tenant(id) ON DELETE CASCADE,
    CONSTRAINT fk_alexa_oauth_user FOREIGN KEY (user_id) REFERENCES tb_user(id) ON DELETE CASCADE,
    CONSTRAINT alexa_oauth_alexa_user_unq_key UNIQUE (alexa_user_id)
);

-- Index for looking up tokens by Alexa user ID (used in most fulfillment requests)
CREATE INDEX IF NOT EXISTS idx_alexa_oauth_alexa_user ON alexa_oauth2_tokens(alexa_user_id);

-- Index for token validation queries
CREATE INDEX IF NOT EXISTS idx_alexa_oauth_access_token ON alexa_oauth2_tokens USING hash (access_token);

-- Index for finding expired tokens for cleanup
CREATE INDEX IF NOT EXISTS idx_alexa_oauth_expires_at ON alexa_oauth2_tokens(expires_at);

-- Index for tenant-based queries
CREATE INDEX IF NOT EXISTS idx_alexa_oauth_tenant ON alexa_oauth2_tokens(tenant_id);

-- Index for user-based queries (for account management)
CREATE INDEX IF NOT EXISTS idx_alexa_oauth_user ON alexa_oauth2_tokens(user_id);

-- Table for storing temporary authorization codes (used during OAuth2 flow)
CREATE TABLE IF NOT EXISTS alexa_oauth2_auth_codes (
    code VARCHAR(255) NOT NULL CONSTRAINT alexa_oauth2_auth_codes_pkey PRIMARY KEY,
    tenant_id UUID NOT NULL,
    user_id UUID NOT NULL,
    alexa_user_id VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    CONSTRAINT fk_alexa_oauth_code_tenant FOREIGN KEY (tenant_id) REFERENCES tenant(id) ON DELETE CASCADE,
    CONSTRAINT fk_alexa_oauth_code_user FOREIGN KEY (user_id) REFERENCES tb_user(id) ON DELETE CASCADE
);

-- Index for cleaning up expired auth codes
CREATE INDEX IF NOT EXISTS idx_alexa_oauth_code_expires_at ON alexa_oauth2_auth_codes(expires_at);
