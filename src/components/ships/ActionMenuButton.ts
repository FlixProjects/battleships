import { Selectable } from "../Selectable";

interface Props {
    iconSrc?: string;
    onClick?: (e?: MouseEvent) => void;
}

export class ActionMenuButton extends Selectable {
    constructor(id: string, private props: Props) {
        super(id);
    }

    public build(): HTMLElement {
        this.ref = document.createElement("button");
        this.ref.id = this.id;
        this.addStyles();
        this.addClickEventListener();
        return this.ref;
    }

    public async onClick(e: MouseEvent): Promise<void> {
        await this.props.onClick?.(e);
        return;
    }

    protected addStyles(): void {
        this.ref.classList.add("action-menu-btn");

        const icon = document.createElement("img");
        icon.src = this.props.iconSrc;

        icon.style.width = "20px";
        icon.style.height = "20px";
        icon.style.filter = "brightness(0) invert(1)";

        this.ref.appendChild(icon);
    }
}
