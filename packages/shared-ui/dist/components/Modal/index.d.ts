import { LitElement } from 'lit';
export declare class MfeModal extends LitElement {
    static styles: import("lit").CSSResult;
    open: boolean;
    title: string;
    private handleOverlayClick;
    private handleKeydown;
    close(): void;
    connectedCallback(): void;
    disconnectedCallback(): void;
    render(): import("lit-html").TemplateResult<1>;
}
declare global {
    interface HTMLElementTagNameMap {
        'mfe-modal': MfeModal;
    }
}
//# sourceMappingURL=index.d.ts.map