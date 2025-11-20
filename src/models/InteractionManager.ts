import { gameManager } from "..";
import {
    ActionTypes,
    GameEngine,
    getHull,
    getShipFromPlayer,
    ICellLoc,
    keyToLocation,
    locationToKey,
    ResultType,
} from "../../shared";
import { getComponents, updateComponents } from "../components/component-helper";
import { Selectable } from "../components/Selectable";

export class InteractionManager {
    public uiState = "Idle";
    public selectables: Record<string, Selectable> = {};
    private globalClickHandler: (e: MouseEvent) => void;

    // TODO: Refactor to set each EventHandler as its own class
    public handleDeployingShipEvent(event: DeployingShipIMEvent) {
        this.removeGlobalClickEventListener();
        this.uiState = IMEventType.DEPLOYING_SHIP;
        this.globalClickHandler = (e: MouseEvent) => this.selectingShipsClickHandler(e, event);
        this.addGlobalClickEventListener();
    }

    public handleMovingShipEvent(event: MovingShipIMEvent) {
        this.removeGlobalClickEventListener();
        this.uiState = IMEventType.MOVING_SHIP;
        this.globalClickHandler = (e: MouseEvent) => this.moveShipsClickHandler(e, event);
        this.addGlobalClickEventListener();
    }

    private selectingShipsClickHandler(e: MouseEvent, event: DeployingShipIMEvent) {
        const { shipId, onGlobalDeselect, onSuccessfulSelect } = event;
        const playerId = gameManager.getPlayer().id;

        const target = e.target as HTMLElement;

        const clickedShipRow = target.closest(".ship-row"); // find way to replace this implementation

        const gameEngine = new GameEngine(gameManager.state.gameState);
        const { validCells } = gameEngine.prime.deployShip({ playerId, shipId });

        this.updateGameBoard(validCells);

        const id = this.addGetIdOfClick(e);
        const validCellIndices = validCells.map((cell) => locationToKey(cell));

        if (!clickedShipRow && !validCellIndices.includes(id)) {
            return this.handleInvalidClick(onGlobalDeselect);
        }

        this.clearPriorOnSelects(validCellIndices);
        this.loadOnSelects(validCellIndices, onGlobalDeselect);

        if (validCellIndices.includes(id)) {
            this.handleDeployShipClick(id, shipId, onSuccessfulSelect);
        }

        this.uiState = IMEventType.IDLE;
    }

    private moveShipsClickHandler(e: MouseEvent, event: MovingShipIMEvent) {
        const { shipId, onGlobalDeselect, onSuccessfulSelect } = event;
        const playerId = gameManager.getPlayer().id;

        const target = e.target as HTMLElement;

        const gameEngine = new GameEngine(gameManager.state.gameState);
        const { validCells, origin } = gameEngine.prime.moveShip({ playerId, shipId });

        this.updateGameBoard(validCells);

        const id = target.closest(`.tile`)?.id;
        const validCellIndices = validCells.map((cell) => locationToKey(cell));

        const isInvalidClick = !id || (!validCellIndices.includes(id) && !(origin && locationToKey(origin) === id));

        if (isInvalidClick) {
            return this.handleInvalidClick(onGlobalDeselect);
        }

        this.clearPriorOnSelects(validCellIndices);
        this.loadOnSelects(validCellIndices, onGlobalDeselect);

        if (validCellIndices.includes(id)) {
            this.handleValidMoveShipClick(id, shipId, onSuccessfulSelect);
        }

        this.uiState = IMEventType.IDLE;
    }

    private updateGameBoard(cells: ICellLoc[]) {
        const gameBoard = getComponents().div.gameBoard;
        gameBoard.updateSelectableTiles(cells);
    }

    private handleInvalidClick(callback?: () => void) {
        callback();
        this.removeGlobalClickEventListener();
        return;
    }

    private clearPriorOnSelects(selectableKeys: string[]) {
        selectableKeys.forEach((index) => {
            this.selectables[index].clearOnSelect();
        });
    }

    private loadOnSelects(selectableKeys: string[], onDeselect?: () => void) {
        selectableKeys.forEach((index) => {
            this.selectables[index].addOnSelect(() => {
                updateComponents();
                onDeselect?.();
                this.removeGlobalClickEventListener();
            });
        });
    }

    private handleDeployShipClick(tileId: string, shipId: string, onSuccessCb?: () => void) {
        const gameEngine = new GameEngine(gameManager.state.gameState);
        const playerId = gameManager.getPlayer().id;
        const { commandPointCost } = getShipFromPlayer(gameManager.getPlayer(), shipId);
        // FIXME: only single location for now
        const committedHullLocations = [keyToLocation(tileId)].map((loc) => getHull(shipId, loc));
        const result = gameEngine.commit.deployShip({
            shipId,
            playerId,
            hullLocations: committedHullLocations,
            commandPointCost,
        });

        if (result.type === ResultType.ERROR) return;

        gameManager.updatePlayer(result.player);

        const tile = this.selectables[tileId];
        tile.runOnSelects();

        onSuccessCb?.();
    }

    private handleValidMoveShipClick(tileId: string, shipId: string, onSuccessCb?: () => void) {
        const gameEngine = new GameEngine(gameManager.state.gameState);
        const movementCost = 1; // Default movement cost
        const newLocation = getHull(shipId, keyToLocation(tileId));
        const playerId = gameManager.getPlayer().id;

        const result = gameEngine.commit.moveShip({
            type: ActionTypes.MOVE,
            shipId,
            playerId,
            hullLocations: [newLocation], // FIXME: only single location for now
            commandPointCost: movementCost,
        });

        if (result.type === ResultType.ERROR) return;

        gameManager.updatePlayer(result.player);

        const tile = this.selectables[tileId];
        tile.runOnSelects();

        onSuccessCb?.();
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
    MOVING_SHIP: "Moving_Ship",
} as const;

export type TIMEventType = (typeof IMEventType)[keyof typeof IMEventType];

export interface DeployingShipIMEvent {
    shipId: string;
    onGlobalDeselect?: () => void;
    onSuccessfulSelect?: () => void;
}

export interface MovingShipIMEvent {
    shipId: string;
    onGlobalDeselect?: () => void;
    onSuccessfulSelect?: () => void;
}
