import clone from "lodash.clonedeep";
import { GameState, IGameState, IPlayer } from "..";

export class GameStateManager {
    private _gameState: GameState;
    constructor(_gameState: IGameState) {
        // each time we instantiate we deep clone the gameState
        const plain = clone(_gameState);
        this._gameState = this.transformToDomain(plain);
    }

    private transformToDomain(_gameState: IGameState) {
        if (_gameState instanceof GameState) {
            this._gameState = _gameState;
            return _gameState;
        }
        return new GameState(_gameState);
    }

    get gameState() {
        return new GameState({ ...this._gameState });
    }

    setGameState(_gameState: IGameState) {
        this._gameState = this.transformToDomain(_gameState);
    }

    getPlayer(playerId: string) {
        return this.gameState.getPlayer(playerId);
    }

    getPlayers() {
        return this.gameState.getPlayers();
    }

    updatePlayer(player: Partial<IPlayer>) {
        this._gameState = this.gameState.updatePlayer(player);
        return this;
    }
}
