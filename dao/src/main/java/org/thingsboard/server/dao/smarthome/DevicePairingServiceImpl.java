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
import org.thingsboard.server.common.data.smarthome.DevicePairingStatus;
import org.thingsboard.server.common.data.smarthome.DevicePairingToken;

import java.security.SecureRandom;
import java.util.List;
import java.util.Optional;

@Service
@Slf4j
@RequiredArgsConstructor
public class DevicePairingServiceImpl implements DevicePairingService {

    private static final int TOKEN_LENGTH = 8;
    private static final long TOKEN_TTL_MS = 15 * 60 * 1000L; // 15 minutes
    private static final String TOKEN_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    private static final SecureRandom RANDOM = new SecureRandom();

    private final DevicePairingTokenDao devicePairingTokenDao;

    @Override
    public DevicePairingToken generateToken(DevicePairingToken request) {
        log.trace("Executing generateToken [{}]", request);
        request.setToken(generateRandomToken());
        request.setStatus(DevicePairingStatus.PENDING);
        request.setExpiresAt(System.currentTimeMillis() + TOKEN_TTL_MS);
        return devicePairingTokenDao.save(request);
    }

    @Override
    public Optional<DevicePairingToken> findByToken(String token) {
        log.trace("Executing findByToken [{}]", token);
        return devicePairingTokenDao.findByToken(token);
    }

    @Override
    public DevicePairingToken confirmPairing(String token, DeviceId deviceId) {
        log.trace("Executing confirmPairing [token={}, deviceId={}]", token, deviceId);
        DevicePairingToken pairingToken = devicePairingTokenDao.findByToken(token)
                .orElseThrow(() -> new IllegalArgumentException("Pairing token not found: " + token));
        if (pairingToken.getStatus() != DevicePairingStatus.PENDING) {
            throw new IllegalStateException("Pairing token is not in PENDING status: " + pairingToken.getStatus());
        }
        if (pairingToken.getExpiresAt() < System.currentTimeMillis()) {
            pairingToken.setStatus(DevicePairingStatus.EXPIRED);
            devicePairingTokenDao.save(pairingToken);
            throw new IllegalStateException("Pairing token has expired");
        }
        pairingToken.setDeviceId(deviceId);
        pairingToken.setStatus(DevicePairingStatus.PAIRED);
        return devicePairingTokenDao.save(pairingToken);
    }

    @Override
    public DevicePairingToken cancelToken(String token) {
        log.trace("Executing cancelToken [{}]", token);
        DevicePairingToken pairingToken = devicePairingTokenDao.findByToken(token)
                .orElseThrow(() -> new IllegalArgumentException("Pairing token not found: " + token));
        if (pairingToken.getStatus() != DevicePairingStatus.PENDING) {
            throw new IllegalStateException("Pairing token is not in PENDING status: " + pairingToken.getStatus());
        }
        pairingToken.setStatus(DevicePairingStatus.CANCELLED);
        return devicePairingTokenDao.save(pairingToken);
    }

    @Override
    public void cleanupExpired() {
        log.trace("Executing cleanupExpired");
        List<DevicePairingToken> expired = devicePairingTokenDao.findExpiredPending(System.currentTimeMillis());
        for (DevicePairingToken token : expired) {
            token.setStatus(DevicePairingStatus.EXPIRED);
            devicePairingTokenDao.save(token);
        }
    }

    private String generateRandomToken() {
        StringBuilder sb = new StringBuilder(TOKEN_LENGTH);
        for (int i = 0; i < TOKEN_LENGTH; i++) {
            sb.append(TOKEN_CHARS.charAt(RANDOM.nextInt(TOKEN_CHARS.length())));
        }
        return sb.toString();
    }
}
