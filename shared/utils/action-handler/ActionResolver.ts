import { MAX_HAND_SIZE } from "../../config/constants";
import { ERROR_CODE } from "../../constants";
import { GameEngine, GameStateManager } from "../../models";
import { GameEngine as GameEngineV2 } from "../../models/GameEngineV2";
import { IResolveStep, createResolvePipeline } from "./steps";
import {
    ActionTypes,
    IDeployAction,
    IMoveAction,
    IPlayerAction,
    IShipAttackAction,
    IResult,
    IGameState,
    ResultType,
} from "../../types";

export class ActionResolver {
    public currentTurn: IPlayerAction[] = [];
    public results: IResult[] = [];
    public player1Actions: IPlayerAction[];
    public player2Actions: IPlayerAction[];
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

    // Deploy / Move / Attack / PlayCard all resolve through the signal engine.
    // For PlayCard the engine routes PlayCardSignal → card.play(ctx) (ShipCard →
    // deploy, SupportCard → effect creation) + the card lifecycle; PlayCardValidator
    // guards card-exists / card-in-hand, so an invalid play is a clean no-op.
    // The trailing step loop is the (currently empty) extension point for any
    // non-engine resolution; all action types now go through engine.run.
    public resolveAction(action: IPlayerAction) {
        const engine = new GameEngineV2(this.gameState, GameStateManager);
        if (
            action.type === ActionTypes.ATTACK ||
            action.type === ActionTypes.MOVE ||
            action.type === ActionTypes.DEPLOY ||
            action.type === ActionTypes.PLAY_CARD
        ) {
            this.gameState = engine.run(action);
        }
        for (const step of this.resolveSteps) {
            step.resolve(action, this);
        }
        return this.gameState;
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
