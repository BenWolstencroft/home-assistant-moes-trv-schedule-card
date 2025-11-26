/**
 * MOES TRV Schedule Card
 * Custom Lovelace card for managing schedules on MOES Thermostatic Radiator Valves
 * 
 * Repository: https://github.com/BenWolstencroft/home-assistant-moes-trv-schedule-card
 * Version: 1.3.12
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
    this._showDialog = false;
  }

  setConfig(config) {
    if (!config.entity) {
      throw new Error('Please define a MOES TRV schedule entity');
    }
    this._config = config;
  }

  set hass(hass) {
    this._hass = hass;
    
    // Don't refresh schedule data or re-render if dialog is open to prevent UI resets
    if (!this._showDialog) {
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

  getNextTransition() {
    const now = new Date();
    const currentDay = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    
    // Determine which schedule group to use
    let scheduleKey;
    if (currentDay === 0) {
      scheduleKey = 'sunday';
    } else if (currentDay === 6) {
      scheduleKey = 'saturday';
    } else {
      scheduleKey = 'weekdays';
    }
    
    const todaySchedule = this._schedule[scheduleKey];
    
    // Find next transition today
    for (const period of todaySchedule) {
      if (period.time > currentTime) {
        return { time: period.time, temp: period.temp, today: true };
      }
    }
    
    // If no more transitions today, get first period of tomorrow
    let tomorrowKey;
    if (currentDay === 6) { // Saturday -> Sunday
      tomorrowKey = 'sunday';
    } else if (currentDay === 0) { // Sunday -> Monday (weekdays)
      tomorrowKey = 'weekdays';
    } else if (currentDay === 5) { // Friday -> Saturday
      tomorrowKey = 'saturday';
    } else { // Weekday -> Weekday
      tomorrowKey = 'weekdays';
    }
    
    const tomorrowSchedule = this._schedule[tomorrowKey];
    return { time: tomorrowSchedule[0].time, temp: tomorrowSchedule[0].temp, today: false };
  }

  getCurrentTemp() {
    const entity = this._hass.states[this._config.entity];
    if (!entity) return null;
    
    // Try to get current temperature from entity attributes
    if (entity.attributes.current_temperature !== undefined) {
      return entity.attributes.current_temperature;
    }
    return null;
  }

  getCurrentSlot() {
    const now = new Date();
    const currentDay = now.getDay();
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    
    let scheduleKey;
    if (currentDay === 0) {
      scheduleKey = 'sunday';
    } else if (currentDay === 6) {
      scheduleKey = 'saturday';
    } else {
      scheduleKey = 'weekdays';
    }
    
    const todaySchedule = this._schedule[scheduleKey];
    
    // Find the current slot (last period that has started)
    let currentSlot = todaySchedule[0]; // Default to first period
    for (const period of todaySchedule) {
      if (period.time <= currentTime) {
        currentSlot = period;
      } else {
        break;
      }
    }
    
    return { time: currentSlot.time, temp: currentSlot.temp };
  }

  render() {
    if (!this._hass || !this._config.entity) {
      return;
    }

    const entity = this._hass.states[this._config.entity];
    const entityName = this._config.title || (entity ? entity.attributes.friendly_name || this._config.entity : this._config.entity);
    const nextTransition = this.getNextTransition();
    const currentSlot = this.getCurrentSlot();

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
        }
        ha-card {
          cursor: pointer;
          transition: box-shadow 0.2s;
        }
        ha-card:hover {
          box-shadow: 0 2px 8px rgba(0,0,0,0.15);
        }
        .card-content {
          padding: 10px 16px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 16px;
        }
        .left-section {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .entity-name {
          font-size: 1em;
          font-weight: 500;
          color: var(--primary-text-color);
          text-wrap: nowrap;
          text-overflow: ellipsis;
        }
        .right-section {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 0px;
        }
        .current-info {
          font-size: 0.8em;
          color: var(--secondary-text-color);
        }
        .current-label {
          font-weight: 500;
        }
        .current-time {
          color: var(--primary-text-color);
        }
        .current-temp-value {
          font-weight: 700;
          color: var(--primary-color);
        }
        .next-info {
          display: flex;
          align-items: baseline;
          gap: 6px;
          font-size: 0.8em;
        }
        .next-label {
          font-weight: 500;
          color: var(--secondary-text-color);
        }
        .next-time {
          font-weight: 700;
          color: var(--primary-text-color);
        }
        .next-temp {
          font-weight: 700;
          color: var(--primary-color);
        }
        
        /* Dialog Overlay */
        .dialog-overlay {
          display: ${this._showDialog ? 'block' : 'none'};
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.7);
          z-index: 1000;
        }
        .dialog-container {
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          background: var(--card-background-color);
          border-radius: 8px;
          max-width: 600px;
          width: 90%;
          max-height: 90vh;
          overflow: hidden;
          z-index: 1001;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
        }
        .dialog-header {
          padding: 16px 20px;
          border-bottom: 1px solid var(--divider-color);
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: var(--primary-background-color);
        }
        .dialog-title {
          margin: 0;
          font-size: 1.3em;
          font-weight: 500;
        }
        .dialog-close {
          background: none;
          border: none;
          cursor: pointer;
          font-size: 28px;
          color: var(--primary-text-color);
          opacity: 0.6;
          padding: 0;
          width: 36px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 4px;
          transition: all 0.2s;
        }
        .dialog-close:hover {
          opacity: 1;
          background: var(--secondary-background-color);
        }
        .dialog-body {
          padding: 20px;
          overflow-y: auto;
          max-height: calc(90vh - 80px);
        }
      </style>
      
      <ha-card>
        <div class="card-content">
          <div class="left-section">
            <div class="entity-name">${entityName}</div>
          </div>
          
          <div class="right-section">
            <div class="current-info">
              <span class="current-label">Now:</span>
              <span class="current-time">${currentSlot.time}</span>
              <span class="current-temp-value">${currentSlot.temp}°C</span>
            </div>
            
            ${nextTransition ? `
              <div class="next-info">
                <span class="next-label">${nextTransition.today ? 'Next:' : 'Tomorrow:'}</span>
                <span class="next-time">${nextTransition.time}</span>
                <span class="next-temp">${nextTransition.temp}°C</span>
              </div>
            ` : ''}
          </div>
        </div>
      </ha-card>
      
      ${this._showDialog ? `
        <div class="dialog-overlay" id="dialog-overlay">
          <div class="dialog-container">
            <div class="dialog-header">
              <h2 class="dialog-title">${entityName} Schedule</h2>
              <button class="dialog-close" id="close-dialog">×</button>
            </div>
            <div class="dialog-body">
              <div id="dialog-content"></div>
            </div>
          </div>
        </div>
      ` : ''}
    `;

    // Add click listener to open dialog
    const card = this.shadowRoot.querySelector('ha-card');
    if (card) {
      card.addEventListener('click', (e) => this._handleMoreInfo(e));
    }

    // Add dialog close handlers
    if (this._showDialog) {
      const overlay = this.shadowRoot.getElementById('dialog-overlay');
      const closeBtn = this.shadowRoot.getElementById('close-dialog');
      
      if (overlay) {
        overlay.addEventListener('click', (e) => {
          if (e.target === overlay) {
            this._closeDialog();
          }
        });
      }
      
      if (closeBtn) {
        closeBtn.addEventListener('click', () => this._closeDialog());
      }

      // Load the schedule editor content
      import('./moes-trv-schedule-card-more-info.js').then(() => {
        const dialogContent = this.shadowRoot.getElementById('dialog-content');
        if (dialogContent) {
          const moreInfo = document.createElement('moes-trv-schedule-more-info');
          moreInfo.setConfig(this._config);
          moreInfo.hass = this._hass;
          moreInfo.setSchedule(this._schedule);
          
          moreInfo.addEventListener('close-dialog', () => {
            this._closeDialog();
          });
          
          dialogContent.appendChild(moreInfo);
        }
      });
    }
  }

  _handleMoreInfo(e) {
    e.stopPropagation();
    
    // Create and show dialog overlay
    this._showDialog = true;
    this.render();
  }

  _closeDialog() {
    this._showDialog = false;
    // Refresh schedule from entity when dialog closes
    this.parseScheduleFromEntity();
    this.render();
  }

  getCardSize() {
    return 2; // Compact display - just shows next transition
  }

  static getConfigElement() {
    return document.createElement('moes-trv-schedule-card-editor');
  }

  static getStubConfig() {
    return {
      entity: 'climate.moes_trv'
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
  '%c MOES-TRV-SCHEDULE-CARD %c 1.3.12 ',
  'color: white; background: #039be5; font-weight: 700;',
  'color: #039be5; background: white; font-weight: 700;'
);
