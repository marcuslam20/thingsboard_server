# Tuya Smart — Full Feature Mapping to ThingsBoard Smart Home Platform

> **Goal**: Clone ALL features from Tuya Smart / Osprey Smart Home app on top of ThingsBoard.
> **Reference App**: Osprey Smart Home (Tuya OEM white-label app) — screenshots in `docs/app-design/`
> **Branch**: `feature/smart-home`

---

## Status Legend

| Icon | Meaning |
|------|---------|
| ✅ | Done — implemented and compiles |
| 🔨 | In Progress — partially implemented |
| 📋 | Planned — design ready, not yet coded |
| ❌ | Not Started — needs design + implementation |
| ➖ | Not Applicable — handled by mobile app or not needed |

## Priority Legend

| Priority | Meaning |
|----------|---------|
| **P0** | Core — Must have for MVP / basic smart home |
| **P1** | Important — Needed for production-quality app |
| **P2** | Advanced — Nice to have, enhances UX |
| **P3** | Premium — Enterprise / specialized features |

---

## 1. User & Account Management

| # | Tuya Feature | Description | Priority | Status | TB Implementation | Phase |
|---|-------------|-------------|----------|--------|-------------------|-------|
| 1.1 | Phone Registration | Register with phone + SMS OTP | P0 | ❌ | TB has email-only auth. Need SMS provider integration | 6 |
| 1.2 | Email Registration | Register with email + verification code | P0 | ✅ | Custom signup API (`POST /api/noAuth/signup`) | Done |
| 1.3 | Password Login | Email/phone + password | P0 | ✅ | TB built-in auth (`POST /api/auth/login`) | Done |
| 1.4 | OTP Login | Phone/email + one-time code (no password) | P1 | ❌ | Need OTP service | 6 |
| 1.5 | Social Login — Facebook | OAuth via Facebook | P2 | ❌ | TB has OAuth2 framework, need Facebook provider config | 6 |
| 1.6 | Social Login — Google | OAuth via Google | P2 | ❌ | TB has OAuth2 framework, need Google provider config | 6 |
| 1.7 | Social Login — Apple | Sign in with Apple | P2 | ❌ | TB has OAuth2 framework, need Apple provider config | 6 |
| 1.8 | Forgot Password | Reset via verification code | P0 | ✅ | TB built-in (`POST /api/noAuth/resetPasswordByEmail`) | Done |
| 1.9 | Change Password | From settings | P0 | ✅ | TB built-in (`POST /api/auth/changePassword`) | Done |
| 1.10 | Account Deletion | GDPR-compliant, 7-day grace period | P1 | ❌ | Need custom implementation | 6 |
| 1.11 | User Profile | Edit avatar, nickname | P0 | 🔨 | TB has basic user profile, need avatar upload | 6 |
| 1.12 | Region/Country Selection | At registration, determines data center | P1 | ❌ | Need country selector at signup | 6 |
| 1.13 | Multi-Language | App supports multiple languages | P1 | ➖ | Mobile app responsibility (i18n) | - |
| 1.14 | Timezone Settings | Per-user timezone | P0 | ✅ | TB user additional_info has timezone | Done |
| 1.15 | Guest Mode | "Try as Guest" — browse without account | P2 | ❌ | Need anonymous/limited access mode | 6 |
| 1.16 | 2FA | Two-factor authentication | P2 | ✅ | TB built-in 2FA support | Done |
| 1.17 | Privacy/Terms Acceptance | Checkbox at registration | P0 | ➖ | Mobile app responsibility | - |
| 1.18 | Session Management | View active sessions/logins | P2 | ❌ | Need login history tracking | 6 |

**Summary**: 8/18 done, 2 mobile-app-only, 8 TODO

---

## 2. Home (Family) Management

| # | Tuya Feature | Description | Priority | Status | TB Implementation | Phase |
|---|-------------|-------------|----------|--------|-------------------|-------|
| 2.1 | Create Home | Create a smart home (family) | P0 | ✅ | `POST /api/smarthome/homes` | 2 |
| 2.2 | Multiple Homes | Manage multiple homes per account | P0 | ✅ | `GET /api/smarthome/homes` returns list | 2 |
| 2.3 | Switch Between Homes | Home selector dropdown | P0 | ➖ | Mobile app UI (API supports it) | - |
| 2.4 | Edit Home Name | Rename home | P0 | ✅ | `PUT /api/smarthome/homes/{homeId}` | 2 |
| 2.5 | Delete Home | Remove home + all data | P0 | ✅ | `DELETE /api/smarthome/homes/{homeId}` | 2 |
| 2.6 | Home Location | GPS coordinates, address | P0 | ✅ | `smart_home` table has latitude, longitude, geo_name | 2 |
| 2.7 | Home Timezone | Per-home timezone | P0 | ✅ | `smart_home` table has timezone column | 2 |
| 2.8 | Invite Members | Add user to home by phone/email | P0 | ✅ | `POST /api/smarthome/homes/{homeId}/members` | 2 |
| 2.9 | Member Role — Owner | Full control, manage everything | P0 | ✅ | `SmartHomeMemberRole.OWNER` | 2 |
| 2.10 | Member Role — Admin | Manage devices, scenes, add members | P0 | ✅ | `SmartHomeMemberRole.ADMIN` | 2 |
| 2.11 | Member Role — Member | Operate devices, view scenes | P0 | ✅ | `SmartHomeMemberRole.MEMBER` | 2 |
| 2.12 | Change Member Role | Assign different roles | P1 | ✅ | `PUT /api/smarthome/homes/{homeId}/members/{memberId}` | 2 |
| 2.13 | Remove Member | Remove from home | P0 | ✅ | `DELETE /api/smarthome/homes/{homeId}/members/{memberId}` | 2 |
| 2.14 | Transfer Ownership | Transfer owner role to another member | P2 | ❌ | Need transfer ownership endpoint | 2+ |
| 2.15 | Home Background Image | Custom background for dashboard | P2 | ❌ | Need image upload for home | 7 |
| 2.16 | Weather Display | Show weather on home screen | P1 | ❌ | Need weather API integration | 7 |
| 2.17 | Home Messages | Family-related notifications | P2 | ❌ | Need message/notification system | 7 |

**Summary**: 12/17 done, 1 mobile-app-only, 4 TODO

---

## 3. Room Management

| # | Tuya Feature | Description | Priority | Status | TB Implementation | Phase |
|---|-------------|-------------|----------|--------|-------------------|-------|
| 3.1 | Create Room | Add rooms to home | P0 | ✅ | `POST /api/smarthome/homes/{homeId}/rooms` | 2 |
| 3.2 | Delete Room | Remove room | P0 | ✅ | `DELETE /api/smarthome/homes/{homeId}/rooms/{roomId}` | 2 |
| 3.3 | Rename Room | Change room name | P0 | ✅ | `PUT /api/smarthome/homes/{homeId}/rooms/{roomId}` | 2 |
| 3.4 | Reorder Rooms | Drag-and-drop sort | P1 | ✅ | `room` table has `sort_order` column | 2 |
| 3.5 | Room Icon | Icon per room | P1 | ✅ | `room` table has `icon` column | 2 |
| 3.6 | Room Background | Background image/wallpaper | P2 | ❌ | Need image field in room | 7 |
| 3.7 | Assign Device to Room | Place device in room | P0 | ✅ | `POST /api/smarthome/homes/{homeId}/rooms/{roomId}/devices` | 2 |
| 3.8 | Move Device Between Rooms | Reassign device | P0 | ✅ | Remove from old room + add to new (API supports) | 2 |
| 3.9 | Room-Based Device View | Devices organized by room tabs | P0 | ✅ | `GET /api/smarthome/homes/{homeId}/rooms/{roomId}/devices` | 2 |
| 3.10 | Default Room Templates | Predefined rooms (Living Room, Bedroom, etc.) | P2 | ❌ | Need seed data for default rooms | 7 |

**Summary**: 8/10 done, 2 TODO

---

## 4. Device Management

| # | Tuya Feature | Description | Priority | Status | TB Implementation | Phase |
|---|-------------|-------------|----------|--------|-------------------|-------|
| **Pairing / Adding** | | | | | | |
| 4.1 | Category-Based Add | Browse categories to find pairing guide | P0 | ✅ | `GET /api/smarthome/categories` | 1 |
| 4.2 | Pairing Token System | Generate temp token for device activation | P0 | ✅ | `POST /api/smarthome/pairing/token` | 3 |
| 4.3 | Confirm Pairing | Link device to home/room after pairing | P0 | ✅ | `POST /api/smarthome/pairing/confirm` | 3 |
| 4.4 | Token Status Check | Query pairing token status | P0 | ✅ | `GET /api/smarthome/pairing/token/{token}` | 3 |
| 4.5 | WiFi EZ Mode | Fast broadcast pairing | P1 | ➖ | Mobile app + device firmware (not backend) | - |
| 4.6 | WiFi AP Mode | Hotspot pairing fallback | P1 | ➖ | Mobile app + device firmware | - |
| 4.7 | BLE Pairing | Bluetooth pairing | P1 | ➖ | Mobile app + device firmware | - |
| 4.8 | QR Code Pairing | Scan QR to pair | P1 | ❌ | Need QR code generation for pairing token | 7 |
| 4.9 | Gateway Sub-Device | Pair sub-devices via gateway | P1 | ❌ | Need gateway-aware pairing flow | 7 |
| 4.10 | Pairing Guide/Tutorial | Visual step-by-step guide | P2 | ➖ | Mobile app UI responsibility | - |
| **Device Info & Settings** | | | | | | |
| 4.11 | Device Rename | Change display name | P0 | ✅ | TB built-in device API | Done |
| 4.12 | Device Icon | Custom icon | P1 | ✅ | Device additional_info | Done |
| 4.13 | Device Info View | ID, IP, MAC, signal, online status | P0 | ✅ | TB built-in device info API | Done |
| 4.14 | Online/Offline Status | Real-time connectivity indicator | P0 | ✅ | TB device activity state | Done |
| 4.15 | Signal Strength | WiFi dBm display | P2 | ❌ | Need device telemetry attribute | 7 |
| **Device Sharing** | | | | | | |
| 4.16 | Share Device | Generate share code | P0 | ✅ | `POST /api/smarthome/devices/{deviceId}/share` | 3 |
| 4.17 | Accept Share | Accept by share code | P0 | ✅ | `POST /api/smarthome/share/accept` | 3 |
| 4.18 | Revoke Share | Remove shared access | P0 | ✅ | `DELETE /api/smarthome/shares/{shareId}` | 3 |
| 4.19 | List Device Shares | View all shares for device | P1 | ✅ | `GET /api/smarthome/devices/{deviceId}/shares` | 3 |
| 4.20 | Sharing Validity Period | Limited time sharing | P2 | ✅ | `device_share.expires_at` column | 3 |
| **Device Removal** | | | | | | |
| 4.21 | Remove Device | Remove from account/home | P0 | ✅ | TB built-in device delete + room_device cleanup | Done |
| 4.22 | Factory Reset | Restore device defaults | P1 | ❌ | Need RPC command for factory reset | 7 |
| **Firmware / OTA** | | | | | | |
| 4.23 | OTA Firmware Update | Over-the-air updates | P1 | ✅ | TB built-in OTA package management | Done |
| 4.24 | Batch OTA | Update multiple devices | P2 | ✅ | TB built-in batch OTA | Done |
| **Device Logs** | | | | | | |
| 4.25 | Operation Logs | View device action history | P1 | ✅ | TB audit log system | Done |
| 4.26 | DP Report Logs | Historical DP data | P1 | ✅ | TB time-series data | Done |

**Summary**: 18/26 done, 3 mobile-app-only, 5 TODO

---

## 5. Device Control

| # | Tuya Feature | Description | Priority | Status | TB Implementation | Phase |
|---|-------------|-------------|----------|--------|-------------------|-------|
| **DP-Based Controls** | | | | | | |
| 5.1 | Boolean DP (Toggle) | On/off switch | P0 | ✅ | `DataPoint` with `DpType.BOOLEAN` + TB RPC | 1 |
| 5.2 | Value DP (Slider) | Numeric value (brightness, temp) | P0 | ✅ | `DataPoint` with `DpType.VALUE` + constraints (min/max/step) | 1 |
| 5.3 | Enum DP (Picker) | Enumerated values (fan speed) | P0 | ✅ | `DataPoint` with `DpType.ENUM` + constraints (range) | 1 |
| 5.4 | String DP | Text data | P0 | ✅ | `DataPoint` with `DpType.STRING` | 1 |
| 5.5 | Raw DP | Raw byte data | P1 | ✅ | `DataPoint` with `DpType.RAW` | 1 |
| 5.6 | Fault DP | Error/fault display (read-only) | P0 | ✅ | `DataPoint` with `DpType.FAULT` + `DpMode.RO` | 1 |
| 5.7 | Standard DP Sets | Pre-defined DPs per category | P0 | ✅ | `StandardInstructionSetService` seeds 8 categories | 1 |
| 5.8 | DP Command API | Send DP commands to device | P0 | ❌ | Need `POST /api/smarthome/devices/{id}/commands` using TB RPC | 7 |
| 5.9 | DP Status API | Get current DP values | P0 | ❌ | Need `GET /api/smarthome/devices/{id}/status` from TB attributes/telemetry | 7 |
| **Scheduling & Timers** | | | | | | |
| 5.10 | Device Schedule | Time-based per-device actions | P0 | ❌ | Need schedule service (can use TB rule engine or custom) | 7 |
| 5.11 | Recurring Schedule | Repeat on days of week | P0 | ❌ | Part of schedule service | 7 |
| 5.12 | Countdown Timer | Auto-action after delay | P1 | ❌ | Part of schedule service | 7 |
| 5.13 | Cycle Timer | Repeating on/off cycles | P2 | ❌ | Part of schedule service | 7 |
| **Device Grouping** | | | | | | |
| 5.14 | Create Device Group | Group same-model devices | P0 | ✅ | `POST /api/smarthome/groups` | 3 |
| 5.15 | Group Control | Control all devices in group | P0 | ❌ | Need `POST /api/smarthome/groups/{groupId}/control` (batch RPC) | 7 |
| 5.16 | Add/Remove from Group | Manage group members | P0 | ✅ | `POST/DELETE /api/smarthome/groups/{groupId}/devices` | 3 |
| 5.17 | List Group Devices | View group members | P0 | ✅ | `GET /api/smarthome/groups/{groupId}/devices` | 3 |
| **Favorites & Quick Access** | | | | | | |
| 5.18 | Favorite Devices | Mark as favorite | P2 | ❌ | Need favorites field in device or user settings | 7 |
| 5.19 | Home Screen Widget | OS-level widget | P2 | ➖ | Mobile app responsibility | - |

**Summary**: 10/19 done, 1 mobile-app-only, 8 TODO

---

## 6. Smart Scenes & Automation

| # | Tuya Feature | Description | Priority | Status | TB Implementation | Phase |
|---|-------------|-------------|----------|--------|-------------------|-------|
| **Scene Types** | | | | | | |
| 6.1 | Tap-to-Run | Manual one-tap execution | P0 | 📋 | `smart_scene` table ready, `scene_type=TAP_TO_RUN` | 4 |
| 6.2 | Automation | If-condition-then-action | P0 | 📋 | `smart_scene` table ready, `scene_type=AUTOMATION` | 4 |
| **Conditions** | | | | | | |
| 6.3 | Device Status Condition | Trigger when DP reaches value | P0 | 📋 | `conditions` JSONB in smart_scene | 4 |
| 6.4 | Schedule/Time Trigger | Trigger at specific time | P0 | 📋 | Condition type: SCHEDULE | 4 |
| 6.5 | Sunrise/Sunset Trigger | With advance/delay offsets | P1 | ❌ | Need sun calculation library | 4+ |
| 6.6 | Weather Condition | Trigger on temperature, humidity, etc. | P2 | ❌ | Need weather API integration | 7 |
| 6.7 | Geofence — Arrive/Leave | Location-based trigger | P2 | ❌ | Need geofence service | 7 |
| **Condition Logic** | | | | | | |
| 6.8 | AND Logic | All conditions must be met | P0 | 📋 | `condition_logic` column = 'AND' | 4 |
| 6.9 | ANY Logic | Any condition triggers | P0 | 📋 | `condition_logic` column = 'ANY' | 4 |
| **Actions** | | | | | | |
| 6.10 | Control Device | Set DP values | P0 | 📋 | Action type: DEVICE_CONTROL in `actions` JSONB | 4 |
| 6.11 | Control Device Group | Batch action on group | P1 | 📋 | Action type: GROUP_CONTROL | 4 |
| 6.12 | Trigger Another Scene | Chain scenes | P1 | 📋 | Action type: TRIGGER_SCENE | 4 |
| 6.13 | Enable/Disable Automation | Toggle another automation | P2 | 📋 | Action type: TOGGLE_AUTOMATION | 4 |
| 6.14 | Delay Action | Wait before next action | P0 | 📋 | Action type: DELAY | 4 |
| 6.15 | Send Notification | Push notification | P1 | 📋 | Action type: NOTIFICATION | 4 |
| **Scene Management** | | | | | | |
| 6.16 | Enable/Disable | Toggle without deleting | P0 | 📋 | `smart_scene.enabled` column | 4 |
| 6.17 | Effective Time Period | Active time window | P1 | 📋 | `smart_scene.effective_time` JSONB | 4 |
| 6.18 | Scene Execution Logs | History of executions | P1 | 📋 | `smart_scene_log` table ready | 4 |
| 6.19 | Siri Shortcuts | iOS Siri integration for scenes | P2 | ➖ | Mobile app responsibility | - |
| 6.20 | Scene Reorder | Sort scenes | P2 | ❌ | Need sort_order field | 4 |

**Summary**: 0/20 done (SQL schema ready), 14 planned for Phase 4, 1 mobile-app-only, 5 need additional services

---

## 7. Notifications & Messages

| # | Tuya Feature | Description | Priority | Status | TB Implementation | Phase |
|---|-------------|-------------|----------|--------|-------------------|-------|
| 7.1 | Push Notifications | Real-time push to mobile | P0 | ❌ | Need push notification service (FCM/APNs) | 8 |
| 7.2 | Alarm Tab | Device alarms and alerts | P0 | ❌ | Need alarm/message center API | 8 |
| 7.3 | Home Tab | Family messages (member changes) | P1 | ❌ | Need home activity log | 8 |
| 7.4 | Bulletin Tab | System announcements | P2 | ❌ | TB has notification center (can extend) | 8 |
| 7.5 | Device Online/Offline Alert | Connectivity change notification | P1 | ❌ | Need device status webhook/listener | 8 |
| 7.6 | Do Not Disturb | Mute notifications by schedule | P2 | ❌ | Need DND settings per user | 8 |
| 7.7 | Device Alarm Config | Configure alarm per DP threshold | P1 | ❌ | Need alarm rule configuration | 8 |

**Summary**: 0/7 done, all TODO in Phase 8

---

## 8. Voice Assistant Integration

| # | Tuya Feature | Description | Priority | Status | TB Implementation | Phase |
|---|-------------|-------------|----------|--------|-------------------|-------|
| 8.1 | Amazon Alexa | Voice control via Alexa | P0 | ✅ | `alexa-skill/` Lambda + `AlexaController.java` | 5 |
| 8.2 | Google Assistant | Voice control via Google | P0 | ✅ | `google-assistant-skill/` Cloud Function | 5 |
| 8.3 | Device Discovery | List devices on voice platform | P0 | ✅ | Alexa Discovery handler, Google SYNC | 5 |
| 8.4 | Voice Device Control | On/off, brightness, etc. | P0 | ✅ | Alexa PowerController, Google EXECUTE | 5 |
| 8.5 | Siri Shortcuts | Tap-to-Run via Siri | P2 | ❌ | Need scene execution API first (Phase 4) | 5+ |
| 8.6 | Voice Scene Execution | Execute scenes by voice | P2 | ❌ | Need Alexa/Google scene discovery (after Phase 4) | 5+ |

**Summary**: 4/6 done, 2 depend on Phase 4

---

## 9. Weather & Environment

| # | Tuya Feature | Description | Priority | Status | TB Implementation | Phase |
|---|-------------|-------------|----------|--------|-------------------|-------|
| 9.1 | Weather on Home Screen | Current weather per home location | P1 | ❌ | Need weather API proxy | 7 |
| 9.2 | Temperature/Humidity | Outdoor temp & humidity | P1 | ❌ | Part of weather service | 7 |
| 9.3 | PM2.5 / Air Quality | Outdoor air quality | P2 | ❌ | Part of weather service | 7 |
| 9.4 | Sunrise/Sunset Times | Local sun times | P1 | ❌ | Need sun calculation (for scenes + display) | 7 |
| 9.5 | Weather-Based Automation | Weather as scene trigger | P2 | ❌ | Depends on weather service + Phase 4 | 7 |

**Summary**: 0/5 done, all TODO in Phase 7

---

## 10. Energy Management

| # | Tuya Feature | Description | Priority | Status | TB Implementation | Phase |
|---|-------------|-------------|----------|--------|-------------------|-------|
| 10.1 | Real-Time Power | Voltage, current, wattage | P1 | 🔨 | TB telemetry can store power DPs, need formatted API | 7 |
| 10.2 | Energy Statistics | Daily/monthly/annual charts | P2 | ❌ | Need aggregation API over TB time-series | 7 |
| 10.3 | Device-Level Tracking | Per-device energy usage | P2 | ❌ | Part of energy stats | 7 |

**Summary**: 0/3 done, all TODO

---

## 11. Camera & Media

| # | Tuya Feature | Description | Priority | Status | TB Implementation | Phase |
|---|-------------|-------------|----------|--------|-------------------|-------|
| 11.1 | Live View Streaming | P2P real-time video | P1 | ❌ | Out of scope for initial MVP (needs media server) | 9+ |
| 11.2 | Two-Way Audio | Talk-back via camera | P2 | ❌ | Out of scope | 9+ |
| 11.3 | Motion Detection | AI-based motion alerts | P2 | ❌ | Can use TB rule engine for DP-based alerts | 9+ |
| 11.4 | Cloud Storage | Encrypted video backup | P3 | ❌ | Out of scope | 9+ |
| 11.5 | SD Card Playback | Local recording playback | P2 | ➖ | Device firmware + mobile app | - |

**Summary**: 0/5 done, deferred to Phase 9+

---

## Overall Progress Summary

| Category | Total | ✅ Done | 🔨 WIP | 📋 Planned | ❌ TODO | ➖ N/A |
|----------|-------|--------|--------|-----------|--------|--------|
| 1. User & Account | 18 | 8 | 0 | 0 | 8 | 2 |
| 2. Home Management | 17 | 12 | 0 | 0 | 4 | 1 |
| 3. Room Management | 10 | 8 | 0 | 0 | 2 | 0 |
| 4. Device Management | 26 | 18 | 0 | 0 | 5 | 3 |
| 5. Device Control | 19 | 10 | 0 | 0 | 8 | 1 |
| 6. Smart Scenes | 20 | 0 | 0 | 14 | 5 | 1 |
| 7. Notifications | 7 | 0 | 0 | 0 | 7 | 0 |
| 8. Voice Assistants | 6 | 4 | 0 | 0 | 2 | 0 |
| 9. Weather | 5 | 0 | 0 | 0 | 5 | 0 |
| 10. Energy | 3 | 0 | 1 | 0 | 2 | 0 |
| 11. Camera | 5 | 0 | 0 | 0 | 4 | 1 |
| **TOTAL** | **136** | **60** | **1** | **14** | **52** | **9** |

**Progress: 60/136 features done (44%), 14 planned (10%), 52 TODO (38%), 9 N/A (7%)**

---

## Implementation Roadmap

### ✅ COMPLETED

| Phase | Name | Features | Status |
|-------|------|----------|--------|
| 1 | Product & Data Point Management | Categories, DPs, standard instruction sets | ✅ Done |
| 2 | Smart Home & Room Management | Homes, members, rooms, device-room assignment | ✅ Done |
| 3 | Device Lifecycle | Pairing tokens, device sharing, device groups | ✅ Done |
| 5 | Voice Assistants (Basic) | Alexa + Google Assistant integration | ✅ Done |

### 📋 NEXT UP

| Phase | Name | Key Features | Est. Effort | Priority |
|-------|------|-------------|-------------|----------|
| **4** | **Smart Scenes & Automation** | Tap-to-Run, Automation, conditions (device/time/weather), actions (control/delay/notify), execution engine, logs | Large | **P0** |
| **6** | **Enhanced Auth** | Phone registration + SMS OTP, social login (FB/Google/Apple), account deletion, guest mode | Medium | **P1** |
| **7** | **Device Control & Services** | DP command/status APIs, device schedules, countdown timers, group control, weather service, favorites, energy stats | Large | **P0-P1** |
| **8** | **Notifications & Messages** | Push notifications (FCM/APNs), message center (alarm/home/bulletin tabs), device alerts, DND | Medium | **P1** |
| **9+** | **Camera & Advanced** | Media streaming, cloud storage, advanced security, AI features | Very Large | **P3** |

### Recommended Priority Order

```
Phase 4 (Scenes)     ████████████░░░░  P0 — Core app feature, Automation tab
Phase 7 (Control)    ████████████░░░░  P0 — DP commands, schedules, group control
Phase 8 (Notifications) ████████░░░░░░  P1 — Push + message center
Phase 6 (Auth)       ██████░░░░░░░░░░  P1 — Social login, SMS
Phase 5+ (Voice)     ████░░░░░░░░░░░░  P2 — Scene discovery via voice
Phase 9+ (Camera)    ██░░░░░░░░░░░░░░  P3 — Deferred
```

---

## Tuya Standard Category Mapping (Product Types)

| Tuya Code | Category | Standard DPs | Status |
|-----------|----------|-------------|--------|
| `dj` | Light | switch_led, bright_value, temp_value, colour_data, work_mode | ✅ Seeded |
| `kg` | Switch | switch_1, switch_2, switch_3, countdown_1 | ✅ Seeded |
| `cz` | Smart Plug | switch, cur_power, cur_current, cur_voltage | ✅ Seeded |
| `wk` | Thermostat | switch, temp_set, temp_current, mode | ✅ Seeded |
| `fs` | Fan | switch, fan_speed, fan_direction, mode | ✅ Seeded |
| `ms` | Lock | lock_state, unlock_method, alarm_lock | ✅ Seeded |
| `cl` | Curtain | control, percent_control, percent_state | ✅ Seeded |
| `cg` | Sensor | temp_current, humidity_value, battery_state | ✅ Seeded |
| `sp` | Camera | basic_private, motion_switch, motion_sensitivity | ❌ TODO |
| `mal` | Gateway | — (sub-device management) | ❌ TODO |
| `wnykq` | Air Purifier | switch, pm25, filter_life, mode, fan_speed | ❌ TODO |
| `cs` | Dehumidifier | switch, dehumidify_set, humidity_current | ❌ TODO |
| `jsq` | Humidifier | switch, humidity_set, mode | ❌ TODO |
| `robot` | Robot Vacuum | switch, mode, suction, clean_area | ❌ TODO |
| `cwwsq` | Pet Feeder | feed, feed_report, manual_feed | ❌ TODO |

---

## API Endpoint Summary (All Phases)

### Phase 1 — Product & DataPoint ✅
```
GET    /api/smarthome/categories
GET    /api/smarthome/categories/{categoryId}
POST   /api/smarthome/categories
DELETE /api/smarthome/categories/{categoryId}
GET    /api/smarthome/products/{deviceProfileId}/datapoints
GET    /api/smarthome/products/{deviceProfileId}/datapoints/{dpId}
POST   /api/smarthome/products/{deviceProfileId}/datapoints
DELETE /api/smarthome/datapoints/{dataPointId}
POST   /api/smarthome/products/{deviceProfileId}/apply-standard-dps
POST   /api/smarthome/categories/seed-standard
```

### Phase 2 — Home & Room ✅
```
POST   /api/smarthome/homes
GET    /api/smarthome/homes
GET    /api/smarthome/homes/{homeId}
PUT    /api/smarthome/homes/{homeId}
DELETE /api/smarthome/homes/{homeId}
POST   /api/smarthome/homes/{homeId}/members
GET    /api/smarthome/homes/{homeId}/members
PUT    /api/smarthome/homes/{homeId}/members/{memberId}
DELETE /api/smarthome/homes/{homeId}/members/{memberId}
POST   /api/smarthome/homes/{homeId}/rooms
GET    /api/smarthome/homes/{homeId}/rooms
PUT    /api/smarthome/homes/{homeId}/rooms/{roomId}
DELETE /api/smarthome/homes/{homeId}/rooms/{roomId}
POST   /api/smarthome/homes/{homeId}/rooms/{roomId}/devices
GET    /api/smarthome/homes/{homeId}/rooms/{roomId}/devices
DELETE /api/smarthome/homes/{homeId}/rooms/{roomId}/devices/{deviceId}
```

### Phase 3 — Device Lifecycle ✅
```
POST   /api/smarthome/pairing/token
GET    /api/smarthome/pairing/token/{token}
POST   /api/smarthome/pairing/confirm
POST   /api/smarthome/devices/{deviceId}/share
POST   /api/smarthome/share/accept
GET    /api/smarthome/devices/{deviceId}/shares
DELETE /api/smarthome/shares/{shareId}
POST   /api/smarthome/groups
GET    /api/smarthome/homes/{homeId}/groups
DELETE /api/smarthome/groups/{groupId}
POST   /api/smarthome/groups/{groupId}/devices
DELETE /api/smarthome/groups/{groupId}/devices/{deviceId}
GET    /api/smarthome/groups/{groupId}/devices
```

### Phase 4 — Smart Scenes 📋
```
POST   /api/smarthome/homes/{homeId}/scenes
GET    /api/smarthome/homes/{homeId}/scenes
GET    /api/smarthome/scenes/{sceneId}
PUT    /api/smarthome/scenes/{sceneId}
DELETE /api/smarthome/scenes/{sceneId}
POST   /api/smarthome/scenes/{sceneId}/execute
GET    /api/smarthome/scenes/{sceneId}/logs
PUT    /api/smarthome/scenes/{sceneId}/enable
PUT    /api/smarthome/scenes/{sceneId}/disable
```

### Phase 7 — Device Control & Services ❌
```
POST   /api/smarthome/devices/{deviceId}/commands      (send DP commands)
GET    /api/smarthome/devices/{deviceId}/status         (get current DP values)
POST   /api/smarthome/devices/{deviceId}/schedules      (create schedule)
GET    /api/smarthome/devices/{deviceId}/schedules      (list schedules)
DELETE /api/smarthome/devices/{deviceId}/schedules/{id} (delete schedule)
POST   /api/smarthome/groups/{groupId}/control          (batch control)
GET    /api/smarthome/weather/{homeId}                  (weather data)
POST   /api/smarthome/devices/{deviceId}/favorite       (toggle favorite)
GET    /api/smarthome/devices/{deviceId}/energy          (energy stats)
```

### Phase 8 — Notifications ❌
```
GET    /api/smarthome/messages                          (message center)
GET    /api/smarthome/messages/alarms                   (device alarms)
GET    /api/smarthome/messages/home                     (home activity)
PUT    /api/smarthome/messages/{messageId}/read         (mark as read)
PUT    /api/smarthome/notifications/settings            (DND, preferences)
```
