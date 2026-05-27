import { LitElement, html, css } from 'lit';
import { property } from 'lit/decorators.js';

export class MfeModal extends LitElement {
  static styles = css`
    :host {
      display: contents;
    }

    .overlay {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: var(--z-modal, 300);
      opacity: 0;
      visibility: hidden;
      transition: opacity var(--transition-base, 250ms ease),
                  visibility var(--transition-base, 250ms ease);
    }

    .overlay.open {
      opacity: 1;
      visibility: visible;
    }

    .modal {
      background: var(--color-bg, #FFFFFF);
      border-radius: var(--radius-lg, 0.75rem);
      box-shadow: var(--shadow-xl, 0 20px 25px rgba(0,0,0,0.12));
      max-width: 90vw;
      max-height: 85vh;
      overflow-y: auto;
      transform: scale(0.95);
      transition: transform var(--transition-base, 250ms ease);
    }

    .overlay.open .modal {
      transform: scale(1);
    }

    .header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: var(--space-4, 1rem) var(--space-6, 1.5rem);
      border-bottom: 1px solid var(--color-border, #E5E7EB);
    }

    .title {
      font-family: var(--font-sans, system-ui);
      font-size: var(--font-size-lg, 1.125rem);
      font-weight: var(--font-weight-semibold, 600);
      color: var(--color-text, #1A1A2E);
      margin: 0;
    }

    .close-btn {
      background: none;
      border: none;
      cursor: pointer;
      padding: var(--space-1, 0.25rem);
      color: var(--color-text-muted, #6B7280);
      font-size: 1.25rem;
      line-height: 1;
      border-radius: var(--radius-sm, 0.25rem);
    }

    .close-btn:hover {
      background: var(--color-bg-subtle, #F9FAFB);
      color: var(--color-text, #1A1A2E);
    }

    .body {
      padding: var(--space-6, 1.5rem);
    }

    .footer {
      display: flex;
      justify-content: flex-end;
      gap: var(--space-3, 0.75rem);
      padding: var(--space-4, 1rem) var(--space-6, 1.5rem);
      border-top: 1px solid var(--color-border, #E5E7EB);
    }
  `;

  @property({ type: Boolean, reflect: true }) open = false;
  @property({ type: String }) title = '';

  private handleOverlayClick(e: Event) {
    if (e.target === e.currentTarget) {
      this.close();
    }
  }

  private handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      this.close();
    }
  }

  close() {
    this.open = false;
    this.dispatchEvent(new CustomEvent('mfe-close', {
      bubbles: true,
      composed: true,
    }));
  }

  connectedCallback() {
    super.connectedCallback();
    document.addEventListener('keydown', this.handleKeydown.bind(this));
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    document.removeEventListener('keydown', this.handleKeydown.bind(this));
  }

  render() {
    return html`
      <div class="overlay ${this.open ? 'open' : ''}" @click="${this.handleOverlayClick}">
        <div class="modal" role="dialog" aria-modal="true" aria-label="${this.title}">
          <div class="header">
            <h2 class="title">${this.title}</h2>
            <button class="close-btn" @click="${this.close}" aria-label="Close">✕</button>
          </div>
          <div class="body">
            <slot></slot>
          </div>
          <div class="footer">
            <slot name="footer"></slot>
          </div>
        </div>
      </div>
    `;
  }
}

customElements.define('mfe-modal', MfeModal);

declare global {
  interface HTMLElementTagNameMap {
    'mfe-modal': MfeModal;
  }
}
