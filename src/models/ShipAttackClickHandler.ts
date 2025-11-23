import { gameManager } from "..";
import { ActionTypes, getHull, ICellLoc, keyToLocation, locationToKey, ResultType } from "../../shared";
import { GameEngine } from "../../shared/models/GameEngine";
import { ClickHandler } from "./ClickHandler";
import { ShipAttackActionIMEvent } from "./InteractionManager";

export class ShipAttackClickHandler extends ClickHandler {
    private validCells: ICellLoc[] = [];
    private origin: ICellLoc;
    constructor(protected event: ShipAttackActionIMEvent) {
        super();
    }

    public handleEvent() {
        const { shipId } = this.event;
        const playerId = gameManager.getPlayer().id;

        const gameEngine = new GameEngine(gameManager.state.gameState);
        const { validCells, origin } = gameEngine.prime.shipAttack({ playerId, shipId });

        this.updateGameBoard(validCells);
        this.validCells = validCells;
        this.origin = origin;

        return {
            nextClickhandler: (e: MouseEvent) => this.handler(e),
        };
    }

    protected handler(e: MouseEvent) {
        const { onGlobalDeselect } = this.event;
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
            // this.handleShipAttackClick(id, shipId, onSuccessfulSelect);
        }
    }
}
