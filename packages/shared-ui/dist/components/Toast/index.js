var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { LitElement, html, css } from 'lit';
import { property } from 'lit/decorators.js';
export class MfeToast extends LitElement {
    constructor() {
        super(...arguments);
        this.variant = 'info';
        this.message = '';
        this.dismissible = true;
        this.duration = 0; // 0 = manual dismiss
        this.exit = false;
        this.icons = {
            success: '✓',
            error: '✕',
            warning: '⚠',
            info: 'ℹ',
        };
    }
    connectedCallback() {
        super.connectedCallback();
        if (this.duration > 0) {
            this.timer = setTimeout(() => this.dismiss(), this.duration);
        }
    }
    disconnectedCallback() {
        super.disconnectedCallback();
        if (this.timer)
            clearTimeout(this.timer);
    }
    dismiss() {
        this.exit = true;
        setTimeout(() => {
            this.dispatchEvent(new CustomEvent('mfe-dismiss', {
                bubbles: true,
                composed: true,
            }));
        }, 250);
        this.requestUpdate();
    }
    render() {
        return html `
      <div class="toast ${this.variant} ${this.exit ? 'exit' : ''}">
        <span class="icon">${this.icons[this.variant]}</span>
        <span class="message">${this.message}</span>
        ${this.dismissible ? html `
          <button class="close-btn" @click="${this.dismiss}" aria-label="Dismiss">✕</button>
        ` : ''}
      </div>
    `;
    }
}
MfeToast.styles = css `
    :host {
      display: block;
    }

    .toast {
      display: flex;
      align-items: center;
      gap: var(--space-3, 0.75rem);
      padding: var(--space-3, 0.75rem) var(--space-4, 1rem);
      border-radius: var(--radius-md, 0.5rem);
      font-family: var(--font-sans, system-ui);
      font-size: var(--font-size-sm, 0.875rem);
      box-shadow: var(--shadow-lg, 0 10px 15px rgba(0,0,0,0.1));
      animation: slideIn var(--transition-base, 250ms ease) forwards;
      max-width: 400px;
    }

    @keyframes slideIn {
      from { transform: translateX(100%); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }

    @keyframes slideOut {
      from { transform: translateX(0); opacity: 1; }
      to { transform: translateX(100%); opacity: 0; }
    }

    .toast.exit {
      animation: slideOut var(--transition-base, 250ms ease) forwards;
    }

    .toast.success {
      background: #d1fae5;
      color: #065f46;
      border-left: 4px solid var(--color-success, #10B981);
    }

    .toast.error {
      background: #fee2e2;
      color: #991b1b;
      border-left: 4px solid var(--color-error, #EF4444);
    }

    .toast.warning {
      background: #fef3c7;
      color: #92400e;
      border-left: 4px solid var(--color-warning, #F59E0B);
    }

    .toast.info {
      background: #e0f2fe;
      color: #075985;
      border-left: 4px solid var(--color-info, #3B82F6);
    }

    .icon {
      font-size: 1.25rem;
      flex-shrink: 0;
    }

    .message {
      flex: 1;
    }

    .close-btn {
      background: none;
      border: none;
      cursor: pointer;
      font-size: 1rem;
      opacity: 0.6;
      padding: 0;
      line-height: 1;
      flex-shrink: 0;
    }

    .close-btn:hover {
      opacity: 1;
    }
  `;
__decorate([
    property({ type: String })
], MfeToast.prototype, "variant", void 0);
__decorate([
    property({ type: String })
], MfeToast.prototype, "message", void 0);
__decorate([
    property({ type: Boolean })
], MfeToast.prototype, "dismissible", void 0);
__decorate([
    property({ type: Number })
], MfeToast.prototype, "duration", void 0);
customElements.define('mfe-toast', MfeToast);
//# sourceMappingURL=index.js.map