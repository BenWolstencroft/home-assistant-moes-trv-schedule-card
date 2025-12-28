/**
 * MOES TRV Schedule Card - More Info Dialog
 * Popup dialog for editing TRV schedules
 */

class MoesTrvScheduleMoreInfo extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._schedule = null;
    this._statusMessage = null;
    this._statusType = null;
    this._openDay = this.getCurrentDayKey(); // Default to current day
  }

  getCurrentDayKey() {
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0 = Sunday, 6 = Saturday
    
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
    const scheduleGroups = [
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
    return periods.map((period, index) => `
      <div class="period" data-day="${day}" data-index="${index}">
        <input type="time" value="${period.time}" data-field="time" />
        <input type="number" value="${period.temp}" min="5" max="35" step="0.5" data-field="temp" />
        <span class="temp-unit">°C</span>
      </div>
    `).join('');
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

    // Apply button
    const applyBtn = this.shadowRoot.getElementById('apply-btn');
    if (applyBtn) {
      applyBtn.addEventListener('click', () => this.saveSchedule());
    }
  }

  async saveSchedule() {
    try {
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
