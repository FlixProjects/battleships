import {
    EffectAnchor,
    ICard,
    ICellLoc,
    IEffectConfig,
    IGameState,
    IGameStateManager,
    IGetValidSupportCellsQueryCtx,
    IMEvent,
    IMEventType,
    IPlainCard,
    IPlayCardSignalHandleCtx,
    ISupportCardPayload,
    PlaySupportConfirmIMEvent,
    PlaySupportTargetIMEvent,
} from "../types";
import { keyToLocation, locationToKey } from "../utils/helpers";
import { PathFinder } from "../utils/path-finder";
import { Card, ICardSelectionHandlers } from "./Card";
import { DeckAddToPlayedSignal } from "./signals/DeckAddToPlayedSignal";
import { GameActivateEffectSignal } from "./signals/GameActivateEffectSignal";
import { PlayerRemoveCardFromHandSignal } from "./signals/PlayerRemoveCardFromHandSignal";
import { PlayerSpendCommandPointsSignal } from "./signals/PlayerSpendCommandPointsSignal";

export class SupportCard extends Card {
    public readonly description: string;
    public readonly commandPointCost: number;
    public readonly effects: IEffectConfig[];
    public readonly imgSrc: string;

    constructor(props: Readonly<ICard>) {
        super(props);
        // Resolved data is persisted on the card at creation (buildPlayerStartingState).
        // Never re-derive from SUPPORTS_CONFIG / EFFECTS_CONFIG here. `name` lives
        // on the Card base.
        this.description = props.description ?? "";
        this.commandPointCost = props.commandPointCost ?? 0;
        this.effects = props.effects ?? [];
        this.imgSrc = props.imgSrc ?? "";
    }

    public play(ctx: IPlayCardSignalHandleCtx): IGameState {
        const { gsm, signal, emitter } = ctx;
        const { playerId, cardPayload } = signal.payload;

        if (cardPayload.kind !== "Support") {
            throw new Error(
                `SupportCard ${this.id} received non-Support payload (kind=${cardPayload.kind}); cannot play`,
            );
        }
        const { targetCell } = cardPayload as ISupportCardPayload;

        // Activate this card's pre-created Effects (they already live in GameState,
        // minted inactive at game creation) — mirrors how a ShipCard deploys its Ship.
        // GameState owns the toggle (symmetric with expiry-deactivation).
        const activateSignals = gsm.gameState.effects
            .filter((e) => e.sourceCardId === this.id)
            .map(
                (effect) =>
                    new GameActivateEffectSignal({
                        senderId: this.id,
                        originId: signal.id,
                        payload: { effectId: effect.id, targetCell },
                    }),
            );

        emitter([
            ...activateSignals,
            new PlayerSpendCommandPointsSignal({
                targetId: playerId,
                senderId: this.id,
                originId: signal.id,
                payload: { playerId, amount: this.commandPointCost },
            }),
            // Card lifecycle — same as ShipCard: Player owns the hand, Deck owns the played pile.
            new PlayerRemoveCardFromHandSignal({
                targetId: playerId,
                senderId: this.id,
                originId: signal.id,
                payload: { playerId, cardId: this.id },
            }),
            new DeckAddToPlayedSignal({
                targetId: this.deckId,
                senderId: this.id,
                originId: signal.id,
                payload: { deckId: this.deckId, cardId: this.id },
            }),
        ]);

        return gsm.gameState;
    }

    // ===============================================================================
    // query functions (read-only — lifted from the legacy GameEngine.prime.playSupport)
    // ===============================================================================

    public getValidTargetCells(ctx: IGetValidSupportCellsQueryCtx) {
        const { gsm, resolve } = ctx;
        const { playerId, effectIndex } = ctx.signal.payload;

        // Read the resolved Effect config persisted on the card at creation —
        // never re-derive from SUPPORTS_CONFIG / EFFECTS_CONFIG at query time.
        const effectConfig = this.effects[effectIndex];
        if (!effectConfig) {
            throw new Error(`getValidTargetCells: effectIndex ${effectIndex} out of range for ${this.refNo}`);
        }

        if (effectConfig.range === 0) {
            return resolve({ validCells: [], requiresTarget: false });
        }

        const validCells = this.computeAnchoredCells(gsm, playerId, effectConfig);
        resolve({ validCells, requiresTarget: true });
    }

    /**
     * Manhattan-distance reachable cells from the configured anchor. For
     * `any_tile` we treat the whole board as the seed set (no anchor cell).
     */
    private computeAnchoredCells(gsm: IGameStateManager, playerId: string, effectConfig: IEffectConfig): ICellLoc[] {
        if (effectConfig.anchor === EffectAnchor.AnyTile) {
            const all: ICellLoc[] = [];
            const { rows, cols } = gsm.getBoardDimensions();
            for (let x = 0; x < cols; x++) {
                for (let y = 0; y < rows; y++) {
                    all.push([x, y]);
                }
            }
            return all;
        }

        const anchorCells = this.getAnchorCells(gsm, playerId, effectConfig.anchor);
        const reached = new Set<string>();
        anchorCells.forEach((origin) => {
            reached.add(locationToKey(origin));
            PathFinder.getCellsWithinRange({ start: origin, range: effectConfig.range }).forEach((cell) =>
                reached.add(locationToKey(cell)),
            );
        });

        return Array.from(reached).map((key) => keyToLocation(key));
    }

    private getAnchorCells(gsm: IGameStateManager, playerId: string, anchor: IEffectConfig["anchor"]): ICellLoc[] {
        if (anchor === EffectAnchor.Flagship) {
            const ownShips = gsm.getPlayerShips(playerId);
            const flagship = ownShips.find((s) => s.isFlagship && s.deployed && !s.destroyed);
            if (!flagship) return [];
            return (flagship.hulls ?? []).map((h) => h.location);
        }
        if (anchor === EffectAnchor.AnyFriendlyHull) {
            return gsm.gameState.hulls
                .filter((h) => !h.destroyed)
                .filter((h) => gsm.gameState.ships.find((s) => s.id === h.shipId)?.playerId === playerId)
                .map((h) => h.location);
        }
        if (anchor === EffectAnchor.DeploymentRow) {
            const isFirstPlayer = gsm.gameState.isFirstPlayer(playerId);
            const { rows, cols } = gsm.getBoardDimensions();
            const row = isFirstPlayer ? 0 : rows - 1;
            const cells: ICellLoc[] = [];
            for (let x = 0; x < cols; x++) cells.push([x, row]);
            return cells;
        }
        return [];
    }

    public getSelectionEvent(handlers: ICardSelectionHandlers): IMEvent {
        const firstEffect = this.effects[0];

        if (firstEffect && firstEffect.range > 0) {
            const event: PlaySupportTargetIMEvent = {
                type: IMEventType.PLAY_SUPPORT_TARGET,
                cardId: this.id,
                effectIndex: 0,
                ...handlers,
            };
            return event;
        }

        const event: PlaySupportConfirmIMEvent = {
            type: IMEventType.PLAY_SUPPORT_CONFIRM,
            cardId: this.id,
            effectIndex: 0,
            ...handlers,
        };
        return event;
    }

    /** Persist the resolved support data alongside the base card fields. */
    public toPlain(): IPlainCard {
        return {
            ...super.toPlain(),
            description: this.description,
            commandPointCost: this.commandPointCost,
            effects: this.effects,
            imgSrc: this.imgSrc,
        };
    }

    public static toDomain(plain: IPlainCard): SupportCard {
        return new SupportCard(plain);
    }
}
