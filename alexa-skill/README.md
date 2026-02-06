# PachiraMining Alexa Smart Home Skill

AWS Lambda function for Alexa Smart Home integration with ThingsBoard IoT platform.

## Architecture

```
Alexa Voice Command → AWS Lambda → ThingsBoard REST API → Device RPC → Physical Device
```

## Features

- **Device Discovery**: Automatically discovers Alexa-enabled devices from ThingsBoard
- **Power Control**: Turn devices on/off via voice commands
- **State Reporting**: Report device state to Alexa
- **Account Linking**: OAuth2 integration with ThingsBoard

## Supported Device Types

- Lights (on/off, brightness)
- Switches (on/off)
- Smart Plugs (on/off)
- Temperature Sensors (read-only)
- Contact Sensors (read-only)
- Motion Sensors (read-only)

## Setup

### Prerequisites

- Node.js 18.x or later
- AWS Account with Lambda access
- Amazon Developer Account
- ThingsBoard server with Alexa-enabled devices

### Installation

1. Install dependencies:
   ```bash
   npm install
   ```

2. Configure environment variables:
   ```bash
   export THINGSBOARD_URL="https://your-thingsboard.com"
   export THINGSBOARD_USER="your-username"
   export THINGSBOARD_PASS="your-password"
   export ALEXA_SKILL_ID="amzn1.ask.skill.xxxxx"
   ```

3. Build the project:
   ```bash
   npm run build
   ```

4. Deploy to AWS:
   ```bash
   npm run deploy
   ```

### Alexa Skill Configuration

1. Go to [Alexa Developer Console](https://developer.amazon.com/alexa/console/ask)
2. Create new skill → Smart Home → Start from scratch
3. Configure skill settings:
   - Skill name: "PachiraMining IoT"
   - Default language: English (US)
4. Set Lambda ARN as the endpoint
5. Configure Account Linking with ThingsBoard OAuth2

## ThingsBoard Device Configuration

To enable a device for Alexa control, add the following to the device profile's `alexa_capabilities` field:

```json
{
  "enabled": true,
  "category": "SWITCH"
}
```

Supported categories: `LIGHT`, `SWITCH`, `SMARTPLUG`, `THERMOSTAT`, `TEMPERATURE_SENSOR`, `CONTACT_SENSOR`, `MOTION_SENSOR`

## Voice Commands

- "Alexa, discover devices"
- "Alexa, turn on [device name]"
- "Alexa, turn off [device name]"
- "Alexa, set [light name] to 50 percent"
- "Alexa, what's the temperature in [room]"

## Development

### Project Structure

```
alexa-skill/
├── src/
│   ├── index.ts              # Lambda entry point
│   ├── handlers/
│   │   ├── discovery.ts      # Device discovery
│   │   ├── powerController.ts # On/off control
│   │   ├── authorization.ts  # OAuth handling
│   │   └── stateReport.ts    # State reporting
│   ├── services/
│   │   ├── thingsboard-client.ts
│   │   └── device-mapper.ts
│   └── types/
│       ├── alexa.ts
│       └── thingsboard.ts
├── package.json
├── tsconfig.json
└── serverless.yml
```

### Testing Locally

```bash
# Run tests
npm test

# Test specific handler
npm test -- --grep "discovery"
```

## Security

- All communication uses HTTPS/TLS
- ThingsBoard credentials stored in Lambda environment variables
- OAuth2 tokens validated on each request
- Device access validated against user permissions

## License

Proprietary - PachiraMining
