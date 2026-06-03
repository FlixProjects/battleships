import { MAX_HAND_SIZE } from "../../config/constants";
import { GameEngine, GameStateManager } from "../../models";
import { GameEngine as GameEngineV2 } from "../../models/GameEngineV2";
import { GamePersistentEffectsTickSignal } from "../../models/signals/GamePersistentEffectsTickSignal";
import { GameRefillHandsSignal } from "../../models/signals/GameRefillHandsSignal";
import { GameRemoveExpiredEffectsSignal } from "../../models/signals/GameRemoveExpiredEffectsSignal";
import { GameRemoveSubmissionCommandPointsSignal } from "../../models/signals/GameRemoveSubmissionCommandPointsSignal";
import { GameRotateInitiativeSignal } from "../../models/signals/GameRotateInitiativeSignal";
import { GameWinnerDeterminedSignal } from "../../models/signals/GameWinnerDeterminedSignal";
import { ISignal } from "../../models/signals/types";
import { IGameState, IPlayerAction, IResult } from "../../types";

export class ActionResolver {
    public currentTurn: IPlayerAction[] = [];
    public results: IResult[] = [];
    public player1Actions: IPlayerAction[];
    public player2Actions: IPlayerAction[];
    private engine: GameEngineV2;

    public gameState: IGameState;

    constructor(
        public playerId: string, // for the perspective the ActionResolver is resolving for
        gameState: IGameState,
    ) {
        this.player1Actions = [...(gameState.players[0]?.pendingActions ?? [])];
        this.player2Actions = [...(gameState.players[1]?.pendingActions ?? [])];
        // `handleActions` hands us a shallow `{ ...gameState }` copy, which strips
        // the GameState prototype. Rehydrate to a domain instance so the engine
        // and its validators can call GameState methods (e.g. `getPlayer`).
        this.gameState = new GameStateManager(gameState).gameState;
        this.engine = new GameEngineV2(this.gameState, GameStateManager);
    }

    public resolve() {
        this.resolvePersistentEffectsTick();

        do {
            this.resolveTurn();
            this.resolveWinner();
            if (this.gameState.winners.length > 0) break;
        } while (this.player1Actions.length > 0 || this.player2Actions.length > 0);

        this.resolveRotationOfInitiative();
        this.resolvePostSubmissionCommandPointRemoval();
        this.resolveExpiredEffects();
        this.resolveHandRefill();
        const { obscuredGameState } = this.resolveVisibility();

        return { gameState: this.gameState, obscuredGameState, results: this.results };
    }

    private runSignal(signal: ISignal) {
        this.gameState = this.engine.setGameState(this.gameState).runWithSignal(signal);
        return this.gameState;
    }

    private resolvePersistentEffectsTick() {
        this.runSignal(new GamePersistentEffectsTickSignal());
    }

    public resolveExpiredEffects() {
        this.runSignal(new GameRemoveExpiredEffectsSignal());
    }

    public resolveHandRefill() {
        this.runSignal(new GameRefillHandsSignal({ payload: { maxHandSize: MAX_HAND_SIZE } }));
    }

    private resolveTurn() {
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
        this.runSignal(new GameRotateInitiativeSignal());
    }

    private resolveWinner() {
        this.runSignal(new GameWinnerDeterminedSignal());
    }

    public resolveAction(action: IPlayerAction) {
        this.gameState = this.engine.setGameState(this.gameState).run(action);
        return this.gameState;
    }

    public resolveVisibility() {
        const gameEngine = new GameEngine(this.gameState);
        return gameEngine.calculateVisibility(this.playerId);
    }

    private resolvePostSubmissionCommandPointRemoval() {
        this.runSignal(new GameRemoveSubmissionCommandPointsSignal({ payload: { playerId: this.playerId } }));
    }
}
