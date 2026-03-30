/**
 * Copyright © 2016-2025 The Thingsboard Authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
package org.thingsboard.server.service.scene.queue;

import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.thingsboard.server.common.data.id.TenantId;
import org.thingsboard.server.common.data.smarthome.SmartScene;
import org.thingsboard.server.dao.smarthome.SmartSceneService;
import org.thingsboard.server.gen.transport.TransportProtos.SceneMgmtMsgProto;
import org.thingsboard.server.gen.transport.TransportProtos.ToSceneEngineMsg;
import org.thingsboard.server.gen.transport.TransportProtos.ToSceneEngineNotificationMsg;
import org.thingsboard.server.queue.TbQueueConsumer;
import org.thingsboard.server.queue.common.TbProtoQueueMsg;
import org.thingsboard.server.queue.provider.TbSceneEngineQueueFactory;
import org.thingsboard.server.queue.util.TbSceneEngineComponent;
import org.thingsboard.server.service.scene.SceneExecutionService;
import org.thingsboard.server.service.scene.schedule.ScheduleCacheManager;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;

/**
 * Consumes messages from Scene Engine queue topics and dispatches them.
 *
 * Two consumer loops running in separate threads:
 *
 * 1. TRIGGER consumer (topic: tb_scene_engine):
 *    Receives: "execute scene X with trigger type Y"
 *    Action:   Load scene from DB → SceneExecutionService.executeScene()
 *
 * 2. NOTIFICATION consumer (topic: tb_scene_engine.notifications):
 *    Receives: "scene X was updated/deleted/enabled/disabled"
 *    Action:   ScheduleCacheManager.onSceneCreatedOrUpdated/onSceneDeleted/...
 *
 * This service is annotated @TbSceneEngineComponent:
 *   - In monolithic mode: runs in same JVM as Controller (both load)
 *   - In microservice mode: runs in Scene Engine container only
 */
@Slf4j
@Service
@TbSceneEngineComponent
@RequiredArgsConstructor
public class SceneEngineConsumerService {

    private final TbSceneEngineQueueFactory sceneEngineQueueFactory;
    private final SceneExecutionService sceneExecutionService;
    private final ScheduleCacheManager scheduleCacheManager;
    private final SmartSceneService smartSceneService;

    @Value("${queue.scene-engine.poll-interval:25}")
    private long pollInterval;

    private TbQueueConsumer<TbProtoQueueMsg<ToSceneEngineMsg>> triggerConsumer;
    private TbQueueConsumer<TbProtoQueueMsg<ToSceneEngineNotificationMsg>> notificationConsumer;
    private ExecutorService consumerExecutor;
    private volatile boolean running = false;

    @PostConstruct
    public void init() {
        this.triggerConsumer = sceneEngineQueueFactory.createSceneEngineMsgConsumer();
        this.notificationConsumer = sceneEngineQueueFactory.createSceneEngineNotificationsMsgConsumer();

        // 2 threads: 1 for trigger consumer, 1 for notification consumer
        this.consumerExecutor = Executors.newFixedThreadPool(2);
        this.running = true;

        // Start both consumer loops
        consumerExecutor.submit(this::triggerConsumerLoop);
        consumerExecutor.submit(this::notificationConsumerLoop);

        log.info("SceneEngineConsumerService started: triggerConsumer + notificationConsumer");
    }

    @PreDestroy
    public void destroy() {
        running = false;
        if (triggerConsumer != null) triggerConsumer.unsubscribe();
        if (notificationConsumer != null) notificationConsumer.unsubscribe();
        if (consumerExecutor != null) {
            consumerExecutor.shutdownNow();
            try {
                consumerExecutor.awaitTermination(5, TimeUnit.SECONDS);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
            }
        }
        log.info("SceneEngineConsumerService stopped");
    }

    /**
     * Consumer loop for TRIGGER messages.
     *
     * Flow:
     *   poll() → get batch of messages → for each message:
     *     1. Extract sceneId and triggerType from protobuf
     *     2. Load scene from DB
     *     3. Validate (exists? enabled?)
     *     4. Execute scene actions
     *     5. Commit (acknowledge) the message
     */
    private void triggerConsumerLoop() {
        log.info("Scene trigger consumer loop started");
        triggerConsumer.subscribe();

        while (running) {
            try {
                List<TbProtoQueueMsg<ToSceneEngineMsg>> msgs = triggerConsumer.poll(pollInterval);
                if (msgs.isEmpty()) continue;

                for (TbProtoQueueMsg<ToSceneEngineMsg> msg : msgs) {
                    try {
                        handleTriggerMsg(msg.getValue());
                    } catch (Exception e) {
                        log.error("Error handling trigger message", e);
                    }
                }

                triggerConsumer.commit();
            } catch (Exception e) {
                if (running) {
                    log.error("Error in trigger consumer loop", e);
                    sleep(1000); // backoff on error
                }
            }
        }
        log.info("Scene trigger consumer loop stopped");
    }

    /**
     * Consumer loop for NOTIFICATION (management) messages.
     *
     * Flow:
     *   poll() → for each message:
     *     SCENE_UPDATED → load scene → sync to schedule cache
     *     SCENE_DELETED → remove from schedule cache
     *     SCENE_ENABLED → load scene → add to cache
     *     SCENE_DISABLED → remove from cache
     */
    private void notificationConsumerLoop() {
        log.info("Scene notification consumer loop started");
        notificationConsumer.subscribe();

        while (running) {
            try {
                List<TbProtoQueueMsg<ToSceneEngineNotificationMsg>> msgs = notificationConsumer.poll(pollInterval);
                if (msgs.isEmpty()) continue;

                for (TbProtoQueueMsg<ToSceneEngineNotificationMsg> msg : msgs) {
                    try {
                        handleNotificationMsg(msg.getValue());
                    } catch (Exception e) {
                        log.error("Error handling notification message", e);
                    }
                }

                notificationConsumer.commit();
            } catch (Exception e) {
                if (running) {
                    log.error("Error in notification consumer loop", e);
                    sleep(1000);
                }
            }
        }
        log.info("Scene notification consumer loop stopped");
    }

    /**
     * Handle a scene execution trigger.
     * Same logic as the old TimeScanner.processEntry() — just receives via queue now.
     */
    private void handleTriggerMsg(ToSceneEngineMsg msg) {
        UUID sceneId = new UUID(msg.getSceneIdMSB(), msg.getSceneIdLSB());
        TenantId tenantId = TenantId.fromUUID(new UUID(msg.getTenantIdMSB(), msg.getTenantIdLSB()));
        String triggerType = msg.getTriggerType();

        log.debug("Received trigger: sceneId={}, trigger={}", sceneId, triggerType);

        Optional<SmartScene> sceneOpt = smartSceneService.findById(sceneId);
        if (sceneOpt.isEmpty()) {
            log.debug("Scene {} not found, skipping", sceneId);
            return;
        }

        SmartScene scene = sceneOpt.get();
        if (!scene.isEnabled()) {
            log.debug("Scene '{}' is disabled, skipping", scene.getName());
            return;
        }

        log.info("Executing scene '{}' (trigger={})", scene.getName(), triggerType);
        sceneExecutionService.executeScene(tenantId, scene, triggerType);
    }

    /**
     * Handle a scene management notification.
     * Same logic as the old ScheduleCacheManager methods — just receives via queue now.
     */
    private void handleNotificationMsg(ToSceneEngineNotificationMsg msg) {
        if (!msg.hasSceneMgmtMsg()) return;

        SceneMgmtMsgProto mgmt = msg.getSceneMgmtMsg();
        UUID sceneId = new UUID(mgmt.getSceneIdMSB(), mgmt.getSceneIdLSB());

        log.debug("Received mgmt: sceneId={}, type={}", sceneId, mgmt.getMsgType());

        switch (mgmt.getMsgType()) {
            case SCENE_UPDATED, SCENE_ENABLED -> {
                Optional<SmartScene> sceneOpt = smartSceneService.findById(sceneId);
                sceneOpt.ifPresent(scheduleCacheManager::onSceneCreatedOrUpdated);
            }
            case SCENE_DELETED -> scheduleCacheManager.onSceneDeleted(sceneId);
            case SCENE_DISABLED -> scheduleCacheManager.onSceneDisabled(sceneId);
            default -> log.warn("Unknown scene mgmt type: {}", mgmt.getMsgType());
        }
    }

    private void sleep(long ms) {
        try {
            Thread.sleep(ms);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
    }
}
