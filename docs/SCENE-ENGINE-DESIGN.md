# Scene Engine Design — Copy Tuya Smart Scene

> Branch: `main` (backend) + `feature/tuya-ui` (admin-ui)
> Created: 2026-03-17
> Updated: 2026-03-17
> Status: Planning

---

## 1. Architecture Overview

### How ThingsBoard Works (Monolithic vs Microservice)

ThingsBoard is **1 codebase** that builds into **multiple deployable services**.
NOT separate projects — same code, different packaging.

```
thingsboard_server/              ← 1 codebase
├── application/                 ← Builds → tb-core (REST API)
├── rule-engine/                 ← Builds → tb-rule-engine
├── transport/mqtt/              ← Builds → tb-mqtt-transport
├── transport/http/              ← Builds → tb-http-transport
├── scene-engine/                ← Builds → tb-scene-engine ← NEW
├── common/queue/                ← SHARED: Kafka + In-memory abstraction
├── common/cache/                ← SHARED: Redis + Caffeine abstraction
├── common/data/                 ← SHARED: Data models
├── dao/                         ← SHARED: Database access
└── msa/
    ├── tb-node/                 ← Dockerfile for tb-core
    ├── transport/mqtt/          ← Dockerfile for mqtt-transport
    └── scene-engine/            ← Dockerfile for scene-engine ← NEW
```

### Two Deployment Modes (same code, different config)

```
MONOLITHIC (dev, test, < 10K devices):
┌─────────────────────────────────────────────────┐
│              1 JVM — thingsboard.jar             │
│                                                  │
│  TB Core + Rule Engine + Scene Engine            │
│  + MQTT Transport + HTTP Transport               │
│                                                  │
│  Queue: In-memory (services call each other      │
│         directly within same JVM)                │
│  Cache: Caffeine (local RAM)                     │
│  DB: PostgreSQL                                  │
│                                                  │
│  Config: TB_QUEUE_TYPE=in-memory                 │
│          CACHE_TYPE=caffeine                     │
└─────────────────────────────────────────────────┘

MICROSERVICE (production, 10K - 1M+ devices):
┌──────────┐ ┌──────────────┐ ┌───────────────┐
│ TB Core  │ │ TB Rule      │ │ Scene Engine  │
│ ×2-5     │ │ Engine ×2-10 │ │ ×3-10         │
│ REST API │ │ Device msgs  │ │ Triggers +    │
│ Scene    │ │ processing   │ │ Execution     │
│ CRUD     │ │              │ │               │
└────┬─────┘ └──────┬───────┘ └───────┬───────┘
     │              │                 │
     └──────────────┼─────────────────┘
                    │
             ┌──────▼──────┐
             │    KAFKA     │
             └──────┬───────┘
                    │
     ┌──────────────┼──────────────┐
     │              │              │
┌────▼─────┐ ┌─────▼────┐ ┌──────▼─────┐
│PostgreSQL│ │  Valkey   │ │ Zookeeper  │
│          │ │  (Redis)  │ │            │
└──────────┘ └──────────┘ └────────────┘

  Config: TB_QUEUE_TYPE=kafka
          CACHE_TYPE=redis
```

### Why This Approach (not a separate project)

Scene Engine is a **module within TB codebase** (like tb-rule-engine), NOT a separate project.

Benefits:
- Shares data models (SmartScene, DataPoint, Device) — no duplication
- Shares queue abstraction (TbQueueProducer/Consumer) — auto Kafka or in-memory
- Shares cache abstraction (TbCache) — auto Redis or Caffeine
- Shares DB connection pool — no separate config
- Dev in monolithic (easy debug) → Deploy as microservice (scale)
- Single build: `mvn clean install`

Business logic code does NOT change between modes:
```java
@Autowired
private TbQueueProducer<TbMsg> producer;
// Monolithic → in-memory method call
// Microservice → Kafka produce
// Code is THE SAME

@Autowired
private TbCache<String, SceneDetail> sceneCache;
// Monolithic → Caffeine local cache
// Microservice → Redis/Valkey distributed cache
// Code is THE SAME
```

---

## 2. Tuya Smart Scene Features

### Two Scene Types

#### TAP-TO-RUN
- **NO conditions** (no IF section)
- **Only actions** (THEN section)
- User presses button on app → execute all actions sequentially
- Can be placed on Home screen as shortcut
- Can be triggered by another automation's action

#### AUTOMATION
- **Has conditions** (IF section) — required, at least one
- **Has actions** (THEN section) — required, at least one
- **Has effective time** — when automation is active
- Condition types:
  - DEVICE_STATUS: when DP value matches condition
  - SCHEDULE: at specific time + repeat days
  - WEATHER: temperature, humidity, weather condition, sunrise/sunset
  - GEOFENCE: arrive/leave location
- Condition logic: ALL match (AND) / ANY match (OR)
- Auto-executes when conditions are met

### Data stored in Database (PostgreSQL)

Scene definitions are stored in DB (table: `smart_scene`).
Existing CRUD APIs handle create/read/update/delete.
When scene is created/updated → sync metadata to cache for fast lookup.

### Execution flow depends on scene type

```
TAP-TO-RUN execution:
  User press button → HTTP request → TB Core → execute actions directly
  → Uses TB's existing async RPC (fire-and-forget)
  → No Kafka needed (normal API traffic)

AUTOMATION execution:
  Trigger event (schedule/device/weather)
  → Queue message → Scene Engine evaluates conditions → execute actions
  → Uses Kafka for distributed processing at scale
```

---

## 3. JSON Schemas

### Conditions (AUTOMATION only)

```json
[
  {
    "conditionType": "DEVICE_STATUS",
    "entityId": "device-uuid",
    "dpCode": "temp_current",
    "operator": ">",
    "value": 28,
    "valueType": "NUMBER"
  },
  {
    "conditionType": "DEVICE_STATUS",
    "entityId": "device-uuid-2",
    "dpCode": "switch_led",
    "operator": "==",
    "value": true,
    "valueType": "BOOLEAN"
  },
  {
    "conditionType": "SCHEDULE",
    "timeZoneId": "Asia/Ho_Chi_Minh",
    "loops": "0111110",
    "time": "18:00",
    "date": "20260320"
  },
  {
    "conditionType": "WEATHER",
    "weatherType": "TEMPERATURE",
    "operator": ">",
    "value": 35,
    "latitude": 10.762,
    "longitude": 106.660
  },
  {
    "conditionType": "WEATHER",
    "weatherType": "SUNSET"
  },
  {
    "conditionType": "GEOFENCE",
    "geofenceAction": "ARRIVE",
    "latitude": 10.762,
    "longitude": 106.660,
    "radius": 200
  }
]
```

Schedule `loops` format (Tuya-compatible):
```
"0111110" = 7 chars, each = 1 day of week
 │││││││
 ││││││└── SUN (0 = no)
 │││││└─── SAT (0 = no)
 ││││└──── FRI (1 = yes)
 │││└───── THU (1 = yes)
 ││└────── WED (1 = yes)
 │└─────── TUE (1 = yes)
 └──────── MON (1 = yes)

"0000000" = one-time only (uses "date" field)
"1111111" = every day
```

### Actions (both TAP_TO_RUN and AUTOMATION)

```json
[
  {
    "actionType": "DEVICE_CONTROL",
    "entityId": "device-uuid",
    "executorProperty": {
      "dpCode": "switch_led",
      "dpValue": true
    }
  },
  {
    "actionType": "DELAY",
    "executorProperty": {
      "seconds": 5,
      "minutes": 0
    }
  },
  {
    "actionType": "DEVICE_CONTROL",
    "entityId": "device-uuid-2",
    "executorProperty": {
      "dpCode": "bright_value",
      "dpValue": 100
    }
  },
  {
    "actionType": "SCENE_RUN",
    "entityId": "another-scene-uuid"
  },
  {
    "actionType": "NOTIFICATION",
    "executorProperty": {
      "title": "AC turned on",
      "message": "Temperature > 28°C, AC set to 25°C"
    }
  },
  {
    "actionType": "SCENE_TOGGLE",
    "entityId": "automation-scene-uuid",
    "executorProperty": {
      "enabled": false
    }
  }
]
```

### Effective Time (AUTOMATION only)

```json
{
  "type": "ALL_DAY",
  "timeZoneId": "Asia/Ho_Chi_Minh"
}
```
```json
{
  "type": "CUSTOM",
  "start": "18:00",
  "end": "06:00",
  "loops": "1111100",
  "timeZoneId": "Asia/Ho_Chi_Minh"
}
```

---

## 4. Scene Engine Components

### 4.1 TimeScanner
- Runs every 15 seconds
- Acquires distributed lock via cache (only 1 scanner active)
- Scans cache sorted set for scenes due now
- Produces SceneTriggerMessage to queue
- Calculates next trigger time from loops + time
- Very lightweight: 50MB RAM, 1% CPU

### 4.2 DeviceEventRouter
- Queue consumer: subscribes to device telemetry stream
- Updates device state in cache (dpCode → current value)
- Checks cache for scenes watching this device
- Checks cooldown before producing trigger
- Scales horizontally with consumer group

### 4.3 SceneExecutor (Core)
- Queue consumer: scene trigger topic
- Loads scene detail from cache
- Checks enabled + effective time
- Evaluates conditions (AND/OR logic)
- Executes actions sequentially
- Handles DELAY by producing delayed message
- Logs execution result to DB

### 4.4 DelayedActionConsumer
- Polls delayed action queue every 1 second
- Checks executeAfter timestamp
- Executes remaining actions when time is due

### 4.5 WeatherService
- Polls OpenWeatherMap every 30 minutes
- Caches results (30min TTL)
- Triggers sunrise/sunset scenes

---

## 5. Queue Topics & Messages

Uses TB's queue abstraction (in-memory for monolithic, Kafka for microservice):

```
TOPICS:
1. tb_rule_engine (EXISTING) — device telemetry stream
2. scene.trigger  (NEW) — trigger events for scene evaluation
3. scene.delayed  (NEW) — delayed action continuation
4. scene.mgmt     (NEW) — CRUD sync events (DB → cache)
5. tb_core        (EXISTING) — RPC commands to devices
```

### SceneTriggerMessage
```json
{
  "sceneId": "uuid",
  "triggerType": "SCHEDULE | DEVICE_STATUS | MANUAL | WEATHER | SCENE_RUN",
  "tenantId": "uuid",
  "smartHomeId": "uuid",
  "triggerTime": 1742216400000,
  "triggerContext": {}
}
```

---

## 6. Cache Schema

Uses TB's cache abstraction (Caffeine for monolithic, Redis/Valkey for microservice):

```
1. SCHEDULE INDEX (Sorted Set)
   Key:     scene:schedule:{tenantId}
   Score:   next_trigger_time (Unix ms)
   Member:  sceneId

2. DEVICE WATCH INDEX (Set per device)
   Key:     scene:watch:{deviceId}
   Members: sceneId values

3. SCENE DETAIL CACHE (Hash)
   Key:     scene:detail:{sceneId}
   Fields:  full scene config
   TTL:     1 hour

4. DEVICE STATE CACHE (Hash)
   Key:     device:state:{deviceId}
   Fields:  dpCode → current value
   TTL:     none (realtime updates)

5. EXECUTION DEBOUNCE
   Key:     scene:cooldown:{sceneId}
   TTL:     60s (configurable)

6. WEATHER CACHE
   Key:     weather:{lat}:{lng}
   TTL:     30 minutes

MEMORY ESTIMATE (1M devices, 100K scenes): ≈ 350MB
```

---

## 7. Project Structure

```
thingsboard_server/
├── scene-engine/                              ← NEW module
│   ├── pom.xml                                  (depends on common/*)
│   ├── src/main/java/org/thingsboard/server/scene/
│   │   ├── SceneEngineApplication.java        ← Spring Boot entry (microservice)
│   │   ├── scanner/
│   │   │   └── TimeScanner.java               ← Schedule trigger scanner
│   │   ├── router/
│   │   │   └── DeviceEventRouter.java         ← Device telemetry → scene trigger
│   │   ├── evaluator/
│   │   │   ├── ConditionEvaluator.java
│   │   │   ├── DeviceStatusEvaluator.java
│   │   │   ├── ScheduleEvaluator.java
│   │   │   ├── WeatherEvaluator.java
│   │   │   └── EffectiveTimeChecker.java
│   │   ├── executor/
│   │   │   ├── SceneExecutionService.java     ← Core: parse actions, execute
│   │   │   ├── DeviceControlAction.java       ← Send RPC to device
│   │   │   ├── DelayAction.java               ← Schedule delayed continuation
│   │   │   ├── SceneRunAction.java            ← Trigger another scene
│   │   │   ├── NotificationAction.java        ← Push FCM/APNs
│   │   │   └── SceneToggleAction.java         ← Enable/disable automation
│   │   ├── cache/
│   │   │   ├── SceneCacheManager.java         ← Sync DB → cache
│   │   │   └── DeviceStateCache.java          ← Track device DP values
│   │   ├── weather/
│   │   │   └── WeatherService.java            ← OpenWeatherMap polling
│   │   └── notification/
│   │       └── PushNotificationService.java   ← FCM/APNs
│   └── src/main/resources/
│       └── application.yml
│
├── application/                               ← Existing TB Core
│   └── .../controller/SmartSceneController.java
│       └── executeScene() — Phase 1: direct execution for TAP_TO_RUN
│       └── CRUD → produce scene.mgmt event to sync cache
│
├── msa/
│   └── scene-engine/                          ← Dockerfile for microservice mode
│       └── Dockerfile
│
└── docker/
    └── docker-compose.yml                     ← Add scene-engine service
```

---

## 8. SmartSceneController Changes (TB Core)

### Phase 1: Tap-to-Run (direct execution, no queue needed)
```
POST /scenes/{id}/execute
  → Load scene from DB
  → Parse actions JSON
  → For each action:
      DEVICE_CONTROL → async RPC (fire-and-forget, using TB actor system)
      DELAY → CompletableFuture.delayedExecutor()
      SCENE_RUN → recursive call
  → Log result to DB
  → Return
```

### Phase 2+: Automation (queue-based for scale)
```
Scene CRUD (create/update/delete)
  → Save to DB (existing)
  → Produce scene.mgmt event to queue
  → Scene Engine consumes → syncs cache (schedule index, device watch, etc.)
```

---

## 9. Docker Compose (Microservice Mode)

```yaml
# Added to docker/docker-compose.yml
scene-engine:
  image: ${DOCKER_REPO}/${SCENE_ENGINE_DOCKER_NAME}:${TB_VERSION}
  restart: always
  deploy:
    replicas: 3
  environment:
    - TB_QUEUE_TYPE=kafka
    - TB_KAFKA_SERVERS=kafka:9092
    - CACHE_TYPE=redis
    - REDIS_HOST=valkey
    - SPRING_DATASOURCE_URL=jdbc:postgresql://postgres:5432/thingsboard
    - OPENWEATHER_API_KEY=${OPENWEATHER_API_KEY}
    - SCENE_SCANNER_INTERVAL_MS=15000
    - SCENE_COOLDOWN_SECONDS=60
  depends_on:
    - kafka
    - valkey
    - postgres
```

---

## 10. Scale Guide

```
10K devices / 1K scenes:
  Mode: Monolithic (1 JVM)
  Queue: In-memory
  Cache: Caffeine
  → Scene Engine runs inside same JVM
  → No Kafka, no Redis needed

100K devices / 10K scenes:
  Mode: Microservice
  TB Core: 2, Rule Engine: 2, Scene Engine: 3
  Kafka: 3 brokers, 50 partitions
  Valkey: 1 instance, 200MB

1M devices / 100K scenes:
  Mode: Microservice
  TB Core: 5+, Rule Engine: 10+, Scene Engine: 10+
  Kafka: 5+ brokers, 100 partitions
  Valkey Cluster: 3 masters + 3 replicas, 2GB
```

---

## 11. Implementation Phases

### Phase 1: Tap-to-Run Real Execution ✅ DONE
- Modify SmartSceneController.executeScene() in TB Core
- Parse actions JSON → call async RPC for each device
- Support: DEVICE_CONTROL, DELAY, SCENE_RUN actions
- No queue needed — direct execution via TB actor system
- Async execution: returns RUNNING immediately, actions run in background thread pool
- DELAY uses ScheduledExecutorService (no Thread.sleep blocking)
- Test: press execute on app → devices actually respond ✅

### Phase 2: Schedule Trigger — Two Sub-Phases

Phase 2 is split into 2A (logic verification) and 2B (production scale).
Business logic code is IDENTICAL — only the infrastructure layer changes.

#### Phase 2A: In-Memory (Monolithic, < 10K scenes) ← CURRENT

Goal: Verify schedule logic works correctly before adding infrastructure complexity.

```
Architecture:
  ┌─────────────────────────────────────────────────────────┐
  │                   1 JVM (monolithic)                      │
  │                                                           │
  │  SmartSceneController                                     │
  │    → Scene CRUD → ScheduleCacheManager.syncScene()       │
  │                                                           │
  │  ScheduleCache (ConcurrentSkipListMap)                   │
  │    key: nextTriggerTime (long)                           │
  │    value: Set<SceneScheduleEntry>                        │
  │    ← in-memory sorted set, same as Redis ZSET concept   │
  │                                                           │
  │  TimeScanner (@Scheduled every 15s)                      │
  │    → query cache: nextTriggerTime <= now                 │
  │    → direct call: SceneExecutionService.executeScene()   │
  │    → calculate next trigger → update cache               │
  │                                                           │
  │  ScheduleCalculator                                       │
  │    → parse loops + time → compute next trigger timestamp │
  └─────────────────────────────────────────────────────────┘
```

Components:
- ScheduleCalculator: parse loops/time/date → next trigger time (pure logic)
- ScheduleCache: ConcurrentSkipListMap sorted by trigger time
- ScheduleCacheManager: sync DB ↔ cache on scene CRUD
- TimeScanner: @Scheduled(fixedDelay=15000) → scan + execute
- No Kafka, no Redis — all in-memory, all in same JVM

Test: create automation with schedule "18:00 Mon-Fri" → devices respond at 18:00 ✅

#### Phase 2B: TB Queue Abstraction (Microservice, 10K+ scenes)

Goal: Scale horizontally for production. Switch from direct calls to queue-based.

```
Architecture:
  ┌──────────────┐    ┌─────────────┐    ┌──────────────────┐
  │ TB Core ×2-5 │    │ Kafka       │    │ Scene Engine ×3-10│
  │              │    │             │    │                   │
  │ Scene CRUD   │──►│scene.mgmt   │──►│ ScheduleCache     │
  │              │    │             │    │ (Redis ZSET)      │
  │              │    │scene.trigger│◄──│ TimeScanner       │
  │              │    │             │──►│ SceneExecutor     │
  │              │    │scene.delayed│──►│ DelayedConsumer   │
  └──────────────┘    └─────────────┘    └──────────────────┘
```

Migration from 2A → 2B (business logic unchanged):
1. ScheduleCache: ConcurrentSkipListMap → Redis Sorted Set (Valkey)
2. TimeScanner: direct call → produce scene.trigger to Kafka
3. SceneExecutor: @Scheduled consumer → Kafka consumer
4. Scene CRUD sync: direct method → produce scene.mgmt to Kafka
5. DELAY handling: ScheduledExecutorService → scene.delayed Kafka topic

Infrastructure additions:
- Protobuf: ToSceneTriggerMsg.proto, SceneMgmtMsg.proto
- Queue: TbQueueSceneSettings, TbSceneQueueFactory
- Factory: InMemoryMonolithQueueFactory + KafkaMonolithQueueFactory (add methods)
- Config: thingsboard.yml queue.scene.topic settings
- Docker: scene-engine/ Dockerfile + docker-compose service

Scale capacity after 2B:
  10K scenes / 100K devices:  Scene Engine ×3,  Kafka 1 broker,  Valkey 200MB
  100K scenes / 1M devices:   Scene Engine ×10, Kafka 3 brokers, Valkey Cluster 2GB
  1M scenes / 10M devices:    Scene Engine ×20, Kafka 5 brokers, Valkey Cluster 8GB

Performance analysis:
- TimeScanner: 1 ZRANGEBYSCORE query every 15s = O(log N + M) where M = matched scenes
  100K scenes → ~0.1ms per scan (Redis), negligible CPU
- Bottleneck is EXECUTION not SCANNING:
  1000 scenes trigger at 18:00 → 1000 Kafka messages → distributed across 10 workers
  Each worker handles 100 scenes × 3 actions = 300 RPC calls in parallel
- Kafka throughput: 100K+ msg/s per broker → never the bottleneck for scenes

### Phase 3: Device Status Trigger
- DeviceEventRouter (queue consumer for device telemetry)
- Device state cache (track DP values)
- ConditionEvaluator (compare DP value vs condition)
- Effective time checking
- Test: temperature > 28 → AC turns on

### Phase 4: Delay + Scene Run + Scene Toggle
- DelayedActionConsumer (queue-based delayed execution)
- SceneRunAction (trigger another scene)
- SceneToggleAction (enable/disable automation)

### Phase 5: Push Notification
- FCM/APNs integration
- Device token registration API for mobile app
- NotificationAction in executor

### Phase 6: Weather Trigger
- OpenWeatherMap API integration
- Weather polling + cache (30min interval)
- Sunrise/Sunset trigger support

### Phase 7: Geofencing (optional)
- Mobile app sends location updates
- POST /api/smarthome/location/update endpoint
- Geofence calculator (Haversine distance)
- Arrive/Leave trigger
