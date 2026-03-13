import { ERROR_CODE } from "../../constants";
import { GameEngine, GameStateManager } from "../../models";
import {
    ActionTypes,
    IDeployAction,
    IMoveAction,
    IPlayerAction,
    IShipAttackAction,
    IResult,
    IGameState,
    ResultType,
} from "../../types";

export class ActionResolver {
    public currentTurn: IPlayerAction[] = [];
    public results: IResult[] = [];
    public player1Actions: IPlayerAction[];
    public player2Actions: IPlayerAction[];

    constructor(
        public playerId: string, // for the perspective the ActionResolver is resolving for
        public gameState: IGameState,
    ) {
        this.player1Actions = [...(gameState.players[0]?.pendingActions ?? [])];
        this.player2Actions = [...(gameState.players[1]?.pendingActions ?? [])];
    }

    public resolve() {
        do {
            this.resolveTurn();
            this.resolveWinner();
            if (this.gameState.winners.length > 0) break;
        } while (this.player1Actions.length > 0 || this.player2Actions.length > 0);

        this.resolveRotationOfInitiative();
        this.resolvePostSubmissionCommandPointRemoval();
        const { obscuredGameState } = this.resolveVisibility();

        return { gameState: this.gameState, obscuredGameState, results: this.results };
    }

    public resolveTurn() {
        const [firstActionInTurn, secondActionInTurn] = this.resolveIntiative(
            this.player1Actions.shift(),
            this.player2Actions.shift(),
            this.gameState.initiative,
        );

        if (firstActionInTurn) {
            this.currentTurn.push(firstActionInTurn);
        }
        if (secondActionInTurn) {
            this.currentTurn.push(secondActionInTurn);
        }

        this.currentTurn.forEach((action) => {
            const newState = this.resolveAction(action);
            this.gameState = newState;
        });

        this.currentTurn = [];
    }

    private resolveIntiative(
        player1Action?: IPlayerAction,
        player2Action?: IPlayerAction,
        initiativePlayerId?: string,
    ) {
        if (player1Action?.playerId === initiativePlayerId || !initiativePlayerId) {
            return [player1Action, player2Action];
        }
        return [player2Action, player1Action];
    }

    private resolveRotationOfInitiative() {
        const gsm = new GameStateManager(this.gameState);
        const players = gsm.gameState.getPlayers();
        const currPlayerIndex = players.findIndex((p) => p.id === gsm.gameState.initiative);
        const nextPlayerIndex = (currPlayerIndex + 1) % players.length;
        const nextPlayerId = players[nextPlayerIndex].id;
        gsm.gameState.update({ initiative: nextPlayerId });
        this.gameState = gsm.gameState;
    }

    private resolveWinner() {
        const gameEngine = new GameEngine(this.gameState);
        const gsm = new GameStateManager(this.gameState);

        const result = gameEngine.calculateWinner();

        gsm.gameState.update({ winners: result.winners ?? [], isOver: result.isOver });
        this.gameState = gsm.gameState;
    }

    public resolveAction(action: IPlayerAction) {
        switch (action.type) {
            case ActionTypes.DEPLOY:
                return this.resolveDeploy(action as IDeployAction) ?? this.gameState;
            case ActionTypes.MOVE:
                return this.resolveMove(action as IMoveAction) ?? this.gameState;
            case ActionTypes.ATTACK:
                return this.resolveAttack(action as IShipAttackAction) ?? this.gameState;
            default:
                return this.gameState;
        }
    }

    public resolveDeploy(action: IDeployAction) {
        const gsm = new GameStateManager(this.gameState);
        const gameEngine = new GameEngine(this.gameState);
        const result = gameEngine.commit.deployShip(action);

        if (result.type === ResultType.ERROR) {
            throw new Error("Cannot deploy ship here, space is occupied");
        }

        const { player, ship, hulls } = result;
        const newState = gsm.addHulls(hulls).updateShip(ship).updatePlayer(player).addAction(action).gameState;
        return newState;
    }

    public resolveMove(action: IMoveAction) {
        // for now, if the player with initiative occupies the location,
        // the other player's Move is not resolved (they are not refunded the CP)
        console.log(">>>>resolveMove", this.gameState);
        const gsm = new GameStateManager(this.gameState);
        console.log(">>>>GameStateManager");
        const gameEngine = new GameEngine(this.gameState);

        const result = gameEngine.commit.moveShip(action);
        if (result.type === ResultType.ERROR) {
            const isNonSystemError =
                // Ship's movement may have been reduced by earlier opponent's effect
                result.errorCode === ERROR_CODE.MOVE_ERROR_INSUFFICIENT_MOVEMENT ||
                // Destination may have become occupied by earlier opponent's turn
                result.errorCode === ERROR_CODE.MOVE_ERROR_LOCATION_OCCUPIED;

            if (isNonSystemError) {
                return gsm.gameState;
            }

            throw new Error(result.message || "An error occurred while moving the ship");
        }

        const { player, ship, hulls } = result;
        const newState = gsm.updateHulls(hulls).updateShip(ship).updatePlayer(player).addAction(action).gameState;

        return newState;
    }

    public resolveAttack(action: IShipAttackAction) {
        const gsm = new GameStateManager(this.gameState);
        const gameEngine = new GameEngine(this.gameState);

        // TODO: change to commit with validation
        const { players, ships, hulls } = gameEngine.calculateAttackResult(action);
        const newState = gsm.updateHulls(hulls).updateShips(ships).updatePlayers(players).addAction(action).gameState;

        return newState;
    }

    public resolveVisibility() {
        const gameEngine = new GameEngine(this.gameState);
        return gameEngine.calculateVisibility(this.playerId);
    }

    public resolvePostSubmissionCommandPointRemoval() {
        const gsm = new GameStateManager(this.gameState);
        gsm.updatePlayer({ id: this.playerId, commandPoints: 0 });
        this.gameState = gsm.gameState;
    }
}
