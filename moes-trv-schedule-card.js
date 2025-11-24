/**
 * MOES TRV Schedule Card
 * Custom Lovelace card for managing schedules on MOES Thermostatic Radiator Valves
 * 
 * Repository: https://github.com/BenWolstencroft/home-assistant-moes-trv-schedule-card
 * Version: 1.0.0
 * 
 * Features:
 * - Three schedule groups (Weekdays, Saturday, Sunday)
 * - Four time periods per group (MOES TRV standard)
 * - Temperature settings for each period
 * - Visual schedule editor
 * - Supports text entities (Zigbee/MQTT) and climate entities (Tuya)
 */

class MoesTrvScheduleCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._config = {};
    this._schedule = this.getDefaultSchedule();
  }

  setConfig(config) {
    if (!config.entity) {
      throw new Error('Please define a MOES TRV schedule entity');
    }
    this._config = config;
  }

  set hass(hass) {
    this._hass = hass;
    
    // Get current schedule from entity if available
    const entity = hass.states[this._config.entity];
    if (entity) {
      // Try to get schedule from attribute first
      if (entity.attributes.schedule) {
        this.parseScheduleFromEntity(entity.attributes.schedule);
      }
      // For text entities, the schedule is the state itself
      else if (this._config.entity.startsWith('text.') && entity.state && entity.state !== 'unknown') {
        this.parseScheduleFromEntity(entity.state);
      }
    }
    
    this.render();
  }

  getDefaultSchedule() {
    // MOES TRVs have 3 schedule groups: Weekdays, Saturday, Sunday
    // Each group has exactly 4 periods
    return {
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
    };
  }

  parseScheduleFromEntity(scheduleString) {
    // Parse format: "06:00/18°C  10:00/15°C  17:00/15°C  22:00/15°C  06:00/15°C  10:00/15°C  17:00/15°C  22:00/15°C  06:00/15°C  10:00/15°C  17:00/15°C  22:00/15°C"
    const parts = scheduleString.split('  ').filter(p => p.trim());
    
    if (parts.length === 12) {
      this._schedule = {
        weekdays: parts.slice(0, 4).map(this.parsePeriod),
        saturday: parts.slice(4, 8).map(this.parsePeriod),
        sunday: parts.slice(8, 12).map(this.parsePeriod)
      };
    }
  }

  parsePeriod(periodString) {
    // Parse "06:00/18°C" or "06:00/18"
    const match = periodString.match(/(\d{2}:\d{2})\/(\d+\.?\d*)/);
    if (match) {
      return {
        time: match[1],
        temp: parseFloat(match[2])
      };
    }
    return { time: '00:00', temp: 15 };
  }

  formatScheduleForEntity() {
    // Format: "06:00/18°C  10:00/15°C  17:00/15°C  22:00/15°C  06:00/15°C  10:00/15°C  17:00/15°C  22:00/15°C  06:00/15°C  10:00/15°C  17:00/15°C  22:00/15°C"
    const formatPeriod = (period) => `${period.time}/${period.temp}°C`;
    
    const weekdaysParts = this._schedule.weekdays.map(formatPeriod);
    const saturdayParts = this._schedule.saturday.map(formatPeriod);
    const sundayParts = this._schedule.sunday.map(formatPeriod);
    
    return [...weekdaysParts, ...saturdayParts, ...sundayParts].join('  ');
  }

  render() {
    if (!this._hass || !this._config.entity) {
      return;
    }

    const entity = this._hass.states[this._config.entity];
    const entityName = entity ? entity.attributes.friendly_name || this._config.entity : this._config.entity;

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
        }
        ha-card {
          padding: 16px;
        }
        .card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }
        .card-header h2 {
          margin: 0;
          font-size: 1.5em;
          font-weight: 500;
        }
        .entity-info {
          font-size: 0.9em;
          color: var(--secondary-text-color);
          margin-bottom: 16px;
        }
        .days-container {
          display: flex;
          flex-direction: column;
          gap: 16px;
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
        }
        .day-name {
          font-weight: 500;
          font-size: 1.1em;
          flex: 1;
        }
        .day-description {
          font-size: 0.85em;
          color: var(--secondary-text-color);
          margin-top: 4px;
        }
        .day-actions {
          display: flex;
          gap: 8px;
        }
        .icon-button {
          background: none;
          border: none;
          cursor: pointer;
          padding: 4px;
          color: var(--primary-text-color);
          opacity: 0.6;
          transition: opacity 0.2s;
        }
        .icon-button:hover {
          opacity: 1;
        }
        .periods-container {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .period {
          display: flex;
          gap: 12px;
          align-items: center;
          padding: 8px;
          background: var(--primary-background-color);
          border-radius: 4px;
        }
        .period input[type="time"] {
          flex: 1;
          padding: 8px;
          border: 1px solid var(--divider-color);
          border-radius: 4px;
          background: var(--card-background-color);
          color: var(--primary-text-color);
          font-size: 14px;
        }
        .period input[type="number"] {
          width: 80px;
          padding: 8px;
          border: 1px solid var(--divider-color);
          border-radius: 4px;
          background: var(--card-background-color);
          color: var(--primary-text-color);
          text-align: center;
          font-size: 14px;
        }
        .period .temp-unit {
          font-size: 14px;
          color: var(--secondary-text-color);
        }
        .period-limit-note {
          margin-top: 8px;
          padding: 8px;
          background: var(--secondary-background-color);
          border-radius: 4px;
          font-size: 0.85em;
          color: var(--secondary-text-color);
          text-align: center;
        }
        .actions {
          margin-top: 24px;
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
        .collapsed .periods-container {
          display: none;
        }
        .collapsed .period-limit-note {
          display: none;
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
      
      <ha-card>
        <div class="card-header">
          <h2>TRV Schedule</h2>
        </div>
        
        <div class="entity-info">
          ${entityName}
        </div>
        
        <div class="days-container">
          ${this.renderDays()}
        </div>
        
        <div class="actions">
          <button class="action-button secondary" @click="${() => this.resetSchedule()}">
            Reset to Default
          </button>
          <button class="action-button primary" @click="${() => this.saveSchedule()}">
            Apply Schedule
          </button>
        </div>
        
        ${this._statusMessage ? `<div class="status-message ${this._statusType}">${this._statusMessage}</div>` : ''}
      </ha-card>
    `;

    this.attachEventListeners();
  }

  renderDays() {
    const scheduleGroups = [
      { key: 'weekdays', name: 'Weekdays', description: 'Monday - Friday' },
      { key: 'saturday', name: 'Saturday', description: 'Saturday only' },
      { key: 'sunday', name: 'Sunday', description: 'Sunday only' }
    ];
    
    return scheduleGroups.map((group) => `
      <div class="day-schedule" data-day="${group.key}">
        <div class="day-header" data-day="${group.key}">
          <div>
            <div class="day-name">${group.name}</div>
            <div class="day-description">${group.description}</div>
          </div>
          <div class="day-actions">
            <button class="icon-button toggle-day" data-day="${group.key}" title="Expand/Collapse">
              ▼
            </button>
          </div>
        </div>
        
        <div class="periods-container" data-day="${group.key}">
          ${this.renderPeriods(group.key)}
        </div>
        
        <div class="period-limit-note">
          MOES TRVs support exactly 4 periods per schedule group
        </div>
      </div>
    `).join('');
  }

  renderPeriods(day) {
    const periods = this._schedule[day] || [];
    return periods.map((period, index) => `
      <div class="period" data-day="${day}" data-index="${index}">
        <input type="time" value="${period.time}" data-field="time" />
        <input type="number" value="${period.temp}" min="5" max="35" step="0.5" data-field="temp" />
        <span class="temp-unit">°C</span>
        <button class="icon-button remove-period" title="Remove">
          ✕
        </button>
      </div>
    `).join('');
  }

  attachEventListeners() {
    // Toggle day expansion
    this.shadowRoot.querySelectorAll('.toggle-day').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const day = btn.dataset.day;
        const daySchedule = this.shadowRoot.querySelector(`.day-schedule[data-day="${day}"]`);
        daySchedule.classList.toggle('collapsed');
        btn.textContent = daySchedule.classList.contains('collapsed') ? '▶' : '▼';
      });
    });

    // Remove period
    this.shadowRoot.querySelectorAll('.remove-period').forEach(btn => {
      btn.addEventListener('click', () => {
        const period = btn.closest('.period');
        const day = period.dataset.day;
        const index = parseInt(period.dataset.index);
        this.removePeriod(day, index);
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
        this.updatePeriod(day, index, field, value);
      });
    });
  }

  removePeriod(day, index) {
    // MOES TRVs require exactly 4 periods
    this.showStatus('MOES TRVs require exactly 4 periods per schedule group', 'error');
  }

  updatePeriod(day, index, field, value) {
    this._schedule[day][index][field] = value;
  }

  resetSchedule() {
    this._schedule = this.getDefaultSchedule();
    this.render();
    this.showStatus('Schedule reset to defaults', 'success');
  }

  async saveSchedule() {
    try {
      // Format schedule for MOES TRV
      const scheduleString = this.formatScheduleForEntity();
      
      // Determine the entity type and use appropriate service
      const entity = this._hass.states[this._config.entity];
      
      if (!entity) {
        throw new Error(`Entity ${this._config.entity} not found`);
      }
      
      // Check if it's a text entity (common for Zigbee MQTT devices)
      if (this._config.entity.startsWith('text.')) {
        await this._hass.callService('text', 'set_value', {
          entity_id: this._config.entity,
          value: scheduleString
        });
      } 
      // Check if it's a climate entity with schedule attribute
      else if (this._config.entity.startsWith('climate.')) {
        // Try Tuya integration first
        try {
          await this._hass.callService('tuya', 'send_command', {
            device_id: this._config.entity,
            command: 'schedule',
            params: scheduleString
          });
        } catch (tuyaError) {
          // Fallback to generic climate service
          await this._hass.callService('climate', 'set_schedule', {
            entity_id: this._config.entity,
            schedule: scheduleString
          });
        }
      }
      // Generic fallback - try to set as an attribute or use text service
      else {
        await this._hass.callService('text', 'set_value', {
          entity_id: this._config.entity,
          value: scheduleString
        });
      }
      
      this.showStatus('Schedule applied successfully!', 'success');
      console.info('Applied schedule to', this._config.entity, ':', scheduleString);
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

  getCardSize() {
    return 6;
  }

  static getConfigElement() {
    return document.createElement('moes-trv-schedule-card-editor');
  }

  static getStubConfig() {
    return {
      entity: 'climate.moes_trv',
      show_current_temp: true,
      min_temp: 5,
      max_temp: 35,
      temp_step: 0.5
    };
  }
}

customElements.define('moes-trv-schedule-card', MoesTrvScheduleCard);

// Register the card with Home Assistant
window.customCards = window.customCards || [];
window.customCards.push({
  type: 'moes-trv-schedule-card',
  name: 'MOES TRV Schedule Card',
  description: 'Schedule manager for MOES Thermostatic Radiator Valves',
  preview: false,
  documentationURL: 'https://github.com/BenWolstencroft/home-assistant-moes-trv-schedule-card'
});

console.info(
  '%c MOES-TRV-SCHEDULE-CARD %c 1.0.0 ',
  'color: white; background: #039be5; font-weight: 700;',
  'color: #039be5; background: white; font-weight: 700;'
);
