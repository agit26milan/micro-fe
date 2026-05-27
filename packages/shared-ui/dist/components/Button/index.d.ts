import { LitElement } from 'lit';
export declare class MfeButton extends LitElement {
    static styles: import("lit").CSSResult;
    variant: 'primary' | 'secondary' | 'ghost' | 'danger';
    size: 'sm' | 'md' | 'lg';
    disabled: boolean;
    type: 'button' | 'submit' | 'reset';
    private handleClick;
    render(): import("lit-html").TemplateResult<1>;
}
declare global {
    interface HTMLElementTagNameMap {
        'mfe-button': MfeButton;
    }
}
//# sourceMappingURL=index.d.ts.map