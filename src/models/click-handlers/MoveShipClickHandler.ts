import { gameManager } from "../..";
import {
    ActionTypes,
    GameStateManager,
    ICellLoc,
    IHull,
    IShip,
    keyToLocation,
    locationToKey,
    ResultType,
} from "../../../shared";
import { MoveShipActionCreator } from "../../../shared/models/ActionCreator";
import { GameEngine } from "../../../shared/models/GameEngine";
import { transformGameStateToPlain } from "../../../shared/transformers";
import { getComponents } from "../../components/component-helper";
import { animationManager } from "../AnimationManager";
import { MoveShipAnimation } from "../animations/MoveShipAnimation";
import { ClickHandler } from "./ClickHandler";
import { MovingShipIMEvent } from "../interaction-manager/types";

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
        const gameEngine = new GameEngine(gameManager.state.gameState);
        const movementCost = 1; // Default movement cost
        const gsm = new GameStateManager(gameManager.state.gameState);

        const playerId = gameManager.getCurrentPlayerId();
        const player = gsm.getPlayer(playerId);
        const ship = player.getShip(shipId);

        const oldLocations = ship.hulls;
        const newLocations = this.getNewHullLocations(keyToLocation(destinationTileId), ship);

        // FIXME: we need to handle concurrent animations for multi-hull ships
        const moveAction = new MoveShipActionCreator(player, gsm.getCurrentRound()).create({
            shipId,
            hullLocations: newLocations,
            commandPointCost: movementCost,
        });

        const result = gameEngine.commit.moveShip(moveAction);

        if (result.type === ResultType.ERROR) return;

        gsm.updateHulls(result.hulls).updateShip(result.ship).updatePlayer(result.player).addAction(moveAction);

        this.executeMoveShipAnimation(result.ship, oldLocations);

        gameManager.savePlainAppState({ gameState: transformGameStateToPlain(gsm.gameState) });

        const tile = this.selectables[destinationTileId];
        tile.runOnSelects();

        onSuccessCb?.();
    }

    // WARNING: we don't mutate the original as much as possible
    private getNewHullLocations(endCell: ICellLoc, ship: IShip) {
        let newHullLocations = [...ship.hulls];
        newHullLocations = ship.hulls;
        // FIXME: only single location for now
        const hullFront = { ...newHullLocations[0] };
        hullFront.location = endCell;

        return [hullFront];
    }

    private executeMoveShipAnimation(ship: IShip, oldLocations: IHull[]) {
        const shipId = ship.id;
        const playerId = ship.playerId;
        const gsm = new GameStateManager(gameManager.state.gameState);

        const moveShipAnimation = new MoveShipAnimation({
            elementId: shipId,
            fromCell: oldLocations[0].location,
            toCell: ship.hulls[0].location,
        });
        const gameBoard = getComponents().div.gameBoard;
        gameBoard.addToAnimatingMap(shipId, moveShipAnimation.id);

        animationManager.enqueue(moveShipAnimation, () => {
            gameBoard.removeFromAnimatingMap(shipId);
            gameBoard.renderShip(ship, ship.hulls, playerId === gsm.gameState.getFirstPlayerId());
        });
        animationManager.play();
    }
}
