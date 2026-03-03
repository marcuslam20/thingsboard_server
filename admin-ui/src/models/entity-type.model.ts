///
/// Copyright © 2016-2025 The Thingsboard Authors
///
/// Licensed under the Apache License, Version 2.0 (the "License");
/// you may not use this file except in compliance with the License.
/// You may obtain a copy of the License at
///
///     http://www.apache.org/licenses/LICENSE-2.0
///
/// Unless required by applicable law or agreed to in writing, software
/// distributed under the License is distributed on an "AS IS" BASIS,
/// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
/// See the License for the specific language governing permissions and
/// limitations under the License.
///

export enum EntityType {
  TENANT = 'TENANT',
  TENANT_PROFILE = 'TENANT_PROFILE',
  CUSTOMER = 'CUSTOMER',
  USER = 'USER',
  DASHBOARD = 'DASHBOARD',
  ASSET = 'ASSET',
  DEVICE = 'DEVICE',
  DEVICE_PROFILE = 'DEVICE_PROFILE',
  ASSET_PROFILE = 'ASSET_PROFILE',
  ALARM = 'ALARM',
  RULE_CHAIN = 'RULE_CHAIN',
  RULE_NODE = 'RULE_NODE',
  EDGE = 'EDGE',
  ENTITY_VIEW = 'ENTITY_VIEW',
  WIDGETS_BUNDLE = 'WIDGETS_BUNDLE',
  WIDGET_TYPE = 'WIDGET_TYPE',
  API_USAGE_STATE = 'API_USAGE_STATE',
  TB_RESOURCE = 'TB_RESOURCE',
  OTA_PACKAGE = 'OTA_PACKAGE',
  RPC = 'RPC',
  QUEUE = 'QUEUE',
  NOTIFICATION_TARGET = 'NOTIFICATION_TARGET',
  NOTIFICATION_TEMPLATE = 'NOTIFICATION_TEMPLATE',
  NOTIFICATION_REQUEST = 'NOTIFICATION_REQUEST',
  NOTIFICATION_RULE = 'NOTIFICATION_RULE',
  NOTIFICATION = 'NOTIFICATION',
}
