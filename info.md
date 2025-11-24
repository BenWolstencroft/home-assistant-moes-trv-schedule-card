# Information

This is a custom Lovelace card for Home Assistant that provides a visual schedule manager for MOES Thermostatic Radiator Valves (TRVs).

## Features

- Three schedule groups: Weekdays, Saturday, and Sunday
- Four configurable time periods per group
- Visual time and temperature editor
- Supports both Zigbee (text entity) and Tuya (climate entity) integrations
- Generates proper MOES schedule format with double-space separators

## Installation via HACS

1. Open HACS in Home Assistant
2. Click on "Frontend"
3. Click the menu (⋮) in the top right
4. Select "Custom repositories"
5. Add this repository URL: `https://github.com/BenWolstencroft/home-assistant-moes-trv-schedule-card`
6. Select category: "Lovelace"
7. Click "Add"
8. Find "MOES TRV Schedule Card" in the list
9. Click "Download"
10. Restart Home Assistant
11. Clear your browser cache

## Configuration

Add the card to your dashboard:

```yaml
type: custom:moes-trv-schedule-card
entity: text.bedroom_trv_schedule  # For Zigbee/MQTT
# OR
entity: climate.bedroom_trv  # For Tuya devices
```

See [README.md](README.md) for full documentation.
