/**
 * MOES TRV Schedule Card Editor
 * Visual configuration editor for the MOES TRV Schedule Card
 */

class MoesTrvScheduleCardEditor extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  setConfig(config) {
    this._config = config;
  }

  set hass(hass) {
    this._hass = hass;
    this.render();
  }

  configChanged(newConfig) {
    const event = new Event('config-changed', {
      bubbles: true,
      composed: true,
    });
    event.detail = { config: newConfig };
    this.dispatchEvent(event);
  }

  render() {
    if (!this._hass) {
      return;
    }

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
        }
        .card-config {
          display: flex;
          flex-direction: column;
          gap: 16px;
          padding: 16px;
        }
        .config-row {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .config-row label {
          font-weight: 500;
          font-size: 14px;
          color: var(--primary-text-color);
        }
        .config-row select,
        .config-row input {
          padding: 8px;
          border: 1px solid var(--divider-color);
          border-radius: 4px;
          background: var(--card-background-color);
          color: var(--primary-text-color);
          font-size: 14px;
        }
        .config-row select:focus,
        .config-row input:focus {
          outline: none;
          border-color: var(--primary-color);
        }
        .help-text {
          font-size: 12px;
          color: var(--secondary-text-color);
          margin-top: 4px;
        }
        .section-title {
          font-size: 16px;
          font-weight: 500;
          margin-top: 8px;
          margin-bottom: 8px;
          color: var(--primary-text-color);
        }
        .checkbox-row {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .checkbox-row input[type="checkbox"] {
          width: auto;
        }
      </style>
      
      <div class="card-config">
        <div class="section-title">Entity Configuration</div>
        
        <div class="config-row">
          <label for="entity-picker">MOES TRV Entity</label>
          <ha-entity-picker
            id="entity-picker"
            .hass="${this._hass}"
            .value="${this._config.entity || ''}"
            .includeDomains="${['climate', 'text']}"
            allow-custom-entity
          ></ha-entity-picker>
          <div class="help-text">
            Select the schedule entity for your MOES TRV (climate entity or text entity for Zigbee/MQTT devices)
          </div>
        </div>
        
        <div class="section-title">Display Options</div>
        
        <div class="config-row">
          <label for="title-input">Card Title (optional)</label>
          <input 
            type="text" 
            id="title-input" 
            value="${this._config.title || ''}"
            placeholder="TRV Schedule"
          />
          <div class="help-text">
            Custom title for the card (leave empty for default)
          </div>
        </div>
        
        <div class="config-row checkbox-row">
          <input 
            type="checkbox" 
            id="show-current-checkbox"
            ${this._config.show_current_temp !== false ? 'checked' : ''}
          />
          <label for="show-current-checkbox">Show current temperature</label>
        </div>
        
        <div class="section-title">Schedule Settings</div>
        
        <div class="config-row">
          <label for="min-temp-input">Minimum Temperature (°C)</label>
          <input 
            type="number" 
            id="min-temp-input" 
            value="${this._config.min_temp || 5}"
            min="5"
            max="15"
            step="0.5"
          />
          <div class="help-text">
            Minimum allowed temperature in the schedule
          </div>
        </div>
        
        <div class="config-row">
          <label for="max-temp-input">Maximum Temperature (°C)</label>
          <input 
            type="number" 
            id="max-temp-input" 
            value="${this._config.max_temp || 35}"
            min="20"
            max="35"
            step="0.5"
          />
          <div class="help-text">
            Maximum allowed temperature in the schedule
          </div>
        </div>
        
        <div class="config-row">
          <label for="temp-step-input">Temperature Step (°C)</label>
          <input 
            type="number" 
            id="temp-step-input" 
            value="${this._config.temp_step || 0.5}"
            min="0.1"
            max="1"
            step="0.1"
          />
          <div class="help-text">
            Temperature adjustment increment
          </div>
        </div>
        
        <div class="config-row checkbox-row">
          <input 
            type="checkbox" 
            id="24hour-checkbox"
            ${this._config.time_format !== '12h' ? 'checked' : ''}
          />
          <label for="24hour-checkbox">Use 24-hour time format</label>
        </div>
      </div>
    `;

    this.attachEventListeners();
  }

  attachEventListeners() {
    const entityPicker = this.shadowRoot.getElementById('entity-picker');
    if (entityPicker) {
      entityPicker.addEventListener('value-changed', (e) => {
        this._config = { ...this._config, entity: e.detail.value };
        this.configChanged(this._config);
      });
    }

    const titleInput = this.shadowRoot.getElementById('title-input');
    titleInput.addEventListener('change', (e) => {
      this._config = { ...this._config, title: e.target.value };
      this.configChanged(this._config);
    });

    const showCurrentCheckbox = this.shadowRoot.getElementById('show-current-checkbox');
    showCurrentCheckbox.addEventListener('change', (e) => {
      this._config = { ...this._config, show_current_temp: e.target.checked };
      this.configChanged(this._config);
    });

    const minTempInput = this.shadowRoot.getElementById('min-temp-input');
    minTempInput.addEventListener('change', (e) => {
      this._config = { ...this._config, min_temp: parseFloat(e.target.value) };
      this.configChanged(this._config);
    });

    const maxTempInput = this.shadowRoot.getElementById('max-temp-input');
    maxTempInput.addEventListener('change', (e) => {
      this._config = { ...this._config, max_temp: parseFloat(e.target.value) };
      this.configChanged(this._config);
    });

    const tempStepInput = this.shadowRoot.getElementById('temp-step-input');
    tempStepInput.addEventListener('change', (e) => {
      this._config = { ...this._config, temp_step: parseFloat(e.target.value) };
      this.configChanged(this._config);
    });

    const time24HourCheckbox = this.shadowRoot.getElementById('24hour-checkbox');
    time24HourCheckbox.addEventListener('change', (e) => {
      this._config = { ...this._config, time_format: e.target.checked ? '24h' : '12h' };
      this.configChanged(this._config);
    });
  }

  getEntityName(entityId) {
    if (this._hass && this._hass.states[entityId]) {
      const entity = this._hass.states[entityId];
      return entity.attributes.friendly_name || entityId;
    }
    return entityId;
  }
}

customElements.define('moes-trv-schedule-card-editor', MoesTrvScheduleCardEditor);
