var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { LitElement, html, css } from 'lit';
import { property } from 'lit/decorators.js';
export class MfeInput extends LitElement {
    constructor() {
        super(...arguments);
        this.label = '';
        this.value = '';
        this.placeholder = '';
        this.type = 'text';
        this.disabled = false;
        this.error = false;
        this.errorMessage = '';
        this.name = '';
    }
    handleInput(e) {
        const target = e.target;
        this.value = target.value;
        this.dispatchEvent(new CustomEvent('mfe-input', {
            bubbles: true,
            composed: true,
            detail: { value: this.value, name: this.name },
        }));
    }
    render() {
        return html `
      <div class="input-wrapper">
        ${this.label ? html `<label for="input">${this.label}</label>` : ''}
        <div class="input-container">
          <input
            id="input"
            type="${this.type}"
            .value="${this.value}"
            placeholder="${this.placeholder}"
            ?disabled="${this.disabled}"
            class="${this.error ? 'error' : ''}"
            @input="${this.handleInput}"
          />
        </div>
        ${this.error && this.errorMessage ? html `<span class="error-text">${this.errorMessage}</span>` : ''}
      </div>
    `;
    }
}
MfeInput.styles = css `
    :host {
      display: inline-block;
      width: 100%;
    }

    .input-wrapper {
      display: flex;
      flex-direction: column;
      gap: var(--space-1, 0.25rem);
    }

    label {
      font-family: var(--font-sans, system-ui);
      font-size: var(--font-size-sm, 0.875rem);
      font-weight: var(--font-weight-medium, 500);
      color: var(--color-text, #1A1A2E);
    }

    input {
      width: 100%;
      font-family: var(--font-sans, system-ui);
      font-size: var(--font-size-sm, 0.875rem);
      padding: var(--space-2, 0.5rem) var(--space-3, 0.75rem);
      border: 1px solid var(--color-border, #E5E7EB);
      border-radius: var(--radius-md, 0.5rem);
      background: var(--color-bg, #FFFFFF);
      color: var(--color-text, #1A1A2E);
      transition: border-color var(--transition-fast, 150ms ease);
      outline: none;
      box-sizing: border-box;
    }

    input:focus {
      border-color: var(--color-primary, #0066FF);
      box-shadow: 0 0 0 3px var(--color-primary-light, #E8F0FE);
    }

    input::placeholder {
      color: var(--color-text-muted, #6B7280);
    }

    input.error {
      border-color: var(--color-error, #EF4444);
    }

    input.error:focus {
      box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
    }

    .error-text {
      font-size: var(--font-size-xs, 0.75rem);
      color: var(--color-error, #EF4444);
    }
  `;
__decorate([
    property({ type: String })
], MfeInput.prototype, "label", void 0);
__decorate([
    property({ type: String })
], MfeInput.prototype, "value", void 0);
__decorate([
    property({ type: String })
], MfeInput.prototype, "placeholder", void 0);
__decorate([
    property({ type: String })
], MfeInput.prototype, "type", void 0);
__decorate([
    property({ type: Boolean })
], MfeInput.prototype, "disabled", void 0);
__decorate([
    property({ type: Boolean })
], MfeInput.prototype, "error", void 0);
__decorate([
    property({ type: String })
], MfeInput.prototype, "errorMessage", void 0);
__decorate([
    property({ type: String })
], MfeInput.prototype, "name", void 0);
customElements.define('mfe-input', MfeInput);
//# sourceMappingURL=index.js.map