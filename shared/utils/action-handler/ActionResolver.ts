import { ActionTypes, GameState, IAction, ICellLoc, IDeployAction, IResult, LocationHelper } from "../..";

export class ActionResolver {
    public currentTurn: IAction[] = [];
    public results: IResult[] = [];
    constructor(public player1Actions: IAction[], public player2Actions: IAction[], public gameState: GameState) {}

    public resolve() {
        do {
            this.resolveTurn();
        } while (this.player1Actions.length > 0 || this.player2Actions.length > 0);

        return { gameState: this.gameState, results: this.results };
    }

    private resolveIntiative(action1?: IAction, action2?: IAction, initiativePlayerId?: string) {
        if (action1?.playerId === initiativePlayerId || !initiativePlayerId) {
            return [action1, action2];
        }
        return [action2, action1];
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

    public resolveAction(action: IAction) {
        this.results.push(action);
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
