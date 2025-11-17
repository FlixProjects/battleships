import { gameManager } from "..";
import { ActionTypes, BOARD_COLUMNS, BOARD_ROWS, getHull, IAction, ICellLoc, IDeployAction } from "../../shared";

export class GameEngine {
    public moves: IAction[] = [];

    get prime() {
        return {
            deployShip: (shipId: string) => this.primeDeployShip(shipId),
        };
    }

    get commit() {
        return {
            deployShip: (shipId: string, location: ICellLoc[]) => this.commitDeployShip(shipId, location),
        };
    }

    private primeDeployShip(shipId: string): ICellLoc[] {
        const availableCells: ICellLoc[] = [];

        if (gameManager.isFirstPlayer) {
            for (let i = 0; i < BOARD_COLUMNS; i++) {
                availableCells.push([i, 0]);
            }
        } else {
            for (let i = 0; i < BOARD_COLUMNS; i++) {
                availableCells.push([i, BOARD_ROWS - 1]);
            }
        }

        return availableCells;
    }

    private commitDeployShip(shipId: string, locations: ICellLoc[]) {
        const player = gameManager.getPlayer();
        const committedHullLocations = locations.map((loc) => getHull(shipId, loc));
        const deployedShip = player.ships.find((ship) => ship.id === shipId);

        const commandPointCost = deployedShip?.commandPointCost ? deployedShip.commandPointCost : 0;

        const deployAction: IDeployAction = {
            shipId,
            hullLocations: committedHullLocations,
            type: ActionTypes.DEPLOY,
            playerId: gameManager.getPlayer().id,
            commandPointCost,
        };
       

        deployedShip.deployed = true;
        deployedShip.hullLocations = committedHullLocations;

        gameManager.updatePlayer({
            ships: player.ships,
            pendingActions: [...player.pendingActions, deployAction],
            commandPoints: player.commandPoints - commandPointCost,
        });

        // TODO: update the counter
    }
}
