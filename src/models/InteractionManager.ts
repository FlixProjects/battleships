export class InteractionManager {
    public uiState = "Idle";
    private globalClickHandler: (e: MouseEvent) => void;

    public handleDeployingShipEvent(event: Pick<DeployingShipIMEvent, "onDeselect">) {
        this.uiState = IMEventType.DEPLOYING_SHIP;
        this.globalClickHandler = (e: MouseEvent) => this.selectingShipsClickHandler(e, event);
        this.addGlobalClickEventListener();
    }

    private selectingShipsClickHandler(e: MouseEvent, event: Pick<DeployingShipIMEvent, "onDeselect">) {
        const target = e.target as HTMLElement;
        const clickedTile = target.closest(".tile");
        const clickedShipRow = target.closest(".ship-row");

        if (!clickedTile && !clickedShipRow) {
            event.onDeselect();
            this.removeGlobalClickEventListener();
        }

        this.uiState = IMEventType.IDLE;
    }

    private addGlobalClickEventListener() {
        document.addEventListener("click", this.globalClickHandler);
    }

    private removeGlobalClickEventListener() {
        document.removeEventListener("click", this.globalClickHandler);
    }
}

export interface IMEvent {
    type: TIMEventType;
}

export const IMEventType = {
    IDLE: "Idle",
    DEPLOYING_SHIP: "Deploying_Ship",
} as const;

export type TIMEventType = (typeof IMEventType)[keyof typeof IMEventType];

export interface DeployingShipIMEvent extends IMEvent {
    type: "Deploying_Ship";
    onDeselect: () => void;
}
