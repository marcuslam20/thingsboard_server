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
 * Alexa Skill Event Handler
 * Handles skill lifecycle events sent by Amazon (e.g., SkillDisabled, SkillAccountLinked).
 *
 * Actual event format from Amazon:
 * {
 *   "version": "1.0",
 *   "context": {
 *     "System": {
 *       "application": { "applicationId": "amzn1.ask.skill.xxx" },
 *       "user": { "userId": "amzn1.ask.account.xxx" },
 *       "apiEndpoint": "https://api.amazonalexa.com",
 *       "apiAccessToken": "..."
 *     }
 *   },
 *   "request": {
 *     "type": "AlexaSkillEvent.SkillDisabled",
 *     "requestId": "...",
 *     "timestamp": "...",
 *     "eventCreationTime": "...",
 *     "eventPublishingTime": "...",
 *     "body": { "userInformationPersistenceStatus": "NOT_PERSISTED" }
 *   }
 * }
 */

export interface SkillEvent {
  version: string;
  context: {
    System: {
      application: { applicationId: string };
      user: { userId: string };
      apiEndpoint?: string;
      apiAccessToken?: string;
    };
  };
  request: {
    type: string;
    requestId: string;
    timestamp: string;
    eventCreationTime?: string;
    eventPublishingTime?: string;
    body?: {
      userInformationPersistenceStatus?: string;
    };
  };
}

export async function handleSkillEvent(event: SkillEvent): Promise<void> {
  const eventType = event.request?.type;
  const userId = event.context?.System?.user?.userId;

  console.log(`Skill event received: ${eventType}, userId: ${userId}`);

  if (!userId) {
    console.warn('Skill event missing userId, ignoring');
    return;
  }

  // Extract event name from type (e.g., "AlexaSkillEvent.SkillDisabled" → "SkillDisabled")
  const eventName = eventType?.split('.').pop() || eventType;

  switch (eventName) {
    case 'SkillDisabled':
      await handleSkillDisabled(userId);
      break;

    case 'SkillAccountLinked':
      console.log(`Skill account linked for userId: ${userId}`);
      // No action needed — linking is handled by the app flow
      break;

    default:
      console.log(`Unhandled skill event: ${eventType}`);
  }
}

async function handleSkillDisabled(amazonUserId: string): Promise<void> {
  console.log(`Skill disabled by user: ${amazonUserId}, revoking tokens...`);

  const baseUrl = process.env.TB_URL || '';
  if (!baseUrl) {
    console.error('TB_URL not configured, cannot notify backend');
    return;
  }

  try {
    // Call public endpoint directly — no authentication needed
    const response = await fetch(`${baseUrl.replace(/\/$/, '')}/api/alexa/skill/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ eventName: 'SkillDisabled', amazonUserId }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error(`Backend returned ${response.status}: ${error}`);
    } else {
      console.log(`Successfully notified backend to revoke tokens for user: ${amazonUserId}`);
    }
  } catch (error) {
    console.error(`Failed to revoke tokens for user ${amazonUserId}:`, error);
    // Don't throw — Amazon doesn't expect a response for skill events
  }
}
