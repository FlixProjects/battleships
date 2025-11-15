import { gameEngine } from "..";
import { getComponents } from "../components/component-helper";
import { Selectable } from "../components/Selectable";
import { ShipIcon } from "../components/ships/ShipIcon";
import { keyToLocation, locationToKey } from "../utils/game-helper";

export class InteractionManager {
    public uiState = "Idle";
    public selectables: Record<string, Selectable> = {};
    private globalClickHandler: (e: MouseEvent) => void;

    public handleDeployingShipEvent(event: DeployingShipIMEvent) {
        this.uiState = IMEventType.DEPLOYING_SHIP;
        this.globalClickHandler = (e: MouseEvent) => this.selectingShipsClickHandler(e, event);
        this.addGlobalClickEventListener();
    }

    private selectingShipsClickHandler(e: MouseEvent, event: DeployingShipIMEvent) {
        const { shipId, onGlobalDeselect } = event;

        const target = e.target as HTMLElement;

        const clickedTile = target.closest(".tile");
        const clickedShipRow = target.closest(".ship-row");

        const validCells = gameEngine.prime.deployShip(shipId);
        const gameBoard = getComponents().div.gameBoard;

        gameBoard.updateSelectableTiles(validCells);

        if (!clickedTile && !clickedShipRow) {
            onGlobalDeselect();
            this.removeGlobalClickEventListener();
        }

        const id = this.addGetIdOfClick(e);

        const validCellIndices = validCells.map((cell) => locationToKey(cell));

        validCellIndices.forEach((index) => {
            this.selectables[index].addOnSelect(() => {
                const tile = this.selectables[index];
                const shipIcon = new ShipIcon({ shipId });
                tile.addChild(shipIcon);
                tile.ref.appendChild(shipIcon.build());
            });
        });

        if (validCellIndices.includes(id)) {
            gameEngine.commit.deployShip(id, keyToLocation(id));
            const tile = this.selectables[id];
            tile.runOnSelects();
        }

        validCellIndices.forEach((index) => {
            this.selectables[index].clearOnSelect();
        });

        this.uiState = IMEventType.IDLE;
    }

    public register(selectable: Selectable) {
        this.selectables[selectable.id] = selectable;
    }

    private addGetIdOfClick = (e: MouseEvent) => {
        const target = e.target as HTMLElement;
        return target.id;
    };

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
} as const;

export type TIMEventType = (typeof IMEventType)[keyof typeof IMEventType];

export interface DeployingShipIMEvent {
    shipId: string;
    onGlobalDeselect?: () => void;
    onSelect?: () => void;
}
