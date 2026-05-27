import { LitElement } from 'lit';
export declare class MfeInput extends LitElement {
    static styles: import("lit").CSSResult;
    label: string;
    value: string;
    placeholder: string;
    type: 'text' | 'email' | 'password' | 'number';
    disabled: boolean;
    error: boolean;
    errorMessage: string;
    name: string;
    private handleInput;
    render(): import("lit-html").TemplateResult<1>;
}
declare global {
    interface HTMLElementTagNameMap {
        'mfe-input': MfeInput;
    }
}
//# sourceMappingURL=index.d.ts.map