var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { LitElement, html, css } from 'lit';
import { property } from 'lit/decorators.js';
export class MfeButton extends LitElement {
    constructor() {
        super(...arguments);
        this.variant = 'primary';
        this.size = 'md';
        this.disabled = false;
        this.type = 'button';
    }
    handleClick(e) {
        if (this.disabled) {
            e.preventDefault();
            return;
        }
        this.dispatchEvent(new CustomEvent('mfe-click', {
            bubbles: true,
            composed: true,
            detail: { originalEvent: e },
        }));
    }
    render() {
        return html `
      <button
        class="${this.variant} ${this.size}"
        ?disabled="${this.disabled}"
        type="${this.type}"
        @click="${this.handleClick}"
      >
        <slot></slot>
      </button>
    `;
    }
}
MfeButton.styles = css `
    :host {
      display: inline-block;
    }

    button {
      font-family: var(--font-sans, system-ui, -apple-system, sans-serif);
      font-size: var(--font-size-sm, 0.875rem);
      font-weight: var(--font-weight-medium, 500);
      padding: var(--space-2, 0.5rem) var(--space-4, 1rem);
      border-radius: var(--radius-md, 0.5rem);
      border: 1px solid transparent;
      cursor: pointer;
      transition: all var(--transition-fast, 150ms ease);
      line-height: var(--line-height-normal, 1.5);
      display: inline-flex;
      align-items: center;
      gap: var(--space-2, 0.5rem);
    }

    button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    button:focus-visible {
      outline: 2px solid var(--color-primary, #0066FF);
      outline-offset: 2px;
    }

    /* Variants */
    button.primary {
      background: var(--color-primary, #0066FF);
      color: var(--color-text-inverse, #FFFFFF);
      border-color: var(--color-primary, #0066FF);
    }
    button.primary:hover:not(:disabled) {
      background: var(--color-primary-dark, #0052CC);
    }

    button.secondary {
      background: transparent;
      color: var(--color-primary, #0066FF);
      border-color: var(--color-primary, #0066FF);
    }
    button.secondary:hover:not(:disabled) {
      background: var(--color-primary-light, #E8F0FE);
    }

    button.ghost {
      background: transparent;
      color: var(--color-text, #1A1A2E);
      border-color: transparent;
    }
    button.ghost:hover:not(:disabled) {
      background: var(--color-bg-subtle, #F9FAFB);
    }

    button.danger {
      background: var(--color-error, #EF4444);
      color: var(--color-text-inverse, #FFFFFF);
      border-color: var(--color-error, #EF4444);
    }
    button.danger:hover:not(:disabled) {
      opacity: 0.9;
    }

    /* Sizes */
    button.sm { padding: var(--space-1, 0.25rem) var(--space-3, 0.75rem); font-size: var(--font-size-xs, 0.75rem); }
    button.lg { padding: var(--space-3, 0.75rem) var(--space-6, 1.5rem); font-size: var(--font-size-base, 1rem); }
  `;
__decorate([
    property({ type: String })
], MfeButton.prototype, "variant", void 0);
__decorate([
    property({ type: String })
], MfeButton.prototype, "size", void 0);
__decorate([
    property({ type: Boolean })
], MfeButton.prototype, "disabled", void 0);
__decorate([
    property({ type: String })
], MfeButton.prototype, "type", void 0);
customElements.define('mfe-button', MfeButton);
//# sourceMappingURL=index.js.map