import { GameStateManager } from "@shared/models/GameStateManager";
import { FEGameState } from "./fe-entities/FEGameState";
import { TGameStateInput } from "@shared/types/types";

export class FEGameStateManager extends GameStateManager {
    protected transformToDomain(_gameState: TGameStateInput) {
        return new FEGameState(_gameState);
    }
}
