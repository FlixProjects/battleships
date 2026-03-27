import { FEHighlightLocationsCommand } from "@shared/models/commands/FEHighlightLocationsCommand";
import { FEMoveShipCommand } from "@shared/models/commands/FEMoveShipCommand";
import { GameEngine } from "@shared/models/GameEngine";
import { ICellLoc, } from "@shared/types";
import { locationToKey } from "@shared/utils";
import { gameManager } from "../..";
import { getComponents } from "../../components/component-helper";
import { queueCommand } from "../../utils/game-helper";
import { MovingShipIMEvent } from "../interaction-manager/types";
import { ClickHandler } from "./ClickHandler";

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

        queueCommand(new FEHighlightLocationsCommand(getComponents().div.gameBoard, validCells));
        this.validCells = validCells;
        this.origin = origin;

        return {
            nextClickhandler: async (e: MouseEvent) => await this.handler(e),
        };
    }

    protected async handler(e: MouseEvent) {
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
            await this.handleValidMoveShipClick(id, shipId, onSuccessfulSelect);
        }
    }

    private async handleValidMoveShipClick(destinationTileId: string, shipId: string, onSuccessCb?: () => void) {
        const playerId = gameManager.getCurrentPlayerId();
        const tile = this.selectables[destinationTileId];

        await queueCommand(
            new FEMoveShipCommand({
                tileId: destinationTileId,
                shipId,
                playerId,
                locationElement: tile,
                onSuccessCb,
            }),
        );
    }
}
