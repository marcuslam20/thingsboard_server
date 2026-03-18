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
package org.thingsboard.server.dao.smarthome;

import org.thingsboard.server.common.data.smarthome.SmartHomeDevice;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface SmartHomeDeviceDao {

    SmartHomeDevice save(SmartHomeDevice smartHomeDevice);

    List<SmartHomeDevice> findBySmartHomeId(UUID smartHomeId);

    List<SmartHomeDevice> findBySmartHomeIdAndRoomId(UUID smartHomeId, UUID roomId);

    List<SmartHomeDevice> findBySmartHomeIdUnassigned(UUID smartHomeId);

    Optional<SmartHomeDevice> findByDeviceId(UUID deviceId);

    void removeBySmartHomeIdAndDeviceId(UUID smartHomeId, UUID deviceId);

    void removeBySmartHomeId(UUID smartHomeId);

    boolean existsByDeviceId(UUID deviceId);
}
