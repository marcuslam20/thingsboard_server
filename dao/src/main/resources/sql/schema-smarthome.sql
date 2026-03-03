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

-- Product Categories (standard Tuya-like categories)
CREATE TABLE IF NOT EXISTS product_category (
    id uuid NOT NULL CONSTRAINT product_category_pkey PRIMARY KEY,
    created_time bigint NOT NULL,
    tenant_id uuid NOT NULL,
    code varchar(64) NOT NULL,
    name varchar(255) NOT NULL,
    icon varchar(1000000),
    parent_id uuid,
    standard_dp_set jsonb,
    sort_order int DEFAULT 0,
    version bigint DEFAULT 1,
    CONSTRAINT product_category_code_unq UNIQUE (tenant_id, code),
    CONSTRAINT fk_product_category_tenant FOREIGN KEY (tenant_id) REFERENCES tenant(id) ON DELETE CASCADE,
    CONSTRAINT fk_product_category_parent FOREIGN KEY (parent_id) REFERENCES product_category(id)
);

CREATE INDEX IF NOT EXISTS idx_product_category_tenant ON product_category(tenant_id);

-- Data Points (structured DP definitions per device profile / product)
CREATE TABLE IF NOT EXISTS data_point (
    id uuid NOT NULL CONSTRAINT data_point_pkey PRIMARY KEY,
    created_time bigint NOT NULL,
    tenant_id uuid NOT NULL,
    device_profile_id uuid NOT NULL,
    dp_id int NOT NULL,
    code varchar(64) NOT NULL,
    name varchar(255) NOT NULL,
    dp_type varchar(32) NOT NULL,
    mode varchar(32) NOT NULL DEFAULT 'RW',
    constraints jsonb,
    is_standard boolean DEFAULT false,
    sort_order int DEFAULT 0,
    version bigint DEFAULT 1,
    CONSTRAINT data_point_dp_id_unq UNIQUE (device_profile_id, dp_id),
    CONSTRAINT data_point_code_unq UNIQUE (device_profile_id, code),
    CONSTRAINT fk_data_point_tenant FOREIGN KEY (tenant_id) REFERENCES tenant(id) ON DELETE CASCADE,
    CONSTRAINT fk_data_point_device_profile FOREIGN KEY (device_profile_id) REFERENCES device_profile(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_data_point_device_profile ON data_point(device_profile_id);
CREATE INDEX IF NOT EXISTS idx_data_point_tenant ON data_point(tenant_id);

-- Add smart home columns to device_profile
ALTER TABLE device_profile ADD COLUMN IF NOT EXISTS category_id uuid;
ALTER TABLE device_profile ADD COLUMN IF NOT EXISTS product_model varchar(255);
ALTER TABLE device_profile ADD COLUMN IF NOT EXISTS connectivity_type varchar(32);

-- Smart Home (belongs to user)
CREATE TABLE IF NOT EXISTS smart_home (
    id uuid NOT NULL CONSTRAINT smart_home_pkey PRIMARY KEY,
    created_time bigint NOT NULL,
    tenant_id uuid NOT NULL,
    owner_user_id uuid NOT NULL,
    name varchar(255) NOT NULL,
    geo_name varchar(255),
    latitude double precision,
    longitude double precision,
    timezone varchar(64),
    additional_info varchar,
    version bigint DEFAULT 1,
    CONSTRAINT fk_smart_home_tenant FOREIGN KEY (tenant_id) REFERENCES tenant(id) ON DELETE CASCADE,
    CONSTRAINT fk_smart_home_owner FOREIGN KEY (owner_user_id) REFERENCES tb_user(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_smart_home_tenant ON smart_home(tenant_id);
CREATE INDEX IF NOT EXISTS idx_smart_home_owner ON smart_home(owner_user_id);

-- Smart Home Members (multi-user access)
CREATE TABLE IF NOT EXISTS smart_home_member (
    id uuid NOT NULL CONSTRAINT smart_home_member_pkey PRIMARY KEY,
    created_time bigint NOT NULL,
    smart_home_id uuid NOT NULL,
    user_id uuid NOT NULL,
    role varchar(32) NOT NULL DEFAULT 'MEMBER',
    status varchar(32) NOT NULL DEFAULT 'ACTIVE',
    invited_by uuid,
    version bigint DEFAULT 1,
    CONSTRAINT smart_home_member_unq UNIQUE (smart_home_id, user_id),
    CONSTRAINT fk_smart_home_member_home FOREIGN KEY (smart_home_id) REFERENCES smart_home(id) ON DELETE CASCADE,
    CONSTRAINT fk_smart_home_member_user FOREIGN KEY (user_id) REFERENCES tb_user(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_smart_home_member_user ON smart_home_member(user_id);

-- Rooms
CREATE TABLE IF NOT EXISTS room (
    id uuid NOT NULL CONSTRAINT room_pkey PRIMARY KEY,
    created_time bigint NOT NULL,
    tenant_id uuid NOT NULL,
    smart_home_id uuid NOT NULL,
    name varchar(255) NOT NULL,
    icon varchar(64),
    sort_order int DEFAULT 0,
    additional_info varchar,
    version bigint DEFAULT 1,
    CONSTRAINT room_name_unq UNIQUE (smart_home_id, name),
    CONSTRAINT fk_room_home FOREIGN KEY (smart_home_id) REFERENCES smart_home(id) ON DELETE CASCADE,
    CONSTRAINT fk_room_tenant FOREIGN KEY (tenant_id) REFERENCES tenant(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_room_home ON room(smart_home_id);

-- Device-Room assignment
CREATE TABLE IF NOT EXISTS room_device (
    room_id uuid NOT NULL,
    device_id uuid NOT NULL,
    sort_order int DEFAULT 0,
    CONSTRAINT room_device_pkey PRIMARY KEY (room_id, device_id),
    CONSTRAINT fk_room_device_room FOREIGN KEY (room_id) REFERENCES room(id) ON DELETE CASCADE,
    CONSTRAINT fk_room_device_device FOREIGN KEY (device_id) REFERENCES device(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_room_device_device ON room_device(device_id);

-- Smart Scenes
CREATE TABLE IF NOT EXISTS smart_scene (
    id uuid NOT NULL CONSTRAINT smart_scene_pkey PRIMARY KEY,
    created_time bigint NOT NULL,
    tenant_id uuid NOT NULL,
    smart_home_id uuid NOT NULL,
    name varchar(255) NOT NULL,
    scene_type varchar(32) NOT NULL,
    enabled boolean DEFAULT true,
    icon varchar(64),
    conditions jsonb,
    condition_logic varchar(8) DEFAULT 'AND',
    actions jsonb NOT NULL,
    effective_time jsonb,
    additional_info varchar,
    version bigint DEFAULT 1,
    CONSTRAINT fk_smart_scene_tenant FOREIGN KEY (tenant_id) REFERENCES tenant(id) ON DELETE CASCADE,
    CONSTRAINT fk_smart_scene_home FOREIGN KEY (smart_home_id) REFERENCES smart_home(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_smart_scene_home ON smart_scene(smart_home_id);
CREATE INDEX IF NOT EXISTS idx_smart_scene_type ON smart_scene(scene_type);

-- Scene execution log
CREATE TABLE IF NOT EXISTS smart_scene_log (
    id uuid NOT NULL,
    created_time bigint NOT NULL,
    scene_id uuid NOT NULL,
    trigger_type varchar(32),
    status varchar(32),
    execution_details jsonb,
    CONSTRAINT fk_scene_log_scene FOREIGN KEY (scene_id) REFERENCES smart_scene(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_scene_log_scene ON smart_scene_log(scene_id);
CREATE INDEX IF NOT EXISTS idx_scene_log_time ON smart_scene_log(created_time);

-- Device pairing tokens
CREATE TABLE IF NOT EXISTS device_pairing_token (
    id uuid NOT NULL CONSTRAINT device_pairing_token_pkey PRIMARY KEY,
    created_time bigint NOT NULL,
    tenant_id uuid NOT NULL,
    device_profile_id uuid NOT NULL,
    smart_home_id uuid NOT NULL,
    room_id uuid,
    token varchar(64) NOT NULL UNIQUE,
    status varchar(32) DEFAULT 'PENDING',
    device_id uuid,
    expires_at bigint NOT NULL,
    pairing_data jsonb,
    CONSTRAINT fk_pairing_tenant FOREIGN KEY (tenant_id) REFERENCES tenant(id) ON DELETE CASCADE,
    CONSTRAINT fk_pairing_profile FOREIGN KEY (device_profile_id) REFERENCES device_profile(id),
    CONSTRAINT fk_pairing_home FOREIGN KEY (smart_home_id) REFERENCES smart_home(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_pairing_token ON device_pairing_token(token);

-- Device shares
CREATE TABLE IF NOT EXISTS device_share (
    id uuid NOT NULL CONSTRAINT device_share_pkey PRIMARY KEY,
    created_time bigint NOT NULL,
    tenant_id uuid NOT NULL,
    device_id uuid NOT NULL,
    shared_by_user_id uuid NOT NULL,
    shared_to_user_id uuid,
    share_code varchar(32) UNIQUE,
    permissions jsonb DEFAULT '["CONTROL"]',
    status varchar(32) DEFAULT 'PENDING',
    expires_at bigint,
    version bigint DEFAULT 1,
    CONSTRAINT fk_device_share_tenant FOREIGN KEY (tenant_id) REFERENCES tenant(id) ON DELETE CASCADE,
    CONSTRAINT fk_device_share_device FOREIGN KEY (device_id) REFERENCES device(id) ON DELETE CASCADE,
    CONSTRAINT fk_device_share_by FOREIGN KEY (shared_by_user_id) REFERENCES tb_user(id),
    CONSTRAINT fk_device_share_to FOREIGN KEY (shared_to_user_id) REFERENCES tb_user(id)
);

CREATE INDEX IF NOT EXISTS idx_device_share_code ON device_share(share_code);
CREATE INDEX IF NOT EXISTS idx_device_share_device ON device_share(device_id);

-- Device groups
CREATE TABLE IF NOT EXISTS device_group (
    id uuid NOT NULL CONSTRAINT device_group_pkey PRIMARY KEY,
    created_time bigint NOT NULL,
    tenant_id uuid NOT NULL,
    smart_home_id uuid NOT NULL,
    name varchar(255) NOT NULL,
    device_profile_id uuid NOT NULL,
    icon varchar(64),
    additional_info varchar,
    version bigint DEFAULT 1,
    CONSTRAINT fk_device_group_tenant FOREIGN KEY (tenant_id) REFERENCES tenant(id) ON DELETE CASCADE,
    CONSTRAINT fk_device_group_home FOREIGN KEY (smart_home_id) REFERENCES smart_home(id) ON DELETE CASCADE,
    CONSTRAINT fk_device_group_profile FOREIGN KEY (device_profile_id) REFERENCES device_profile(id)
);

CREATE TABLE IF NOT EXISTS device_group_member (
    group_id uuid NOT NULL,
    device_id uuid NOT NULL,
    CONSTRAINT device_group_member_pkey PRIMARY KEY (group_id, device_id),
    CONSTRAINT fk_group_member_group FOREIGN KEY (group_id) REFERENCES device_group(id) ON DELETE CASCADE,
    CONSTRAINT fk_group_member_device FOREIGN KEY (device_id) REFERENCES device(id) ON DELETE CASCADE
);
