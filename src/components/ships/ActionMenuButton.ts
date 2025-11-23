import { Selectable } from "../Selectable";
import { Icon } from "./Icon";

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
        this.addIcon();
        this.addStyles();
        this.addClickEventListener();
        return this.ref;
    }

    public async onClick(e: MouseEvent): Promise<void> {
        await this.props.onClick?.(e);
        return;
    }

    public addIcon(){
        const icon = new Icon({ src: this.props.iconSrc || "" });
        
        this.addChild(icon)
        this.ref.appendChild(icon.build());
    }

    protected addStyles(): void {
        this.ref.classList.add("action-menu-btn"); // we use class since we need hover
    }
}
