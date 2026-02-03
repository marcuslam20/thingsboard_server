///
/// Copyright © 2016-2025 The Thingsboard Authors
///
/// Licensed under the Apache License, Version 2.0 (the "License");
/// you may not use this file except in compliance with the License.
/// You may obtain a copy of the License at
///
///     http://www.apache.org/licenses/LICENSE-2.0
///
/// Unless required by applicable law or agreed to in writing, software
/// distributed under the License is distributed on an "AS IS" BASIS,
/// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
/// See the License for the specific language governing permissions and
/// limitations under the License.
///

/**
 * Google Assistant Smart Home Integration for ThingsBoard
 * Main entry point for Cloud Function
 */

import { smarthome } from 'actions-on-google';
import express, { Request, Response } from 'express';
import { handleSync } from './handlers/sync';
import { handleExecute } from './handlers/execute';
import { handleQuery } from './handlers/query';
import { handleDisconnect } from './handlers/disconnect';

// Environment variables
const THINGSBOARD_URL = process.env.THINGSBOARD_URL || 'http://localhost:8080';
const PORT = process.env.PORT || 8080;

// Create Smart Home app
const app = smarthome({
  debug: true,
});

/**
 * Extract access token from request headers
 */
function extractAccessToken(headers: any): string | null {
  const authHeader = headers.authorization || headers.Authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  return null;
}

/**
 * SYNC Intent Handler
 * Returns list of user's devices
 */
app.onSync(async (body, headers) => {
  console.log('Received SYNC intent');

  const accessToken = extractAccessToken(headers);
  if (!accessToken) {
    throw new Error('Missing access token');
  }

  return handleSync(body, accessToken, THINGSBOARD_URL);
});

/**
 * EXECUTE Intent Handler
 * Executes commands on devices
 */
app.onExecute(async (body, headers) => {
  console.log('Received EXECUTE intent');

  const accessToken = extractAccessToken(headers);
  if (!accessToken) {
    throw new Error('Missing access token');
  }

  return handleExecute(body, accessToken, THINGSBOARD_URL);
});

/**
 * QUERY Intent Handler
 * Returns current state of devices
 */
app.onQuery(async (body, headers) => {
  console.log('Received QUERY intent');

  const accessToken = extractAccessToken(headers);
  if (!accessToken) {
    throw new Error('Missing access token');
  }

  return handleQuery(body, accessToken, THINGSBOARD_URL);
});

/**
 * DISCONNECT Intent Handler
 * Handles account unlinking
 */
app.onDisconnect(async (body, headers) => {
  console.log('Received DISCONNECT intent');

  const accessToken = extractAccessToken(headers);
  if (!accessToken) {
    console.warn('Missing access token for DISCONNECT');
  }

  return handleDisconnect(body, accessToken || '', THINGSBOARD_URL);
});

/**
 * Express app for Cloud Functions
 */
const expressApp = express();

// Health check endpoint
expressApp.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    thingsboardUrl: THINGSBOARD_URL,
    timestamp: new Date().toISOString(),
  });
});

// Smart Home fulfillment endpoint
expressApp.post('/fulfillment', app);
expressApp.post('/', app); // Also handle root path

// Start server (for local development)
if (require.main === module) {
  expressApp.listen(PORT, () => {
    console.log(`Google Assistant fulfillment server started on port ${PORT}`);
    console.log(`ThingsBoard URL: ${THINGSBOARD_URL}`);
    console.log(`Health check: http://localhost:${PORT}/health`);
  });
}

// Export for Google Cloud Functions
export const fulfillment = expressApp;
