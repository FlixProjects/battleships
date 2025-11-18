import { gameManager } from "..";
import { getHull, getShipFromPlayer, ResultType } from "../../shared";
import { getComponents, updateComponents } from "../components/component-helper";
import { Selectable } from "../components/Selectable";
import { keyToLocation, locationToKey } from "../utils/game-helper";
import { GameEngine } from "./GameEngine";

export class InteractionManager {
    public uiState = "Idle";
    public selectables: Record<string, Selectable> = {};
    private globalClickHandler: (e: MouseEvent) => void;

    public handleDeployingShipEvent(event: DeployingShipIMEvent) {
        this.removeGlobalClickEventListener();
        this.uiState = IMEventType.DEPLOYING_SHIP;
        this.globalClickHandler = (e: MouseEvent) => this.selectingShipsClickHandler(e, event);
        this.addGlobalClickEventListener();
    }

    private selectingShipsClickHandler(e: MouseEvent, event: DeployingShipIMEvent) {
        const { shipId, onGlobalDeselect, onSuccessfulSelect } = event;
        const playerId = gameManager.getPlayer().id;
        const { commandPointCost } = getShipFromPlayer(gameManager.getPlayer(), shipId);

        const target = e.target as HTMLElement;

        const clickedShipRow = target.closest(".ship-row"); // find way to replace this implementation

        const gameEngine = new GameEngine(gameManager.state.gameState);
        const validCells = gameEngine.prime.deployShip({ playerId, shipId });
        const gameBoard = getComponents().div.gameBoard;

        gameBoard.updateSelectableTiles(validCells);

        const id = this.addGetIdOfClick(e);
        const validCellIndices = validCells.map((cell) => locationToKey(cell));

        if (!clickedShipRow && !validCellIndices.includes(id)) {
            onGlobalDeselect();
            this.removeGlobalClickEventListener();
            return;
        }

        validCellIndices.forEach((index) => {
            this.selectables[index].clearOnSelect();
        });

        validCellIndices.forEach((index) => {
            this.selectables[index].addOnSelect(() => {
                updateComponents();
                onGlobalDeselect();
                this.removeGlobalClickEventListener();
            });
        });
        // FIXME: only single location for now
        const committedHullLocations = [keyToLocation(id)].map((loc) => getHull(shipId, loc));

        if (validCellIndices.includes(id)) {
            const result = gameEngine.commit.deployShip({
                shipId,
                playerId,
                hullLocations: committedHullLocations,
                commandPointCost,
            });

            if (result.type === ResultType.ERROR) return;

            gameManager.updatePlayer(result.player);

            const tile = this.selectables[id];
            tile.runOnSelects();

            onSuccessfulSelect?.();
        }

        this.uiState = IMEventType.IDLE;
    }

    public register(selectable: Selectable) {
        this.selectables[selectable.id] = selectable;
    }
    private clearAllOnSelects() {
        Object.values(this.selectables).forEach((selectable) => {
            selectable.clearOnSelect();
        });
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
    onSuccessfulSelect?: () => void;
}
