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
package org.thingsboard.server.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
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
import org.thingsboard.server.common.data.id.DeviceId;
import org.thingsboard.server.common.data.id.TenantId;
import org.thingsboard.server.common.data.id.UserId;
import org.thingsboard.server.common.data.security.UserCredentials;
import org.thingsboard.server.dao.model.sql.GoogleOAuth2TokenEntity;
import org.thingsboard.server.queue.util.TbCoreComponent;
import org.thingsboard.server.service.google.GoogleAssistantService;
import org.thingsboard.server.service.google.GoogleOAuth2Service;
import org.thingsboard.server.service.google.dto.*;
import org.thingsboard.server.service.security.model.SecurityUser;

import java.util.*;
import java.util.stream.Collectors;

/**
 * REST API Controller for Google Assistant Smart Home integration.
 * Handles OAuth2 authorization flow and Smart Home fulfillment requests.
 */
@RestController
@TbCoreComponent
@RequestMapping("/api/google")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Google Assistant", description = "Google Assistant Smart Home Integration API")
public class GoogleAssistantController extends BaseController {

    private final GoogleAssistantService googleAssistantService;
    private final GoogleOAuth2Service googleOAuth2Service;
    private final PasswordEncoder passwordEncoder;
    private final ObjectMapper objectMapper = new ObjectMapper();

    // ============== OAuth2 Endpoints ==============

    @GetMapping(value = "/oauth/authorize")
    @Operation(summary = "OAuth2 Authorization Endpoint",
            description = "Displays authorization page for Google account linking with login form.")
    public ResponseEntity<String> authorizeForm(
            @Parameter(description = "OAuth2 client ID") @RequestParam("client_id") String clientId,
            @Parameter(description = "OAuth2 redirect URI") @RequestParam("redirect_uri") String redirectUri,
            @Parameter(description = "OAuth2 state parameter") @RequestParam("state") String state,
            @Parameter(description = "OAuth2 response type") @RequestParam("response_type") String responseType,
            @Parameter(description = "Google user ID") @RequestParam(value = "user_locale", required = false) String userLocale,
            @AuthenticationPrincipal SecurityUser currentUser
    ) {
        log.debug("OAuth2 authorization request: clientId={}, redirectUri={}, state={}", clientId, redirectUri, state);

        // If user is already authenticated, show authorization consent page
        if (currentUser != null) {
            String html = String.format(
                "<!DOCTYPE html><html><head><title>Google Assistant Authorization</title>" +
                "<style>body{font-family:Arial,sans-serif;max-width:500px;margin:50px auto;padding:20px;text-align:center}" +
                "button{background:#4285f4;color:white;border:none;padding:12px 24px;font-size:16px;border-radius:4px;cursor:pointer}" +
                "button:hover{background:#357ae8}</style></head>" +
                "<body><h1>Link ThingsBoard with Google Assistant</h1>" +
                "<p>Logged in as: <strong>%s</strong></p>" +
                "<p>Allow Google Assistant to control your ThingsBoard devices?</p>" +
                "<form method='POST' action='/api/google/oauth/authorize'>" +
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
            "button{width:100%%;background:#4285f4;color:white;border:none;padding:12px;font-size:16px;border-radius:4px;cursor:pointer;margin-top:10px}" +
            "button:hover{background:#357ae8}" +
            ".error{color:#d32f2f;font-size:14px;margin-top:10px;display:none}" +
            "</style></head>" +
            "<body><div class='container'>" +
            "<h1>Link with Google Assistant</h1>" +
            "<p class='subtitle'>Login to your ThingsBoard account</p>" +
            "<form method='POST' action='/api/google/oauth/login'>" +
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

    @PostMapping(value = "/oauth/login")
    @Operation(summary = "OAuth2 Login and Authorization",
            description = "Handles login form submission and generates authorization code")
    public ResponseEntity<?> loginAndAuthorize(
            @Parameter(description = "Username/Email") @RequestParam("username") String username,
            @Parameter(description = "Password") @RequestParam("password") String password,
            @Parameter(description = "OAuth2 client ID") @RequestParam("client_id") String clientId,
            @Parameter(description = "OAuth2 redirect URI") @RequestParam("redirect_uri") String redirectUri,
            @Parameter(description = "OAuth2 state parameter") @RequestParam("state") String state,
            @Parameter(description = "OAuth2 response type") @RequestParam("response_type") String responseType
    ) {
        try {
            log.debug("OAuth2 login attempt for user: {}", username);

            // Authenticate user using ThingsBoard auth service
            User user = userService.findUserByEmail(TenantId.SYS_TENANT_ID, username);
            if (user == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .contentType(MediaType.TEXT_HTML)
                        .body("<html><body><h1>Login Failed</h1><p>Invalid username or password</p>" +
                              "<a href='/api/google/oauth/authorize?client_id=" + clientId +
                              "&redirect_uri=" + redirectUri + "&state=" + state +
                              "&response_type=" + responseType + "'>Try again</a></body></html>");
            }

            // Get user credentials to verify password
            UserCredentials credentials = userService.findUserCredentialsByUserId(TenantId.SYS_TENANT_ID, user.getId());
            if (credentials == null || !credentials.isEnabled()) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .contentType(MediaType.TEXT_HTML)
                        .body("<html><body><h1>Login Failed</h1><p>Account is disabled or invalid</p>" +
                              "<a href='/api/google/oauth/authorize?client_id=" + clientId +
                              "&redirect_uri=" + redirectUri + "&state=" + state +
                              "&response_type=" + responseType + "'>Try again</a></body></html>");
            }

            // Verify password
            boolean passwordMatches = passwordEncoder.matches(password, credentials.getPassword());
            if (!passwordMatches) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .contentType(MediaType.TEXT_HTML)
                        .body("<html><body><h1>Login Failed</h1><p>Invalid username or password</p>" +
                              "<a href='/api/google/oauth/authorize?client_id=" + clientId +
                              "&redirect_uri=" + redirectUri + "&state=" + state +
                              "&response_type=" + responseType + "'>Try again</a></body></html>");
            }

            // User authenticated successfully - generate authorization code
            TenantId tenantId = user.getTenantId();
            UserId userId = user.getId();
            String googleUserId = UUID.randomUUID().toString();

            String authCode = googleOAuth2Service.generateAuthorizationCode(tenantId, userId, googleUserId);

            // Redirect back to Google with authorization code
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

    @PostMapping(value = "/oauth/authorize")
    @PreAuthorize("hasAnyAuthority('TENANT_ADMIN', 'CUSTOMER_USER')")
    @Operation(summary = "OAuth2 Authorization Submit",
            description = "Processes authorization and generates authorization code")
    public ResponseEntity<?> authorizeSubmit(
            @Parameter(description = "OAuth2 client ID") @RequestParam("client_id") String clientId,
            @Parameter(description = "OAuth2 redirect URI") @RequestParam("redirect_uri") String redirectUri,
            @Parameter(description = "OAuth2 state parameter") @RequestParam("state") String state,
            @Parameter(description = "OAuth2 response type") @RequestParam("response_type") String responseType,
            @AuthenticationPrincipal SecurityUser currentUser
    ) throws ThingsboardException {
        log.debug("Processing OAuth2 authorization for user: {}", currentUser.getId());

        try {
            TenantId tenantId = currentUser.getTenantId();
            UserId userId = currentUser.getId();
            String googleUserId = UUID.randomUUID().toString(); // Generate unique Google user ID

            // Generate authorization code
            String authCode = googleOAuth2Service.generateAuthorizationCode(tenantId, userId, googleUserId);

            // Redirect back to Google with authorization code
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

    @PostMapping(value = "/oauth/token", consumes = MediaType.APPLICATION_FORM_URLENCODED_VALUE)
    @Operation(summary = "OAuth2 Token Exchange",
            description = "Exchanges authorization code for access token or refreshes access token")
    public ResponseEntity<GoogleOAuth2TokenResponse> exchangeToken(
            @Parameter(description = "Grant type") @RequestParam("grant_type") String grantType,
            @Parameter(description = "OAuth2 client ID") @RequestParam("client_id") String clientId,
            @Parameter(description = "OAuth2 client secret") @RequestParam("client_secret") String clientSecret,
            @Parameter(description = "Authorization code") @RequestParam(value = "code", required = false) String code,
            @Parameter(description = "Refresh token") @RequestParam(value = "refresh_token", required = false) String refreshToken,
            @Parameter(description = "Redirect URI") @RequestParam(value = "redirect_uri", required = false) String redirectUri
    ) {
        log.debug("Token exchange request: grantType={}, clientId={}", grantType, clientId);

        try {
            GoogleOAuth2TokenResponse response;

            if ("authorization_code".equals(grantType)) {
                // Exchange authorization code for tokens
                response = googleOAuth2Service.exchangeCodeForToken(code, clientId, clientSecret);
            } else if ("refresh_token".equals(grantType)) {
                // Refresh access token
                response = googleOAuth2Service.refreshAccessToken(refreshToken, clientId, clientSecret);
            } else {
                response = GoogleOAuth2TokenResponse.builder()
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
            GoogleOAuth2TokenResponse errorResponse = GoogleOAuth2TokenResponse.builder()
                    .error("server_error")
                    .errorDescription("Internal server error")
                    .build();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    @PostMapping(value = "/oauth/revoke")
    @Operation(summary = "OAuth2 Token Revocation",
            description = "Revokes access token (called when user unlinks account in Google Home)")
    public ResponseEntity<?> revokeToken(
            @Parameter(description = "Access token to revoke") @RequestParam("token") String token
    ) {
        log.debug("Token revocation request");

        try {
            googleOAuth2Service.revokeToken(token);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            log.error("Error during token revocation: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    // ============== Fulfillment Endpoint ==============

    @PostMapping(value = "/fulfillment", consumes = MediaType.APPLICATION_JSON_VALUE, produces = MediaType.APPLICATION_JSON_VALUE)
    @Operation(summary = "Smart Home Fulfillment",
            description = "Main endpoint for Google Smart Home intents (SYNC, EXECUTE, QUERY, DISCONNECT)")
    public ResponseEntity<?> handleIntent(
            @Parameter(description = "Authorization header with Bearer token") @RequestHeader("Authorization") String authHeader,
            @RequestBody JsonNode request
    ) {
        log.debug("Fulfillment request received");

        try {
            // Extract access token from Authorization header
            String accessToken = extractAccessToken(authHeader);
            if (accessToken == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
            }

            // Validate token and get tenant
            GoogleOAuth2TokenEntity tokenEntity = googleOAuth2Service.validateAndGetToken(accessToken);
            TenantId tenantId = tokenEntity.toTenantId();

            // Extract request ID and intent
            String requestId = request.get("requestId").asText();
            JsonNode inputs = request.get("inputs");
            if (inputs == null || !inputs.isArray() || inputs.size() == 0) {
                return ResponseEntity.badRequest().body("Invalid request: missing inputs");
            }

            String intent = inputs.get(0).get("intent").asText();
            log.debug("Processing intent: {} for tenant: {}", intent, tenantId);

            // Route to appropriate handler
            Object response;
            switch (intent) {
                case "action.devices.SYNC":
                    response = handleSync(tenantId, requestId);
                    break;
                case "action.devices.EXECUTE":
                    response = handleExecute(tenantId, requestId, inputs.get(0));
                    break;
                case "action.devices.QUERY":
                    response = handleQuery(tenantId, requestId, inputs.get(0));
                    break;
                case "action.devices.DISCONNECT":
                    response = handleDisconnect(tenantId, requestId, accessToken);
                    break;
                default:
                    log.warn("Unknown intent: {}", intent);
                    return ResponseEntity.badRequest().body("Unknown intent: " + intent);
            }

            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            log.error("Invalid request: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        } catch (Exception e) {
            log.error("Error processing fulfillment request: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    // ============== Device Management Endpoints ==============

    @GetMapping(value = "/devices")
    @PreAuthorize("hasAnyAuthority('TENANT_ADMIN', 'CUSTOMER_USER')")
    @Operation(summary = "Get Google-Enabled Devices",
            description = "Returns all devices with Google Assistant enabled for current tenant")
    public ResponseEntity<List<GoogleDevice>> getDevices(
            @AuthenticationPrincipal SecurityUser currentUser
    ) throws ThingsboardException {
        log.debug("Getting Google-enabled devices for tenant: {}", currentUser.getTenantId());

        try {
            List<GoogleDevice> devices = googleAssistantService.getGoogleEnabledDevices(currentUser.getTenantId());
            return ResponseEntity.ok(devices);
        } catch (Exception e) {
            log.error("Error getting Google-enabled devices: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping(value = "/devices/{deviceId}")
    @PreAuthorize("hasAnyAuthority('TENANT_ADMIN', 'CUSTOMER_USER')")
    @Operation(summary = "Get Google Device",
            description = "Returns a specific device with Google Assistant capabilities")
    public ResponseEntity<GoogleDevice> getDevice(
            @Parameter(description = "Device ID") @PathVariable("deviceId") String deviceIdStr,
            @AuthenticationPrincipal SecurityUser currentUser
    ) throws ThingsboardException {
        log.debug("Getting Google device: {}", deviceIdStr);

        try {
            DeviceId deviceId = new DeviceId(UUID.fromString(deviceIdStr));
            checkDeviceId(deviceId, null);

            GoogleDevice device = googleAssistantService.getGoogleDevice(currentUser.getTenantId(), deviceId);
            return ResponseEntity.ok(device);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            log.error("Error getting Google device: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @PostMapping(value = "/devices/{deviceId}/configure")
    @PreAuthorize("hasAuthority('TENANT_ADMIN')")
    @Operation(summary = "Configure Google Capabilities",
            description = "Configure Google Assistant capabilities for a device")
    public ResponseEntity<GoogleDevice> configureDevice(
            @Parameter(description = "Device ID") @PathVariable("deviceId") String deviceIdStr,
            @RequestBody GoogleCapabilities capabilities,
            @AuthenticationPrincipal SecurityUser currentUser
    ) throws ThingsboardException {
        log.debug("Configuring Google capabilities for device: {}", deviceIdStr);

        try {
            DeviceId deviceId = new DeviceId(UUID.fromString(deviceIdStr));
            checkDeviceId(deviceId, null);

            GoogleDevice device = googleAssistantService.configureGoogleCapabilities(
                    currentUser.getTenantId(), deviceId, capabilities);
            return ResponseEntity.ok(device);
        } catch (Exception e) {
            log.error("Error configuring Google capabilities: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @PostMapping(value = "/devices/{deviceId}/enable")
    @PreAuthorize("hasAuthority('TENANT_ADMIN')")
    @Operation(summary = "Enable/Disable Google Assistant",
            description = "Enable or disable Google Assistant for a device")
    public ResponseEntity<GoogleDevice> setDeviceEnabled(
            @Parameter(description = "Device ID") @PathVariable("deviceId") String deviceIdStr,
            @Parameter(description = "Enable or disable") @RequestParam("enabled") boolean enabled,
            @AuthenticationPrincipal SecurityUser currentUser
    ) throws ThingsboardException {
        log.debug("Setting Google enabled={} for device: {}", enabled, deviceIdStr);

        try {
            DeviceId deviceId = new DeviceId(UUID.fromString(deviceIdStr));
            checkDeviceId(deviceId, null);

            GoogleDevice device = googleAssistantService.setGoogleEnabled(
                    currentUser.getTenantId(), deviceId, enabled);
            return ResponseEntity.ok(device);
        } catch (Exception e) {
            log.error("Error setting Google enabled: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    // ============== Private Helper Methods ==============

    private String extractAccessToken(String authHeader) {
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            return authHeader.substring(7);
        }
        return null;
    }

    private GoogleSyncResponse handleSync(TenantId tenantId, String requestId) {
        log.debug("Handling SYNC intent for tenant: {}", tenantId);

        List<GoogleDevice> devices = googleAssistantService.getGoogleEnabledDevices(tenantId);

        List<GoogleSyncResponse.Device> googleDevices = devices.stream()
                .map(this::mapToSyncDevice)
                .collect(Collectors.toList());

        GoogleSyncResponse.Payload payload = GoogleSyncResponse.Payload.builder()
                .agentUserId(tenantId.toString())
                .devices(googleDevices)
                .build();

        return GoogleSyncResponse.builder()
                .requestId(requestId)
                .payload(payload)
                .build();
    }

    private GoogleExecuteResponse handleExecute(TenantId tenantId, String requestId, JsonNode input) {
        log.debug("Handling EXECUTE intent for tenant: {}", tenantId);

        List<GoogleExecuteResponse.CommandResult> results = new ArrayList<>();

        try {
            JsonNode payload = input.get("payload");
            JsonNode commands = payload.get("commands");

            for (JsonNode commandGroup : commands) {
                JsonNode devices = commandGroup.get("devices");
                JsonNode executions = commandGroup.get("execution");

                for (JsonNode device : devices) {
                    String deviceIdStr = device.get("id").asText();
                    DeviceId deviceId = new DeviceId(UUID.fromString(deviceIdStr));

                    for (JsonNode execution : executions) {
                        String command = execution.get("command").asText();
                        JsonNode params = execution.get("params");

                        try {
                            // Execute command
                            GoogleCommand googleCommand = GoogleCommand.builder()
                                    .deviceId(deviceId.getId())
                                    .command(command)
                                    .params(params)
                                    .requestId(requestId)
                                    .build();

                            googleAssistantService.executeCommand(tenantId, deviceId, googleCommand);

                            // Return success
                            Map<String, Object> states = new HashMap<>();
                            params.fields().forEachRemaining(entry ->
                                states.put(entry.getKey(), entry.getValue().asText()));

                            results.add(GoogleExecuteResponse.CommandResult.builder()
                                    .ids(Collections.singletonList(deviceIdStr))
                                    .status("SUCCESS")
                                    .states(states)
                                    .build());
                        } catch (Exception e) {
                            log.error("Error executing command on device {}: {}", deviceIdStr, e.getMessage());
                            results.add(GoogleExecuteResponse.CommandResult.builder()
                                    .ids(Collections.singletonList(deviceIdStr))
                                    .status("ERROR")
                                    .errorCode("deviceOffline")
                                    .build());
                        }
                    }
                }
            }
        } catch (Exception e) {
            log.error("Error handling EXECUTE intent: {}", e.getMessage(), e);
        }

        GoogleExecuteResponse.Payload payload = GoogleExecuteResponse.Payload.builder()
                .commands(results)
                .build();

        return GoogleExecuteResponse.builder()
                .requestId(requestId)
                .payload(payload)
                .build();
    }

    private GoogleQueryResponse handleQuery(TenantId tenantId, String requestId, JsonNode input) {
        log.debug("Handling QUERY intent for tenant: {}", tenantId);

        Map<String, GoogleQueryResponse.DeviceState> deviceStates = new HashMap<>();

        try {
            JsonNode payload = input.get("payload");
            JsonNode devices = payload.get("devices");

            for (JsonNode device : devices) {
                String deviceIdStr = device.get("id").asText();
                DeviceId deviceId = new DeviceId(UUID.fromString(deviceIdStr));

                try {
                    GoogleState state = googleAssistantService.queryDeviceState(tenantId, deviceId);

                    deviceStates.put(deviceIdStr, GoogleQueryResponse.DeviceState.builder()
                            .online(state.isOnline())
                            .status("SUCCESS")
                            .states(state.getState())
                            .build());
                } catch (Exception e) {
                    log.error("Error querying device state for {}: {}", deviceIdStr, e.getMessage());
                    deviceStates.put(deviceIdStr, GoogleQueryResponse.DeviceState.builder()
                            .online(false)
                            .status("ERROR")
                            .errorCode("deviceOffline")
                            .build());
                }
            }
        } catch (Exception e) {
            log.error("Error handling QUERY intent: {}", e.getMessage(), e);
        }

        GoogleQueryResponse.Payload payload = GoogleQueryResponse.Payload.builder()
                .devices(deviceStates)
                .build();

        return GoogleQueryResponse.builder()
                .requestId(requestId)
                .payload(payload)
                .build();
    }

    private Map<String, Object> handleDisconnect(TenantId tenantId, String requestId, String accessToken) {
        log.debug("Handling DISCONNECT intent for tenant: {}", tenantId);

        try {
            googleOAuth2Service.revokeToken(accessToken);
        } catch (Exception e) {
            log.error("Error revoking token: {}", e.getMessage(), e);
        }

        Map<String, Object> response = new HashMap<>();
        response.put("requestId", requestId);
        return response;
    }

    private GoogleSyncResponse.Device mapToSyncDevice(GoogleDevice device) {
        GoogleCapabilities capabilities = device.getGoogleCapabilities();

        // Map traits with full prefix
        List<String> traits = capabilities.getTraits().stream()
                .map(trait -> trait.startsWith("action.devices.traits.") ? trait : "action.devices.traits." + trait)
                .collect(Collectors.toList());

        GoogleSyncResponse.DeviceName name = GoogleSyncResponse.DeviceName.builder()
                .defaultNames(Collections.singletonList(device.getName()))
                .name(device.getName())
                .nicknames(capabilities.getNicknames() != null && !capabilities.getNicknames().isEmpty()
                    ? capabilities.getNicknames()
                    : Collections.singletonList(
                        device.getLabel() != null && !device.getLabel().isEmpty()
                            ? device.getLabel()
                            : device.getName()))
                .build();

        GoogleSyncResponse.DeviceInfo deviceInfo = GoogleSyncResponse.DeviceInfo.builder()
                .manufacturer("ThingsBoard")
                .model(device.getType())
                .hwVersion("1.0")
                .swVersion("1.0")
                .build();

        return GoogleSyncResponse.Device.builder()
                .id(device.getId().toString())
                .type(capabilities.getDeviceType())
                .traits(traits)
                .name(name)
                .willReportState(capabilities.isWillReportState())
                .roomHint(capabilities.getRoomHint())
                .deviceInfo(deviceInfo)
                .attributes(capabilities.getAttributes())
                .build();
    }
}
