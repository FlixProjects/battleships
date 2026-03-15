import { gameManager } from "..";
import { GameStateManager, ICellLoc, ResultType } from "../../shared";
import { DeployShipActionCreator } from "../../shared/models/ActionCreator";
import { GameEngine } from "../../shared/models/GameEngine";
import { ActionResolver } from "../../shared/utils/action-handler/ActionResolver";
import { getHull, keyToLocation, locationToKey } from "../../shared/utils/helpers";
import { ClickHandler } from "./ClickHandler";
import { DeployingShipIMEvent } from "./interaction-manager/types";

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
        const gameState = gameManager.state.gameState;
        const gsm = new GameStateManager(gameState);
        const playerId = gameManager.getCurrentPlayerId();
        const player = gsm.getPlayer(playerId);

        const { commandPointCost, hullTemplates } = gsm.getShip(shipId);

        // FIXME: only single location for now
        const committedHullLocations = hullTemplates.map((template) => {
            const loc = keyToLocation(tileId);
            return getHull(shipId, template, loc); // we initialise the location here
        });

        const deployAction = new DeployShipActionCreator(player, gsm.getCurrentRound()).create({
            shipId,
            commandPointCost,
            hullLocations: committedHullLocations,
        });

        const newGameState = new ActionResolver(playerId, gameState).resolveDeploy(deployAction);

        gameManager.saveCurrentPlayerStateV2({ gameState: newGameState }, { skipResolve: true });

        const tile = this.selectables[tileId];
        tile.runOnSelects();

        onSuccessCb?.();
    }
}
