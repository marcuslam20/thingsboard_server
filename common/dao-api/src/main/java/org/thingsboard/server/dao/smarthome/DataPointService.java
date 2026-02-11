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

import org.thingsboard.server.common.data.id.DataPointId;
import org.thingsboard.server.common.data.id.DeviceProfileId;
import org.thingsboard.server.common.data.id.TenantId;
import org.thingsboard.server.common.data.smarthome.DataPoint;
import org.thingsboard.server.dao.entity.EntityDaoService;

import java.util.List;

public interface DataPointService extends EntityDaoService {

    DataPoint findDataPointById(TenantId tenantId, DataPointId dataPointId);

    List<DataPoint> findDataPointsByDeviceProfileId(DeviceProfileId deviceProfileId);

    DataPoint findDataPointByDeviceProfileIdAndDpId(DeviceProfileId deviceProfileId, int dpId);

    DataPoint findDataPointByDeviceProfileIdAndCode(DeviceProfileId deviceProfileId, String code);

    DataPoint saveDataPoint(DataPoint dataPoint);

    void deleteDataPoint(TenantId tenantId, DataPointId dataPointId);

    void deleteDataPointsByDeviceProfileId(DeviceProfileId deviceProfileId);

    List<DataPoint> applyStandardDpSet(TenantId tenantId, DeviceProfileId deviceProfileId, List<DataPoint> standardDps);

}
