import { LitElement } from 'lit';
export type ToastVariant = 'success' | 'error' | 'warning' | 'info';
export declare class MfeToast extends LitElement {
    static styles: import("lit").CSSResult;
    variant: ToastVariant;
    message: string;
    dismissible: boolean;
    duration: number;
    private exit;
    private timer?;
    private icons;
    connectedCallback(): void;
    disconnectedCallback(): void;
    dismiss(): void;
    render(): import("lit-html").TemplateResult<1>;
}
declare global {
    interface HTMLElementTagNameMap {
        'mfe-toast': MfeToast;
    }
}
//# sourceMappingURL=index.d.ts.map