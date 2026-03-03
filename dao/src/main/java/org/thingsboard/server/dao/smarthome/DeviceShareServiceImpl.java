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

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.thingsboard.server.common.data.id.DeviceId;
import org.thingsboard.server.common.data.id.UserId;
import org.thingsboard.server.common.data.smarthome.DeviceShare;
import org.thingsboard.server.common.data.smarthome.DeviceShareStatus;

import org.thingsboard.common.util.JacksonUtil;

import java.security.SecureRandom;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@Slf4j
@RequiredArgsConstructor
public class DeviceShareServiceImpl implements DeviceShareService {

    private static final int CODE_LENGTH = 8;
    private static final long SHARE_TTL_MS = 24 * 60 * 60 * 1000L; // 24 hours
    private static final String CODE_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    private static final SecureRandom RANDOM = new SecureRandom();

    private final DeviceShareDao deviceShareDao;

    @Override
    public DeviceShare shareDevice(DeviceShare request) {
        log.trace("Executing shareDevice [{}]", request);
        request.setShareCode(generateRandomCode());
        request.setStatus(DeviceShareStatus.PENDING);
        request.setExpiresAt(System.currentTimeMillis() + SHARE_TTL_MS);
        if (request.getPermissions() == null) {
            request.setPermissions(JacksonUtil.toJsonNode("[\"CONTROL\"]"));
        }
        return deviceShareDao.save(request);
    }

    @Override
    public Optional<DeviceShare> findByShareCode(String shareCode) {
        log.trace("Executing findByShareCode [{}]", shareCode);
        return deviceShareDao.findByShareCode(shareCode);
    }

    @Override
    public DeviceShare acceptShare(String shareCode, UserId acceptingUserId) {
        log.trace("Executing acceptShare [code={}, userId={}]", shareCode, acceptingUserId);
        DeviceShare share = deviceShareDao.findByShareCode(shareCode)
                .orElseThrow(() -> new IllegalArgumentException("Share code not found: " + shareCode));
        if (share.getStatus() != DeviceShareStatus.PENDING) {
            throw new IllegalStateException("Share is not in PENDING status: " + share.getStatus());
        }
        if (share.getExpiresAt() > 0 && share.getExpiresAt() < System.currentTimeMillis()) {
            share.setStatus(DeviceShareStatus.EXPIRED);
            deviceShareDao.save(share);
            throw new IllegalStateException("Share code has expired");
        }
        share.setSharedToUserId(acceptingUserId);
        share.setStatus(DeviceShareStatus.ACCEPTED);
        return deviceShareDao.save(share);
    }

    @Override
    public void revokeShare(UUID shareId) {
        log.trace("Executing revokeShare [{}]", shareId);
        DeviceShare share = deviceShareDao.findById(shareId)
                .orElseThrow(() -> new IllegalArgumentException("Share not found: " + shareId));
        share.setStatus(DeviceShareStatus.REVOKED);
        deviceShareDao.save(share);
    }

    @Override
    public List<DeviceShare> findByDeviceId(DeviceId deviceId) {
        log.trace("Executing findByDeviceId [{}]", deviceId);
        return deviceShareDao.findByDeviceId(deviceId.getId());
    }

    private String generateRandomCode() {
        StringBuilder sb = new StringBuilder(CODE_LENGTH);
        for (int i = 0; i < CODE_LENGTH; i++) {
            sb.append(CODE_CHARS.charAt(RANDOM.nextInt(CODE_CHARS.length())));
        }
        return sb.toString();
    }
}
