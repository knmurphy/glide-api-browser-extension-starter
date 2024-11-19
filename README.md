# Glide API Browser Extension Starter

A browser extension that allows you to easily add rows to your Glide tables directly from your browser.

## Features

- Add rows to Glide tables with a simple form interface
- Save multiple table configurations
- Parse Glide table configuration code automatically
- Secure storage of API tokens

## Setup

1. Install dependencies:
```bash
pnpm install
```

2. Run the development server:
```bash
pnpm dev
```

## Usage

1. Click on the extension icon to open the popup
2. First time? Click "Open Options" to configure your Glide tables
3. In the options page:
   - You can paste your Glide table configuration code directly, or
   - Fill in the fields manually:
     - Configuration Name (for your reference)
     - API Token (your Glide API token)
     - App ID (your Glide app ID)
     - Table ID (your Glide table ID)
     - Column Configuration (JSON format of your table columns)

Example column configuration:
```json
{
  "name": {
    "type": "string",
    "name": "Name"
  },
  "description": {
    "type": "string",
    "name": "Description"
  }
}
```

4. Once configured, use the popup to:
   - Select your saved configuration
   - Fill in the form fields
   - Click "Add Row" to submit the data

## Development

This extension is built using:
- [WXT](https://wxt.dev) - Browser extension framework
- Vue.js - UI framework
- @glideapps/tables - Official Glide Tables SDK

## Build

To build the extension for production:
```bash
pnpm build
```

The built extension will be in the `dist` directory.

## Project Structure

```
├── src/
│   ├── popup/           # Extension popup interface
│   ├── options/         # Settings page
│   ├── background/      # Background scripts
│   └── lib/            # Shared utilities
├── public/             # Static assets
└── wxt.config.ts      # WXT configuration
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## License

MIT License - feel free to modify and share!

## Support

- Report issues on GitHub
- Join our community discussions
- Check out the [Glide API documentation](https://docs.glideapps.com/reference/api-introduction)
