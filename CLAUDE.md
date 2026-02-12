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
