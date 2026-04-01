import { Selectable } from "../Selectable";
import { Icon } from "./Icon";

interface Props {
    iconSrc?: string;
    disabled?: boolean;
    onClick?: (e?: MouseEvent) => void;
}

export class ActionMenuButton extends Selectable {
    public ref: HTMLButtonElement;
    constructor(
        id: string,
        private props: Props,
    ) {
        super(id);
    }

    public build(): HTMLElement {
        this.ref = document.createElement("button");
        this.ref.id = this.id;
        this.addIcon();
        this.addStyles();

        this.setDisabled(this.props.disabled);

        return this.ref;
    }

    public async onClick(e: MouseEvent): Promise<void> {
        await this.props.onClick?.(e);
        return;
    }

    public setDisabled(isDisabled: boolean) {
        this.ref.disabled = isDisabled;

        return isDisabled ? this.setAsUnselectable() : this.setAsSelectable();
    }

    public addIcon() {
        const icon = new Icon({ src: this.props.iconSrc || "" });

        this.addChild(icon);
        this.ref.appendChild(icon.build());
    }

    protected addStyles(): void {
        this.ref.style.background = "rgba(110, 231, 183, 0.1)";
        this.ref.style.border = "1px solid rgba(110, 231, 183, 0.3)";
        this.ref.style.borderRadius = "6px";
        this.ref.style.padding = "6px";
        this.ref.style.cursor = "pointer";
        this.ref.style.display = "flex";
        this.ref.style.alignItems = "center";
        this.ref.style.justifyContent = "center";
        this.ref.style.transition = "all 0.2s ease";
    }

    public onSelectable(): void {
        this.ref.style.cursor = "pointer";
        this.addClickEventListener();
        this.ref.addEventListener("mouseenter", this.mouseEnter);
        this.ref.addEventListener("mouseleave", this.mouseLeave);
    }

    public onUnselectable(): void {
        // TODO: Extract to a ActionRow base class
        this.ref.style.cursor = "not-allowed";
        this.removeClickEventListener();
        this.ref.style.border = "1px solid rgba(255, 0, 0, 0.3)";
        this.ref.removeEventListener("mouseenter", this.mouseEnter);
        this.ref.removeEventListener("mouseleave", this.mouseLeave);
    }

    private mouseEnter = () => {
        this.ref.style.transform = "scale(1.1)";
        this.ref.style.borderBottomColor = "rgba(110, 231, 183, 0.2)";
    };

    private mouseLeave = () => {
        this.ref.style.transform = "scale(1)";
        this.ref.style.borderBottomColor = "rgba(110, 231, 183, 0.6)";
    };
}
