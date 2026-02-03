/**
 * EXECUTE Intent Handler
 * Handles command execution requests from Google Assistant
 */

import { SmartHomeV1ExecuteRequest, SmartHomeV1ExecuteResponse } from 'actions-on-google';
import { ThingsBoardClient } from '../services/thingsboard-client';
import { mapCommandToRpc } from '../services/trait-mapper';

/**
 * Handle EXECUTE intent - command execution
 * Called when user gives voice commands like:
 * - "Turn on the lights"
 * - "Set brightness to 75%"
 * - "Set thermostat to 22 degrees"
 */
export async function handleExecute(
  body: SmartHomeV1ExecuteRequest,
  accessToken: string,
  thingsboardUrl: string
): Promise<SmartHomeV1ExecuteResponse> {
  console.log('Handling EXECUTE intent');

  const client = new ThingsBoardClient(thingsboardUrl);
  const commands: any[] = [];

  try {
    const input = body.inputs[0];
    const payload = input.payload;

    // Process each command group
    for (const commandGroup of payload.commands) {
      const devices = commandGroup.devices;
      const executions = commandGroup.execution;

      // Execute commands on each device
      for (const device of devices) {
        const deviceId = device.id;

        for (const execution of executions) {
          const command = execution.command;
          const params = execution.params || {};

          try {
            console.log(`Executing command ${command} on device ${deviceId}`);

            // Map Google command to ThingsBoard RPC
            const rpcCommand = mapCommandToRpc(command, params);

            // Execute command via ThingsBoard API
            await client.executeCommand(deviceId, rpcCommand, accessToken);

            // Return success result
            commands.push({
              ids: [deviceId],
              status: 'SUCCESS',
              states: params, // Return the requested state
            });

            console.log(`Command executed successfully on device ${deviceId}`);
          } catch (error: any) {
            console.error(`Error executing command on device ${deviceId}:`, error.message);

            // Return error result
            commands.push({
              ids: [deviceId],
              status: 'ERROR',
              errorCode: 'deviceOffline',
            });
          }
        }
      }
    }
  } catch (error: any) {
    console.error('Error handling EXECUTE intent:', error.message);
  }

  return {
    requestId: body.requestId,
    payload: {
      commands: commands,
    },
  };
}
