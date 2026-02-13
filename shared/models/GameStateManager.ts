import clone from "lodash.clonedeep";
import { GameState, IGameState, IHull, IPlainAction, IPlayer, IShip } from "..";

export class GameStateManager {
    private _gameState: GameState;
    constructor(_gameState: IGameState) {
        // each time we instantiate we deep clone the gameState
        const plain = clone(_gameState);
        this._gameState = this.transformToDomain(plain);
    }

    private transformToDomain(_gameState: IGameState) {
        if (_gameState instanceof GameState) {
            return _gameState;
        }
        return new GameState(_gameState);
    }

    get gameState() {
        return this._gameState;
    }

    setGameState(_gameState: IGameState) {
        this._gameState = this.transformToDomain(_gameState);
    }

    getCurrentRound() {
        return this.gameState.currentRound;
    }

    getPlayer(playerId: string) {
        return this.gameState.getPlayer(playerId);
    }

    getPlayers() {
        return this.gameState.getPlayers();
    }

    getPlayerShips(playerId: string) {
        return this.gameState.ships.filter((s) => s.playerId === playerId);
    }

    getShip(shipId: string) {
        return this.gameState.getShip(shipId);
    }

    updatePlayer(player: Partial<IPlayer>) {
        this._gameState = this.gameState.updatePlayer(player);
        return this;
    }

    updateShip(ship: Partial<IShip>) {
        this._gameState = this.gameState.updateShip(ship);
        return this;
    }

    updateHull(hull: Partial<IHull>) {
        this._gameState = this.gameState.updateHull(hull);
        return this;
    }

    updateHulls(hulls: Partial<IHull>[]) {
        hulls.forEach((hull) => this.updateHull(hull));
        return this;
    }

    updateAction(action: Partial<IPlainAction>) {
        this._gameState = this.gameState.updateAction(action);
        return this;
    }

    addAction(action: IPlainAction) {
        this._gameState = this.gameState.addAction(action);
        return this;
    }

    updateActions(actions: Partial<IPlainAction>[]) {
        actions.forEach((action) => this.updateAction(action));
        return this;
    }
}
