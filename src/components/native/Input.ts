import { BaseComponent } from "../BaseComponent";

export class HTMLInput extends BaseComponent {
    ref: HTMLInputElement;

    get innerText(): string {
        return this.ref.innerText;
    }

    setValue(value: string) {
        this.ref.value = value;
        return;
    }

    get disabled(): boolean {
        return this.ref.disabled;
    }

    get value(): string {
        return this.ref.value;
    }
}
