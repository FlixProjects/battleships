import { FEDeployShipCommand } from "@shared/models/commands/FEDeployShipCommand";
import { FEHighlightLocationsCommand } from "@shared/models/commands/FEHighlightLocationsCommand";
import { GameEngine } from "@shared/models/GameEngine";
import { ICellLoc, ResultType } from "@shared/types";
import { locationToKey } from "@shared/utils/helpers";
import { gameManager } from "../..";
import { getComponents } from "../../components/component-helper";
import { queueCommand } from "../../utils/game-helper";
import { DeployingShipIMEvent } from "../interaction-manager/types";
import { ClickHandler } from "./ClickHandler";

export class DeployShipClickHandler extends ClickHandler {
    private validCells: ICellLoc[] = [];
    constructor(protected event: DeployingShipIMEvent) {
        super();
    }

    public handleEvent() {
        const { shipId } = this.event;
        const playerId = gameManager.getPlayer().id;

        const gameEngine = new GameEngine(gameManager.state.gameState);
        const result = gameEngine.prime.deployShip({ playerId, shipId });

        if (result.type === ResultType.ERROR) {
            throw new Error(result.message || "[Error] Failed to get valid deploy cells");
        }

        const { validCells } = result;

        queueCommand(new FEHighlightLocationsCommand(getComponents().div.gameBoard, validCells));
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
        const playerId = gameManager.getCurrentPlayerId();
        const tile = this.selectables[tileId];

        if (!playerId) {
            throw new Error("[Error] Player ID not found");
        }
        
        queueCommand(
            new FEDeployShipCommand({
                tileId,
                shipId,
                playerId,
                locationElement: tile,
                onSuccessCb,
            }),
        );
    }
}
