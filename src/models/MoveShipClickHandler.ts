import { gameManager } from "..";
import {
    ActionTypes,
    GameStateManager,
    ICellLoc,
    IShip,
    keyToLocation,
    locationToKey,
    ResultType
} from "../../shared";
import { GameEngine } from "../../shared/models/GameEngine";
import { ClickHandler } from "./ClickHandler";
import { MovingShipIMEvent } from "./InteractionManager";

export class MoveShipClickHandler extends ClickHandler {
    private validCells: ICellLoc[] = [];
    private origin: ICellLoc;
    constructor(protected event: MovingShipIMEvent) {
        super();
    }

    public handleEvent() {
        const { shipId } = this.event;
        const playerId = gameManager.getPlayer().id;

        const gameEngine = new GameEngine(gameManager.state.gameState);
        const { validCells, origin } = gameEngine.prime.moveShip({ playerId, shipId });

        this.updateGameBoard(validCells);
        this.validCells = validCells;
        this.origin = origin;

        return {
            nextClickhandler: (e: MouseEvent) => this.handler(e),
        };
    }

    protected handler(e: MouseEvent) {
        const { shipId, onGlobalDeselect, onSuccessfulSelect } = this.event;
        const target = e.target as HTMLElement;

        const id = target.closest(`.tile`)?.id;
        const validCellIndices = this.validCells.map((cell) => locationToKey(cell));

        const isInvalidClick =
            !id || (!validCellIndices.includes(id) && !(this.origin && locationToKey(this.origin) === id));

        if (isInvalidClick) {
            return this.handleInvalidClick(onGlobalDeselect);
        }

        this.clearPriorOnSelects(validCellIndices);
        this.loadOnSelects(validCellIndices, onGlobalDeselect);

        if (validCellIndices.includes(id)) {
            // FIXME: we should receive array of hullIds that are moving, and new locations
            this.handleValidMoveShipClick(id, shipId, onSuccessfulSelect);
        }
    }

    private handleValidMoveShipClick(destinationTileId: string, shipId: string, onSuccessCb?: () => void) {
        const gameEngine = new GameEngine(gameManager.state.gameState);
        const movementCost = 1; // Default movement cost
        const gsm = new GameStateManager(gameManager.state.gameState);

        const playerId = gameManager.getCurrentPlayerId();
        const player = gsm.getPlayer(playerId);
        const ship = player.getShip(shipId);


        const newLocations = this.getNewHullLocations(keyToLocation(destinationTileId), ship);

        const result = gameEngine.commit.moveShip({
            type: ActionTypes.MOVE,
            shipId,
            playerId,
            hullLocations: newLocations,
            commandPointCost: movementCost,
        });

        if (result.type === ResultType.ERROR) return;

        gameManager.saveCurrentPlayerState({ gameState: gsm.updatePlayer(result.player).gameState });

        const tile = this.selectables[destinationTileId];
        tile.runOnSelects();

        onSuccessCb?.();
    }

    // WARNING: we don't mutate the original as much as possible
    private getNewHullLocations(endCell: ICellLoc, ship: IShip) {
        let newHullLocations = [...ship.hullLocations];
        newHullLocations = ship.hullLocations;
        // FIXME: only single location for now
        const hullFront = { ...newHullLocations[0] };
        hullFront.location = endCell;

        return [hullFront];
    }
}
