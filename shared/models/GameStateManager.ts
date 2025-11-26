import { GameState } from "..";
import clone from "lodash.clonedeep";

export class GameStateManager {
    private gameState: GameState;
    constructor(_gameState: GameState) {
        // each time we instantiate we deep clone the gameState
        const plain = clone(_gameState);
        this.gameState = new GameState(plain);
    }

    transformToDomain(_gameState: GameState) {
        return new GameState(_gameState);
    }
}
