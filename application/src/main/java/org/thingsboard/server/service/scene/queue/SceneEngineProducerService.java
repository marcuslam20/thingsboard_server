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
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.thingsboard.server.common.data.id.TenantId;
import org.thingsboard.server.common.msg.queue.TopicPartitionInfo;
import org.thingsboard.server.gen.transport.TransportProtos.SceneMgmtMsgProto;
import org.thingsboard.server.gen.transport.TransportProtos.SceneMgmtMsgType;
import org.thingsboard.server.gen.transport.TransportProtos.ToSceneEngineMsg;
import org.thingsboard.server.gen.transport.TransportProtos.ToSceneEngineNotificationMsg;
import org.thingsboard.server.queue.TbQueueProducer;
import org.thingsboard.server.queue.common.TbProtoQueueMsg;
import org.thingsboard.server.queue.provider.TbSceneEngineQueueFactory;
import org.thingsboard.server.queue.settings.TbQueueSceneEngineSettings;
import org.thingsboard.server.queue.discovery.TopicService;
import org.thingsboard.server.queue.util.TbCoreComponent;

import java.util.UUID;

/**
 * Service that TB Core uses to send messages TO the Scene Engine via queue.
 *
 * Two types of messages:
 *
 * 1. TRIGGER messages (scene execution):
 *    pushSceneTriggerMsg() → topic: tb_scene_engine
 *    Used by: Controller (Tap-to-Run), TimeScanner (schedule)
 *    Consumed by: SceneEngineConsumerService → executes scene actions
 *
 * 2. MANAGEMENT notifications (cache sync):
 *    pushSceneMgmtMsg() → topic: tb_scene_engine.notifications
 *    Used by: Controller (CRUD operations)
 *    Consumed by: ScheduleCacheManager → syncs schedule cache
 *
 * In monolithic mode: InMemory producer (same JVM, HashMap)
 * In microservice mode: Kafka producer (different JVM, network)
 * Code is IDENTICAL — only the factory implementation changes.
 */
@Slf4j
@Service
@TbCoreComponent
@RequiredArgsConstructor
public class SceneEngineProducerService {

    private final TbSceneEngineQueueFactory sceneEngineQueueFactory;
    private final TopicService topicService;
    private final TbQueueSceneEngineSettings sceneEngineSettings;

    private TbQueueProducer<TbProtoQueueMsg<ToSceneEngineMsg>> triggerProducer;
    private TbQueueProducer<TbProtoQueueMsg<ToSceneEngineNotificationMsg>> notificationProducer;

    @PostConstruct
    public void init() {
        this.triggerProducer = sceneEngineQueueFactory.createSceneEngineMsgProducer();
        this.notificationProducer = sceneEngineQueueFactory.createSceneEngineNotificationsMsgProducer();
        log.info("SceneEngineProducerService initialized");
    }

    /**
     * Send a scene execution trigger to the Scene Engine.
     *
     * Called when:
     *   - User presses "execute" on Tap-to-Run scene
     *   - TimeScanner detects a schedule is due
     *   - Device status trigger fires (Phase 3)
     *
     * @param tenantId    the tenant that owns the scene
     * @param sceneId     UUID of the scene to execute
     * @param triggerType "MANUAL", "SCHEDULE", or "DEVICE_STATUS"
     */
    public void pushSceneTriggerMsg(TenantId tenantId, UUID sceneId, String triggerType) {
        // Build protobuf message
        // UUID = 128 bits = 2 × int64 (MSB = most significant bits, LSB = least significant bits)
        ToSceneEngineMsg msg = ToSceneEngineMsg.newBuilder()
                .setTenantIdMSB(tenantId.getId().getMostSignificantBits())
                .setTenantIdLSB(tenantId.getId().getLeastSignificantBits())
                .setSceneIdMSB(sceneId.getMostSignificantBits())
                .setSceneIdLSB(sceneId.getLeastSignificantBits())
                .setTriggerType(triggerType)
                .build();

        // Build TopicPartitionInfo — tells producer which topic to send to
        TopicPartitionInfo tpi = topicService.buildTopicPartitionInfo(
                sceneEngineSettings.getTopic(), null, null, false);

        // Wrap in TbProtoQueueMsg and send to queue
        triggerProducer.send(tpi, new TbProtoQueueMsg<>(sceneId, msg), null);

        log.debug("Pushed scene trigger: sceneId={}, trigger={}", sceneId, triggerType);
    }

    /**
     * Send a scene management notification to the Scene Engine.
     *
     * Called when:
     *   - Scene is created or updated → SCENE_UPDATED → sync to schedule cache
     *   - Scene is deleted → SCENE_DELETED → remove from cache
     *   - Scene is enabled → SCENE_ENABLED → add to cache
     *   - Scene is disabled → SCENE_DISABLED → remove from cache
     *
     * @param tenantId the tenant that owns the scene
     * @param sceneId  UUID of the scene
     * @param msgType  SCENE_UPDATED, SCENE_DELETED, SCENE_ENABLED, SCENE_DISABLED
     */
    public void pushSceneMgmtMsg(TenantId tenantId, UUID sceneId, SceneMgmtMsgType msgType) {
        SceneMgmtMsgProto mgmtMsg = SceneMgmtMsgProto.newBuilder()
                .setTenantIdMSB(tenantId.getId().getMostSignificantBits())
                .setTenantIdLSB(tenantId.getId().getLeastSignificantBits())
                .setSceneIdMSB(sceneId.getMostSignificantBits())
                .setSceneIdLSB(sceneId.getLeastSignificantBits())
                .setMsgType(msgType)
                .build();

        ToSceneEngineNotificationMsg msg = ToSceneEngineNotificationMsg.newBuilder()
                .setSceneMgmtMsg(mgmtMsg)
                .build();

        TopicPartitionInfo tpi = topicService.buildTopicPartitionInfo(
                sceneEngineSettings.getTopic(), null, null, false);

        notificationProducer.send(tpi, new TbProtoQueueMsg<>(sceneId, msg), null);

        log.debug("Pushed scene mgmt: sceneId={}, type={}", sceneId, msgType);
    }
}
