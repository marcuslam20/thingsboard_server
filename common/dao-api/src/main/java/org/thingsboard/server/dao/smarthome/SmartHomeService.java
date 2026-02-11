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

import org.thingsboard.server.common.data.id.SmartHomeId;
import org.thingsboard.server.common.data.id.TenantId;
import org.thingsboard.server.common.data.id.UserId;
import org.thingsboard.server.common.data.page.PageData;
import org.thingsboard.server.common.data.page.PageLink;
import org.thingsboard.server.common.data.smarthome.SmartHome;
import org.thingsboard.server.dao.entity.EntityDaoService;

import java.util.List;

public interface SmartHomeService extends EntityDaoService {

    SmartHome findSmartHomeById(TenantId tenantId, SmartHomeId smartHomeId);

    SmartHome saveSmartHome(SmartHome smartHome);

    PageData<SmartHome> findSmartHomesByTenantId(TenantId tenantId, PageLink pageLink);

    List<SmartHome> findSmartHomesByUserId(UserId userId);

    void deleteSmartHome(TenantId tenantId, SmartHomeId smartHomeId);
}
