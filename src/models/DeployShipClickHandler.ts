import { gameManager } from "..";
import { GameStateManager, ICellLoc, ResultType } from "../../shared";
import { GameEngine } from "../../shared/models/GameEngine";
import { getHull, keyToLocation, locationToKey } from "../../shared/utils/helpers";
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
            nextClickhandler: async (e: MouseEvent) => await this.handler(e),
        };
    }

    protected async handler(e: MouseEvent) {
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
        const gsm = new GameStateManager(gameManager.state.gameState);
        const playerId = gameManager.getCurrentPlayerId();
        const player = gsm.getPlayer(playerId);

        const { commandPointCost, hullTemplates } = player.getShip(shipId); // getShipFromPlayer(player, shipId);

        // FIXME: only single location for now
        const committedHullLocations = hullTemplates.map((template) => {
            const loc = keyToLocation(tileId);
            return getHull(shipId, template, loc); // we initialise the location here
        });
        const result = gameEngine.commit.deployShip({
            shipId,
            playerId,
            hullLocations: committedHullLocations,
            commandPointCost,
        });

        if (result.type === ResultType.ERROR) return;

        gameManager.saveCurrentPlayerState({ gameState: gsm.updatePlayer(result.player).gameState });

        const tile = this.selectables[tileId];
        tile.runOnSelects();

        onSuccessCb?.();
    }
}
