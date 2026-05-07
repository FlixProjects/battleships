import { BaseComponent } from "../BaseComponent";

interface Props {
    label: string;
    onClick: (e?: MouseEvent) => void;
    disabled?: boolean;
}

export class PathMenuButton extends BaseComponent {
    public ref: HTMLButtonElement;

    constructor(
        public id: string,
        private props: Props,
    ) {
        super();
    }

    public build(): HTMLElement {
        this.ref = document.createElement("button");
        this.ref.id = this.id;
        this.ref.textContent = this.props.label;
        this.addStyles();
        this.setDisabled(!!this.props.disabled);
        this.ref.addEventListener("click", (e) => {
            e.stopPropagation();
            if (this.ref.disabled) return;
            this.props.onClick(e);
        });
        return this.ref;
    }

    public setDisabled(disabled: boolean) {
        this.ref.disabled = disabled;
        this.ref.style.opacity = disabled ? "0.4" : "1";
        this.ref.style.cursor = disabled ? "not-allowed" : "pointer";
    }

    protected addStyles() {
        this.ref.style.background = "rgba(110, 231, 183, 0.1)";
        this.ref.style.border = "1px solid rgba(110, 231, 183, 0.3)";
        this.ref.style.color = "rgba(220, 240, 232, 1)";
        this.ref.style.borderRadius = "6px";
        this.ref.style.padding = "8px 12px";
        this.ref.style.minWidth = "44px";
        this.ref.style.fontSize = "14px";
        this.ref.style.cursor = "pointer";
        this.ref.style.transition = "all 0.2s ease";
    }
}
