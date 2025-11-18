import {
    ActionTypes,
    BOARD_COLUMNS,
    BOARD_ROWS,
    GameState,
    ICellLoc,
    IDeployAction,
    IDeployResult,
    IGetValidDeployCellsAction,
    IResult,
    LocationHelper,
    Player,
    ResultType
} from "../../shared";

// TODO: migrate to a more signal based approach
// GameEngine receives commands/signals from UI and updates the GameManager state
// updateComponents() then allows rendering of UI based on the updated state
// GameEngine should not have access to frontend methods
export class GameEngine {
    constructor(public gameState: GameState) {}

    get prime() {
        return {
            deployShip: (action: IGetValidDeployCellsAction) => this.primeDeployShip(action),
        };
    }

    get commit() {
        return {
            deployShip: (action: IDeployAction) => this.commitDeployShip(action),
        };
    }

    private primeDeployShip(action: IGetValidDeployCellsAction): ICellLoc[] {
        const { playerId } = action;

        const availableCells: ICellLoc[] = [];

        if (this.isFirstPlayer(playerId)) {
            for (let i = 0; i < BOARD_COLUMNS; i++) {
                availableCells.push([i, 0]);
            }
        } else {
            for (let i = 0; i < BOARD_COLUMNS; i++) {
                availableCells.push([i, BOARD_ROWS - 1]);
            }
        }

        return availableCells; // TODO: return as Results
    }

    // commit should be after validation, we modify the local state
    // and prepare player action to be sent to server
    private commitDeployShip(action: IDeployAction): IDeployResult {
        const { shipId, playerId, hullLocations } = action;

        const player = this.getPlayer(playerId);

        const deployedShip = player.ships.find((ship) => ship.id === shipId);

        const commandPointCost = deployedShip?.commandPointCost ? deployedShip.commandPointCost : 0;

        const deployAction: IDeployAction = {
            type: ActionTypes.DEPLOY,
            shipId,
            hullLocations,
            playerId,
            commandPointCost,
        };

        deployedShip.deployed = true;
        deployedShip.hullLocations = hullLocations;

        player.pendingActions = [...player.pendingActions, deployAction];
        player.commandPoints -= commandPointCost;

        return {
            type: ResultType.SUCCESS,
            playerId,
            player,
        };
    }
    // ================= Helpers =================

    private getFirstPlayer() {
        return this.gameState.players[0];
    }

    private getPlayer(playerId: string): Player {
        return this.gameState.players.find((p) => p.id === playerId);
    }

    private isFirstPlayer(playerId: string) {
        return this.gameState.players[0].id === playerId;
    }
}
