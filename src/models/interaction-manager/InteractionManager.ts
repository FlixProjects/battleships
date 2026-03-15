import { Selectable } from "../../components/Selectable";
import { ClickHandler } from "../click-handlers/ClickHandler";
import { DeployShipClickHandler } from "../click-handlers/DeployShipClickHandler";
import { MoveShipClickHandler } from "../click-handlers/MoveShipClickHandler";
import { SelectShipClickHandler } from "../click-handlers/SelectShipClickHandler";
import { ShipAttackClickHandler } from "../click-handlers/ShipAttackClickHandler";
import {
    DeployingShipIMEvent,
    IMEventType,
    MovingShipIMEvent,
    SelectShipActionIMEvent,
    ShipAttackActionIMEvent,
} from "./types";

export class InteractionManager {
    public uiState = "Idle";
    public selectables: Record<string, Selectable> = {};
    private globalClickHandler: (e: MouseEvent) => void;

    public handleEvent(
        event: DeployingShipIMEvent | MovingShipIMEvent | SelectShipActionIMEvent | ShipAttackActionIMEvent,
    ) {
        this.removeGlobalClickEventListener();
        let eventHandler: ClickHandler;

        switch (event.type) {
            case IMEventType.DEPLOYING_SHIP:
                this.uiState = IMEventType.DEPLOYING_SHIP;
                eventHandler = new DeployShipClickHandler(event).load(this.selectables, () =>
                    this.removeGlobalClickEventListener(),
                );
                break;
            case IMEventType.MOVING_SHIP:
                this.uiState = IMEventType.MOVING_SHIP;
                eventHandler = new MoveShipClickHandler(event).load(this.selectables, () =>
                    this.removeGlobalClickEventListener(),
                );
                break;
            case IMEventType.SELECT_SHIP:
                this.uiState = IMEventType.SELECT_SHIP;
                eventHandler = new SelectShipClickHandler(event).load(this.selectables, () =>
                    this.removeGlobalClickEventListener(),
                );
                break;
            case IMEventType.SHIP_ATTACK:
                this.uiState = IMEventType.SHIP_ATTACK;
                eventHandler = new ShipAttackClickHandler(event).load(this.selectables, () =>
                    this.removeGlobalClickEventListener(),
                );
                break;
        }

        const { nextClickhandler } = eventHandler.handleEvent(); // any operations to resolve before click
        this.globalClickHandler = nextClickhandler;
        this.addGlobalClickEventListener();

        // FIXME: should reset uiState but we have no use for it now
    }

    public register(selectable: Selectable) {
        this.selectables[selectable.id] = selectable;
    }

    private addGlobalClickEventListener() {
        document.addEventListener("click", this.globalClickHandler);
    }

    private removeGlobalClickEventListener() {
        document.removeEventListener("click", this.globalClickHandler);
    }
}
