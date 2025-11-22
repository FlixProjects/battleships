import { gameManager } from "..";
import { ICellLoc, ResultType } from "../../shared";
import { GameEngine } from "../../shared/models/GameEngine";
import { getHull, getShipFromPlayer, keyToLocation, locationToKey } from "../../shared/utils/helpers";
import { ClickHandler } from "./ClickHandler";
import { DeployingShipIMEvent } from "./InteractionManager";

export class DeployShipClickHandler extends ClickHandler {
    private validCells: ICellLoc[] = [];
    constructor(protected event: DeployingShipIMEvent) {
        super();
    }

    public handleEvent() {
        const { shipId } = this.event;
        const playerId = gameManager.getPlayer().id;

        const gameEngine = new GameEngine(gameManager.state.gameState);
        const { validCells } = gameEngine.prime.deployShip({ playerId, shipId });
        
        this.updateGameBoard(validCells);
        this.validCells = validCells;

        return {
            nextClickhandler: (e: MouseEvent) => this.handler(e),
        };
    }
    
    protected handler(e: MouseEvent) {
        const { shipId, onGlobalDeselect, onSuccessfulSelect } = this.event;
        const target = e.target as HTMLElement;

        const clickedShipRow = target.closest(".ship-row"); // find way to replace this implementation

        const id = this.addGetIdOfClick(e);
        const validCellIndices = this.validCells.map((cell) => locationToKey(cell));

        if (!clickedShipRow && !validCellIndices.includes(id)) {
            return this.handleInvalidClick(onGlobalDeselect);
        }

        this.clearPriorOnSelects(validCellIndices);
        this.loadOnSelects(validCellIndices, onGlobalDeselect);

        if (validCellIndices.includes(id)) {
            this.handleDeployShipClick(id, shipId, onSuccessfulSelect);
        }
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
}
