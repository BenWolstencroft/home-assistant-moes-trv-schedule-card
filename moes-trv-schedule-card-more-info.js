/**
 * MOES TRV Schedule Card - More Info Dialog
 * Popup dialog for editing TRV schedules
 */

class MoesTrvScheduleMoreInfo extends HTMLElement {
  static SONOFF_DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  static SONOFF_PATTERN = /^text\.(.+)_weekly_schedule_(monday|tuesday|wednesday|thursday|friday|saturday|sunday)$/;

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._schedule = null;
    this._deviceType = 'moes';
    this._statusMessage = null;
    this._statusType = null;
    this._openDay = this.getCurrentDayKey(); // Default to current day
  }

  setDeviceType(type) {
    this._deviceType = type;
    this._openDay = this.getCurrentDayKey();
  }

  getCurrentDayKey() {
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0 = Sunday, 6 = Saturday

    if (this._deviceType === 'sonoff') {
      return ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][dayOfWeek];
    }
    if (dayOfWeek === 0) {
      return 'sunday';
    } else if (dayOfWeek === 6) {
      return 'saturday';
    } else {
      return 'weekdays';
    }
  }

  setConfig(config) {
    this._config = config;
  }

  set hass(hass) {
    this._hass = hass;
    this.render();
  }

  setSchedule(schedule) {
    this._schedule = JSON.parse(JSON.stringify(schedule));
    this.render();
  }

  formatScheduleForEntity() {
    const parts = [];
    ['weekdays', 'saturday', 'sunday'].forEach(day => {
      this._schedule[day].forEach(period => {
        parts.push(`${period.time}/${period.temp}°C`);
      });
    });
    return parts.join('  ');
  }

  formatScheduleForSensorEntity() {
    // Format schedule as attributes for sensor-based devices
    // Format: weekdays_p1_hour, weekdays_p1_minute, weekdays_p1_temperature, etc.
    const data = {};
    const days = ['weekdays', 'saturday', 'sunday'];
    const periodNames = ['p1', 'p2', 'p3', 'p4'];

    for (const day of days) {
      const periods = this._schedule[day] || [];
      for (let i = 0; i < periods.length && i < 4; i++) {
        const period = periods[i];
        const periodName = periodNames[i];
        const [hour, minute] = period.time.split(':').map(Number);
        
        data[`${day}_${periodName}_hour`] = hour;
        data[`${day}_${periodName}_minute`] = minute;
        data[`${day}_${periodName}_temperature`] = period.temp;
      }
    }

    return data;
  }

  formatSonoffScheduleForDay(day) {
    // Format: "00:00/16 07:00/19 10:00/16 10:00/16 17:00/19 23:00/16"
    const periods = this._schedule[day] || [];
    return periods.map(p => `${p.time}/${p.temp}`).join(' ');
  }

  getSonoffBaseEntityId() {
    const match = this._config.entity.match(MoesTrvScheduleMoreInfo.SONOFF_PATTERN);
    if (!match) return null;
    return match[1];
  }

  getSonoffDayEntityId(day) {
    const base = this.getSonoffBaseEntityId();
    return base ? `text.${base}_weekly_schedule_${day}` : null;
  }

  hasProgramAttributes(entity) {
    // Check if entity has program-style attributes
    // Can be either nested under 'program' key or flat attributes
    if (!entity || !entity.attributes) return false;
    
    // Check for nested program object (Zigbee2MQTT style)
    if (entity.attributes.program) {
      const program = entity.attributes.program;
      return (
        program.weekdays_p1_hour !== undefined ||
        program.saturday_p1_hour !== undefined ||
        program.sunday_p1_hour !== undefined
      );
    }
    
    // Check for flat attributes
    return (
      entity.attributes.weekdays_p1_hour !== undefined ||
      entity.attributes.saturday_p1_hour !== undefined ||
      entity.attributes.sunday_p1_hour !== undefined
    );
  }

  render() {
    if (!this._hass || !this._config || !this._schedule) {
      return;
    }

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
        }
        .container {
          padding: 24px;
          max-height: 80vh;
          overflow-y: auto;
        }
        .days-container {
          display: flex;
          flex-direction: column;
          gap: 16px;
          margin-bottom: 24px;
        }
        .day-schedule {
          border: 1px solid var(--divider-color);
          border-radius: 8px;
          padding: 12px;
          background: var(--card-background-color);
        }
        .day-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
          cursor: pointer;
          user-select: none;
        }
        .day-info {
          flex: 1;
        }
        .day-name {
          font-weight: 500;
          font-size: 1.1em;
        }
        .toggle-icon {
          font-size: 1.2em;
          transition: transform 0.2s;
        }
        .day-schedule.collapsed .toggle-icon {
          transform: rotate(-90deg);
        }
        .periods-container {
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin-top: 12px;
        }
        .day-schedule.collapsed .periods-container {
          display: none;
        }
        .period {
          display: flex;
          gap: 12px;
          align-items: center;
          padding: 8px;
          background: var(--primary-background-color);
          border-radius: 4px;
        }
        .period input {
          padding: 8px;
          border: 1px solid var(--divider-color);
          border-radius: 4px;
          background: var(--card-background-color);
          color: var(--primary-text-color);
          font-size: 14px;
        }
        .period input[type="time"] {
          flex: 1;
        }
        .period input[type="number"] {
          width: 80px;
          text-align: center;
        }
        .period .temp-unit {
          font-size: 14px;
          color: var(--secondary-text-color);
        }
        .actions {
          display: flex;
          gap: 12px;
          justify-content: flex-end;
        }
        .action-button {
          padding: 12px 24px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
          transition: opacity 0.2s;
        }
        .action-button.primary {
          background: var(--primary-color);
          color: var(--text-primary-color);
        }
        .action-button.secondary {
          background: var(--secondary-background-color);
          color: var(--primary-text-color);
        }
        .action-button:hover {
          opacity: 0.8;
        }
        .status-message {
          padding: 12px;
          margin-top: 16px;
          border-radius: 4px;
          text-align: center;
        }
        .status-message.success {
          background: var(--success-color, #4caf50);
          color: white;
        }
        .status-message.error {
          background: var(--error-color, #f44336);
          color: white;
        }
        .remove-period-btn {
          background: none;
          border: 1px solid var(--divider-color);
          border-radius: 4px;
          cursor: pointer;
          color: var(--error-color, #f44336);
          font-size: 18px;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0;
          flex-shrink: 0;
          transition: all 0.2s;
        }
        .remove-period-btn:hover {
          background: var(--error-color, #f44336);
          color: white;
        }
        .add-period-btn {
          background: none;
          border: 1px dashed var(--divider-color);
          border-radius: 4px;
          cursor: pointer;
          color: var(--primary-color);
          padding: 8px;
          width: 100%;
          font-size: 14px;
          margin-top: 4px;
          transition: all 0.2s;
        }
        .add-period-btn:hover {
          background: var(--primary-background-color);
          border-color: var(--primary-color);
        }
      </style>
      
      <div class="container">
        <div class="days-container">
          ${this.renderDays()}
        </div>
        
        <div class="actions">
          <button class="action-button primary" id="apply-btn">
            Apply Schedule
          </button>
        </div>
        
        ${this._statusMessage ? `<div class="status-message ${this._statusType}">${this._statusMessage}</div>` : ''}
      </div>
    `;

    this.attachEventListeners();
  }

  renderDays() {
    const scheduleGroups = this._deviceType === 'sonoff'
      ? MoesTrvScheduleMoreInfo.SONOFF_DAYS.map(day => ({
          key: day,
          name: day.charAt(0).toUpperCase() + day.slice(1)
        }))
      : [
          { key: 'weekdays', name: 'Weekdays'},
          { key: 'saturday', name: 'Saturday'},
          { key: 'sunday', name: 'Sunday' }
        ];

    return scheduleGroups.map((group) => {
      const isCollapsed = this._openDay !== group.key;
      return `
        <div class="day-schedule ${isCollapsed ? 'collapsed' : ''}" data-day="${group.key}">
          <div class="day-header" data-day="${group.key}">
            <div class="day-info">
              <div class="day-name">${group.name}</div>
            </div>
            <span class="toggle-icon">${isCollapsed ? '▶' : '▼'}</span>
          </div>
          
          <div class="periods-container" data-day="${group.key}">
            ${this.renderPeriods(group.key)}
          </div>
        </div>
      `;
    }).join('');
  }

  renderPeriods(day) {
    const periods = this._schedule[day] || [];
    const isSonoff = this._deviceType === 'sonoff';
    const minTemp = isSonoff ? 4 : 5;

    let html = periods.map((period, index) => {
      const isFirstPeriod = index === 0;
      const timeAttrs = isSonoff && isFirstPeriod ? 'disabled' : '';
      const removeBtn = isSonoff && !isFirstPeriod
        ? `<button class="remove-period-btn" data-day="${day}" data-index="${index}" title="Remove transition">&times;</button>`
        : '';
      return `
        <div class="period" data-day="${day}" data-index="${index}">
          <input type="time" value="${period.time}" data-field="time" ${timeAttrs} />
          <input type="number" value="${period.temp}" min="${minTemp}" max="35" step="0.5" data-field="temp" />
          <span class="temp-unit">°C</span>
          ${removeBtn}
        </div>
      `;
    }).join('');

    if (isSonoff && periods.length < 6) {
      html += `<button class="add-period-btn" data-day="${day}">+ Add Transition</button>`;
    }

    return html;
  }

  attachEventListeners() {
    // Toggle day expansion - accordion style (only one open at a time)
    this.shadowRoot.querySelectorAll('.day-header').forEach(header => {
      header.addEventListener('click', () => {
        const day = header.dataset.day;
        
        // If clicking already open panel, do nothing
        if (this._openDay === day) {
          return;
        }
        
        // Update which day is open and re-render
        this._openDay = day;
        this.render();
      });
    });

    // Update period values
    this.shadowRoot.querySelectorAll('.period input').forEach(input => {
      input.addEventListener('change', () => {
        const period = input.closest('.period');
        const day = period.dataset.day;
        const index = parseInt(period.dataset.index);
        const field = input.dataset.field;
        const value = field === 'temp' ? parseFloat(input.value) : input.value;
        this._schedule[day][index][field] = value;
      });
    });

    // Add transition buttons (Sonoff)
    this.shadowRoot.querySelectorAll('.add-period-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const day = btn.dataset.day;
        const periods = this._schedule[day];
        if (periods.length < 6) {
          const lastPeriod = periods[periods.length - 1];
          const [lastH, lastM] = lastPeriod.time.split(':').map(Number);
          const nextMinutes = Math.min(lastH * 60 + lastM + 60, 23 * 60);
          const newTime = `${String(Math.floor(nextMinutes / 60)).padStart(2, '0')}:${String(nextMinutes % 60).padStart(2, '0')}`;
          periods.push({ time: newTime, temp: lastPeriod.temp });
          this.render();
        }
      });
    });

    // Remove transition buttons (Sonoff)
    this.shadowRoot.querySelectorAll('.remove-period-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const day = btn.dataset.day;
        const index = parseInt(btn.dataset.index);
        if (this._schedule[day].length > 1) {
          this._schedule[day].splice(index, 1);
          this.render();
        }
      });
    });

    // Apply button
    const applyBtn = this.shadowRoot.getElementById('apply-btn');
    if (applyBtn) {
      applyBtn.addEventListener('click', () => this.saveSchedule());
    }
  }

  async saveSchedule() {
    try {
      // Handle Sonoff TRVZB - save each day to its own text entity
      if (this._deviceType === 'sonoff') {
        // Validate and sort transitions
        for (const day of MoesTrvScheduleMoreInfo.SONOFF_DAYS) {
          const periods = this._schedule[day];
          const dayName = day.charAt(0).toUpperCase() + day.slice(1);
          if (!periods || periods.length === 0) {
            this.showStatus(`${dayName}: At least one transition is required`, 'error');
            return;
          }
          if (periods.length > 6) {
            this.showStatus(`${dayName}: Maximum 6 transitions allowed`, 'error');
            return;
          }
          // Sort by time
          periods.sort((a, b) => a.time.localeCompare(b.time));
          if (periods[0].time !== '00:00') {
            this.showStatus(`${dayName}: First transition must start at 00:00`, 'error');
            return;
          }
          for (const period of periods) {
            if (period.temp < 4 || period.temp > 35) {
              this.showStatus(`${dayName}: Temperature must be between 4°C and 35°C`, 'error');
              return;
            }
          }
        }

        for (const day of MoesTrvScheduleMoreInfo.SONOFF_DAYS) {
          const entityId = this.getSonoffDayEntityId(day);
          if (!entityId) continue;
          const value = this.formatSonoffScheduleForDay(day);
          await this._hass.callService('text', 'set_value', {
            entity_id: entityId,
            value: value
          });
        }
        this.showStatus('Schedule applied successfully!', 'success');
        setTimeout(() => {
          this.dispatchEvent(new CustomEvent('close-dialog'));
        }, 1000);
        return;
      }

      const scheduleString = this.formatScheduleForEntity();
      const entity = this._hass.states[this._config.entity];

      if (!entity) {
        throw new Error(`Entity ${this._config.entity} not found`);
      }

      // Determine where the schedule came from to know how to set it
      const hasScheduleAttribute = entity.attributes && entity.attributes.schedule !== undefined;
      const isTextEntity = this._config.entity.startsWith('text.');
      const isSensorEntity = this._config.entity.startsWith('sensor.');
      const hasProgramAttrs = this.hasProgramAttributes(entity);

      if (isSensorEntity && hasProgramAttrs) {
        // Sensor entity with program attributes - use MQTT to set via Zigbee2MQTT
        const programData = this.formatScheduleForSensorEntity();
        
        // Get the device's friendly name for MQTT topic
        let mqttDeviceName = null;
        
        // First, check if user has explicitly configured the MQTT device name
        if (this._config.mqtt_device_name) {
          mqttDeviceName = this._config.mqtt_device_name;
        }
        // Fall back to deriving from entity ID (most reliable for Z2M)
        // Entity ID format: sensor.entrance_underfloor_heating_program
        // MQTT topic format: zigbee2mqtt/entrance_underfloor_heating/set
        else {
          const entityName = this._config.entity.split('.')[1];
          // Remove _program suffix to get the device name
          mqttDeviceName = entityName.replace(/_program$/, '');
        }
        
        // Publish to MQTT via Home Assistant's mqtt.publish service
        // Wrap in 'program' object as Zigbee2MQTT expects this structure
        const mqttTopic = `zigbee2mqtt/${mqttDeviceName}/set`;
        const mqttPayload = { program: programData };
        
        await this._hass.callService('mqtt', 'publish', {
          topic: mqttTopic,
          payload: JSON.stringify(mqttPayload)
        });
        
        this.showStatus('Schedule applied via MQTT!', 'success');
      } else if (isTextEntity && !hasScheduleAttribute) {
        // Text entity where schedule is in the state
        await this._hass.callService('text', 'set_value', {
          entity_id: this._config.entity,
          value: scheduleString
        });
        this.showStatus('Schedule applied successfully!', 'success');
      } else if (hasScheduleAttribute) {
        // Schedule is in an attribute - need to find the source entity
        // For climate entities with schedule attribute, look for the underlying text entity
        if (this._config.entity.startsWith('climate.')) {
          // Try to find associated text entity
          const entityName = this._config.entity.split('.')[1];
          const textEntityPatterns = [
            `text.${entityName}_schedule`,
            `text.${entityName}`,
            `text.${entityName.replace('_trv', '')}_schedule`
          ];
          
          let targetTextEntity = null;
          for (const pattern of textEntityPatterns) {
            if (this._hass.states[pattern]) {
              targetTextEntity = pattern;
              break;
            }
          }
          
          if (targetTextEntity) {
            await this._hass.callService('text', 'set_value', {
              entity_id: targetTextEntity,
              value: scheduleString
            });
            this.showStatus('Schedule applied successfully!', 'success');
          } else {
            throw new Error(`Cannot update schedule for ${this._config.entity}. No writable text entity found for schedule attribute.`);
          }
        } else {
          throw new Error(`Cannot update schedule attribute for ${this._config.entity}. Attributes are read-only.`);
        }
      } else {
        throw new Error(`No schedule data found for ${this._config.entity}. Entity must have either a 'schedule' attribute, be a text entity, or be a sensor with program attributes.`);
      }
      
      // Close dialog after 1 second
      setTimeout(() => {
        this.dispatchEvent(new CustomEvent('close-dialog'));
      }, 1000);
    } catch (error) {
      console.error('Error applying schedule:', error);
      this.showStatus('Error applying schedule: ' + error.message, 'error');
    }
  }

  showStatus(message, type) {
    this._statusMessage = message;
    this._statusType = type;
    this.render();
    
    setTimeout(() => {
      this._statusMessage = null;
      this.render();
    }, 3000);
  }
}

customElements.define('moes-trv-schedule-more-info', MoesTrvScheduleMoreInfo);
