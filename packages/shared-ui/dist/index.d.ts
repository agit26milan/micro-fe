/**
 * @mfe-store/shared-ui
 *
 * Framework-agnostic UI components via Web Components (Lit).
 * Dapat digunakan di React, Vue, Angular, atau vanilla HTML.
 *
 * Usage:
 * ```html
 * <mfe-button variant="primary">Click me</mfe-button>
 * <mfe-input label="Email" type="email"></mfe-input>
 * <mfe-modal title="Confirm" open>
 *   <p>Are you sure?</p>
 *   <mfe-button slot="footer" variant="ghost">Cancel</mfe-button>
 * </mfe-modal>
 * <mfe-toast variant="success" message="Saved!"></mfe-toast>
 * ```
 */
import './components/Button/index.js';
import './components/Input/index.js';
import './components/Modal/index.js';
import './components/Toast/index.js';
export type { MfeButton } from './components/Button/index.js';
export type { MfeInput } from './components/Input/index.js';
export type { MfeModal } from './components/Modal/index.js';
export type { MfeToast, ToastVariant } from './components/Toast/index.js';
//# sourceMappingURL=index.d.ts.map