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
            // Update standardDpSet if it was empty or outdated
            existing.setStandardDpSet(standardDpSet);
            if (existing.getIcon() == null || existing.getIcon().isEmpty()) {
                existing.setIcon(icon);
            }
            productCategoryService.saveProductCategory(existing);
            log.info("Updated standardDpSet for existing category: {} ({})", name, code);
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

    // ──────────────────────────────────────────────────────────────────────
    // Light (dj) — Tuya standard instruction set for WiFi lights
    // Covers: on/off, brightness, color temp, color data, scenes, timers
    // ──────────────────────────────────────────────────────────────────────
    private JsonNode buildLightDpSet() {
        ArrayNode dps = JacksonUtil.newArrayNode();
        // Required DPs
        dps.add(buildDp(20, "switch_led", "Switch", DpType.BOOLEAN, DpMode.RW, null, true));
        dps.add(buildDp(21, "work_mode", "Work Mode", DpType.ENUM, DpMode.RW, enumConstraint("white", "colour", "scene", "music"), true));
        dps.add(buildDp(22, "bright_value_v2", "Brightness", DpType.VALUE, DpMode.RW, rangeConstraint(10, 1000, 1), true));
        dps.add(buildDp(23, "temp_value_v2", "Color Temperature", DpType.VALUE, DpMode.RW, rangeConstraint(0, 1000, 1), true));
        dps.add(buildDp(24, "colour_data_v2", "Color Data (HSV)", DpType.STRING, DpMode.RW, stringConstraint(255), true));
        // Optional DPs
        dps.add(buildDp(25, "scene_data_v2", "Scene Data", DpType.STRING, DpMode.RW, stringConstraint(255), false));
        dps.add(buildDp(26, "countdown_1", "Countdown", DpType.VALUE, DpMode.RW, rangeConstraint(0, 86400, 1), false));
        dps.add(buildDp(27, "control_data", "Control Data", DpType.STRING, DpMode.RW, stringConstraint(255), false));
        dps.add(buildDp(28, "debug_data", "Debug Data", DpType.STRING, DpMode.RO, stringConstraint(255), false));
        dps.add(buildDp(29, "rhythm_mode", "Rhythm Mode", DpType.STRING, DpMode.RW, stringConstraint(255), false));
        dps.add(buildDp(30, "sleep_mode", "Sleep Mode", DpType.RAW, DpMode.RW, null, false));
        dps.add(buildDp(31, "wakeup_mode", "Wake Up Mode", DpType.RAW, DpMode.RW, null, false));
        dps.add(buildDp(32, "power_memory", "Power-on Behavior", DpType.RAW, DpMode.RW, null, false));
        dps.add(buildDp(33, "do_not_disturb", "Do Not Disturb", DpType.BOOLEAN, DpMode.RW, null, false));
        dps.add(buildDp(34, "mic_music_data", "Music Data (Mic)", DpType.STRING, DpMode.WO, stringConstraint(255), false));
        dps.add(buildDp(40, "colour_data", "Color Data (Legacy)", DpType.STRING, DpMode.RW, stringConstraint(255), false));
        dps.add(buildDp(41, "scene_data", "Scene Data (Legacy)", DpType.STRING, DpMode.RW, stringConstraint(255), false));
        dps.add(buildDp(42, "flash_scene_1", "Flash Scene 1", DpType.STRING, DpMode.RW, stringConstraint(255), false));
        dps.add(buildDp(43, "flash_scene_2", "Flash Scene 2", DpType.STRING, DpMode.RW, stringConstraint(255), false));
        dps.add(buildDp(44, "flash_scene_3", "Flash Scene 3", DpType.STRING, DpMode.RW, stringConstraint(255), false));
        dps.add(buildDp(45, "flash_scene_4", "Flash Scene 4", DpType.STRING, DpMode.RW, stringConstraint(255), false));
        return dps;
    }

    // ──────────────────────────────────────────────────────────────────────
    // Switch (kg) — Tuya standard instruction set for wall switches
    // Supports up to 6 gangs with individual countdowns and relay status
    // ──────────────────────────────────────────────────────────────────────
    private JsonNode buildSwitchDpSet() {
        ArrayNode dps = JacksonUtil.newArrayNode();
        // Required — Gang switches
        dps.add(buildDp(1, "switch_1", "Switch 1", DpType.BOOLEAN, DpMode.RW, null, true));
        dps.add(buildDp(2, "switch_2", "Switch 2", DpType.BOOLEAN, DpMode.RW, null, false));
        dps.add(buildDp(3, "switch_3", "Switch 3", DpType.BOOLEAN, DpMode.RW, null, false));
        dps.add(buildDp(4, "switch_4", "Switch 4", DpType.BOOLEAN, DpMode.RW, null, false));
        dps.add(buildDp(5, "switch_5", "Switch 5", DpType.BOOLEAN, DpMode.RW, null, false));
        dps.add(buildDp(6, "switch_6", "Switch 6", DpType.BOOLEAN, DpMode.RW, null, false));
        // Countdowns per gang (seconds, 0 = off)
        dps.add(buildDp(7, "countdown_1", "Countdown 1", DpType.VALUE, DpMode.RW, rangeConstraint(0, 86400, 1), false));
        dps.add(buildDp(8, "countdown_2", "Countdown 2", DpType.VALUE, DpMode.RW, rangeConstraint(0, 86400, 1), false));
        dps.add(buildDp(9, "countdown_3", "Countdown 3", DpType.VALUE, DpMode.RW, rangeConstraint(0, 86400, 1), false));
        dps.add(buildDp(10, "countdown_4", "Countdown 4", DpType.VALUE, DpMode.RW, rangeConstraint(0, 86400, 1), false));
        dps.add(buildDp(11, "countdown_5", "Countdown 5", DpType.VALUE, DpMode.RW, rangeConstraint(0, 86400, 1), false));
        dps.add(buildDp(12, "countdown_6", "Countdown 6", DpType.VALUE, DpMode.RW, rangeConstraint(0, 86400, 1), false));
        // USB switch (for switches with USB port)
        dps.add(buildDp(16, "switch_usb1", "USB Switch 1", DpType.BOOLEAN, DpMode.RW, null, false));
        dps.add(buildDp(17, "switch_usb2", "USB Switch 2", DpType.BOOLEAN, DpMode.RW, null, false));
        // Relay status after power on
        dps.add(buildDp(14, "relay_status", "Power-on Behavior", DpType.ENUM, DpMode.RW, enumConstraint("off", "on", "memory"), false));
        // Backlight mode
        dps.add(buildDp(15, "light_mode", "Indicator Light Mode", DpType.ENUM, DpMode.RW, enumConstraint("relay", "pos", "none"), false));
        // Child lock
        dps.add(buildDp(13, "child_lock", "Child Lock", DpType.BOOLEAN, DpMode.RW, null, false));
        return dps;
    }

    // ──────────────────────────────────────────────────────────────────────
    // Smart Plug / Socket (cz) — Tuya standard instruction set
    // Supports: on/off, countdown, energy monitoring, overload protection
    // ──────────────────────────────────────────────────────────────────────
    private JsonNode buildSmartPlugDpSet() {
        ArrayNode dps = JacksonUtil.newArrayNode();
        // Required
        dps.add(buildDp(1, "switch_1", "Switch 1", DpType.BOOLEAN, DpMode.RW, null, true));
        dps.add(buildDp(2, "switch_2", "Switch 2", DpType.BOOLEAN, DpMode.RW, null, false));
        dps.add(buildDp(3, "switch_3", "Switch 3", DpType.BOOLEAN, DpMode.RW, null, false));
        dps.add(buildDp(4, "switch_4", "Switch 4", DpType.BOOLEAN, DpMode.RW, null, false));
        dps.add(buildDp(5, "switch_5", "Switch 5", DpType.BOOLEAN, DpMode.RW, null, false));
        dps.add(buildDp(6, "switch_6", "Switch 6", DpType.BOOLEAN, DpMode.RW, null, false));
        // USB switches
        dps.add(buildDp(7, "switch_usb1", "USB Switch 1", DpType.BOOLEAN, DpMode.RW, null, false));
        dps.add(buildDp(8, "switch_usb2", "USB Switch 2", DpType.BOOLEAN, DpMode.RW, null, false));
        dps.add(buildDp(9, "switch_usb3", "USB Switch 3", DpType.BOOLEAN, DpMode.RW, null, false));
        dps.add(buildDp(10, "switch_usb4", "USB Switch 4", DpType.BOOLEAN, DpMode.RW, null, false));
        dps.add(buildDp(11, "switch_usb5", "USB Switch 5", DpType.BOOLEAN, DpMode.RW, null, false));
        dps.add(buildDp(12, "switch_usb6", "USB Switch 6", DpType.BOOLEAN, DpMode.RW, null, false));
        // Countdowns per switch (seconds)
        dps.add(buildDp(101, "countdown_1", "Countdown 1", DpType.VALUE, DpMode.RW, rangeConstraint(0, 86400, 1), false));
        dps.add(buildDp(102, "countdown_2", "Countdown 2", DpType.VALUE, DpMode.RW, rangeConstraint(0, 86400, 1), false));
        dps.add(buildDp(103, "countdown_3", "Countdown 3", DpType.VALUE, DpMode.RW, rangeConstraint(0, 86400, 1), false));
        dps.add(buildDp(104, "countdown_4", "Countdown 4", DpType.VALUE, DpMode.RW, rangeConstraint(0, 86400, 1), false));
        dps.add(buildDp(105, "countdown_5", "Countdown 5", DpType.VALUE, DpMode.RW, rangeConstraint(0, 86400, 1), false));
        dps.add(buildDp(106, "countdown_6", "Countdown 6", DpType.VALUE, DpMode.RW, rangeConstraint(0, 86400, 1), false));
        // Energy monitoring
        dps.add(buildDp(17, "add_ele", "Electricity Added (kWh)", DpType.VALUE, DpMode.RO, rangeConstraint(0, 50000, 100), false));
        dps.add(buildDp(18, "cur_current", "Current (mA)", DpType.VALUE, DpMode.RO, rangeConstraint(0, 30000, 1), false));
        dps.add(buildDp(19, "cur_power", "Power (W/10)", DpType.VALUE, DpMode.RO, rangeConstraint(0, 50000, 1), false));
        dps.add(buildDp(20, "cur_voltage", "Voltage (V/10)", DpType.VALUE, DpMode.RO, rangeConstraint(0, 5000, 1), false));
        // Relay / child lock
        dps.add(buildDp(38, "relay_status", "Power-on Behavior", DpType.ENUM, DpMode.RW, enumConstraint("off", "on", "memory"), false));
        dps.add(buildDp(39, "child_lock", "Child Lock", DpType.BOOLEAN, DpMode.RW, null, false));
        dps.add(buildDp(40, "light_mode", "Indicator Light Mode", DpType.ENUM, DpMode.RW, enumConstraint("relay", "pos", "none"), false));
        // Overload protection
        dps.add(buildDp(41, "overcharge_switch", "Overcharge Switch", DpType.BOOLEAN, DpMode.RW, null, false));
        return dps;
    }

    // ──────────────────────────────────────────────────────────────────────
    // Thermostat (wk) — Tuya standard instruction set
    // Covers: HVAC modes, temperature, humidity, schedule, frost protection
    // ──────────────────────────────────────────────────────────────────────
    private JsonNode buildThermostatDpSet() {
        ArrayNode dps = JacksonUtil.newArrayNode();
        // Required
        dps.add(buildDp(1, "switch", "Switch", DpType.BOOLEAN, DpMode.RW, null, true));
        dps.add(buildDp(2, "temp_set", "Target Temperature", DpType.VALUE, DpMode.RW, rangeConstraint(50, 350, 5), true));
        dps.add(buildDp(3, "temp_current", "Current Temperature", DpType.VALUE, DpMode.RO, rangeConstraint(-200, 600, 1), true));
        dps.add(buildDp(4, "mode", "Mode", DpType.ENUM, DpMode.RW, enumConstraint("auto", "cold", "hot", "wind", "dry", "eco"), true));
        // Optional
        dps.add(buildDp(5, "fan_speed_enum", "Fan Speed", DpType.ENUM, DpMode.RW, enumConstraint("auto", "low", "middle", "high"), false));
        dps.add(buildDp(6, "humidity_set", "Target Humidity", DpType.VALUE, DpMode.RW, rangeConstraint(0, 100, 1), false));
        dps.add(buildDp(7, "humidity_current", "Current Humidity", DpType.VALUE, DpMode.RO, rangeConstraint(0, 100, 1), false));
        dps.add(buildDp(13, "temp_unit_convert", "Temperature Unit", DpType.ENUM, DpMode.RW, enumConstraint("c", "f"), false));
        dps.add(buildDp(14, "temp_correction", "Temperature Calibration", DpType.VALUE, DpMode.RW, rangeConstraint(-99, 99, 1), false));
        dps.add(buildDp(15, "humidity_correction", "Humidity Calibration", DpType.VALUE, DpMode.RW, rangeConstraint(-30, 30, 1), false));
        dps.add(buildDp(16, "upper_temp", "Upper Temperature Limit", DpType.VALUE, DpMode.RW, rangeConstraint(200, 500, 1), false));
        dps.add(buildDp(17, "lower_temp", "Lower Temperature Limit", DpType.VALUE, DpMode.RW, rangeConstraint(0, 200, 1), false));
        dps.add(buildDp(24, "valve_state", "Valve State", DpType.ENUM, DpMode.RO, enumConstraint("open", "close"), false));
        dps.add(buildDp(26, "child_lock", "Child Lock", DpType.BOOLEAN, DpMode.RW, null, false));
        dps.add(buildDp(27, "window_check", "Open Window Detection", DpType.BOOLEAN, DpMode.RW, null, false));
        dps.add(buildDp(28, "frost", "Frost Protection", DpType.BOOLEAN, DpMode.RW, null, false));
        dps.add(buildDp(36, "week_program", "Weekly Program", DpType.RAW, DpMode.RW, null, false));
        dps.add(buildDp(40, "sensor_choose", "Sensor Source", DpType.ENUM, DpMode.RW, enumConstraint("in", "out", "both"), false));
        dps.add(buildDp(45, "fault", "Fault", DpType.FAULT, DpMode.RO, null, false));
        return dps;
    }

    // ──────────────────────────────────────────────────────────────────────
    // Fan (fs) — Tuya standard instruction set
    // Covers: speed, swing (horizontal/vertical), natural wind, sleep, timer
    // ──────────────────────────────────────────────────────────────────────
    private JsonNode buildFanDpSet() {
        ArrayNode dps = JacksonUtil.newArrayNode();
        // Required
        dps.add(buildDp(1, "switch", "Switch", DpType.BOOLEAN, DpMode.RW, null, true));
        dps.add(buildDp(2, "fan_speed", "Fan Speed Level", DpType.ENUM, DpMode.RW, enumConstraint("1", "2", "3", "4", "5", "6"), true));
        // Optional
        dps.add(buildDp(3, "speed", "Speed Percentage", DpType.VALUE, DpMode.RW, rangeConstraint(1, 100, 1), false));
        dps.add(buildDp(4, "fan_direction", "Fan Direction", DpType.ENUM, DpMode.RW, enumConstraint("forward", "reverse"), false));
        dps.add(buildDp(5, "mode", "Mode", DpType.ENUM, DpMode.RW, enumConstraint("normal", "nature", "sleep", "baby", "smart"), false));
        dps.add(buildDp(7, "switch_horizontal", "Horizontal Swing", DpType.BOOLEAN, DpMode.RW, null, false));
        dps.add(buildDp(8, "switch_vertical", "Vertical Swing", DpType.BOOLEAN, DpMode.RW, null, false));
        dps.add(buildDp(9, "angle_horizontal", "Horizontal Swing Angle", DpType.ENUM, DpMode.RW, enumConstraint("30", "60", "90", "120", "180", "360"), false));
        dps.add(buildDp(10, "angle_vertical", "Vertical Swing Angle", DpType.ENUM, DpMode.RW, enumConstraint("30", "60", "90", "120"), false));
        dps.add(buildDp(11, "countdown", "Countdown (seconds)", DpType.VALUE, DpMode.RW, rangeConstraint(0, 86400, 1), false));
        dps.add(buildDp(12, "countdown_set", "Countdown Set (hours)", DpType.ENUM, DpMode.RW, enumConstraint("cancel", "1h", "2h", "3h", "4h", "5h", "6h", "7h", "8h"), false));
        dps.add(buildDp(13, "countdown_left", "Countdown Remaining", DpType.VALUE, DpMode.RO, rangeConstraint(0, 86400, 1), false));
        dps.add(buildDp(14, "temp_current", "Current Temperature", DpType.VALUE, DpMode.RO, rangeConstraint(-200, 600, 1), false));
        dps.add(buildDp(15, "humidity_current", "Current Humidity", DpType.VALUE, DpMode.RO, rangeConstraint(0, 100, 1), false));
        dps.add(buildDp(16, "switch_sound", "Beep Sound", DpType.BOOLEAN, DpMode.RW, null, false));
        dps.add(buildDp(17, "switch_led", "LED Display", DpType.BOOLEAN, DpMode.RW, null, false));
        dps.add(buildDp(19, "child_lock", "Child Lock", DpType.BOOLEAN, DpMode.RW, null, false));
        dps.add(buildDp(101, "light", "Light", DpType.BOOLEAN, DpMode.RW, null, false));
        dps.add(buildDp(102, "anion", "Anion (Negative Ion)", DpType.BOOLEAN, DpMode.RW, null, false));
        return dps;
    }

    // ──────────────────────────────────────────────────────────────────────
    // Lock (ms) — Tuya standard instruction set for smart locks
    // Covers: unlock records, temporary passwords, battery, alarms
    // ──────────────────────────────────────────────────────────────────────
    private JsonNode buildLockDpSet() {
        ArrayNode dps = JacksonUtil.newArrayNode();
        // Required
        dps.add(buildDp(1, "unlock_fingerprint", "Unlock by Fingerprint", DpType.VALUE, DpMode.RO, rangeConstraint(0, 999, 1), true));
        dps.add(buildDp(2, "unlock_password", "Unlock by Password", DpType.VALUE, DpMode.RO, rangeConstraint(0, 999, 1), true));
        dps.add(buildDp(3, "unlock_card", "Unlock by Card", DpType.VALUE, DpMode.RO, rangeConstraint(0, 999, 1), true));
        // Optional
        dps.add(buildDp(4, "unlock_face", "Unlock by Face", DpType.VALUE, DpMode.RO, rangeConstraint(0, 999, 1), false));
        dps.add(buildDp(5, "unlock_key", "Unlock by Key", DpType.VALUE, DpMode.RO, rangeConstraint(0, 999, 1), false));
        dps.add(buildDp(6, "unlock_remote", "Unlock by Remote", DpType.VALUE, DpMode.RO, rangeConstraint(0, 999, 1), false));
        dps.add(buildDp(7, "unlock_ble", "Unlock by Bluetooth", DpType.VALUE, DpMode.RO, rangeConstraint(0, 999, 1), false));
        dps.add(buildDp(8, "unlock_temporary", "Temporary Password Unlock", DpType.VALUE, DpMode.RO, rangeConstraint(0, 999, 1), false));
        dps.add(buildDp(9, "unlock_dynamic", "Dynamic Password Unlock", DpType.VALUE, DpMode.RO, rangeConstraint(0, 999, 1), false));
        dps.add(buildDp(10, "lock_motor_state", "Lock Motor State", DpType.BOOLEAN, DpMode.RO, null, false));
        dps.add(buildDp(11, "alarm_lock", "Lock Alarm", DpType.ENUM, DpMode.RO,
                enumConstraint("wrong_finger", "wrong_password", "wrong_card", "wrong_face", "tongue_bad",
                        "low_battery", "pry", "force_lock", "open_inside", "open_in_storm", "unclosed"), false));
        dps.add(buildDp(12, "closed_opened", "Door Sensor", DpType.ENUM, DpMode.RO, enumConstraint("closed", "opened", "timeout_unclosed"), false));
        dps.add(buildDp(13, "residual_electricity", "Battery Level (%)", DpType.VALUE, DpMode.RO, rangeConstraint(0, 100, 1), true));
        dps.add(buildDp(14, "reverse_lock", "Anti-Lock from Inside", DpType.BOOLEAN, DpMode.RO, null, false));
        dps.add(buildDp(15, "lock_record", "Lock Record", DpType.RAW, DpMode.RO, null, false));
        dps.add(buildDp(16, "open_close", "Lock/Unlock Command", DpType.BOOLEAN, DpMode.RW, null, false));
        dps.add(buildDp(19, "hijack", "Hijack Alarm", DpType.BOOLEAN, DpMode.RO, null, false));
        dps.add(buildDp(20, "doorbell", "Doorbell", DpType.BOOLEAN, DpMode.RO, null, false));
        dps.add(buildDp(21, "message", "Message Push", DpType.RAW, DpMode.RO, null, false));
        dps.add(buildDp(33, "unlock_method_create", "Create Unlock Method", DpType.RAW, DpMode.WO, null, false));
        dps.add(buildDp(34, "unlock_method_delete", "Delete Unlock Method", DpType.RAW, DpMode.WO, null, false));
        dps.add(buildDp(35, "unlock_method_modify", "Modify Unlock Method", DpType.RAW, DpMode.WO, null, false));
        dps.add(buildDp(36, "temporary_password_creat", "Create Temporary Password", DpType.STRING, DpMode.RW, stringConstraint(255), false));
        dps.add(buildDp(37, "temporary_password_delete", "Delete Temporary Password", DpType.STRING, DpMode.RW, stringConstraint(255), false));
        dps.add(buildDp(44, "synch_method", "Sync Unlock Methods", DpType.BOOLEAN, DpMode.WO, null, false));
        dps.add(buildDp(46, "automatic_lock", "Auto Lock", DpType.BOOLEAN, DpMode.RW, null, false));
        dps.add(buildDp(47, "auto_lock_time", "Auto Lock Delay (sec)", DpType.VALUE, DpMode.RW, rangeConstraint(0, 120, 1), false));
        return dps;
    }

    // ──────────────────────────────────────────────────────────────────────
    // Curtain / Window Covering (cl) — Tuya standard instruction set
    // Covers: open/close/stop, position, motor direction, calibration, timer
    // ──────────────────────────────────────────────────────────────────────
    private JsonNode buildCurtainDpSet() {
        ArrayNode dps = JacksonUtil.newArrayNode();
        // Required
        dps.add(buildDp(1, "control", "Control", DpType.ENUM, DpMode.RW, enumConstraint("open", "stop", "close"), true));
        dps.add(buildDp(2, "percent_control", "Position Control (%)", DpType.VALUE, DpMode.RW, rangeConstraint(0, 100, 1), true));
        dps.add(buildDp(3, "percent_state", "Current Position (%)", DpType.VALUE, DpMode.RO, rangeConstraint(0, 100, 1), true));
        // Optional
        dps.add(buildDp(4, "mode", "Mode", DpType.ENUM, DpMode.RW, enumConstraint("morning", "night"), false));
        dps.add(buildDp(5, "control_back", "Motor Direction", DpType.ENUM, DpMode.RW, enumConstraint("forward", "back"), false));
        dps.add(buildDp(6, "work_state", "Work State", DpType.ENUM, DpMode.RO, enumConstraint("opening", "closing", "stop"), false));
        dps.add(buildDp(7, "situation_set", "Scenario Setting", DpType.ENUM, DpMode.RW, enumConstraint("fully_open", "fully_close", "half_open"), false));
        dps.add(buildDp(8, "fault", "Fault", DpType.FAULT, DpMode.RO, null, false));
        dps.add(buildDp(9, "countdown", "Countdown (seconds)", DpType.VALUE, DpMode.RW, rangeConstraint(0, 86400, 1), false));
        dps.add(buildDp(10, "time_total", "Total Travel Time (ms)", DpType.VALUE, DpMode.RO, rangeConstraint(0, 120000, 1), false));
        dps.add(buildDp(11, "left_time", "Remaining Time (ms)", DpType.VALUE, DpMode.RO, rangeConstraint(0, 120000, 1), false));
        dps.add(buildDp(12, "battery_percentage", "Battery (%)", DpType.VALUE, DpMode.RO, rangeConstraint(0, 100, 1), false));
        dps.add(buildDp(13, "border", "Limit Setting", DpType.ENUM, DpMode.RW, enumConstraint("up", "down", "remove"), false));
        dps.add(buildDp(14, "best_position", "Favorite Position (%)", DpType.VALUE, DpMode.RW, rangeConstraint(0, 100, 1), false));
        dps.add(buildDp(15, "click_control", "Quick Control", DpType.ENUM, DpMode.RW, enumConstraint("up", "down"), false));
        dps.add(buildDp(16, "auto_power", "Auto Power", DpType.BOOLEAN, DpMode.RW, null, false));
        dps.add(buildDp(17, "angle_control", "Tilt Angle Control", DpType.VALUE, DpMode.RW, rangeConstraint(0, 180, 1), false));
        dps.add(buildDp(18, "angle_state", "Current Tilt Angle", DpType.VALUE, DpMode.RO, rangeConstraint(0, 180, 1), false));
        dps.add(buildDp(20, "control_back_mode", "Motor Mode", DpType.ENUM, DpMode.RW, enumConstraint("forward", "back"), false));
        return dps;
    }

    // ──────────────────────────────────────────────────────────────────────
    // Sensor (cg) — Tuya standard instruction set for multi-sensors
    // Covers: temperature, humidity, CO2, PM2.5, PIR, door/window, smoke, gas
    // ──────────────────────────────────────────────────────────────────────
    private JsonNode buildSensorDpSet() {
        ArrayNode dps = JacksonUtil.newArrayNode();
        // Temperature & Humidity (required for T&H sensors)
        dps.add(buildDp(1, "temp_current", "Temperature (x10 °C)", DpType.VALUE, DpMode.RO, rangeConstraint(-400, 800, 1), true));
        dps.add(buildDp(2, "humidity_value", "Humidity (%)", DpType.VALUE, DpMode.RO, rangeConstraint(0, 100, 1), true));
        dps.add(buildDp(3, "battery_state", "Battery State", DpType.ENUM, DpMode.RO, enumConstraint("low", "middle", "high"), false));
        dps.add(buildDp(4, "battery_percentage", "Battery (%)", DpType.VALUE, DpMode.RO, rangeConstraint(0, 100, 1), false));
        dps.add(buildDp(5, "temp_unit_convert", "Temperature Unit", DpType.ENUM, DpMode.RW, enumConstraint("c", "f"), false));
        dps.add(buildDp(6, "temp_alarm", "Temperature Alarm", DpType.ENUM, DpMode.RO, enumConstraint("upperalarm", "loweralarm", "cancel"), false));
        dps.add(buildDp(7, "humidity_alarm", "Humidity Alarm", DpType.ENUM, DpMode.RO, enumConstraint("upperalarm", "loweralarm", "cancel"), false));
        dps.add(buildDp(8, "maxtemp_set", "Max Temperature Alert", DpType.VALUE, DpMode.RW, rangeConstraint(-200, 600, 1), false));
        dps.add(buildDp(9, "mintemp_set", "Min Temperature Alert", DpType.VALUE, DpMode.RW, rangeConstraint(-200, 600, 1), false));
        dps.add(buildDp(10, "maxhum_set", "Max Humidity Alert", DpType.VALUE, DpMode.RW, rangeConstraint(0, 100, 1), false));
        dps.add(buildDp(11, "minhum_set", "Min Humidity Alert", DpType.VALUE, DpMode.RW, rangeConstraint(0, 100, 1), false));
        dps.add(buildDp(12, "temp_sensitivity", "Temperature Sensitivity", DpType.VALUE, DpMode.RW, rangeConstraint(3, 10, 1), false));
        dps.add(buildDp(13, "humidity_sensitivity", "Humidity Sensitivity", DpType.VALUE, DpMode.RW, rangeConstraint(3, 10, 1), false));
        dps.add(buildDp(14, "temp_report_period", "Temperature Report Interval (min)", DpType.VALUE, DpMode.RW, rangeConstraint(1, 120, 1), false));
        dps.add(buildDp(15, "humidity_report_period", "Humidity Report Interval (min)", DpType.VALUE, DpMode.RW, rangeConstraint(1, 120, 1), false));
        // PIR / motion sensor
        dps.add(buildDp(20, "pir", "Motion Detected", DpType.ENUM, DpMode.RO, enumConstraint("pir", "none"), false));
        dps.add(buildDp(21, "pir_sensitivity", "PIR Sensitivity", DpType.ENUM, DpMode.RW, enumConstraint("low", "middle", "high"), false));
        dps.add(buildDp(22, "pir_time", "PIR No-Motion Delay (sec)", DpType.ENUM, DpMode.RW, enumConstraint("10", "30", "60", "120"), false));
        // Door/window sensor
        dps.add(buildDp(25, "doorcontact_state", "Door/Window State", DpType.BOOLEAN, DpMode.RO, null, false));
        // Illuminance
        dps.add(buildDp(27, "bright_value", "Illuminance (lux)", DpType.VALUE, DpMode.RO, rangeConstraint(0, 10000, 1), false));
        dps.add(buildDp(28, "bright_state", "Brightness Level", DpType.ENUM, DpMode.RO, enumConstraint("low", "middle", "high", "strong"), false));
        // Air quality
        dps.add(buildDp(30, "co2_value", "CO2 (ppm)", DpType.VALUE, DpMode.RO, rangeConstraint(0, 5000, 1), false));
        dps.add(buildDp(31, "pm25_value", "PM2.5 (ug/m3)", DpType.VALUE, DpMode.RO, rangeConstraint(0, 999, 1), false));
        dps.add(buildDp(32, "voc_value", "VOC (ppb)", DpType.VALUE, DpMode.RO, rangeConstraint(0, 9999, 1), false));
        dps.add(buildDp(33, "formaldehyde_value", "Formaldehyde (mg/m3 x100)", DpType.VALUE, DpMode.RO, rangeConstraint(0, 500, 1), false));
        // Smoke / gas
        dps.add(buildDp(35, "smoke_sensor_state", "Smoke Alarm", DpType.ENUM, DpMode.RO, enumConstraint("alarm", "normal"), false));
        dps.add(buildDp(36, "smoke_sensor_value", "Smoke Concentration", DpType.VALUE, DpMode.RO, rangeConstraint(0, 1000, 1), false));
        dps.add(buildDp(37, "gas_sensor_state", "Gas Alarm", DpType.ENUM, DpMode.RO, enumConstraint("alarm", "normal"), false));
        dps.add(buildDp(38, "gas_sensor_value", "Gas Concentration", DpType.VALUE, DpMode.RO, rangeConstraint(0, 1000, 1), false));
        // Water leak
        dps.add(buildDp(40, "watersensor_state", "Water Leak", DpType.ENUM, DpMode.RO, enumConstraint("alarm", "normal"), false));
        return dps;
    }

    private ObjectNode buildDp(int dpId, String code, String name, DpType dpType, DpMode mode, JsonNode constraints, boolean required) {
        ObjectNode dp = JacksonUtil.newObjectNode();
        dp.put("dpId", dpId);
        dp.put("code", code);
        dp.put("name", name);
        dp.put("dpType", dpType.name());
        dp.put("mode", mode.name());
        dp.put("required", required);
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
