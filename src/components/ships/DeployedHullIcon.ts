import { gameManager, interactionManager } from "../..";
import { DEPLOYED_HULL_PREFIX, TColor } from "@shared/constants";
import { IMEventType } from "../../models/interaction-manager/types";
import { Selectable } from "../Selectable";
import { ShipIcon } from "./ShipIcon";

interface Props {
    hullId?: string;
    shipId: string;
    playerId?: string;
    imgSrc?: string;
    invert?: boolean;
    color?: TColor;
    refNo?: string;
}

export class DeployedHullIcon extends Selectable {
    constructor(private props: Props) {
        const id = `${DEPLOYED_HULL_PREFIX}${props.hullId}`;
        super(id);
    }
    public build(): HTMLElement {
        const hullContainer = document.createElement("div");
        hullContainer.id = this.id;
        const hullIcon = new ShipIcon(this.props);
        hullContainer.appendChild(hullIcon.build());
        this.ref = hullContainer;
        this.addClickEventListener();
        return this.ref;
    }

    public async onClick(e?: MouseEvent): Promise<void> {
        if (gameManager.getPlayer().id === this.props.playerId) {
            interactionManager.handleEvent({
                type: IMEventType.SELECT_SHIP,
                tileId: this.id,
                hullId: this.props.hullId,
                shipId: this.props.shipId,
                selectableId: "select-ship", // FIXME: should this be dynamic?
            });
        }
    }
}
