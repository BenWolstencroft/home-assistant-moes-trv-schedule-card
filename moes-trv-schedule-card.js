/**
 * MOES TRV Schedule Card
 * Custom Lovelace card for managing schedules on MOES Thermostatic Radiator Valves
 *
 * Repository: https://github.com/BenWolstencroft/home-assistant-moes-trv-schedule-card
 * Version: 1.4.0
 *
 * Features:
 * - Three schedule groups (Weekdays, Saturday, Sunday) for MOES TRVs
 * - Seven individual day schedules for Sonoff TRVZB
 * - Four time periods per group (MOES TRV standard) / Six time periods per day (Sonoff TRVZB)
 * - Temperature settings for each period
 * - Visual schedule editor
 * - Supports text entities (Zigbee/MQTT), climate entities (Tuya), sensor entities (program attributes), and Sonoff TRVZB
 */

class MoesTrvScheduleCard extends HTMLElement {
  static SONOFF_DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  static SONOFF_PATTERN = /^text\.(.+)_weekly_schedule_(monday|tuesday|wednesday|thursday|friday|saturday|sunday)$/;

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._config = {};
    this._deviceType = 'moes'; // 'moes' or 'sonoff'
    this._schedule = this.getDefaultSchedule();
    this._showDialog = false;
  }

  setConfig(config) {
    if (!config.entity) {
      throw new Error('Please define a TRV schedule entity');
    }
    this._config = config;
    this._deviceType = this.isSonoffEntity(config.entity) ? 'sonoff' : 'moes';
    this._schedule = this.getDefaultSchedule();
  }

  isSonoffEntity(entityId) {
    return MoesTrvScheduleCard.SONOFF_PATTERN.test(entityId);
  }

  getSonoffBaseEntityId() {
    const match = this._config.entity.match(MoesTrvScheduleCard.SONOFF_PATTERN);
    if (!match) return null;
    return match[1]; // e.g., "living_room_trv" from "text.living_room_trv_weekly_schedule_monday"
  }

  getSonoffDayEntityId(day) {
    const base = this.getSonoffBaseEntityId();
    return base ? `text.${base}_weekly_schedule_${day}` : null;
  }

  set hass(hass) {
    this._hass = hass;

    // Don't refresh schedule data or re-render if dialog is open to prevent UI resets
    if (!this._showDialog) {
      if (this._deviceType === 'sonoff') {
        this.parseSonoffSchedule(hass);
      } else {
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
          // For sensor entities with program attributes (e.g., sensor.*_program)
          else if (this._config.entity.startsWith('sensor.') && this.hasProgramAttributes(entity)) {
            this.parseScheduleFromProgramAttributes(entity.attributes);
          }
        }
      }

      this.render();
    }
  }

  getDefaultSchedule() {
    if (this._deviceType === 'sonoff') {
      // Sonoff TRVZB: 7 individual days, 6 periods each
      const defaultDay = [
        { time: '00:00', temp: 16 },
        { time: '07:00', temp: 19 },
        { time: '10:00', temp: 16 },
        { time: '10:00', temp: 16 },
        { time: '17:00', temp: 19 },
        { time: '23:00', temp: 16 }
      ];
      const schedule = {};
      for (const day of MoesTrvScheduleCard.SONOFF_DAYS) {
        schedule[day] = defaultDay.map(p => ({ ...p }));
      }
      return schedule;
    }
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

  parseSonoffSchedule(hass) {
    const schedule = {};
    for (const day of MoesTrvScheduleCard.SONOFF_DAYS) {
      const entityId = this.getSonoffDayEntityId(day);
      const entity = entityId ? hass.states[entityId] : null;
      if (entity && entity.state && entity.state !== 'unknown') {
        // Sonoff format: "00:00/16 07:00/19 10:00/16 10:00/16 17:00/19 23:00/16" (single space, no °C)
        const parts = entity.state.split(' ').filter(p => p.trim());
        schedule[day] = parts.map(this.parsePeriod);
      } else {
        schedule[day] = this.getDefaultSchedule()[day];
      }
    }
    this._schedule = schedule;
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

  parseScheduleFromProgramAttributes(attributes) {
    // Parse format like: weekdays_p1_hour, weekdays_p1_minute, weekdays_p1_temperature
    // Days: weekdays, saturday, sunday
    // Periods: p1, p2, p3, p4
    
    // Handle both nested (attributes.program) and flat attribute structures
    const programData = attributes.program || attributes;
    
    const days = ['weekdays', 'saturday', 'sunday'];
    const periods = ['p1', 'p2', 'p3', 'p4'];
    
    const schedule = {
      weekdays: [],
      saturday: [],
      sunday: []
    };

    for (const day of days) {
      for (const period of periods) {
        const hourKey = `${day}_${period}_hour`;
        const minuteKey = `${day}_${period}_minute`;
        const tempKey = `${day}_${period}_temperature`;
        
        const hour = programData[hourKey];
        const minute = programData[minuteKey];
        const temp = programData[tempKey];
        
        if (hour !== undefined && minute !== undefined && temp !== undefined) {
          const time = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
          schedule[day].push({ time, temp: parseFloat(temp) });
        } else {
          // Use defaults if attributes are missing
          schedule[day].push({ time: '00:00', temp: 15 });
        }
      }
    }

    this._schedule = schedule;
  }

  formatScheduleForEntity() {
    // Format: "06:00/18°C  10:00/15°C  17:00/15°C  22:00/15°C  06:00/15°C  10:00/15°C  17:00/15°C  22:00/15°C  06:00/15°C  10:00/15°C  17:00/15°C  22:00/15°C"
    const formatPeriod = (period) => `${period.time}/${period.temp}°C`;
    
    const weekdaysParts = this._schedule.weekdays.map(formatPeriod);
    const saturdayParts = this._schedule.saturday.map(formatPeriod);
    const sundayParts = this._schedule.sunday.map(formatPeriod);
    
    return [...weekdaysParts, ...saturdayParts, ...sundayParts].join('  ');
  }

  getScheduleKeyForDay(jsDayNum) {
    // jsDayNum: 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    if (this._deviceType === 'sonoff') {
      return ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][jsDayNum];
    }
    if (jsDayNum === 0) return 'sunday';
    if (jsDayNum === 6) return 'saturday';
    return 'weekdays';
  }

  getNextTransition() {
    const now = new Date();
    const currentDay = now.getDay();
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const scheduleKey = this.getScheduleKeyForDay(currentDay);
    const todaySchedule = this._schedule[scheduleKey];

    // Find next transition today
    for (const period of todaySchedule) {
      if (period.time > currentTime) {
        return { time: period.time, temp: period.temp, today: true };
      }
    }

    // If no more transitions today, get first period of tomorrow
    const tomorrowDay = (currentDay + 1) % 7;
    const tomorrowKey = this.getScheduleKeyForDay(tomorrowDay);
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

    const scheduleKey = this.getScheduleKeyForDay(currentDay);
    const todaySchedule = this._schedule[scheduleKey];

    // Find the current slot (last period that has started today)
    let currentSlot = null;
    for (const period of todaySchedule) {
      if (period.time <= currentTime) {
        currentSlot = period;
      }
    }

    // If no period has started today, use the last period from yesterday
    if (!currentSlot) {
      const yesterdayDay = (currentDay + 6) % 7;
      const yesterdayKey = this.getScheduleKeyForDay(yesterdayDay);
      const yesterdaySchedule = this._schedule[yesterdayKey];
      currentSlot = yesterdaySchedule[yesterdaySchedule.length - 1];
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
        .card-content {
          padding: 10px 16px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 8px;
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
          moreInfo.setDeviceType(this._deviceType);
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
    this.refreshScheduleFromEntity();
    this.render();
  }

  refreshScheduleFromEntity() {
    if (this._deviceType === 'sonoff') {
      this.parseSonoffSchedule(this._hass);
      return;
    }

    // Re-read schedule from entity based on entity type
    const entity = this._hass?.states[this._config.entity];
    if (!entity) return;

    if (entity.attributes.schedule) {
      this.parseScheduleFromEntity(entity.attributes.schedule);
    } else if (this._config.entity.startsWith('text.') && entity.state && entity.state !== 'unknown') {
      this.parseScheduleFromEntity(entity.state);
    } else if (this._config.entity.startsWith('sensor.') && this.hasProgramAttributes(entity)) {
      this.parseScheduleFromProgramAttributes(entity.attributes);
    }
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
  '%c MOES-TRV-SCHEDULE-CARD %c 1.4.0 ',
  'color: white; background: #039be5; font-weight: 700;',
  'color: #039be5; background: white; font-weight: 700;'
);
