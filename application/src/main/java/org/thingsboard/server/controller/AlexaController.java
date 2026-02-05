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

import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import io.swagger.annotations.ApiParam;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import org.thingsboard.server.common.data.User;
import org.thingsboard.server.common.data.exception.ThingsboardException;
import org.thingsboard.server.common.data.id.TenantId;
import org.thingsboard.server.common.data.id.UserId;
import org.thingsboard.server.common.data.security.UserCredentials;
import org.thingsboard.server.queue.util.TbCoreComponent;
import org.thingsboard.server.service.alexa.AlexaOAuth2Service;
import org.thingsboard.server.service.alexa.AlexaService;
import org.thingsboard.server.service.alexa.dto.AlexaCommand;
import org.thingsboard.server.service.alexa.dto.AlexaDevice;
import org.thingsboard.server.service.alexa.dto.AlexaOAuth2TokenResponse;
import org.thingsboard.server.service.security.model.SecurityUser;

import java.util.List;
import java.util.UUID;

/**
 * REST API Controller for Alexa Smart Home integration.
 * Provides endpoints for OAuth2 authorization, device discovery and command execution.
 */
@Api(tags = "Alexa Integration")
@RestController
@TbCoreComponent
@RequestMapping("/api/alexa")
@RequiredArgsConstructor
@Slf4j
public class AlexaController extends BaseController {

    private final AlexaService alexaService;
    private final AlexaOAuth2Service alexaOAuth2Service;
    private final PasswordEncoder passwordEncoder;

    // ============== OAuth2 Endpoints ==============

    /**
     * OAuth2 Authorization Endpoint - displays login form for Alexa account linking.
     */
    @ApiOperation(value = "OAuth2 Authorization Endpoint",
            notes = "Displays authorization page for Alexa account linking with login form.")
    @GetMapping(value = "/oauth/authorize")
    public ResponseEntity<String> authorizeForm(
            @ApiParam(value = "OAuth2 client ID") @RequestParam("client_id") String clientId,
            @ApiParam(value = "OAuth2 redirect URI") @RequestParam("redirect_uri") String redirectUri,
            @ApiParam(value = "OAuth2 state parameter") @RequestParam("state") String state,
            @ApiParam(value = "OAuth2 response type") @RequestParam("response_type") String responseType,
            @AuthenticationPrincipal SecurityUser currentUser
    ) {
        log.debug("OAuth2 authorization request: clientId={}, redirectUri={}, state={}", clientId, redirectUri, state);

        // If user is already authenticated, show authorization consent page
        if (currentUser != null) {
            String html = String.format(
                "<!DOCTYPE html><html><head><title>Alexa Authorization</title>" +
                "<meta charset='UTF-8'>" +
                "<style>body{font-family:Arial,sans-serif;max-width:500px;margin:50px auto;padding:20px;text-align:center}" +
                "button{background:#00CAFF;color:white;border:none;padding:12px 24px;font-size:16px;border-radius:4px;cursor:pointer}" +
                "button:hover{background:#00A8D6}</style></head>" +
                "<body><h1>Link ThingsBoard with Alexa</h1>" +
                "<p>Logged in as: <strong>%s</strong></p>" +
                "<p>Allow Alexa to control your ThingsBoard devices?</p>" +
                "<form method='POST' action='/api/alexa/oauth/authorize'>" +
                "<input type='hidden' name='client_id' value='%s'/>" +
                "<input type='hidden' name='redirect_uri' value='%s'/>" +
                "<input type='hidden' name='state' value='%s'/>" +
                "<input type='hidden' name='response_type' value='%s'/>" +
                "<button type='submit'>Authorize</button>" +
                "</form></body></html>",
                currentUser.getEmail(), clientId, redirectUri, state, responseType
            );
            return ResponseEntity.ok().contentType(MediaType.TEXT_HTML).body(html);
        }

        // User not authenticated - show login form
        String html = String.format(
            "<!DOCTYPE html><html><head><title>ThingsBoard Login</title>" +
            "<meta charset='UTF-8'>" +
            "<style>" +
            "body{font-family:Arial,sans-serif;max-width:400px;margin:50px auto;padding:20px;background:#f5f5f5}" +
            ".container{background:white;padding:30px;border-radius:8px;box-shadow:0 2px 4px rgba(0,0,0,0.1)}" +
            "h1{color:#333;font-size:24px;margin-bottom:10px;text-align:center}" +
            ".subtitle{color:#666;font-size:14px;margin-bottom:30px;text-align:center}" +
            ".form-group{margin-bottom:20px}" +
            "label{display:block;margin-bottom:5px;color:#333;font-size:14px}" +
            "input{width:100%%;padding:10px;border:1px solid #ddd;border-radius:4px;font-size:14px;box-sizing:border-box}" +
            "button{width:100%%;background:#00CAFF;color:white;border:none;padding:12px;font-size:16px;border-radius:4px;cursor:pointer;margin-top:10px}" +
            "button:hover{background:#00A8D6}" +
            ".alexa-logo{text-align:center;margin-bottom:20px}" +
            ".alexa-logo svg{width:60px;height:60px}" +
            "</style></head>" +
            "<body><div class='container'>" +
            "<div class='alexa-logo'>" +
            "<svg viewBox='0 0 24 24' fill='#00CAFF'><path d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z'/></svg>" +
            "</div>" +
            "<h1>Link with Alexa</h1>" +
            "<p class='subtitle'>Login to your ThingsBoard account</p>" +
            "<form method='POST' action='/api/alexa/oauth/login'>" +
            "<input type='hidden' name='client_id' value='%s'/>" +
            "<input type='hidden' name='redirect_uri' value='%s'/>" +
            "<input type='hidden' name='state' value='%s'/>" +
            "<input type='hidden' name='response_type' value='%s'/>" +
            "<div class='form-group'>" +
            "<label>Email</label>" +
            "<input type='email' name='username' required placeholder='your@email.com'/>" +
            "</div>" +
            "<div class='form-group'>" +
            "<label>Password</label>" +
            "<input type='password' name='password' required placeholder='Password'/>" +
            "</div>" +
            "<button type='submit'>Login and Authorize</button>" +
            "</form></div></body></html>",
            clientId, redirectUri, state, responseType
        );

        return ResponseEntity.ok().contentType(MediaType.TEXT_HTML).body(html);
    }

    /**
     * OAuth2 Login and Authorization - handles login form submission.
     */
    @ApiOperation(value = "OAuth2 Login and Authorization",
            notes = "Handles login form submission and generates authorization code")
    @PostMapping(value = "/oauth/login")
    public ResponseEntity<?> loginAndAuthorize(
            @ApiParam(value = "Username/Email") @RequestParam("username") String username,
            @ApiParam(value = "Password") @RequestParam("password") String password,
            @ApiParam(value = "OAuth2 client ID") @RequestParam("client_id") String clientId,
            @ApiParam(value = "OAuth2 redirect URI") @RequestParam("redirect_uri") String redirectUri,
            @ApiParam(value = "OAuth2 state parameter") @RequestParam("state") String state,
            @ApiParam(value = "OAuth2 response type") @RequestParam("response_type") String responseType
    ) {
        try {
            log.debug("OAuth2 login attempt for user: {}", username);

            // Authenticate user using ThingsBoard auth service
            User user = userService.findUserByEmail(TenantId.SYS_TENANT_ID, username);
            if (user == null) {
                return buildLoginErrorResponse(clientId, redirectUri, state, responseType,
                    "Invalid username or password");
            }

            // Get user credentials to verify password
            UserCredentials credentials = userService.findUserCredentialsByUserId(TenantId.SYS_TENANT_ID, user.getId());
            if (credentials == null || !credentials.isEnabled()) {
                return buildLoginErrorResponse(clientId, redirectUri, state, responseType,
                    "Account is disabled or invalid");
            }

            // Verify password
            boolean passwordMatches = passwordEncoder.matches(password, credentials.getPassword());
            if (!passwordMatches) {
                return buildLoginErrorResponse(clientId, redirectUri, state, responseType,
                    "Invalid username or password");
            }

            // User authenticated successfully - generate authorization code
            TenantId tenantId = user.getTenantId();
            UserId userId = user.getId();
            String alexaUserId = UUID.randomUUID().toString();

            String authCode = alexaOAuth2Service.generateAuthorizationCode(tenantId, userId, alexaUserId);

            // Redirect back to Alexa with authorization code
            String redirectUrl = String.format("%s?code=%s&state=%s", redirectUri, authCode, state);

            log.debug("Login and authorization successful for user: {}, redirecting to: {}", username, redirectUrl);

            return ResponseEntity.status(HttpStatus.FOUND)
                    .header("Location", redirectUrl)
                    .build();

        } catch (Exception e) {
            log.error("Error during OAuth2 login: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .contentType(MediaType.TEXT_HTML)
                    .body("<html><body><h1>Error</h1><p>An error occurred during login</p></body></html>");
        }
    }

    /**
     * OAuth2 Authorization Submit - processes authorization for already authenticated users.
     */
    @ApiOperation(value = "OAuth2 Authorization Submit",
            notes = "Processes authorization and generates authorization code for authenticated users")
    @PreAuthorize("hasAnyAuthority('TENANT_ADMIN', 'CUSTOMER_USER')")
    @PostMapping(value = "/oauth/authorize")
    public ResponseEntity<?> authorizeSubmit(
            @ApiParam(value = "OAuth2 client ID") @RequestParam("client_id") String clientId,
            @ApiParam(value = "OAuth2 redirect URI") @RequestParam("redirect_uri") String redirectUri,
            @ApiParam(value = "OAuth2 state parameter") @RequestParam("state") String state,
            @ApiParam(value = "OAuth2 response type") @RequestParam("response_type") String responseType,
            @AuthenticationPrincipal SecurityUser currentUser
    ) throws ThingsboardException {
        log.debug("Processing OAuth2 authorization for user: {}", currentUser.getId());

        try {
            TenantId tenantId = currentUser.getTenantId();
            UserId userId = currentUser.getId();
            String alexaUserId = UUID.randomUUID().toString();

            // Generate authorization code
            String authCode = alexaOAuth2Service.generateAuthorizationCode(tenantId, userId, alexaUserId);

            // Redirect back to Alexa with authorization code
            String redirectUrl = String.format("%s?code=%s&state=%s", redirectUri, authCode, state);

            log.debug("Authorization successful, redirecting to: {}", redirectUrl);

            return ResponseEntity.status(HttpStatus.FOUND)
                    .header("Location", redirectUrl)
                    .build();
        } catch (Exception e) {
            log.error("Error during authorization: {}", e.getMessage(), e);
            String errorUrl = String.format("%s?error=server_error&state=%s", redirectUri, state);
            return ResponseEntity.status(HttpStatus.FOUND)
                    .header("Location", errorUrl)
                    .build();
        }
    }

    /**
     * OAuth2 Token Exchange - exchanges authorization code for access token.
     */
    @ApiOperation(value = "OAuth2 Token Exchange",
            notes = "Exchanges authorization code for access token or refreshes access token")
    @PostMapping(value = "/oauth/token", consumes = MediaType.APPLICATION_FORM_URLENCODED_VALUE)
    public ResponseEntity<AlexaOAuth2TokenResponse> exchangeToken(
            @ApiParam(value = "Grant type") @RequestParam("grant_type") String grantType,
            @ApiParam(value = "OAuth2 client ID") @RequestParam("client_id") String clientId,
            @ApiParam(value = "OAuth2 client secret") @RequestParam("client_secret") String clientSecret,
            @ApiParam(value = "Authorization code") @RequestParam(value = "code", required = false) String code,
            @ApiParam(value = "Refresh token") @RequestParam(value = "refresh_token", required = false) String refreshToken,
            @ApiParam(value = "Redirect URI") @RequestParam(value = "redirect_uri", required = false) String redirectUri
    ) {
        log.debug("Token exchange request: grantType={}, clientId={}", grantType, clientId);

        try {
            AlexaOAuth2TokenResponse response;

            if ("authorization_code".equals(grantType)) {
                // Exchange authorization code for tokens
                response = alexaOAuth2Service.exchangeCodeForToken(code, clientId, clientSecret);
            } else if ("refresh_token".equals(grantType)) {
                // Refresh access token
                response = alexaOAuth2Service.refreshAccessToken(refreshToken, clientId, clientSecret);
            } else {
                response = AlexaOAuth2TokenResponse.builder()
                        .error("unsupported_grant_type")
                        .errorDescription("Grant type not supported: " + grantType)
                        .build();
                return ResponseEntity.badRequest().body(response);
            }

            if (response.getError() != null) {
                return ResponseEntity.badRequest().body(response);
            }

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error during token exchange: {}", e.getMessage(), e);
            AlexaOAuth2TokenResponse errorResponse = AlexaOAuth2TokenResponse.builder()
                    .error("server_error")
                    .errorDescription("Internal server error")
                    .build();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    /**
     * OAuth2 Token Revocation - revokes access token.
     */
    @ApiOperation(value = "OAuth2 Token Revocation",
            notes = "Revokes access token (called when user unlinks account in Alexa app)")
    @PostMapping(value = "/oauth/revoke")
    public ResponseEntity<?> revokeToken(
            @ApiParam(value = "Access token to revoke") @RequestParam("token") String token
    ) {
        log.debug("Token revocation request");

        try {
            alexaOAuth2Service.revokeToken(token);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            log.error("Error during token revocation: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    // ============== Device Management Endpoints ==============

    /**
     * Get all Alexa-enabled devices for the current tenant.
     * This endpoint is called during Alexa device discovery.
     *
     * @return List of devices configured for Alexa control
     */
    @ApiOperation(value = "Get Alexa-enabled devices",
            notes = "Returns all devices that have Alexa capabilities enabled. " +
                    "Used during Alexa Smart Home skill device discovery.")
    @PreAuthorize("hasAnyAuthority('TENANT_ADMIN', 'CUSTOMER_USER')")
    @GetMapping("/devices")
    public List<AlexaDevice> getAlexaDevices() throws ThingsboardException {
        try {
            log.info("Getting Alexa-enabled devices for tenant: {}", getCurrentUser().getTenantId());
            return alexaService.getAlexaEnabledDevices(getCurrentUser().getTenantId());
        } catch (Exception e) {
            log.error("Failed to get Alexa devices", e);
            throw handleException(e);
        }
    }

    /**
     * Get a specific Alexa-enabled device by ID.
     *
     * @param deviceId The device UUID
     * @return The device details in Alexa format
     */
    @ApiOperation(value = "Get Alexa device by ID",
            notes = "Returns a specific device with its Alexa capabilities.")
    @PreAuthorize("hasAnyAuthority('TENANT_ADMIN', 'CUSTOMER_USER')")
    @GetMapping("/devices/{deviceId}")
    public AlexaDevice getAlexaDevice(
            @ApiParam(value = "Device UUID", required = true)
            @PathVariable UUID deviceId) throws ThingsboardException {
        try {
            log.info("Getting Alexa device: {}", deviceId);
            return alexaService.getAlexaDevice(getCurrentUser().getTenantId(), deviceId);
        } catch (Exception e) {
            log.error("Failed to get Alexa device: {}", deviceId, e);
            throw handleException(e);
        }
    }

    /**
     * Execute an Alexa command on a device.
     * This endpoint handles commands from the Alexa Smart Home skill.
     *
     * @param deviceId The device UUID
     * @param command The Alexa command to execute
     * @return Success response or error
     */
    @ApiOperation(value = "Execute Alexa command",
            notes = "Executes a command on a device from the Alexa Smart Home skill. " +
                    "Supported commands: setPower, setBrightness, setTemperature.")
    @PreAuthorize("hasAnyAuthority('TENANT_ADMIN', 'CUSTOMER_USER')")
    @PostMapping("/devices/{deviceId}/command")
    public ResponseEntity<?> executeCommand(
            @ApiParam(value = "Device UUID", required = true)
            @PathVariable UUID deviceId,
            @ApiParam(value = "Alexa command to execute", required = true)
            @RequestBody AlexaCommand command) throws ThingsboardException {
        try {
            log.info("Executing Alexa command on device {}: {}", deviceId, command.getCommand());
            alexaService.executeCommand(getCurrentUser().getTenantId(), deviceId, command);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            log.error("Failed to execute Alexa command on device: {}", deviceId, e);
            throw handleException(e);
        }
    }

    /**
     * Enable or disable Alexa capabilities for a device.
     *
     * @param deviceId The device UUID
     * @param enabled Whether to enable Alexa
     * @param category The Alexa device category (LIGHT, SWITCH, etc.)
     * @return Updated device
     */
    @ApiOperation(value = "Configure Alexa capabilities",
            notes = "Enable or disable Alexa capabilities for a device and set its category.")
    @PreAuthorize("hasAnyAuthority('TENANT_ADMIN')")
    @PostMapping("/devices/{deviceId}/configure")
    public AlexaDevice configureAlexaCapabilities(
            @ApiParam(value = "Device UUID", required = true)
            @PathVariable UUID deviceId,
            @ApiParam(value = "Enable Alexa", required = true)
            @RequestParam boolean enabled,
            @ApiParam(value = "Alexa category", defaultValue = "SWITCH")
            @RequestParam(defaultValue = "SWITCH") String category) throws ThingsboardException {
        try {
            log.info("Configuring Alexa capabilities for device {}: enabled={}, category={}",
                    deviceId, enabled, category);
            return alexaService.configureAlexaCapabilities(
                    getCurrentUser().getTenantId(), deviceId, enabled, category);
        } catch (Exception e) {
            log.error("Failed to configure Alexa capabilities for device: {}", deviceId, e);
            throw handleException(e);
        }
    }

    // ============== Helper Methods ==============

    private ResponseEntity<String> buildLoginErrorResponse(String clientId, String redirectUri,
                                                            String state, String responseType,
                                                            String errorMessage) {
        String html = String.format(
            "<html><body>" +
            "<h1>Login Failed</h1>" +
            "<p>%s</p>" +
            "<a href='/api/alexa/oauth/authorize?client_id=%s&redirect_uri=%s&state=%s&response_type=%s'>Try again</a>" +
            "</body></html>",
            errorMessage, clientId, redirectUri, state, responseType
        );
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .contentType(MediaType.TEXT_HTML)
                .body(html);
    }
}
