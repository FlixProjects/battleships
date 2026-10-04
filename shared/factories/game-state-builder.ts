import { IGameStateData } from "../types";
import { GameState } from "../models";
import { GameStateBuilder as GameStateSeedBuilder } from "../utils/builder/GameStateBuilder";

export class GameStateBuilder {
    private defaultProps: IGameStateData;

    constructor(defaultOverrides: Partial<IGameStateData> = {}) {
        this.defaultProps = {
            code: "TEST",
            currentRound: 1,
            initiative: "player1",
            players: [],
            ships: [],
            hulls: [],
            cards: [],
            decks: [],
            winners: [],
            isOver: false,
            board: new GameStateSeedBuilder().loadMap().build().board,
            ...defaultOverrides,
        };
    }

    build(overrides: Partial<IGameStateData> = {}): GameState {
        return new GameState({ ...this.defaultProps, ...overrides });
    }
}
