--
-- Copyright © 2016-2025 The Thingsboard Authors
--
-- Licensed under the Apache License, Version 2.0 (the "License");
-- you may not use this file except in compliance with the License.
-- You may obtain a copy of the License at
--
--     http://www.apache.org/licenses/LICENSE-2.0
--
-- Unless required by applicable law or agreed to in writing, software
-- distributed under the License is distributed on an "AS IS" BASIS,
-- WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
-- See the License for the specific language governing permissions and
-- limitations under the License.
--

-- Google Assistant Smart Home Integration Schema
-- This schema supports OAuth2 authorization code flow for Google Smart Home API

CREATE TABLE IF NOT EXISTS google_oauth2_tokens (
    id UUID NOT NULL CONSTRAINT google_oauth2_tokens_pkey PRIMARY KEY,
    tenant_id UUID NOT NULL,
    user_id UUID NOT NULL,
    google_user_id VARCHAR(255) NOT NULL,
    access_token TEXT NOT NULL,
    refresh_token TEXT,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_google_oauth_tenant FOREIGN KEY (tenant_id) REFERENCES tenant(id) ON DELETE CASCADE,
    CONSTRAINT fk_google_oauth_user FOREIGN KEY (user_id) REFERENCES tb_user(id) ON DELETE CASCADE,
    CONSTRAINT google_oauth_google_user_unq_key UNIQUE (google_user_id)
);

-- Index for looking up tokens by Google user ID (used in most fulfillment requests)
CREATE INDEX IF NOT EXISTS idx_google_oauth_google_user ON google_oauth2_tokens(google_user_id);

-- Index for token validation queries
CREATE INDEX IF NOT EXISTS idx_google_oauth_access_token ON google_oauth2_tokens USING hash (access_token);

-- Index for finding expired tokens for cleanup
CREATE INDEX IF NOT EXISTS idx_google_oauth_expires_at ON google_oauth2_tokens(expires_at);

-- Index for tenant-based queries
CREATE INDEX IF NOT EXISTS idx_google_oauth_tenant ON google_oauth2_tokens(tenant_id);

-- Index for user-based queries (for account management)
CREATE INDEX IF NOT EXISTS idx_google_oauth_user ON google_oauth2_tokens(user_id);

-- Table for storing temporary authorization codes (used during OAuth2 flow)
CREATE TABLE IF NOT EXISTS google_oauth2_auth_codes (
    code VARCHAR(255) NOT NULL CONSTRAINT google_oauth2_auth_codes_pkey PRIMARY KEY,
    tenant_id UUID NOT NULL,
    user_id UUID NOT NULL,
    google_user_id VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    CONSTRAINT fk_google_oauth_code_tenant FOREIGN KEY (tenant_id) REFERENCES tenant(id) ON DELETE CASCADE,
    CONSTRAINT fk_google_oauth_code_user FOREIGN KEY (user_id) REFERENCES tb_user(id) ON DELETE CASCADE
);

-- Index for cleaning up expired auth codes
CREATE INDEX IF NOT EXISTS idx_google_oauth_code_expires_at ON google_oauth2_auth_codes(expires_at);

-- Index for Google-enabled devices (using GIN index for JSONB queries)
-- This allows efficient queries for devices with Google Assistant capabilities enabled
CREATE INDEX IF NOT EXISTS idx_device_google_enabled ON device
USING gin ((additional_info))
WHERE additional_info IS NOT NULL
  AND additional_info::jsonb ? 'googleCapabilities'
  AND (additional_info::jsonb->'googleCapabilities'->>'enabled')::boolean = true;
