import { interactionManager } from "../..";
import { IShip } from "../../../shared";
import { IMEventType } from "../../models/InteractionManager";
import { BaseComponent } from "../BaseComponent";
import { SelectMoveButton } from "./SelectMoveButton";

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

        // TODO: we shud check if the ship can move
        this.addMoveButton();

        return this.ref;
    }

    private addMoveButton() {
        const btn = new SelectMoveButton("select-action-move", {
            iconSrc: "./assets/move-icon.svg",
            onClick: async (e: MouseEvent) => {
                e?.stopPropagation();
                interactionManager.handleEvent({
                    type: IMEventType.MOVING_SHIP,
                    shipId: this.props?.ship?.id,
                    onGlobalDeselect: () => this.close(),
                });
                this.remove();
            },
        });

        this.addChild(btn);
        this.ref.appendChild(btn.build());
        return btn;
    }

    public close() {
        this.remove();
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
