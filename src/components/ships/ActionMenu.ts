import { interactionManager } from "../..";
import { IShip } from "../../../shared";
import { IMEventType } from "../../models/InteractionManager";
import { BaseComponent } from "../BaseComponent";
import { getComponents } from "../component-helper";

interface Props {
    ship: IShip;
}

export class ActionMenu extends BaseComponent {
    constructor(private props: Props) {
        super();
    }

    public build() {
        this.ref = document.createElement("div");
        this.ref.classList.add("action-menu");
        this.addStyles();

        const moveBtn = this.createMoveButton();
        this.ref.appendChild(moveBtn);

        return this.ref;
    }

    private createMoveButton() {
        const src = "./assets/move-icon.svg";
        const onClick = (e: MouseEvent) => {
            e.stopPropagation();
            interactionManager.handleEvent({
                type: IMEventType.MOVING_SHIP,
                shipId: this.props?.ship?.id,
                onGlobalDeselect: () => this.clearSelection(),
            });
            this.remove();
        };
        return this.addButton(src, onClick);
    }

    private addButton(src: string, onClick?: (e: MouseEvent) => void, id?: string) {
        const btn = document.createElement("button");
        btn.classList.add("action-menu-btn");

        btn.addEventListener("click", onClick);

        const icon = document.createElement("img");
        icon.src = src;

        icon.style.width = "20px";
        icon.style.height = "20px";
        icon.style.filter = "brightness(0) invert(1)";

        btn.appendChild(icon);

        return btn;
    }

    public close() {
        this.remove();
    }

    private clearSelection() {
        getComponents().div.gameBoard.updateSelectableTiles([]);
    }

    protected addStyles() {
        this.ref.style.position = "absolute";
        this.ref.style.top = "-40px";
        this.ref.style.left = "50%";
        this.ref.style.transform = "translateX(-50%)";
        this.ref.style.background = "rgba(15, 23, 36, 0.95)";
        this.ref.style.border = "1px solid rgba(110, 231, 183, 0.3)";
        this.ref.style.borderRadius = "8px";
        this.ref.style.padding = "4px";
        this.ref.style.display = "flex";
        this.ref.style.gap = "4px";
        this.ref.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.4)";
        this.ref.style.zIndex = "1000";
        this.ref.style.animation = "fadeIn 0.2s ease";
    }
}
