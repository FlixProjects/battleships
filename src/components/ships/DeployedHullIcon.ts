import { DEPLOYED_HULL_PREFIX, TColor } from "@shared/constants";
import { gameManager, interactionManager } from "../../index";
import { IMEventType } from "../../models/interaction-manager/types";
import { Selectable } from "../Selectable";
import { HullIcon } from "./HullIcon";

interface Props {
    hullId: string;
    shipId: string;
    playerId: string;
    imgSrc: string;
    color?: TColor;
    refNo?: string;
    rotation?: number;
}

export class DeployedHullIcon extends Selectable {
    constructor(private props: Props) {
        const id = `${DEPLOYED_HULL_PREFIX}${props.hullId}`;
        super(id);
    }
    public build(): HTMLElement {
        const hullContainer = document.createElement("div");
        hullContainer.id = this.id;
        this.ref = hullContainer;

        const hullIcon = new HullIcon(this.props);

        hullContainer.appendChild(hullIcon.build());
        
        this.isSelectable = gameManager.getPlayer().id === this.props.playerId; // temporarily disallow selecting other player's ships
        this.setState();

        return this.ref;
    }

    public async onClick(e?: MouseEvent): Promise<void> {
        interactionManager.handleEvent({
            type: IMEventType.SELECT_SHIP,
            tileId: this.id,
            hullId: this.props.hullId,
            shipId: this.props.shipId,
            selectableId: "select-ship", // FIXME: should this be dynamic?
        });
    }

    public onSelectable(): void {
        this.addClickEventListener();
        this.ref.addEventListener("mouseenter", this.mouseEnter);
        this.ref.addEventListener("mouseleave", this.mouseLeave);
    }

    public onUnselectable(): void {
        this.removeClickEventListener();
        this.ref.removeEventListener("mouseenter", this.mouseEnter);
        this.ref.removeEventListener("mouseleave", this.mouseLeave);
    }

    private mouseEnter = () => {
        this.ref.style.transform = `scale(1.1, 1.1)`;
        this.ref.style.borderBottomColor = "rgba(110, 231, 183, 0.9)";
    };

    private mouseLeave = () => {
        this.ref.style.transform = `scale(1, 1)`;
        this.ref.style.borderBottomColor = "rgba(110, 231, 183, 0.6)";
    };
}
