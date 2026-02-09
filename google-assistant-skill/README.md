# Google Assistant Smart Home - ThingsBoard Integration

This Cloud Function handles Google Assistant Smart Home fulfillment requests and communicates with ThingsBoard backend.

## Architecture

```
Google Home App
    ↓
Google Smart Home API
    ↓
This Cloud Function (TypeScript)
    ↓
ThingsBoard REST API (/api/google/*)
    ↓
ThingsBoard Devices
```

## Setup

1. Install dependencies:
```bash
npm install
```

2. Build TypeScript:
```bash
npm run build
```

3. Set environment variables:
```bash
export THINGSBOARD_URL=https://your-thingsboard-instance.com
export GOOGLE_PROJECT_ID=your-google-project-id
```

4. Deploy to Google Cloud Functions:
```bash
npm run deploy
```

## Local Development

1. Start development server:
```bash
npm run dev
```

2. Test locally with ngrok:
```bash
ngrok http 8080
```

## Environment Variables

- `THINGSBOARD_URL`: ThingsBoard server URL (required)
- `GOOGLE_PROJECT_ID`: Google Cloud project ID (optional)

## Project Structure

```
src/
├── index.ts                    # Main entry point
├── handlers/
│   ├── sync.ts                 # SYNC intent handler
│   ├── execute.ts              # EXECUTE intent handler
│   ├── query.ts                # QUERY intent handler
│   └── disconnect.ts           # DISCONNECT intent handler
├── services/
│   ├── thingsboard-client.ts   # ThingsBoard API client
│   ├── device-mapper.ts        # Device mapping utilities
│   └── trait-mapper.ts         # Trait/command mapping
└── types/
    ├── google-home.ts          # Google Smart Home types
    └── thingsboard.ts          # ThingsBoard types
```

## Supported Device Types

- Lights (OnOff, Brightness, ColorSetting)
- Switches (OnOff)
- Outlets (OnOff)
- Thermostats (TemperatureSetting)
- Fans (OnOff, FanSpeed)
- Locks (LockUnlock)

## License

Apache License 2.0
