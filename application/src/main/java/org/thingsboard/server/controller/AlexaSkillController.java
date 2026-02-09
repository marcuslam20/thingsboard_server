/**
 * Copyright © 2016-2024 The Thingsboard Authors
 * Copyright © 2024 PachiraMining
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
package org.thingsboard.server.controller;

import com.google.common.util.concurrent.ListenableFuture;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.thingsboard.server.common.data.id.DeviceId;
import org.thingsboard.server.common.data.id.TenantId;
import org.thingsboard.server.common.data.id.UserId;
import org.thingsboard.server.common.data.kv.TsKvEntry;
import org.thingsboard.server.dao.model.sql.AlexaOAuth2TokenEntity;
import org.thingsboard.server.dao.timeseries.TimeseriesService;
import org.thingsboard.server.queue.util.TbCoreComponent;
import org.thingsboard.server.service.alexa.AlexaOAuth2Service;
import org.thingsboard.server.service.alexa.AlexaService;
import org.thingsboard.server.service.alexa.dto.AlexaCommand;
import org.thingsboard.server.service.alexa.dto.AlexaDevice;

import jakarta.servlet.http.HttpServletRequest;
import java.util.*;
import java.util.concurrent.TimeUnit;

/**
 * REST API Controller for Alexa Smart Home Skill endpoints.
 * These endpoints are called by the Alexa Lambda function using
 * per-user OAuth2 Bearer tokens (not ThingsBoard JWT).
 * Token validation is done manually, not via Spring Security.
 */
@RestController
@TbCoreComponent
@RequestMapping("/api/alexa/skill")
@RequiredArgsConstructor
@Slf4j
public class AlexaSkillController {

    private final AlexaService alexaService;
    private final AlexaOAuth2Service alexaOAuth2Service;
    private final TimeseriesService timeseriesService;

    private static final long TELEMETRY_TIMEOUT_SECONDS = 5;

    @GetMapping("/devices")
    public ResponseEntity<?> getDevices(HttpServletRequest request) {
        try {
            AlexaOAuth2TokenEntity token = validateToken(request);
            TenantId tenantId = token.toTenantId();
            UserId userId = token.toUserId();

            log.info("Alexa skill: listing devices for tenant={}, user={}", tenantId, userId);
            List<AlexaDevice> devices = alexaService.getAlexaEnabledDevices(tenantId, userId);
            return ResponseEntity.ok(devices);
        } catch (IllegalArgumentException e) {
            log.warn("Alexa skill auth failed: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            log.error("Alexa skill: error listing devices", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Internal server error"));
        }
    }

    @GetMapping("/devices/{deviceId}")
    public ResponseEntity<?> getDevice(
            @PathVariable String deviceId,
            HttpServletRequest request) {
        try {
            AlexaOAuth2TokenEntity token = validateToken(request);
            TenantId tenantId = token.toTenantId();

            log.info("Alexa skill: getting device {}", deviceId);
            AlexaDevice device = alexaService.getAlexaDevice(tenantId, UUID.fromString(deviceId));
            return ResponseEntity.ok(device);
        } catch (IllegalArgumentException e) {
            log.warn("Alexa skill error: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            log.error("Alexa skill: error getting device {}", deviceId, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Internal server error"));
        }
    }

    @PostMapping("/devices/{deviceId}/command")
    public ResponseEntity<?> executeCommand(
            @PathVariable String deviceId,
            @RequestBody AlexaCommand command,
            HttpServletRequest request) {
        try {
            AlexaOAuth2TokenEntity token = validateToken(request);
            TenantId tenantId = token.toTenantId();

            log.info("Alexa skill: executing command {} on device {}", command.getCommand(), deviceId);
            alexaService.executeCommand(tenantId, UUID.fromString(deviceId), command);
            return ResponseEntity.ok(Map.of("status", "ok"));
        } catch (IllegalArgumentException e) {
            log.warn("Alexa skill error: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            log.error("Alexa skill: error executing command on device {}", deviceId, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Internal server error"));
        }
    }

    @GetMapping("/devices/{deviceId}/telemetry")
    public ResponseEntity<?> getTelemetry(
            @PathVariable String deviceId,
            @RequestParam(value = "keys", required = false) String keys,
            HttpServletRequest request) {
        try {
            AlexaOAuth2TokenEntity token = validateToken(request);
            TenantId tenantId = token.toTenantId();

            log.info("Alexa skill: getting telemetry for device {}, keys={}", deviceId, keys);

            DeviceId tbDeviceId = new DeviceId(UUID.fromString(deviceId));

            // Fetch latest telemetry
            ListenableFuture<List<TsKvEntry>> future;
            if (keys != null && !keys.isEmpty()) {
                List<String> keyList = Arrays.asList(keys.split(","));
                future = timeseriesService.findLatest(tenantId, tbDeviceId, keyList);
            } else {
                future = timeseriesService.findAllLatest(tenantId, tbDeviceId);
            }

            List<TsKvEntry> entries = future.get(TELEMETRY_TIMEOUT_SECONDS, TimeUnit.SECONDS);

            // Convert to ThingsBoard telemetry format: { "key": [{ "ts": ..., "value": ... }] }
            Map<String, List<Map<String, Object>>> result = new LinkedHashMap<>();
            for (TsKvEntry entry : entries) {
                Map<String, Object> tsValue = new LinkedHashMap<>();
                tsValue.put("ts", entry.getTs());
                tsValue.put("value", entry.getValueAsString());
                result.put(entry.getKey(), Collections.singletonList(tsValue));
            }

            return ResponseEntity.ok(result);
        } catch (IllegalArgumentException e) {
            log.warn("Alexa skill error: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            log.error("Alexa skill: error getting telemetry for device {}", deviceId, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Internal server error"));
        }
    }

    /**
     * Extract and validate Alexa OAuth2 Bearer token from the Authorization header.
     */
    private AlexaOAuth2TokenEntity validateToken(HttpServletRequest request) {
        String authHeader = request.getHeader("Authorization");
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            throw new IllegalArgumentException("Missing or invalid Authorization header");
        }
        String accessToken = authHeader.substring(7);
        return alexaOAuth2Service.validateAndGetToken(accessToken);
    }
}
