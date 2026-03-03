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

import org.thingsboard.server.common.data.id.TenantId;
import org.thingsboard.server.common.data.smarthome.DataPoint;
import org.thingsboard.server.dao.Dao;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface DataPointDao extends Dao<DataPoint> {

    DataPoint save(TenantId tenantId, DataPoint dataPoint);

    List<DataPoint> findByDeviceProfileId(UUID deviceProfileId);

    Optional<DataPoint> findByDeviceProfileIdAndDpId(UUID deviceProfileId, int dpId);

    Optional<DataPoint> findByDeviceProfileIdAndCode(UUID deviceProfileId, String code);

    void removeByDeviceProfileId(UUID deviceProfileId);

}
