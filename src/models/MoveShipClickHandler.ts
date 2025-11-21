import { gameManager } from "..";
import { ActionTypes, getHull, keyToLocation, locationToKey, ResultType } from "../../shared";
import { GameEngine } from "../../shared/models/GameEngine";
import { ClickHandler } from "./ClickHandler";
import { MovingShipIMEvent } from "./InteractionManager";

export class MoveShipClickHandler extends ClickHandler {
    constructor(protected event: MovingShipIMEvent) {
        super();
    }

    protected handler(e: MouseEvent) {
        const { shipId, onGlobalDeselect, onSuccessfulSelect } = this.event;
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
}
