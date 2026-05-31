import { EFFECTS_CONFIG, MAX_HAND_SIZE, SUPPORTS_CONFIG } from "../../config/constants";
import { ERROR_CODE } from "../../constants";
import { GameEngine, GameStateManager } from "../../models";
import { GameEngine as GameEngineV2 } from "../../models/GameEngineV2";
import { IResolveStep, createResolvePipeline } from "./steps";
import {
    ActionTypes,
    IDeployAction,
    IMoveAction,
    IPlayCardAction,
    IPlaySupportAction,
    IPlayerAction,
    IShipAttackAction,
    IResult,
    IGameState,
    ResultType,
    TEffectRefNo,
    TSupportRefNo,
} from "../../types";

export class ActionResolver {
    public currentTurn: IPlayerAction[] = [];
    public results: IResult[] = [];
    public player1Actions: IPlayerAction[];
    public player2Actions: IPlayerAction[];
    // Support inner-actions queued by ResolvePlayCardStep, drained by
    // ResolveEffectsStep within the same resolveAction() pass
    public pendingSupportActions: IPlaySupportAction[] = [];
    private readonly resolveSteps: IResolveStep[] = createResolvePipeline();

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

    // Fixed, ordered pipeline (C1 / Decision 2): every step runs, each a no-op
    // unless the action is relevant to it. Replaces the per-type switch.
    // Action types are mutually exclusive so this is behaviour-identical.
    public resolveAction(action: IPlayerAction) {
        const engine = new GameEngineV2(this.gameState, GameStateManager);
        if (action.type === ActionTypes.ATTACK || action.type === ActionTypes.MOVE) {
            this.gameState = engine.run(action);
        }
        for (const step of this.resolveSteps) {
            step.resolve(action, this);
        }
        return this.gameState;
    }

    public resolvePlayCard(action: IPlayCardAction) {
        const gsm = new GameStateManager(this.gameState);
        const player = gsm.getPlayer(action.playerId);
        const card = gsm.getCard(action.cardId);

        if (!card) {
            throw new Error(`Cannot play card ${action.cardId}: card not found`);
        }
        if (!player.hand.includes(action.cardId)) {
            throw new Error(`Cannot play card ${action.cardId}: not in player ${action.playerId}'s hand`);
        }

        const innerAction = card.buildAction(
            {
                id: action.id,
                order: action.order,
                round: action.round,
                playerId: action.playerId,
                commandPointCost: action.commandPointCost,
            },
            action.payload,
        );

        this.applyInnerAction(innerAction);

        // Card hand → deck.played; PlayCardAction is the audit-trail entry.
        const next = new GameStateManager(this.gameState);
        next.gameState.playCard(action.playerId, action.cardId);
        this.trackAction(next, action);
        this.gameState = next.gameState;
        return next.gameState;
    }

    private applyInnerAction(action: IPlayerAction) {
        switch (action.type) {
            case ActionTypes.DEPLOY:
                this.applyDeploy(action as IDeployAction);
                return;
            case ActionTypes.SUPPORT:
                this.pendingSupportActions.push(action as IPlaySupportAction);
                return;
            default:
                throw new Error(`Unsupported inner action type: ${action.type}`);
        }
    }

    public resolvePendingSupportEffects() {
        for (const action of this.pendingSupportActions) {
            this.applySupportAction(action);
        }
        this.pendingSupportActions = [];
    }

    private applySupportAction(action: IPlaySupportAction) {
        const { playerId, supportRefNo, cardId, targetCell, commandPointCost } = action;

        const supportConfig = SUPPORTS_CONFIG[supportRefNo as TSupportRefNo];
        if (!supportConfig) {
            throw new Error(`applySupportAction: unknown SupportCard refNo '${supportRefNo}'`);
        }

        const gsm = new GameStateManager(this.gameState);
        const gameEngine = new GameEngine(this.gameState);
        const player = gsm.getPlayer(playerId);
        const currentRound = gsm.gameState.currentRound;

        supportConfig.effects.forEach((effectRefNo) => {
            const effectConfig = EFFECTS_CONFIG[effectRefNo as TEffectRefNo];
            if (!effectConfig) {
                throw new Error(`applySupportAction: no EffectConfig for refNo '${effectRefNo}'`);
            }
            const effect = gameEngine.buildEffect({ effectConfig, playerId, cardId, targetCell, currentRound });

            // Resolve once on the action turn — a no-op for passive vision effects;
            // matters for one-shot effects (e.g. damage / instant CP grants).
            effect.resolve(gsm);

            if (effectConfig.duration > 0) {
                gsm.addEffect(effect);
            }
        });

        player.commandPoints -= commandPointCost;
        gsm.updatePlayer(player);
        this.gameState = gsm.gameState;
    }

    public resolveDeploy(action: IDeployAction) {
        this.applyDeploy(action);
        const gsm = new GameStateManager(this.gameState);
        this.trackAction(gsm, action);
        this.gameState = gsm.gameState;
        return gsm.gameState;
    }

    private applyDeploy(action: IDeployAction) {
        const gsm = new GameStateManager(this.gameState);
        const gameEngine = new GameEngine(this.gameState);
        const result = gameEngine.commit.deployShip(action);

        if (result.type === ResultType.ERROR) {
            throw new Error("Cannot deploy ship here, space is occupied");
        }

        const { player, ship, hulls } = result;
        this.gameState = gsm.addHulls(hulls).updateShip(ship).updatePlayer(player).gameState;
    }

    private trackAction(gsm: GameStateManager, action: IPlayerAction) {
        gsm.addAction(action);
        const player = gsm.gameState.getPlayer(action.playerId);
        const alreadyTracked = player.pendingActions.some((a) => a.id === action.id);
        if (!alreadyTracked) {
            player.pendingActions = [...player.pendingActions, action];
            gsm.updatePlayer(player);
        }
    }

    public resolveMove(action: IMoveAction) {
        // for now, if the player with initiative occupies the location,
        // the other player's Move is not resolved (they are not refunded the CP)
        const gsm = new GameStateManager(this.gameState);
        const gameEngine = new GameEngine(this.gameState);

        const result = gameEngine.commit.moveShip(action);
        if (result.type === ResultType.ERROR) {
            const isNonSystemError =
                // Ship's movement may have been reduced by earlier opponent's effect
                result.errorCode === ERROR_CODE.MOVE_ERROR_INSUFFICIENT_MOVEMENT ||
                // Destination may have become occupied by earlier opponent's turn
                result.errorCode === ERROR_CODE.MOVE_ERROR_LOCATION_OCCUPIED;

            if (isNonSystemError) {
                return gsm.gameState;
            }

            throw new Error(result.message || "An error occurred while moving the ship");
        }

        const { player, ship, hulls } = result;
        const newState = gsm.updateHulls(hulls).updateShip(ship).updatePlayer(player).addAction(action).gameState;

        return newState;
    }

    public resolveAttack(action: IShipAttackAction) {
        const gsm = new GameStateManager(this.gameState);
        const gameEngine = new GameEngine(this.gameState);

        // TODO: change to commit with validation
        const result = gameEngine.commit.shipAttack(action);

        if (result.type === ResultType.ERROR) {
            throw new Error(result.message || "An error occurred while attacking");
        }

        const { players, ships, hulls } = result;
        const newState = gsm.updateHulls(hulls).updateShips(ships).updatePlayers(players).addAction(action).gameState;

        return newState;
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
