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
package org.thingsboard.server.queue.provider;

import org.thingsboard.server.gen.transport.TransportProtos.ToSceneEngineMsg;
import org.thingsboard.server.gen.transport.TransportProtos.ToSceneEngineNotificationMsg;
import org.thingsboard.server.queue.TbQueueConsumer;
import org.thingsboard.server.queue.TbQueueProducer;
import org.thingsboard.server.queue.common.TbProtoQueueMsg;

/**
 * Queue factory for Scene Engine service.
 *
 * Creates 4 things:
 *
 * PRODUCERS (used by TB Core to SEND messages TO Scene Engine):
 *   1. SceneEngineMsgProducer          → sends trigger messages (execute scene)
 *   2. SceneEngineNotificationProducer → sends management notifications (CRUD sync)
 *
 * CONSUMERS (used by Scene Engine to RECEIVE messages FROM queue):
 *   3. SceneEngineMsgConsumer          → receives trigger messages
 *   4. SceneEngineNotificationConsumer → receives management notifications
 *
 * In monolithic mode: InMemory producer/consumer (same JVM, HashMap-based)
 * In microservice mode: Kafka producer/consumer (different JVMs, network-based)
 */
public interface TbSceneEngineQueueFactory {

    /**
     * Producer: Core → scene.trigger topic → Scene Engine
     * Used when: Controller executes Tap-to-Run, TimeScanner triggers schedule
     */
    TbQueueProducer<TbProtoQueueMsg<ToSceneEngineMsg>> createSceneEngineMsgProducer();

    /**
     * Producer: Core → scene.notifications topic → Scene Engine
     * Used when: Controller creates/updates/deletes/enables/disables a scene
     */
    TbQueueProducer<TbProtoQueueMsg<ToSceneEngineNotificationMsg>> createSceneEngineNotificationsMsgProducer();

    /**
     * Consumer: Scene Engine ← scene.trigger topic
     * SceneExecutor consumes these and runs scene actions
     */
    TbQueueConsumer<TbProtoQueueMsg<ToSceneEngineMsg>> createSceneEngineMsgConsumer();

    /**
     * Consumer: Scene Engine ← scene.notifications topic
     * ScheduleCacheManager consumes these and syncs cache
     */
    TbQueueConsumer<TbProtoQueueMsg<ToSceneEngineNotificationMsg>> createSceneEngineNotificationsMsgConsumer();
}
