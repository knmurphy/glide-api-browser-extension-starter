# Glide API Browser Extension Starter

This is a starter project for building a browser extension that interacts with the Glide API. I hope you use it to build something amazing! I made it because browser extensions are super useful but way too tedious for most to build without some starter code.

## Features (Coming Soon)

- 🔐 Secure storage for Glide API tokens
- ⚙️ Easy configuration of app and table settings
- 📝 Table operations:
  - Add rows
  - Query data
  - Update rows
  - Support for large tables
- 🎨 Clean, intuitive interface
- 🛠️ Extensible architecture for community contributions

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- A Glide account and API token

### Installation

1. Clone this repository:
   ```bash
   git clone https://github.com/yourusername/glide-api-browser-extension-starter.git
   cd glide-api-browser-extension-starter
   ```
   

4. Load the extension in Chrome:
   - Go to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the `extension/dist` directory

## Configuration

1. Click the extension icon in your browser
2. Go to Settings
3. Enter your Glide API credentials:
   - API Token
   - App ID
   - Table ID

## Usage Example

```javascript
import * as glide from "@glideapps/tables";

const glideTableTable = glide.table({
    token: "your-token",
    app: "your-app-id",
    table: "your-table-id",
    columns: {
        name: { type: "string", name: "Name" },
        description: { type: "string", name: "Description" }
    }
});

// Add a new row
const glideTableID = await glideTableTable.add({
    name: "New Item",
    description: "Item description"
});
```

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
