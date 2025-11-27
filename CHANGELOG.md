## 1.3.14 (2025-11-27)

### Fixed

- Fixed missing :host style declaration causing card to not render
- Restored critical Shadow DOM styles for proper custom element display

## 1.3.13 (2025-11-26)

### Improved

- Removed card hover effects (cursor and box-shadow) for cleaner appearance
- Card now has consistent styling without interactive hover states

## 1.3.12 (2025-11-26)

### Fixed

- Fixed 'climate.set_schedule not found' error when saving schedules
- Schedule save logic now properly detects where schedule was retrieved from
- For climate entities with schedule attribute, automatically finds and updates underlying text entity
- Added clear error messages when no writable entity can be found

### Changed

- Removed invalid climate.set_schedule service call (doesn't exist in Home Assistant)
- Save logic now mirrors retrieval logic: checks attribute first, then text entity state

## 1.3.11 (2025-11-26)

### Fixed

- Current temperature now displays scheduled temperature instead of device's actual temperature
- Card title now respects config 'title' option, falling back to entity friendly name or ID

### Changed

- Removed unused getCurrentTemp() function

## 1.3.10 (2025-11-26)

### Improved

- Reduced card content padding for more compact display (12px → 10px)
- Added text-wrap: nowrap and text-overflow: ellipsis to entity name to prevent wrapping

## 1.3.9 (2025-11-26)

### Fixed

- Fixed constant re-rendering making schedule editing impossible
- Prevented render() calls when dialog is open to stop UI interruptions

## 1.3.8 (2025-11-26)

### Code Quality

- Consolidated duplicate input styles in more-info dialog
- Reduced CSS duplication by extracting common properties to shared selectors

## 1.3.7 (2025-11-26)

### Fixed

- Fixed dialog UI resetting when schedule data refreshes
- Paused schedule data updates while more info dialog is open

### Improved

- Reduced whitespace between current and next transition rows for more compact display

## 1.3.6 (2025-11-25)

### Fixed

- Fixed card editor not rendering in Lovelace UI
- Added render() call in setConfig() method
- Changed render guard to check for config instead of hass
- Added label property to entity picker to fix translation errors

## 1.3.5 (2025-11-25)

### Fixed

- Fixed entity picker not displaying in card editor
- Changed to dynamic element creation for proper ha-entity-picker rendering
- Entity selector now works correctly in Shadow DOM

## 1.3.4 (2025-11-25)

### Code Quality

- Removed unused CSS classes and config options
- Cleaned up stub config (removed unused show_current_temp, min_temp, max_temp, temp_step)
- Fixed typo in event listener code
- Further reduced component file size

## 1.3.3 (2025-11-25)

### Code Quality

- Removed unused CSS classes from more-info dialog component
- Cleaned up styling for better maintainability
- Reduced component file size

## 1.3.2 (2025-11-25)

### CI/CD

- Automated GitHub release creation on successful validation
- Release notes automatically extracted from CHANGELOG.md
- Proper version tagging for HACS compatibility

## 1.3.1 (2025-11-25)

### Documentation

- Added screenshots to README (compact view in light/dark themes, editor dialog)
- Improved documentation structure with visual examples
- Meets HACS validation requirements for images

## 1.3.0 (2025-11-25)

### Features

- **Redesigned compact card layout** with improved information density
- **Current schedule slot display** showing when the current temperature period started
- **Left-right layout**: Entity name on left, schedule info on right
- Better use of typography with bold weights for key information
- Theme color integration for temperatures and highlights

### Improvements

- Normalized font sizes for cleaner appearance
- Reduced padding for more compact dashboard footprint
- Improved visual hierarchy with strategic use of bold text
- Better alignment and spacing using flexbox
- Shows both current slot start time and current/target temperature

## 1.2.3 (2025-11-25)

### Features

- **Accordion behavior** for schedule groups - only one panel can be open at a time
- **Smart default panel** - dialog opens with current day's schedule visible (weekday/Saturday/Sunday)
- Improved user experience with focused schedule editing

### Improvements

- Better navigation between schedule groups
- Reduced visual clutter in dialog
- Clearer indication of active schedule group

## 1.2.2 (2025-11-25)

### Bug Fixes

- Replaced complex polymer dialog system with simple custom overlay to avoid DOM conflicts
- Fixed CustomElementRegistry errors ("dom-module" already registered)
- Fixed 404 errors from attempting to load scoped-custom-element-registry
- Improved dialog stability and compatibility

### Technical Changes

- Simplified dialog implementation using native CSS and DOM manipulation
- Removed dependencies on external polymer/paper-dialog libraries
- Better browser compatibility

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
