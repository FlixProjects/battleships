import { FEHighlightLocationsCommand } from "@shared/models/commands/FEHighlightLocationsCommand";
import { FEPlayCardCommand } from "@shared/models/commands/FEPlayCardCommand";
import { GetValidDeployCellsSignal } from "@shared/models/signals/GetValidDeployCellsSignal";
import { ICellLoc } from "@shared/types";
import { keyToLocation, locationToKey } from "@shared/utils/helpers";
import { gameManager } from "../..";
import { getComponents } from "../../components/component-helper";
import { getEngine, queueCommand } from "../../utils/game-helper";
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

        const result = getEngine().query(
            new GetValidDeployCellsSignal({ targetId: shipId, payload: { shipId, playerId } }),
        );
        const validCells = result?.validCells ?? [];

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
            return this.handleInvalidClick(() => {
                this.clearPriorOnSelects(validCellIndices);
                onGlobalDeselect?.();
            });
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

        // The handler is ship-deploy-specific in name, but it goes through the
        // generic FEPlayCardCommand so card→effect dispatch lives in one place.
        const card = gameManager.state.gameState.cards.find((c) => c.instanceId === shipId);
        if (!card) {
            throw new Error(`[Error] No card backs ship ${shipId}; cannot play`);
        }

        queueCommand(
            new FEPlayCardCommand({
                cardId: card.id,
                playerId,
                // Send only the anchor tile (intent); the domain derives hull placements.
                loadPlayParams: { kind: "Ship", location: keyToLocation(tileId) },
                locationElement: tile,
                onSuccessCb,
            }),
        );
    }
}
