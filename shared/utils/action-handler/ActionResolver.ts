import { MAX_HAND_SIZE } from "../../config/constants";
import { GameEngine, GameStateManager } from "../../models";
import { GameEngine as GameEngineV2 } from "../../models/GameEngineV2";
import { IGameState, IPlayerAction, IResult } from "../../types";

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

    public resolvePersistentEffectsTick() {
        const gsm = new GameStateManager(this.gameState);
        gsm.gameState.getActiveEffects().forEach((effect) => effect.resolveTick(gsm));
        this.gameState = gsm.gameState;
    }

    public resolveExpiredEffects() {
        const gsm = new GameStateManager(this.gameState);
        const currentRound = gsm.gameState.currentRound;
        gsm.gameState.effects.filter((e) => e.hasExpired(currentRound)).forEach((e) => gsm.removeEffect(e.id));
        this.gameState = gsm.gameState;
    }

    public resolveHandRefill() {
        if (this.gameState.isOver) return;
        const gsm = new GameStateManager(this.gameState);
        gsm.gameState.players.forEach((player) => {
            gsm.gameState.refillPlayerHand(player.id, MAX_HAND_SIZE);
        });
        this.gameState = gsm.gameState;
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
        const engine = new GameEngineV2(this.gameState, GameStateManager);
        this.gameState = engine.run(action);
        return this.gameState;
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
