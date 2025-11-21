import { Selectable } from "../components/Selectable";
import { DeployShipClickHandler } from "./DeployShipClickHandler";
import { MoveShipClickHandler } from "./MoveShipClickHandler";

export class InteractionManager {
    public uiState = "Idle";
    public selectables: Record<string, Selectable> = {};
    private globalClickHandler: (e: MouseEvent) => void;

    public handleEvent(event: DeployingShipIMEvent | MovingShipIMEvent) {
        this.removeGlobalClickEventListener();
        let handler: (e: MouseEvent) => void;
        switch (event.type) {
            case IMEventType.DEPLOYING_SHIP:
                this.uiState = IMEventType.DEPLOYING_SHIP;
                handler = new DeployShipClickHandler(event).load(this.selectables, () =>
                    this.removeGlobalClickEventListener(),
                );
                break;
            case IMEventType.MOVING_SHIP:
                this.uiState = IMEventType.MOVING_SHIP;
                handler = new MoveShipClickHandler(event).load(this.selectables, () =>
                    this.removeGlobalClickEventListener(),
                );
                break;
        }
        this.globalClickHandler = handler;
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
