import {
    ActionTypes,
    BOARD_COLUMNS,
    BOARD_ROWS,
    GameState,
    ICellLoc,
    IDeployAction,
    IDeployResult,
    IErrorResult,
    IGetValidDeployCellsAction,
    IGetValidDeployCellsResult,
    IResult,
    LocationHelper,
    Player,
    ResultType,
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
            deployShip: (action: IDeployAction): IDeployResult | IErrorResult<any> => {
                const results = this.validateDeployShip(action);
                if (results.type === ResultType.SUCCESS) {
                    return this.commitDeployShip(action);
                }
                return { ...results, type: ResultType.ERROR }; // TODO: better handle typing
            },
        };
    }

    private primeDeployShip(action: IGetValidDeployCellsAction): IGetValidDeployCellsResult {
        const { playerId } = action;

        const availableCells: ICellLoc[] = [];

        const isFirstPlayer = this.isFirstPlayer(playerId);

        for (let i = 0; i < BOARD_COLUMNS; i++) {
            availableCells.push([i, isFirstPlayer ? 0 : BOARD_ROWS - 1]);
        }

        const validCells = new LocationHelper(this.gameState.players).getAvailableCells(availableCells);

        return {
            type: ResultType.SUCCESS,
            playerId,
            validCells,
        };
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

    public validateDeployShip(deployAction: IDeployAction): IResult {
        const { playerId, hullLocations: newHullLocations } = deployAction;
        const newState = { ...this.gameState };

        const locationHelper = new LocationHelper(newState.players);

        if (!locationHelper.hasSpaceForShip(newHullLocations.map((h) => h.location))) {
            return {
                type: ResultType.ERROR,
                playerId,
            };
        }

        return {
            type: ResultType.SUCCESS,
            playerId,
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
