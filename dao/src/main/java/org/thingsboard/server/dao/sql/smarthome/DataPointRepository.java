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
package org.thingsboard.server.dao.sql.smarthome;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.thingsboard.server.dao.model.sql.DataPointEntity;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface DataPointRepository extends JpaRepository<DataPointEntity, UUID> {

    List<DataPointEntity> findByDeviceProfileIdOrderBySortOrder(UUID deviceProfileId);

    Optional<DataPointEntity> findByDeviceProfileIdAndDpId(UUID deviceProfileId, int dpId);

    Optional<DataPointEntity> findByDeviceProfileIdAndCode(UUID deviceProfileId, String code);

    @Modifying
    @Query("DELETE FROM DataPointEntity d WHERE d.deviceProfileId = :deviceProfileId")
    void deleteByDeviceProfileId(@Param("deviceProfileId") UUID deviceProfileId);

}
