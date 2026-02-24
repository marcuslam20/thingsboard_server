# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This workspace contains a fork of **ThingsBoard** (v4.2.0), an open-source IoT platform, extended with **Alexa Smart Home** and **Google Assistant Smart Home** integrations. The primary development happens in `thingsboard_server/`. A parallel directory `alexa_intergration/thingboard_server/` contains an integration-focused fork on the `feature/alexa-integration` branch.

Integration flow: **Voice Command → Cloud Function (Lambda/GCF) → ThingsBoard REST API (`/api/alexa/*`) → Device RPC → Physical Device**

## Workspace Layout

```
TB_SERVER/
├── thingsboard_server/          # Main ThingsBoard server (v4.2.0)
│   ├── application/             # Spring Boot app — controllers, services, actors
│   ├── common/                  # Shared modules (actor, cache, data, proto, queue, transport)
│   ├── dao/                     # JPA/Hibernate persistence (PostgreSQL, Cassandra, hybrid)
│   ├── rule-engine/             # Pluggable rule chain engine
│   ├── transport/               # Protocol transports (MQTT, HTTP, CoAP, LWM2M, SNMP)
│   ├── ui-ngx/                  # Angular 18 frontend
│   ├── msa/                     # Microservice deployment (Docker, JS executor, monitoring)
│   ├── docker/                  # Docker Compose configurations
│   ├── alexa-skill/             # AWS Lambda (Node.js/TypeScript, Serverless Framework)
│   └── google-assistant-skill/  # Google Cloud Function (Node.js/TypeScript)
└── alexa_intergration/          # Integration-focused fork (feature/alexa-integration branch)
```

## Build Commands

All Maven commands run from `thingsboard_server/`. Requires **Java 17** and **Node.js 18+**.

```bash
# Full build (no tests) — standard dev build
MAVEN_OPTS="-Xmx1024m" NODE_OPTIONS="--max_old_space_size=4096" mvn -T2 clean install -DskipTests --also-make

# Build a specific module (e.g., application only)
mvn clean install -DskipTests --projects application --also-make

# Build protobuf/gRPC modules only
MAVEN_OPTS="-Xmx1024m" mvn clean compile -T4 --also-make \
  --projects='common/cluster-api,common/edge-api,common/transport/coap,common/transport/mqtt,common/transport/transport-api'

# Build with Docker images
mvn clean install -Ddockerfile.skip=false
```

## Running Tests

```bash
# All unit tests
mvn test

# Single test class
mvn test -pl application -Dtest=AlexaControllerTest

# Single test method
mvn test -pl application -Dtest=AlexaControllerTest#testGetDevices

# Black-box integration tests (requires Docker images)
cd msa/black-box-tests
mvn clean install -DblackBoxTests.skip=false
mvn clean install -DblackBoxTests.skip=false -DblackBoxTests.hybridMode=true  # PostgreSQL + Cassandra
```

Test framework: JUnit 5 + Mockito (unit), TestNG + Testcontainers (black-box in `msa/black-box-tests/`).

## Frontend (ui-ngx/)

```bash
cd ui-ngx
npm install
npm start          # Dev server (0.0.0.0, 8048MB heap)
npm run build:prod # Production build → target/generated-resources/public/
npm run lint       # ESLint
```

Angular 18 with Angular Material, esbuild, Tailwind CSS, @ngrx/store for state management.

## Alexa Skill Lambda (alexa-skill/)

```bash
cd alexa-skill
npm install
npm run build       # TypeScript → dist/index.js
npm run deploy      # build + serverless deploy
```

Key files: `src/index.ts` (Lambda entry, routes by namespace), `src/handlers/` (discovery, powerController, authorization, stateReport), `src/services/thingsboard-client.ts` (REST client for `/api/alexa/*`), `src/services/device-mapper.ts`.

## Google Assistant Skill (google-assistant-skill/)

```bash
cd google-assistant-skill
npm install
npm run build       # TypeScript compile
./deploy.sh         # Deploy to Google Cloud Functions (asia-southeast1, nodejs20)
```

Uses `actions-on-google` SDK, Express, Axios. Entry point: `src/index.ts`.

## Architecture

### Backend (Java 17, Spring Boot 3.4.8)

- **Actor model** (`common/actor/`): App → Tenant → Device hierarchy for concurrent processing
- **Multi-tenancy**: All queries scoped by `TenantId`; entity IDs use typed wrappers (`TenantId`, `DeviceId`, `UserId`) around UUIDs
- **Rule engine** (`rule-engine/`): Pluggable rule chain for IoT data processing, supports TBEL and JavaScript scripting
- **Transport abstraction**: Protocol-specific transports (MQTT via Netty, HTTP, CoAP via Californium, LWM2M via Leshan, SNMP) all feed into a common message pipeline
- **Message queuing**: Kafka or RabbitMQ abstraction (`common/queue/`) for microservice mode
- **Persistence**: PostgreSQL (entities) + optional Cassandra or EDQS (time-series); JPA/Hibernate ORM
- **Cache**: Redis/Valkey via Jedis
- **Inter-service**: Protobuf + gRPC (`common/proto/`)

### Alexa Integration

- **REST Controller**: `application/.../controller/AlexaController.java` → `/api/alexa/*` endpoints
- **Services**: `application/.../service/alexa/` — `AlexaService` (device discovery, RPC commands), `AlexaOAuth2Service` (token lifecycle)
- **OAuth2 flow**: `GET /api/alexa/oauth/authorize` → login → auth code → `POST /api/alexa/oauth/token` → access/refresh tokens
- **Device capabilities**: Stored in `device.additional_info` JSONB as `alexaCapabilities` (LIGHT, SWITCH, SMARTPLUG, TEMPERATURE_SENSOR, CONTACT_SENSOR, MOTION_SENSOR)
- **DB schema**: `dao/src/main/resources/sql/schema-alexa.sql` (`alexa_oauth2_tokens`, `alexa_oauth2_auth_codes` tables)

### Conventions

- Controllers extend `BaseController` (provides `getCurrentUser()`, `handleException()`, etc.)
- Services follow interface + `*Impl` pattern
- `@TbCoreComponent` beans load only in core service context
- Lombok used extensively (`@Data`, `@Builder`, `@RequiredArgsConstructor`)
- License headers required on all files (enforced by `license:format` Maven goal)

### Configuration

Main config: `application/src/main/resources/thingsboard.yml`

Key environment variables: `HTTP_BIND_PORT` (default 8080), `SPRING_DATASOURCE_URL`, `DATABASE_TS_TYPE` (sql/cassandra), `REDIS_HOST`/`VALKEY_HOST`, `KAFKA_*`.

### Docker (Microservice Mode)

From `thingsboard_server/docker/`:
```bash
./docker-create-log-folders.sh     # Create log dirs (requires sudo)
./docker-install-tb.sh --loadDemo  # Initial DB setup
./docker-start-services.sh         # Start all services
./docker-stop-services.sh          # Stop services
```

Database type set via `DATABASE` variable in `docker/.env` (`postgres` or `hybrid`). Cache type via `CACHE` variable (`valkey`, `valkey-cluster`, `valkey-sentinel`).

---

## Smart Home Feature — Tuya / Osprey Smart Home Clone

### Goal

Build a **complete Smart Home platform** on top of ThingsBoard that clones the functionality of **Tuya Smart** and **Osprey Smart Home** apps. The backend provides REST APIs consumed by:
- **Mobile app** (Android/iOS) — UI cloned from Osprey Smart Home app
- **Alexa / Google Assistant** — Voice control integration
- **IoT devices** — via ThingsBoard transport (MQTT/HTTP/CoAP)

### Mobile App Design Reference

UI/UX design is based on **Osprey Smart Home** app. Screenshots and screen designs are stored in:
```
docs/app-design/    # Osprey Smart Home app screenshots for UI reference
```
The mobile app team will clone these screens. Backend APIs must support every screen and user flow shown in the design reference.

### Branch: `feature/smart-home`

### Mobile App User Flow (maps to backend phases)

```
┌─────────────────────────────────────────────────────────┐
│ 1. ONBOARDING                                           │
│    Signup → Login → Create Home → Set Location/Timezone │
│    (Auth APIs: DONE, Home APIs: Phase 2)                │
├─────────────────────────────────────────────────────────┤
│ 2. HOME SCREEN                                          │
│    Home selector → Room tabs → Device grid per room     │
│    Quick status (online/offline, DP values)             │
│    (Phase 2: Home/Room APIs)                            │
├─────────────────────────────────────────────────────────┤
│ 3. ADD DEVICE                                           │
│    Select category → WiFi pairing → Assign to room      │
│    (Phase 1: Categories DONE, Phase 3: Pairing TODO)    │
├─────────────────────────────────────────────────────────┤
│ 4. DEVICE CONTROL                                       │
│    DP-based controls (toggle, slider, enum picker)      │
│    Real-time status updates                             │
│    (Phase 3: DP command/status APIs)                    │
├─────────────────────────────────────────────────────────┤
│ 5. SMART SCENES                                         │
│    Tap-to-Run → one-tap execute multiple actions        │
│    Automation → if condition then action                 │
│    Schedule → time-based triggers                       │
│    (Phase 4: Scene APIs DONE)                           │
├─────────────────────────────────────────────────────────┤
│ 6. HOME MANAGEMENT                                      │
│    Invite members → Manage roles → Share devices        │
│    (Phase 2: Members, Phase 3: Sharing)                 │
├─────────────────────────────────────────────────────────┤
│ 7. VOICE CONTROL                                        │
│    Alexa / Google Assistant integration                 │
│    (Phase 5: DONE)                                      │
└─────────────────────────────────────────────────────────┘
```

### Roadmap & Progress

#### Phase 1: Product & Data Point Management — DONE

Tuya-style product categorization and standard instruction sets (DP definitions).

**Completed files:**
- Data models: `ProductCategory.java`, `DataPoint.java`, `DpType.java`, `DpMode.java`, `ConnectivityType.java`
- Entity IDs: `ProductCategoryId.java`, `DataPointId.java`, `SmartHomeId.java`, `RoomId.java`, `SmartSceneId.java`
- Entity types: Added `PRODUCT_CATEGORY(44)`, `DATA_POINT(45)`, `SMART_HOME(46)`, `ROOM(47)`, `SMART_SCENE(48)` to `EntityType.java`
- DAO interfaces: `ProductCategoryService.java`, `DataPointService.java`, `ProductCategoryDao.java`, `DataPointDao.java`
- DAO implementations: `ProductCategoryServiceImpl.java`, `DataPointServiceImpl.java`, `JpaProductCategoryDao.java`, `JpaDataPointDao.java`
- JPA entities: `ProductCategoryEntity.java`, `DataPointEntity.java`
- Repositories: `ProductCategoryRepository.java`, `DataPointRepository.java`
- Controller: `SmartHomeProductController.java` — 10 endpoints under `/api/smarthome/`
- Service: `StandardInstructionSetService.java` — seeds 8 standard categories (dj, kg, cz, wk, fs, ms, cl, cg)
- Permissions: Updated `Resource.java`, `TenantAdminPermissions.java`, `CustomerUserPermissions.java`
- Modified: `DeviceProfile.java` (+categoryId, productModel, connectivityType), `DeviceProfileEntity.java`, `ModelConstants.java`, `EntityIdFactory.java`
- SQL schema: `schema-smarthome.sql` — tables `product_category`, `data_point`, device_profile ALTER

**API Endpoints (Phase 1):**
| Method | Endpoint | Auth |
|--------|----------|------|
| GET | `/api/smarthome/categories` | TENANT_ADMIN, CUSTOMER_USER |
| GET | `/api/smarthome/categories/{categoryId}` | TENANT_ADMIN, CUSTOMER_USER |
| POST | `/api/smarthome/categories` | TENANT_ADMIN |
| DELETE | `/api/smarthome/categories/{categoryId}` | TENANT_ADMIN |
| GET | `/api/smarthome/products/{deviceProfileId}/datapoints` | TENANT_ADMIN, CUSTOMER_USER |
| GET | `/api/smarthome/products/{deviceProfileId}/datapoints/{dpId}` | TENANT_ADMIN, CUSTOMER_USER |
| POST | `/api/smarthome/products/{deviceProfileId}/datapoints` | TENANT_ADMIN |
| DELETE | `/api/smarthome/datapoints/{dataPointId}` | TENANT_ADMIN |
| POST | `/api/smarthome/products/{deviceProfileId}/apply-standard-dps` | TENANT_ADMIN |
| POST | `/api/smarthome/categories/seed-standard` | TENANT_ADMIN |

#### Phase 2: Smart Home & Room Management — DONE

CRUD for smart homes (families), members, rooms, and device-room assignments.

**Completed files:**
- Data models: `SmartHome.java`, `SmartHomeMember.java`, `Room.java`, `RoomDevice.java`
- Enums: `SmartHomeMemberRole.java`, `SmartHomeMemberStatus.java`
- JPA entities: `SmartHomeEntity.java`, `SmartHomeMemberEntity.java`, `RoomEntity.java`, `RoomDeviceEntity.java`, `RoomDeviceCompositeId.java`
- Repositories: `SmartHomeRepository.java`, `SmartHomeMemberRepository.java`, `RoomRepository.java`, `RoomDeviceRepository.java`
- DAO: interfaces + JPA impls for SmartHome, SmartHomeMember, Room, RoomDevice
- Services: `SmartHomeService.java`, `SmartHomeMemberService.java`, `RoomService.java`, `RoomDeviceService.java` (+ impls)
- Controller: `SmartHomeController.java` — 16 endpoints under `/api/smarthome/homes/`

**API Endpoints (Phase 2):**
| Method | Endpoint | Auth |
|--------|----------|------|
| POST | `/api/smarthome/homes` | TENANT_ADMIN, CUSTOMER_USER |
| GET | `/api/smarthome/homes` | TENANT_ADMIN, CUSTOMER_USER |
| GET | `/api/smarthome/homes/{homeId}` | TENANT_ADMIN, CUSTOMER_USER |
| PUT | `/api/smarthome/homes/{homeId}` | TENANT_ADMIN, CUSTOMER_USER |
| DELETE | `/api/smarthome/homes/{homeId}` | TENANT_ADMIN, CUSTOMER_USER |
| POST | `/api/smarthome/homes/{homeId}/members` | TENANT_ADMIN, CUSTOMER_USER |
| GET | `/api/smarthome/homes/{homeId}/members` | TENANT_ADMIN, CUSTOMER_USER |
| PUT | `/api/smarthome/homes/{homeId}/members/{memberId}` | TENANT_ADMIN, CUSTOMER_USER |
| DELETE | `/api/smarthome/homes/{homeId}/members/{memberId}` | TENANT_ADMIN, CUSTOMER_USER |
| POST | `/api/smarthome/homes/{homeId}/rooms` | TENANT_ADMIN, CUSTOMER_USER |
| GET | `/api/smarthome/homes/{homeId}/rooms` | TENANT_ADMIN, CUSTOMER_USER |
| PUT | `/api/smarthome/homes/{homeId}/rooms/{roomId}` | TENANT_ADMIN, CUSTOMER_USER |
| DELETE | `/api/smarthome/homes/{homeId}/rooms/{roomId}` | TENANT_ADMIN, CUSTOMER_USER |
| POST | `/api/smarthome/homes/{homeId}/rooms/{roomId}/devices` | TENANT_ADMIN, CUSTOMER_USER |
| GET | `/api/smarthome/homes/{homeId}/rooms/{roomId}/devices` | TENANT_ADMIN, CUSTOMER_USER |
| DELETE | `/api/smarthome/homes/{homeId}/rooms/{roomId}/devices/{deviceId}` | TENANT_ADMIN, CUSTOMER_USER |

#### Phase 3: Device Lifecycle — DONE

Device pairing, sharing, and grouping.

**Completed files:**
- Enums: `DevicePairingStatus.java`, `DeviceShareStatus.java`
- Data models: `DevicePairingToken.java`, `DeviceShare.java`, `DeviceGroup.java`, `DeviceGroupMember.java`
- JPA entities: `DevicePairingTokenEntity.java`, `DeviceShareEntity.java`, `DeviceGroupEntity.java`, `DeviceGroupMemberEntity.java`, `DeviceGroupMemberCompositeId.java`
- Repositories: `DevicePairingTokenRepository.java`, `DeviceShareRepository.java`, `DeviceGroupRepository.java`, `DeviceGroupMemberRepository.java`
- DAO: interfaces + JPA impls for all 4 entities
- Services: `DevicePairingService.java`, `DeviceShareService.java`, `DeviceGroupService.java` (+ impls)
- Controller: `SmartHomeDeviceController.java` — 13 endpoints under `/api/smarthome/`

**API Endpoints (Phase 3):**
| Method | Endpoint | Auth |
|--------|----------|------|
| POST | `/api/smarthome/pairing/token` | TENANT_ADMIN, CUSTOMER_USER |
| GET | `/api/smarthome/pairing/token/{token}` | TENANT_ADMIN, CUSTOMER_USER |
| POST | `/api/smarthome/pairing/confirm` | TENANT_ADMIN, CUSTOMER_USER |
| POST | `/api/smarthome/devices/{deviceId}/share` | TENANT_ADMIN, CUSTOMER_USER |
| POST | `/api/smarthome/share/accept` | TENANT_ADMIN, CUSTOMER_USER |
| GET | `/api/smarthome/devices/{deviceId}/shares` | TENANT_ADMIN, CUSTOMER_USER |
| DELETE | `/api/smarthome/shares/{shareId}` | TENANT_ADMIN, CUSTOMER_USER |
| POST | `/api/smarthome/groups` | TENANT_ADMIN, CUSTOMER_USER |
| GET | `/api/smarthome/homes/{homeId}/groups` | TENANT_ADMIN, CUSTOMER_USER |
| DELETE | `/api/smarthome/groups/{groupId}` | TENANT_ADMIN, CUSTOMER_USER |
| POST | `/api/smarthome/groups/{groupId}/devices` | TENANT_ADMIN, CUSTOMER_USER |
| DELETE | `/api/smarthome/groups/{groupId}/devices/{deviceId}` | TENANT_ADMIN, CUSTOMER_USER |
| GET | `/api/smarthome/groups/{groupId}/devices` | TENANT_ADMIN, CUSTOMER_USER |

#### Phase 4: Smart Scenes & Automation — DONE

Scene management, manual execution, and execution logging. CRUD + enable/disable for Tuya-style Tap-to-Run and Automation scenes.

**Note:** Automated triggers (schedule-based, device-status-based) and actual RPC execution to devices will be implemented in Phase 7 (Device Control & Services).

**Completed files:**
- Enums: `SceneType.java` (TAP_TO_RUN, AUTOMATION), `TriggerType.java` (MANUAL, SCHEDULE, DEVICE_STATUS)
- Data models: `SmartScene.java`, `SmartSceneLog.java`
- JPA entities: `SmartSceneEntity.java`, `SmartSceneLogEntity.java`
- Repositories: `SmartSceneRepository.java`, `SmartSceneLogRepository.java`
- DAO: `SmartSceneDao.java`, `SmartSceneLogDao.java` (interfaces + JPA impls)
- Services: `SmartSceneService.java`, `SmartSceneLogService.java` (+ impls)
- Controller: `SmartSceneController.java` — 9 endpoints under `/api/smarthome/`
- Permissions: Updated `Resource.java`, `TenantAdminPermissions.java`, `CustomerUserPermissions.java`
- Modified: `ModelConstants.java` (added smart_scene_log constants)

**API Endpoints (Phase 4):**
| Method | Endpoint | Auth |
|--------|----------|------|
| POST | `/api/smarthome/homes/{homeId}/scenes` | TENANT_ADMIN, CUSTOMER_USER |
| GET | `/api/smarthome/homes/{homeId}/scenes?sceneType=` | TENANT_ADMIN, CUSTOMER_USER |
| GET | `/api/smarthome/scenes/{sceneId}` | TENANT_ADMIN, CUSTOMER_USER |
| PUT | `/api/smarthome/scenes/{sceneId}` | TENANT_ADMIN, CUSTOMER_USER |
| DELETE | `/api/smarthome/scenes/{sceneId}` | TENANT_ADMIN, CUSTOMER_USER |
| POST | `/api/smarthome/scenes/{sceneId}/execute` | TENANT_ADMIN, CUSTOMER_USER |
| GET | `/api/smarthome/scenes/{sceneId}/logs` | TENANT_ADMIN, CUSTOMER_USER |
| PUT | `/api/smarthome/scenes/{sceneId}/enable` | TENANT_ADMIN, CUSTOMER_USER |
| PUT | `/api/smarthome/scenes/{sceneId}/disable` | TENANT_ADMIN, CUSTOMER_USER |

#### Phase 5: Voice Assistant Integration — DONE

Already implemented in `alexa-skill/` and `google-assistant-skill/`. Will need updates to use new Smart Home data model (rooms, scenes) for richer voice control.

#### Phase 6: Enhanced Authentication — TODO (NEXT)

- Phone registration + SMS OTP verification
- Social login (Facebook, Google, Apple) via TB OAuth2 framework
- Account deletion with grace period (GDPR)
- Guest mode (limited anonymous access)

#### Phase 7: Device Control & Services — TODO

- DP command API (`POST /api/smarthome/devices/{id}/commands`) — send DP values via TB RPC
- DP status API (`GET /api/smarthome/devices/{id}/status`) — get current DP values from TB attributes
- Device schedules (per-device time-based actions, recurring, countdown)
- Group control (`POST /api/smarthome/groups/{groupId}/control`) — batch RPC
- Weather service integration (proxy to weather API, per-home location)
- Energy monitoring APIs (aggregate TB time-series data)
- Favorites system

#### Phase 8: Notifications & Messages — TODO

- Push notification service (FCM for Android, APNs for iOS)
- Message center API (alarm/home/bulletin tabs)
- Device alarm configuration (DP threshold-based alerts)
- Do Not Disturb settings per user

### Full Tuya Feature Mapping

See **`docs/tuya-feature-mapping.md`** for comprehensive 136-feature comparison table with status tracking.

**Overall Progress: 60/136 features done (44%) — 14 planned — 52 TODO**

### Tuya Mapping Reference

| Tuya Concept | ThingsBoard Equivalent | Code |
|---|---|---|
| Product Category (dj, kg, cz...) | `ProductCategory` | `dj`=Light, `kg`=Switch, `cz`=Plug, `wk`=Thermostat, `fs`=Fan, `ms`=Lock, `cl`=Curtain, `cg`=Sensor |
| Standard Instruction Set | `standardDpSet` JSON in ProductCategory | Seeded via `StandardInstructionSetService` |
| Data Point (DP) | `DataPoint` entity | dpId (1-255), code, dpType, mode, constraints |
| DpType | `DpType` enum | BOOLEAN, VALUE, ENUM, STRING, RAW, FAULT |
| DpMode | `DpMode` enum | RW, RO, WO |
| Product | `DeviceProfile` + categoryId + DPs | Extended with categoryId, productModel, connectivityType |
| Family (Home) | `SmartHome` | owner_user_id, geo, timezone |
| Family Member | `SmartHomeMember` | role (OWNER/ADMIN/MEMBER), status |
| Room | `Room` | Per smart_home, with device assignments |
| Tap-to-Run / Automation | `SmartScene` | conditions + actions JSON, scene_type |
| Device Pairing | `DevicePairingToken` | Token-based, status flow |
| Device Sharing | `DeviceShare` | Share code, permissions |
| Device Group | `DeviceGroup` | Group by profile, batch control |

---

## Admin UI Migration — Angular to React

### Goal

Fully replace the existing **Angular 18** frontend (`ui-ngx/`) with a new **React 18** frontend (`admin-ui/`). The React UI must achieve feature parity with the Angular version before it can replace it in production.

### Tech Stack

| Layer | Angular (current) | React (target) |
|-------|-------------------|----------------|
| Framework | Angular 18.2 | React 18.3 |
| Build Tool | Angular CLI + esbuild | Vite 5.4 |
| Component Library | Angular Material | MUI 5.16 |
| State Management | @ngrx/store | Redux Toolkit 2.2 |
| Routing | Angular Router | React Router DOM 6.26 |
| HTTP Client | Angular HttpClient | Axios 1.7 |
| Forms | Angular Reactive Forms | React Hook Form 7.52 |
| i18n | ngx-translate | i18next + react-i18next |
| Charts | Custom + Plotly | ECharts 6.0 + echarts-for-react |
| Styling | SCSS + Tailwind CSS | Emotion + MUI styled |
| Real-time | WebSocket (native) | **TODO: WebSocket** |
| Testing | Jasmine + Karma | **TODO: Vitest + React Testing Library** |

### Directory Structure

```
admin-ui/
├── public/
├── src/
│   ├── api/                  # 24 Axios-based API service modules
│   ├── components/
│   │   ├── entity/           # EntityTable, SubEntityTable, ConfirmDialog
│   │   ├── form/             # (empty — TODO)
│   │   └── layout/           # MainLayout, Sidebar, TopBar
│   ├── guards/               # ProtectedRoute
│   ├── hooks/                # (empty — TODO)
│   ├── i18n/                 # i18next config + en.json
│   ├── models/               # 9 TypeScript model files
│   ├── pages/
│   │   ├── admin/            # Settings hub + 5 tabs
│   │   ├── alarms/           # Alarm list
│   │   ├── assets/           # Asset list + dialog
│   │   ├── asset-profiles/   # Asset profile list + dialog
│   │   ├── audit-logs/       # Audit log viewer
│   │   ├── api-usage/        # API usage stats (stub)
│   │   ├── customers/        # Customer list + detail + dialog
│   │   ├── dashboards/       # Dashboard system (grid, widgets, context)
│   │   ├── devices/          # Device list + detail + tabs + dialogs
│   │   ├── device-profiles/  # Device profile list + dialog
│   │   ├── edge/             # Edge list + detail + dialog
│   │   ├── entity-views/     # Entity view list + dialog
│   │   ├── gateways/         # Gateway page (stub)
│   │   ├── home/             # Home dashboard
│   │   ├── login/            # Login, Signup, ResetPassword
│   │   ├── notifications/    # Notification page (stub)
│   │   ├── ota-updates/      # OTA list + dialog
│   │   ├── profile/          # User profile + change password
│   │   ├── queues/           # Queue page (stub)
│   │   ├── resources/        # Resources page (stub)
│   │   ├── rule-chains/      # Rule chain list (no visual editor)
│   │   ├── security/         # Security settings + 3 tabs
│   │   ├── tenants/          # Tenant list + detail + dialog
│   │   ├── tenant-profiles/  # Tenant profile list + dialog
│   │   ├── users/            # User list + dialog
│   │   ├── widgets/          # Widget bundle list + detail
│   │   └── vc/               # Version control (stub)
│   ├── store/                # Redux store + auth slice
│   ├── theme/                # MUI theme config
│   └── utils/                # (empty — TODO)
├── index.html
├── package.json
├── tsconfig.json
└── vite.config.ts
```

### Commands

```bash
cd admin-ui
npm install           # Install dependencies
npm run dev           # Vite dev server on port 3000 (proxies /api → localhost:8080)
npm run build         # Production build → ../ui-ngx/target/generated-resources/public/
npm run preview       # Preview production build
npm run lint          # ESLint
```

### Overall Coverage: ~35-40%

**Total files:** ~103 TSX/TS | **Angular feature modules:** 35+ | **React pages implemented:** ~56

### Migration Phases

#### Migration Phase 1: Foundation & Core Infrastructure — DONE

Base project setup and core shared infrastructure.

**Completed:**
- [x] Vite + React 18 + TypeScript strict mode project scaffolding
- [x] MUI theme matching ThingsBoard color scheme (`#305680` primary)
- [x] Axios HTTP client with JWT interceptor + refresh token queue
- [x] Redux Toolkit store with auth slice (login, logout, loadUser)
- [x] React Router with auth-guarded routes
- [x] i18next setup with English translations (partial — ~40% coverage)
- [x] MainLayout (persistent sidebar + top bar)
- [x] Sidebar with authority-based menu filtering (SYS_ADMIN / TENANT_ADMIN / CUSTOMER_USER)
- [x] Generic EntityTable component (pagination, sort, search, multi-select, bulk delete)
- [x] SubEntityTable, ConfirmDialog shared components
- [x] Path aliases (`@/` → `src/`)
- [x] Vite manual chunk splitting (vendor, mui, redux)

**Known Issues to Fix:**
- `client.ts`: No request timeout configured — can hang indefinitely
- `client.ts`: JWT decode uses `atob()` which fails on non-standard encoding
- `client.ts:88`: Non-null assertion `token!` in `processQueue`
- `EntityTable.tsx:72`: Default `sortProperty='createdTime'` — not all entities have this field
- `ProtectedRoute.tsx`: No role-based route guard (only checks isAuthenticated, not authority)
- `hooks/`, `utils/`, `components/form/` directories are empty — need common hooks & utilities

#### Migration Phase 2: Authentication Pages — DONE (with gaps)

**Completed:**
- [x] LoginPage — email/password login with error display
- [x] SignupPage — user registration with tenant ID
- [x] ResetPasswordPage — send reset link by email

**NOT Covered (vs Angular):**
- [ ] Create Password page (from activation link)
- [ ] 2FA Login page (TOTP code entry after password)
- [ ] Force 2FA Setup page (first-time 2FA enrollment)
- [ ] Activation Link Expired page
- [ ] Password Reset Link Expired page
- [ ] OAuth2 / Social login buttons on login page
- [ ] Reset Expired Password page

**Known Issues:**
- `LoginPage.tsx:82`: Email regex `/^\S+@\S+$/i` too permissive (allows `a@b`)
- `SignupPage.tsx:57`: Uses `alert()` for success — needs toast notification
- `SignupPage.tsx`: No email verification step
- `SignupPage.tsx`: No terms of service checkbox
- `LoginPage.tsx`: No redirect to `returnUrl` query param after login

#### Migration Phase 3: Entity CRUD Pages — DONE (basic CRUD only)

All entity pages follow the pattern: List (EntityTable) + Create/Edit Dialog + optional Detail Page.

**Completed (list + dialog):**
- [x] Devices — list, create/edit dialog, detail page with 5 tabs (Details, Attributes, Telemetry, Alarms, Events)
- [x] Assets — list, create/edit dialog
- [x] Entity Views — list, create/edit dialog
- [x] Customers — list, create/edit dialog, detail page
- [x] Users — list, create/edit dialog
- [x] Tenants — list, create/edit dialog, detail page (SYS_ADMIN only)
- [x] Device Profiles — list, create/edit dialog
- [x] Asset Profiles — list, create/edit dialog
- [x] Tenant Profiles — list, create/edit dialog (SYS_ADMIN only)
- [x] Edge — list, create/edit dialog, detail page
- [x] OTA Updates — list, create/edit dialog
- [x] Alarms — list with severity/status filters + acknowledge/clear/delete actions

**NOT Covered (vs Angular):**
- [ ] **Device Relations tab** — Entity relation editor (critical TB feature)
- [ ] **Device Audit Log tab**
- [ ] **Device RPC debug terminal** — send/receive RPC commands
- [ ] **Device connectivity check** — test MQTT/HTTP/CoAP connection
- [ ] **Device copy/clone**
- [ ] **Device export/import**
- [ ] **Assign to Customer dialog** — shared dialog for devices, assets, entity views
- [ ] **Asset Detail page** with tabs (Attributes, Relations, Alarms, Events, Audit)
- [ ] **Customer sub-tabs** — Users, Devices, Assets, Dashboards, Edges under customer detail
- [ ] **Tenant sub-tabs** — Admin Users under tenant detail
- [ ] **Edge sub-tabs** — Devices, Assets, Entity Views, Dashboards, Rule Chains under edge detail
- [ ] **Alarm Comments** — add/view comments on alarms
- [ ] **Entity Relations** — dedicated relation management (no page exists in React)

**Known Issues:**
- Many dialogs: silent `.catch(console.error)` — no user-visible error notification
- DeviceDialog: finds default profile by `name === 'default'` — fragile
- All form labels ~60% hardcoded strings, not i18n

#### Migration Phase 4: Dashboard System — DONE (basic, ~40% of Angular)

**Completed:**
- [x] Dashboard list page with CRUD
- [x] Dashboard viewer/editor with toolbar
- [x] Dashboard grid layout (react-grid-layout drag-drop)
- [x] Widget add dialog
- [x] Widget config panel (single datasource)
- [x] Entity alias dialog (basic)
- [x] Dashboard settings dialog
- [x] DashboardContext (React Context for state management)
- [x] Widget registry pattern (plugin architecture)
- [x] 8 widget types: ValueCard, Gauge, TimeseriesChart, BarChart, SimpleTable, AlarmTable, RpcButton, Label

**NOT Covered (vs Angular — significant gaps):**
- [ ] **WebSocket real-time data** — currently polling every 5s, Angular uses WS subscriptions
- [ ] **Multi-datasource widgets** — config panel only supports 1 datasource
- [ ] **Dashboard states** — responsive layouts for mobile/tablet breakpoints
- [ ] **Dashboard export/import** (JSON)
- [ ] **Dashboard sharing** to customers
- [ ] **Dashboard fullscreen mode**
- [ ] **Timewindow synchronization** across widgets
- [ ] **Widget actions** (navigate to dashboard, open URL, custom JS)
- [ ] **Formula / calculated data keys**
- [ ] **Threshold-based colors** (partial in ValueCard only)
- [ ] **Widget error boundaries** — one crash takes down entire dashboard
- [ ] ~42 missing widget types: Map, PieChart, DigitalGauge, StateTransition, Image, Heatmap, SCADA, Markdown, HTML, Floorplan, NavigationCard, Indicator, StatusWidget, ControlWidget, InputWidget, etc.

**Critical Bugs to Fix:**
- `LabelWidget.tsx`: **XSS vulnerability** — uses `dangerouslySetInnerHTML` without sanitization
- `useWidgetData.ts`: **Memory leak** — `setInterval` not cleared when deps change, causes duplicate intervals
- `AlarmTableWidget.tsx`: Same interval memory leak
- `DashboardGrid.tsx`: All breakpoints use same layout — mobile layout broken
- `WidgetContainer.tsx`: Widget state lost when toggling fullscreen
- `GaugeWidget.tsx`: NaN displayed as 0 instead of "no data"
- `RpcButtonWidget.tsx`: No timeout on RPC calls — can hang indefinitely
- `DatasourceEditor.tsx`: Hardcoded limit of 100 devices

#### Migration Phase 5: Admin & Security Settings — DONE (partial)

**Completed:**
- [x] Admin hub page with tabs
- [x] General Settings tab
- [x] Mail Server (SMTP) tab
- [x] Home Settings tab
- [x] Notification Settings tab
- [x] Repository Settings tab
- [x] Security Settings tab
- [x] 2FA Settings tab
- [x] OAuth2 Clients tab (basic)

**NOT Covered:**
- [ ] Auto Commit Settings
- [ ] Trendz Analytics Settings
- [ ] Domain / SSL Settings
- [ ] AI Model Settings (full — has stub page only)

#### Migration Phase 6: Other Module Pages — Stubs Only (~15% each)

These pages exist but are mostly placeholder stubs:

| Page | File | Status | What's Missing |
|------|------|--------|----------------|
| Rule Chains | `RuleChainsPage.tsx` | List only | **Visual editor** (canvas-based, 100+ node types) — largest gap |
| Widget Library | `WidgetsPage.tsx` + `WidgetBundleDetailPage.tsx` | List + detail | Widget preview, import/export, widget type editor |
| Gateways | `GatewaysPage.tsx` | Stub | Full gateway dashboard (Angular renders a system dashboard) |
| Notifications | `NotificationsPage.tsx` | Stub | Inbox, Sent, Templates, Recipients, Rules — 5 sub-views |
| Audit Logs | `AuditLogsPage.tsx` | Basic table | Advanced filters, entity type filter, action filter |
| API Usage | `ApiUsagePage.tsx` | Stub | Usage charts, entity count cards, rate limit display |
| Queues | `QueuesPage.tsx` | Stub | Queue CRUD with strategy configuration |
| Resources | `ResourcesPage.tsx` | Stub | File upload, resource CRUD, LwM2M models |
| Version Control | `VcPage.tsx` | Stub | Entity export/import, version history, git integration |
| Mobile Center | `MobilePage.tsx` | Stub | Mobile app management, bundles, QR code widget |
| SCADA Symbol | `ScadaSymbolPage.tsx` | Stub | SCADA symbol upload + visual editor |
| Image Gallery | (none) | **Missing** | Image/resource upload and management |

### Migration Roadmap — Remaining Work

#### Phase M1: Critical Fixes (Priority: IMMEDIATE)

Fix bugs and security issues in existing code before adding new features.

- [ ] Fix XSS in `LabelWidget.tsx` — sanitize HTML with DOMPurify
- [ ] Fix memory leaks in `useWidgetData.ts` and `AlarmTableWidget.tsx` — proper interval cleanup
- [ ] Add global Error Boundary component at app root
- [ ] Add toast notification system (replace `alert()` and `console.error` silent catches)
- [ ] Add Axios request timeout (30s default)
- [ ] Fix email validation regex in `LoginPage.tsx`
- [ ] Fix `ProtectedRoute` to support role-based guards (not just isAuthenticated)
- [ ] Fix responsive dashboard layout in `DashboardGrid.tsx`

#### Phase M2: Complete Entity Management (Priority: HIGH)

Achieve full CRUD parity for all entity types with Angular.

- [ ] **Entity Relations** — relation editor component + tab on Device/Asset detail pages
- [ ] **Device Detail** — add Relations tab, Audit Log tab
- [ ] **Asset Detail page** — full page with tabs (Details, Attributes, Relations, Alarms, Events)
- [ ] **Customer Detail** — add Users, Devices, Assets, Dashboards sub-tabs using SubEntityTable
- [ ] **Tenant Detail** — add Admin Users sub-tab
- [ ] **Edge Detail** — add Devices, Assets, Entity Views, Dashboards, Rule Chains sub-tabs
- [ ] **Assign to Customer** shared dialog component
- [ ] **Alarm comments** — add/view/delete on alarm detail
- [ ] **Device copy/clone** action
- [ ] **Device/Dashboard export/import** (JSON)

#### Phase M3: WebSocket & Real-time (Priority: HIGH)

Replace polling with WebSocket for production-ready dashboards.

- [ ] Implement WebSocket client service (`/api/ws/plugins/telemetry`)
- [ ] Subscription manager (subscribe/unsubscribe by entity + keys)
- [ ] Update `useWidgetData` hook to use WS instead of polling
- [ ] Delta data updates (append new data points, not full refetch)
- [ ] Connection status indicator + auto-reconnect
- [ ] Timewindow synchronization across dashboard widgets

#### Phase M4: Dashboard System Completion (Priority: HIGH)

- [ ] Multi-datasource widget support in WidgetConfigPanel
- [ ] Dashboard states (mobile/tablet responsive breakpoints)
- [ ] Dashboard export/import JSON
- [ ] Dashboard sharing to customers
- [ ] Dashboard fullscreen mode
- [ ] Widget actions (navigate to dashboard, open URL, custom function)
- [ ] Formula / calculated data keys
- [ ] Threshold-based color rules for all chart/card widgets
- [ ] Add missing widget types (priority order):
  - [ ] PieChart widget
  - [ ] DigitalGauge widget
  - [ ] Map widget (OpenStreetMap + Leaflet)
  - [ ] Markdown/HTML widget
  - [ ] Image widget
  - [ ] NavigationCard widget
  - [ ] StatusWidget / IndicatorWidget
  - [ ] ControlWidget (toggle, slider, input)
  - [ ] Heatmap widget
  - [ ] SCADA symbol widget

#### Phase M5: Rule Chain Visual Editor (Priority: MEDIUM)

This is the most complex single feature — Angular uses a custom canvas-based editor.

- [ ] Evaluate React flow libraries (React Flow, rete.js, or custom canvas)
- [ ] Rule chain canvas component with drag-drop nodes
- [ ] Node palette (100+ rule node types from `/api/componentDescriptors`)
- [ ] Node configuration dialogs (different per node type)
- [ ] Connection drawing between nodes
- [ ] Rule chain import/export
- [ ] Debug mode (message tracing)
- [ ] Script editor for JS/TBEL nodes (Monaco Editor integration)

#### Phase M6: Complete Auth & Profile (Priority: MEDIUM)

- [ ] 2FA login page (TOTP code entry)
- [ ] Force 2FA setup page (first-time enrollment)
- [ ] 2FA setup in user profile (enable/disable, backup codes)
- [ ] OAuth2 / Social login buttons on login page
- [ ] Create Password page (from activation link)
- [ ] Link Expired pages (activation + password reset)
- [ ] User session management (view/terminate active sessions)
- [ ] Activation link generation + display

#### Phase M7: Complete Remaining Modules (Priority: MEDIUM)

- [ ] **Notification Center** — inbox, sent, templates, recipients, rules (5 sub-views)
- [ ] **Audit Logs** — advanced filters (entity type, action type, date range)
- [ ] **API Usage** — usage charts, entity counts, rate limit display
- [ ] **Resource Library** — file upload, resource CRUD, preview
- [ ] **Image Gallery** — image upload, preview, delete
- [ ] **Queue Management** — queue CRUD with submit/processing strategy config
- [ ] **Version Control** — entity export/import UI, version history viewer
- [ ] **Mobile Center** — mobile app management, app bundles, QR code widget settings
- [ ] **SCADA Symbol Editor** — SVG upload + interactive symbol editor
- [ ] **Gateways** — render gateway system dashboard

#### Phase M8: i18n, Testing & Polish (Priority: MEDIUM)

- [ ] Complete i18n — move all hardcoded strings to `en.json` (currently ~40% coverage, target 100%)
- [ ] Add language switcher component
- [ ] Add Vietnamese translation (`vi.json`)
- [ ] Set up Vitest + React Testing Library
- [ ] Write unit tests for: auth slice, API services, EntityTable, ProtectedRoute
- [ ] Write integration tests for: login flow, CRUD flows, dashboard rendering
- [ ] Add loading skeleton screens (replace spinners)
- [ ] Add keyboard navigation + ARIA labels (accessibility)
- [ ] Add dark mode theme toggle
- [ ] Performance: table virtualization for large datasets
- [ ] Performance: lazy load ECharts and heavy components
- [ ] Performance: React.memo on widget components

### Coverage Tracking Summary

| Module | Angular Pages | React Pages | Coverage | Target Phase |
|--------|--------------|-------------|----------|--------------|
| Auth (login/signup/2FA) | 10 | 3 | 30% | M6 |
| Devices | 15+ features | 9 features | 60% | M2 |
| Assets | 8 features | 2 features | 25% | M2 |
| Dashboards + Widgets | 50+ widgets | 8 widgets | 25% | M3, M4 |
| Rule Chains | Visual editor | List only | 10% | M5 |
| Customers | 8 sub-views | 3 views | 35% | M2 |
| Tenants | 4 sub-views | 3 views | 50% | M2 |
| Users | 5 features | 4 features | 70% | M6 |
| Edge | 8 sub-views | 3 views | 25% | M2 |
| Admin Settings | 10 tabs | 8 tabs | 70% | M7 |
| Notifications | 5 sub-views | 1 stub | 10% | M7 |
| Other (12 modules) | Full CRUD | Stubs | 10-15% | M7 |
| i18n | 100% | ~40% | 40% | M8 |
| Unit Tests | Has tests | 0 tests | 0% | M8 |
| WebSocket real-time | Full WS | Polling 5s | 0% | M3 |
| **OVERALL** | **100%** | **~35%** | **~35%** | — |

### Architecture Decisions

1. **State Management:** Redux Toolkit for global state (auth, notifications). React Context for scoped state (dashboard editing). Local state for component-specific UI.
2. **API Layer:** One file per entity domain in `src/api/`. All use shared Axios client with interceptors.
3. **Routing:** Flat route structure in `App.tsx`. No lazy loading yet — will add when bundle size becomes an issue.
4. **Forms:** React Hook Form for all dialogs. No shared form components yet (TODO).
5. **Widget System:** Registry pattern — `WidgetRegistry.ts` maps widget type strings to React components. New widgets register themselves at import time.

---

## Tuya UI Migration — Branch `feature/tuya-ui`

### Goal

Redesign the React admin-ui to match **Tuya IoT Platform** (platform.tuya.com) look and feel, while keeping all existing ThingsBoard functionality working.

### Key Principle

**UI truoc, features sau** — Change the visual appearance using existing features first. Add new Tuya-specific features later when the UI framework is stable.

### Backend Connection

```bash
# Vite dev server proxy
Backend: http://192.168.1.14:8080
Frontend: http://localhost:3000 (npm run dev)
```

### Screenshots Reference

Tuya Platform screenshots stored in `docs/tuya-platform-design/`:

| File | Content |
|------|---------|
| `01-home-dashboard.png` | Home page — welcome banner, tutorial steps, developer console cards |
| `02-ai-products.png` | Product Development — product list table with status/tags |
| `ai-products-tab.png` | Sidebar expanded — All Products, Devices, Logs, Firmware, Voice |
| `04-device-details.png` | Devices — summary cards, advanced filters, device table |
| `05-devices-debug.png` | Device Debug — product selector, real/virtual device debug |

### Tuya → ThingsBoard Concept Mapping

| Tuya Concept | ThingsBoard Equivalent |
|---|---|
| Product (on platform.tuya.com) | Device Profile |
| Device (individual hardware) | Device |
| Company (registered on platform) | Tenant |
| Company employee | TENANT_ADMIN |
| End user (Tuya Smart mobile app only) | CUSTOMER_USER |
| Tuya system admin | SYS_ADMIN |

### Sidebar Module Mapping

```
Tuya Module → ThingsBoard Route
──────────────────────────────────
Overview    → /home
Product
  All Products → /profiles/deviceProfiles
  Devices      → /entities/devices
  Device Logs  → /security-settings/auditLogs
  Firmware     → /otaUpdates
  Voice        → /entities/entityViews
App
  Dashboards   → /dashboards
  Widgets      → /widgets-bundles
Cloud
  Rule Chains  → /ruleChains
  Edges        → /edgeManagement/edges
  Gateways     → /gateways
AI Agent
  Assets       → /entities/assets
  Asset Prof.  → /profiles/assetProfiles
Data
  Alarms       → /alarms
  API Usage    → /usage
Operation
  Settings     → /settings/general
  Security     → /security-settings/general
  Customers    → /customers
  Users        → /users
  Tenants      → /tenants (SYS_ADMIN)
  Queues       → /queues (SYS_ADMIN)
  Notifications→ /notifications
  Resources    → /resources
Purchase       → /usage
VAS            → /resources
```

### Completed (2026-02-24)

| File | Change |
|------|--------|
| `src/theme/theme.ts` | Tuya orange `#FF6A00`, white sidebar, clean typography, rounded components |
| `src/components/layout/Sidebar.tsx` | Narrow 72px icon-based sidebar, 9 module groups, expand on click, orange active |
| `src/components/layout/TopBar.tsx` | Help/Documents/Tech Support + Language selector + Notifications + Profile menu |
| `src/components/layout/MainLayout.tsx` | Fixed sidebar + sticky topbar + max-width 1440px content |
| `src/pages/home/HomePage.tsx` | Welcome banner + tutorial stepper + Developer Console cards + My Space sidebar |

### Pending Decision

**Who can login to web platform?**
- **Option 1 (recommended, matches Tuya):** Web = SYS_ADMIN + TENANT_ADMIN only. CUSTOMER_USER = mobile app only.
- **Option 2:** All roles login web, but show different UI per role.

### TODO — Next Steps (Priority Order)

1. **Decide CUSTOMER_USER access** — block from web or keep?
2. **Product Development page** — redesign DeviceProfilesPage to match `02-ai-products.png`
3. **Devices page** — add summary cards, advanced filters to match `04-device-details.png`
4. **Device Debug tab** — add to DeviceDetailPage to match `05-devices-debug.png`
5. **Page headers** — standardize all pages with Tuya-style title + description + breadcrumbs
6. **Table style** — standardize to Tuya-style tables (hover, status chips, action buttons)
7. **Login page** — redesign to match Tuya (need screenshot)
8. **More screenshots** — capture Product Detail, Cloud Projects, Data Analytics from Tuya

### Git History

```
feature/tuya-ui
├── 3ade91f2 docs: Add Tuya UI migration progress tracking file
└── 0e61fd40 feat(admin-ui): Redesign UI framework to match Tuya IoT Platform
    └── a00d03ea (from feature/smart-home)
```
