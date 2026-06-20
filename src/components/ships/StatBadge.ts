import { BaseComponent } from "../BaseComponent";
import { Icon } from "./Icon";

interface Props {
    iconSrc: string;
    value: string | number;
    /** Icon edge length in px (default 14). */
    size?: number;
}

/** Small `(icon | value)` pair, reused by CardRow and DetailsPanel. */
export class StatBadge extends BaseComponent {
    constructor(private props: Props) {
        super();
    }

    public build(): HTMLElement {
        this.ref = document.createElement("div");
        this.addStyles();

        const size = this.props.size ?? 14;
        const icon = new Icon({
            src: this.props.iconSrc,
            addStyles: (img) => {
                img.ref.style.width = `${size}px`;
                img.ref.style.height = `${size}px`;
            },
        });
        this.addChild(icon);
        this.ref.appendChild(icon.build());

        const value = document.createElement("span");
        value.textContent = String(this.props.value);
        value.style.color = "#ffffff";
        value.style.fontSize = "12px";
        value.style.fontWeight = "bold";
        this.ref.appendChild(value);

        return this.ref;
    }

    protected addStyles(): void {
        this.ref.style.display = "flex";
        this.ref.style.alignItems = "center";
        this.ref.style.gap = "3px";
    }
}
