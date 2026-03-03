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
package org.thingsboard.server.service.smarthome;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.thingsboard.common.util.JacksonUtil;
import org.thingsboard.server.common.data.id.TenantId;
import org.thingsboard.server.common.data.smarthome.DpMode;
import org.thingsboard.server.common.data.smarthome.DpType;
import org.thingsboard.server.common.data.smarthome.ProductCategory;
import org.thingsboard.server.dao.smarthome.ProductCategoryService;

@Service
@Slf4j
@RequiredArgsConstructor
public class StandardInstructionSetService {

    private final ProductCategoryService productCategoryService;

    public void seedStandardCategories(TenantId tenantId) {
        log.info("Seeding standard product categories for tenant [{}]", tenantId);

        seedCategory(tenantId, "dj", "Light", "lightbulb", buildLightDpSet());
        seedCategory(tenantId, "kg", "Switch", "toggle-switch", buildSwitchDpSet());
        seedCategory(tenantId, "cz", "Smart Plug", "power-plug", buildSmartPlugDpSet());
        seedCategory(tenantId, "wk", "Thermostat", "thermostat", buildThermostatDpSet());
        seedCategory(tenantId, "fs", "Fan", "fan", buildFanDpSet());
        seedCategory(tenantId, "ms", "Lock", "lock", buildLockDpSet());
        seedCategory(tenantId, "cl", "Curtain", "curtain", buildCurtainDpSet());
        seedCategory(tenantId, "cg", "Sensor", "sensor", buildSensorDpSet());

        log.info("Standard product categories seeded successfully for tenant [{}]", tenantId);
    }

    private void seedCategory(TenantId tenantId, String code, String name, String icon, JsonNode standardDpSet) {
        ProductCategory existing = productCategoryService.findProductCategoryByCode(tenantId, code);
        if (existing != null) {
            log.debug("Category [{}] already exists for tenant [{}], skipping", code, tenantId);
            return;
        }

        ProductCategory category = new ProductCategory();
        category.setTenantId(tenantId);
        category.setCode(code);
        category.setName(name);
        category.setIcon(icon);
        category.setStandardDpSet(standardDpSet);
        productCategoryService.saveProductCategory(category);
        log.info("Seeded category: {} ({})", name, code);
    }

    private JsonNode buildLightDpSet() {
        ArrayNode dps = JacksonUtil.newArrayNode();
        dps.add(buildDp(1, "switch_led", "Switch", DpType.BOOLEAN, DpMode.RW, null));
        dps.add(buildDp(2, "bright_value", "Brightness", DpType.VALUE, DpMode.RW, rangeConstraint(10, 1000, 1)));
        dps.add(buildDp(3, "temp_value", "Color Temperature", DpType.VALUE, DpMode.RW, rangeConstraint(0, 1000, 1)));
        dps.add(buildDp(4, "work_mode", "Work Mode", DpType.ENUM, DpMode.RW, enumConstraint("white", "colour", "scene", "music")));
        dps.add(buildDp(5, "colour_data", "Color Data", DpType.STRING, DpMode.RW, stringConstraint(255)));
        return dps;
    }

    private JsonNode buildSwitchDpSet() {
        ArrayNode dps = JacksonUtil.newArrayNode();
        dps.add(buildDp(1, "switch_1", "Switch 1", DpType.BOOLEAN, DpMode.RW, null));
        dps.add(buildDp(2, "switch_2", "Switch 2", DpType.BOOLEAN, DpMode.RW, null));
        dps.add(buildDp(3, "switch_3", "Switch 3", DpType.BOOLEAN, DpMode.RW, null));
        dps.add(buildDp(4, "countdown_1", "Countdown 1", DpType.VALUE, DpMode.RW, rangeConstraint(0, 86400, 1)));
        return dps;
    }

    private JsonNode buildSmartPlugDpSet() {
        ArrayNode dps = JacksonUtil.newArrayNode();
        dps.add(buildDp(1, "switch", "Switch", DpType.BOOLEAN, DpMode.RW, null));
        dps.add(buildDp(2, "countdown", "Countdown", DpType.VALUE, DpMode.RW, rangeConstraint(0, 86400, 1)));
        dps.add(buildDp(3, "cur_current", "Current", DpType.VALUE, DpMode.RO, rangeConstraint(0, 30000, 1)));
        dps.add(buildDp(4, "cur_power", "Power", DpType.VALUE, DpMode.RO, rangeConstraint(0, 50000, 1)));
        dps.add(buildDp(5, "cur_voltage", "Voltage", DpType.VALUE, DpMode.RO, rangeConstraint(0, 5000, 1)));
        return dps;
    }

    private JsonNode buildThermostatDpSet() {
        ArrayNode dps = JacksonUtil.newArrayNode();
        dps.add(buildDp(1, "switch", "Switch", DpType.BOOLEAN, DpMode.RW, null));
        dps.add(buildDp(2, "temp_set", "Target Temperature", DpType.VALUE, DpMode.RW, rangeConstraint(50, 350, 5)));
        dps.add(buildDp(3, "temp_current", "Current Temperature", DpType.VALUE, DpMode.RO, rangeConstraint(-200, 600, 1)));
        dps.add(buildDp(4, "mode", "Mode", DpType.ENUM, DpMode.RW, enumConstraint("auto", "cool", "heat", "fan_only", "dry")));
        dps.add(buildDp(5, "fan_speed", "Fan Speed", DpType.ENUM, DpMode.RW, enumConstraint("auto", "low", "medium", "high")));
        return dps;
    }

    private JsonNode buildFanDpSet() {
        ArrayNode dps = JacksonUtil.newArrayNode();
        dps.add(buildDp(1, "switch", "Switch", DpType.BOOLEAN, DpMode.RW, null));
        dps.add(buildDp(2, "fan_speed", "Fan Speed", DpType.ENUM, DpMode.RW, enumConstraint("1", "2", "3", "4")));
        dps.add(buildDp(3, "switch_horizontal", "Swing Horizontal", DpType.BOOLEAN, DpMode.RW, null));
        dps.add(buildDp(4, "countdown", "Countdown", DpType.VALUE, DpMode.RW, rangeConstraint(0, 86400, 1)));
        return dps;
    }

    private JsonNode buildLockDpSet() {
        ArrayNode dps = JacksonUtil.newArrayNode();
        dps.add(buildDp(1, "unlock_method_create", "Unlock Method Create", DpType.RAW, DpMode.WO, null));
        dps.add(buildDp(2, "unlock_method_delete", "Unlock Method Delete", DpType.RAW, DpMode.WO, null));
        dps.add(buildDp(3, "residual_electricity", "Battery Level", DpType.VALUE, DpMode.RO, rangeConstraint(0, 100, 1)));
        dps.add(buildDp(4, "alarm_lock", "Lock Alarm", DpType.ENUM, DpMode.RO, enumConstraint("wrong_finger", "wrong_password", "wrong_card", "wrong_face", "tongue_bad", "low_battery")));
        return dps;
    }

    private JsonNode buildCurtainDpSet() {
        ArrayNode dps = JacksonUtil.newArrayNode();
        dps.add(buildDp(1, "control", "Control", DpType.ENUM, DpMode.RW, enumConstraint("open", "stop", "close")));
        dps.add(buildDp(2, "percent_control", "Position", DpType.VALUE, DpMode.RW, rangeConstraint(0, 100, 1)));
        dps.add(buildDp(3, "percent_state", "Current Position", DpType.VALUE, DpMode.RO, rangeConstraint(0, 100, 1)));
        dps.add(buildDp(4, "mode", "Mode", DpType.ENUM, DpMode.RW, enumConstraint("morning", "night")));
        return dps;
    }

    private JsonNode buildSensorDpSet() {
        ArrayNode dps = JacksonUtil.newArrayNode();
        dps.add(buildDp(1, "temperature", "Temperature", DpType.VALUE, DpMode.RO, rangeConstraint(-400, 800, 1)));
        dps.add(buildDp(2, "humidity", "Humidity", DpType.VALUE, DpMode.RO, rangeConstraint(0, 100, 1)));
        dps.add(buildDp(3, "battery_state", "Battery State", DpType.ENUM, DpMode.RO, enumConstraint("low", "middle", "high")));
        dps.add(buildDp(4, "pir", "Motion Detected", DpType.ENUM, DpMode.RO, enumConstraint("pir", "none")));
        return dps;
    }

    private ObjectNode buildDp(int dpId, String code, String name, DpType dpType, DpMode mode, JsonNode constraints) {
        ObjectNode dp = JacksonUtil.newObjectNode();
        dp.put("dpId", dpId);
        dp.put("code", code);
        dp.put("name", name);
        dp.put("dpType", dpType.name());
        dp.put("mode", mode.name());
        if (constraints != null) {
            dp.set("constraints", constraints);
        }
        return dp;
    }

    private JsonNode rangeConstraint(int min, int max, int step) {
        ObjectNode c = JacksonUtil.newObjectNode();
        c.put("min", min);
        c.put("max", max);
        c.put("step", step);
        return c;
    }

    private JsonNode enumConstraint(String... values) {
        ObjectNode c = JacksonUtil.newObjectNode();
        ArrayNode arr = JacksonUtil.newArrayNode();
        for (String v : values) {
            arr.add(v);
        }
        c.set("values", arr);
        return c;
    }

    private JsonNode stringConstraint(int maxLen) {
        ObjectNode c = JacksonUtil.newObjectNode();
        c.put("maxLen", maxLen);
        return c;
    }

}
