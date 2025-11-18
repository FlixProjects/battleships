import { ActionTypes, GameState, IDeployAction, IPlayerAction, IResult, LocationHelper, Player } from "../..";

export class ActionResolver {
    public currentTurn: IPlayerAction[] = [];
    public results: IResult[] = [];
    constructor(
        public player1Actions: IPlayerAction[], // TODO: do we really the actions if we already have the gameState?
        public player2Actions: IPlayerAction[], // Just need to save second action to pendingActions and we are done
        public gameState: GameState,
    ) {}

    public resolve() {
        if (this.player1Actions.length === 0 && this.player2Actions.length === 0) {
            return { gameState: this.gameState, results: this.results };
        }
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
            default:
                return this.gameState;
        }
    }

    public resolveDeploy(action: IDeployAction) {
        const { playerId, shipId, hullLocations: newHullLocations } = action;

        const newState = { ...this.gameState };

        const player = newState.players.find((p) => p.id === playerId);
        if (!player) return;

        const ship = player.ships.find((s) => s.id === shipId);
        if (!ship || ship.deployed) return;

        const locationHelper = new LocationHelper(newState.players);
        if (!locationHelper.hasSpaceForShip(newHullLocations.map((h) => h.location))) {
            throw new Error("Cannot deploy ship here, space is occupied");
        }

        ship.hullLocations = newHullLocations;
        ship.deployed = true;

        return newState;
    }
}
