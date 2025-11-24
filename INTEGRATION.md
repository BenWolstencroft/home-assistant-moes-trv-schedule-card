# MOES TRV Schedule Card - Integration Guide

This guide explains how to integrate the MOES TRV Schedule Card with different Home Assistant integrations.

## Text Entity Integration (Recommended for Zigbee/MQTT)

If your MOES TRV is connected via Zigbee (Zigbee2MQTT, ZHA, etc.) and exposes a schedule as a text entity:

### Service Call Format

The card automatically detects text entities and uses:

```javascript
await this._hass.callService('text', 'set_value', {
  entity_id: 'text.bedroom_trv_schedule',
  value: "06:00/18°C  10:00/15°C  17:00/18°C  22:00/15°C  06:00/15°C  10:00/15°C  17:00/15°C  22:00/15°C  06:00/15°C  10:00/15°C  17:00/15°C  22:00/15°C"
});
```

### Configuration

Simply use your text entity ID:

```yaml
type: custom:moes-trv-schedule-card
entity: text.bedroom_trv_schedule
```

### Finding Your Schedule Entity

1. Go to Developer Tools > States
2. Search for your TRV device
3. Look for entities ending in `_schedule` or containing `schedule`
4. The entity should be of type `text.*`

## Tuya Integration

If your MOES TRV is connected via the official Tuya integration (for WiFi/cloud devices):

### Service Call Format

The card uses the Tuya `send_command` service with the schedule formatted as:

```javascript
await this._hass.callService('tuya', 'send_command', {
  device_id: this._config.entity,
  command: 'schedule',
  params: "06:00/18°C  10:00/15°C  17:00/18°C  22:00/15°C  06:00/15°C  10:00/15°C  17:00/15°C  22:00/15°C  06:00/15°C  10:00/15°C  17:00/15°C  22:00/15°C"
});
```

### Schedule Format

MOES TRVs expect schedules in this specific format:
- 12 periods total (4 weekday + 4 Saturday + 4 Sunday)
- Format: `HH:MM/TEMP°C`
- Double-space separator between periods
- Example: `"06:00/18°C  10:00/15°C  17:00/18°C  22:00/15°C  ..."`

### Getting Device ID

The card uses the entity ID directly. If you need the device_id:
- Developer Tools > States > Select your TRV entity
- Look for `device_id` in the attributes

## Zigbee2MQTT Integration

For MOES TRVs connected via Zigbee2MQTT, the device typically exposes a schedule as a text entity.

### Recommended Method (Text Entity)

Most Zigbee2MQTT MOES TRVs create a `text.*_schedule` entity. Use the text entity approach above.

### Direct MQTT Method (Advanced)

If you need to publish directly to MQTT:

```javascript
await this._hass.callService('mqtt', 'publish', {
  topic: `zigbee2mqtt/${deviceName}/set`,
  payload: JSON.stringify({
    schedule: "06:00/18°C  10:00/15°C  17:00/18°C  22:00/15°C  06:00/15°C  10:00/15°C  17:00/15°C  22:00/15°C  06:00/15°C  10:00/15°C  17:00/15°C  22:00/15°C"
  })
});
```

### Finding Device Name

Check the MQTT device name in:
- Zigbee2MQTT UI > Devices
- Home Assistant > Settings > Devices & Services > MQTT

## ZHA (Zigbee Home Automation)

For ZHA-integrated MOES TRVs:

### Service Call Format

ZHA may use different service calls depending on the specific device implementation:

```javascript
await this._hass.callService('zha', 'set_zigbee_cluster_attribute', {
  ieee: deviceIEEE,
  endpoint_id: 1,
  cluster_id: 513, // Thermostat cluster
  cluster_type: 'in',
  attribute: 'schedule',
  value: this._schedule
});
```

## Custom Integration Example

If you need to customize the service call, edit the `saveSchedule()` method in `moes-trv-schedule-card.js`:

```javascript
async saveSchedule() {
  try {
    // Example for custom service
    await this._hass.callService('your_domain', 'set_schedule', {
      entity_id: this._config.entity,
      schedule: this._schedule
    });
    
    this.showStatus('Schedule applied successfully!', 'success');
  } catch (error) {
    console.error('Error applying schedule:', error);
    this.showStatus('Error applying schedule: ' + error.message, 'error');
  }
}
```

## Schedule Format

The schedule object structure used by this card:

```javascript
{
  weekdays: [
    { time: '06:00', temp: 18 },
    { time: '10:00', temp: 15 },
    { time: '17:00', temp: 18 },
    { time: '22:00', temp: 15 }
  ],
  saturday: [
    { time: '06:00', temp: 15 },
    { time: '10:00', temp: 15 },
    { time: '17:00', temp: 15 },
    { time: '22:00', temp: 15 }
  ],
  sunday: [
    { time: '06:00', temp: 15 },
    { time: '10:00', temp: 15 },
    { time: '17:00', temp: 15 },
    { time: '22:00', temp: 15 }
  ]
}
```

This internal format is converted to the MOES string format:
```
"06:00/18°C  10:00/15°C  17:00/18°C  22:00/15°C  06:00/15°C  10:00/15°C  17:00/15°C  22:00/15°C  06:00/15°C  10:00/15°C  17:00/15°C  22:00/15°C"
```

## Testing Your Integration

### For Text Entities (Zigbee/MQTT)

1. Open Home Assistant Developer Tools > Services
2. Try the text service:

```yaml
service: text.set_value
target:
  entity_id: text.bedroom_trv_schedule
data:
  value: "06:00/18°C  10:00/15°C  17:00/18°C  22:00/15°C  06:00/15°C  10:00/15°C  17:00/15°C  22:00/15°C  06:00/15°C  10:00/15°C  17:00/15°C  22:00/15°C"
```

### For Tuya Integration

1. Open Home Assistant Developer Tools > Services
2. Try the Tuya service:

```yaml
service: tuya.send_command
data:
  device_id: climate.your_trv
  command: schedule
  params: "06:00/18°C  10:00/15°C  17:00/18°C  22:00/15°C  06:00/15°C  10:00/15°C  17:00/15°C  22:00/15°C  06:00/15°C  10:00/15°C  17:00/15°C  22:00/15°C"
```

### Verification

1. Check if the schedule applies to your TRV
2. Check the TRV's display/app to see if the schedule is set
3. Look at Home Assistant logs for any errors
4. Verify the entity state updates with the new schedule

## Common Issues

### Issue: Schedule doesn't apply

**Solution**: Check that your TRV firmware supports scheduling. Some older MOES models may not support automated schedules.

### Issue: Service not found

**Solution**: Your integration may use a different service name. Check the integration's documentation or use Developer Tools to find available services.

### Issue: Wrong schedule format

**Solution**: Different integrations expect different formats. You may need to transform the schedule object before sending it.

## Need Help?

If you're having trouble integrating with your specific MOES TRV model:

1. Check the integration documentation
2. Look at example service calls in Developer Tools
3. Open an issue on GitHub with:
   - Your TRV model number
   - Integration type (Tuya/Z2M/ZHA)
   - Error messages from browser console

## Contributing Integration Examples

If you successfully integrate with a specific MOES model, please contribute your changes or documentation!
