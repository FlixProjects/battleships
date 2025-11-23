import { Selectable } from "../components/Selectable";
import { ClickHandler } from "./ClickHandler";
import { DeployShipClickHandler } from "./DeployShipClickHandler";
import { MoveShipClickHandler } from "./MoveShipClickHandler";
import { SelectShipClickHandler } from "./SelectShipClickHandler";

export class InteractionManager {
    public uiState = "Idle";
    public selectables: Record<string, Selectable> = {};
    private globalClickHandler: (e: MouseEvent) => void;

    public handleEvent(event: DeployingShipIMEvent | MovingShipIMEvent | SelectShipActionIMEvent) {
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

export const IMEventType = {
    IDLE: "Idle",
    START_TURN: "Start_Turn",
    DEPLOYING_SHIP: "Deploying_Ship",
    MOVING_SHIP: "Moving_Ship",
    SELECT_SHIP: "Select_Ship",
} as const;

export type TIMEventType = (typeof IMEventType)[keyof typeof IMEventType];

export interface IMEvent {
    type: TIMEventType;
}

export interface DeployingShipIMEvent extends IMEvent {
    type: typeof IMEventType.DEPLOYING_SHIP;
    shipId: string;
    onGlobalDeselect?: () => void;
    onSuccessfulSelect?: () => void;
}

export interface MovingShipIMEvent extends IMEvent {
    type: typeof IMEventType.MOVING_SHIP;
    shipId: string;
    onGlobalDeselect?: () => void;
    onSuccessfulSelect?: () => void;
}

export interface SelectShipActionIMEvent extends IMEvent {
    type: typeof IMEventType.SELECT_SHIP;
    tileId: string;
    selectableId: string;
    onGlobalDeselect?: () => void;
}
