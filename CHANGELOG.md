## 1.2.1 (2025-11-24)

### Bug Fixes

- Fixed custom dialog not opening when clicking card (was opening default entity more-info instead)
- Added event propagation stopping to prevent conflicts with default HA behaviors
- Improved dialog event handling for proper custom schedule editor display

## 1.2.0 (2025-11-24)

### Features

- **Native Home Assistant dialog** for schedule editing (like thermostat card behavior)
- Separated schedule editor into dedicated more-info component
- Improved dialog interaction patterns matching HA standards

### Technical Improvements

- Split card into main component (`moes-trv-schedule-card.js`) and dialog component (`moes-trv-schedule-card-more-info.js`)
- Cleaner code architecture with separation of concerns
- Reduced main card complexity and file size
- Proper event handling with Home Assistant dialog system

### Bug Fixes

- Fixed dialog not opening on card click
- Improved dialog behavior to match native HA components

## 1.1.0 (2025-11-24)

### Features

- **Compact dashboard display** showing next scheduled transition
- **Click-to-edit** dialog interface for full schedule management
- Current temperature display on compact card
- Reduced card size from 6 to 2 for minimal dashboard footprint

### Improvements

- **Compact dashboard display** showing next scheduled transition
- **Click-to-edit** dialog interface for full schedule management
- Current temperature display on compact card
- Configuration editor with ha-entity-picker
- More efficient use of dashboard space
- Better user experience with on-demand editor
- Improved mobile usability with dialog interface
- Expand/collapse schedule groups in dialog

## 1.0.0 (2025-11-24)

### Features

- Initial release of MOES TRV Schedule Card
- Three schedule groups: Weekdays, Saturday, Sunday
- Four time periods per schedule group (MOES TRV standard)
- Visual time and temperature editor
- Support for text entities (Zigbee/MQTT devices)
- Support for climate entities (Tuya devices)
- Automatic entity type detection
- MOES-compliant schedule format generation with double-space separators
- Temperature range validation
- Real-time schedule updates
- Modern UI matching Home Assistant design

### Documentation

- Comprehensive README with installation and usage instructions
- Integration guide for different device types
- Multiple YAML configuration examples
- MIT License
