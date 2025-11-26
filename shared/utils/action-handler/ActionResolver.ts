import {
    ActionTypes,
    GameEngine,
    IGameState,
    IDeployAction,
    IMoveAction,
    IPlayerAction,
    IResult,
    IShipAttackAction,
    ResultType,
} from "../..";

export class ActionResolver {
    public currentTurn: IPlayerAction[] = [];
    public results: IResult[] = [];
    constructor(
        public player1Actions: IPlayerAction[], // TODO: do we really the actions if we already have the gameState?
        public player2Actions: IPlayerAction[], // Just need to save second action to pendingActions and we are done
        public gameState: IGameState,
    ) {}

    public resolve() {
        do {
            this.resolveTurn();
        } while (this.player1Actions.length > 0 || this.player2Actions.length > 0);

        return { gameState: this.gameState, results: this.results };
    }

    public resolveTurn() {
        const [firstPlayerAction, secondPlayerAction] = this.resolveIntiative(
            this.player1Actions.shift(),
            this.player2Actions.shift(),
            this.gameState.initiative,
        );

        if (firstPlayerAction) {
            this.currentTurn.push(firstPlayerAction);
        }
        if (secondPlayerAction) {
            this.currentTurn.push(secondPlayerAction);
        }

        this.currentTurn.forEach((action) => {
            const newState = this.resolveAction(action);
            this.gameState = newState;
        });

        this.currentTurn = [];
    }

    private resolveIntiative(action1?: IPlayerAction, action2?: IPlayerAction, initiativePlayerId?: string) {
        if (action1?.playerId === initiativePlayerId || !initiativePlayerId) {
            return [action1, action2];
        }
        return [action2, action1];
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
        const newState = { ...this.gameState };

        const gameEngine = new GameEngine(this.gameState);
        const result = gameEngine.commit.deployShip(action);

        if (result.type === ResultType.ERROR) {
            throw new Error("Cannot deploy ship here, space is occupied");
        }

        const { player, playerId } = result;

        newState.players = newState.players.map((p) => {
            if (p.id === playerId) {
                return player;
            }
            return p;
        });

        return newState;
    }

    public resolveMove(action: IMoveAction) {
        // for now, if the player with initiative occupies the location,
        // the other player's Move is not resolved (they are not refunded the CP)
        const newState = { ...this.gameState };

        const gameEngine = new GameEngine(this.gameState);

        const result = gameEngine.commit.moveShip(action);

        if (result.type === ResultType.SUCCESS) {
            const { player, playerId } = result;

            newState.players = newState.players.map((p) => {
                if (p.id === playerId) {
                    return player;
                }
                return p;
            });
        }

        return newState;
    }

    public resolveAttack(action: IShipAttackAction) {
        const newState = { ...this.gameState };
        const gameEngine = new GameEngine(newState);

        // TODO: change to commit with validation
        const { players } = gameEngine.calculateAttackResult(action);

        newState.players = players;
        return newState;
    }
}
