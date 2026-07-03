import {
    EffectAnchor,
    ICard,
    ICellLoc,
    IEffectConfig,
    IEffectTemplate,
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
    TLineOrientation,
} from "../types";
import { keyToLocation, locationToKey } from "../utils/helpers";
import { PathFinder } from "../utils/path-finder";
import { Card, ICardSelectionHandlers } from "./Card";
import { Effect } from "./effects/Effect";
import { DeckAddToPlayedSignal } from "./signals/DeckAddToPlayedSignal";
import { GameCreateEffectSignal } from "./signals/GameCreateEffectSignal";
import { PlayerRemoveCardFromHandSignal } from "./signals/PlayerRemoveCardFromHandSignal";
import { PlayerSpendCommandPointsSignal } from "./signals/PlayerSpendCommandPointsSignal";

export interface ICreateEffectsArgs {
    playerId: string;
    currentRound: number;
    targetCell?: ICellLoc;
    /** Line supports (Airstrike) expand the target into a 3-tile line in this
     *  direction; single-tile supports ignore it. */
    orientation?: TLineOrientation;
    boardDimensions: { rows: number; cols: number };
}

export class SupportCard extends Card {
    public readonly description: string;
    public readonly commandPointCost: number;
    public readonly effectTemplates: IEffectTemplate[];
    public readonly imgSrc: string;

    constructor(props: Readonly<ICard>) {
        super(props);
        // Resolved data is persisted on the card at creation (buildPlayerStartingState).
        // Never re-derive from SUPPORTS_CONFIG. `name` lives on the Card base.
        this.description = props.description ?? "";
        this.commandPointCost = props.commandPointCost ?? 0;
        this.effectTemplates = props.effectTemplates ?? [];
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
        const { targetCell, orientation } = cardPayload as ISupportCardPayload;

        // Mint this card's live Effects and hand each to GameState to add + resolve.
        const effects = this.createEffects({
            playerId,
            targetCell,
            orientation,
            currentRound: gsm.gameState.currentRound,
            boardDimensions: gsm.getBoardDimensions(),
        });

        emitter([
            ...effects.map((effect) => this.toCreateEffectSignal(effect, signal.id)),
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

    /**
     * Build the live Effects this card produces from its templates. Concrete
     * cards (FlareCard, InspireCard) override this; the base only exists so an
     * unregistered Support fails loudly rather than silently doing nothing.
     */
    protected createEffects(_args: ICreateEffectsArgs): Effect[] {
        throw new Error(`SupportCard ${this.id} (refNo=${this.refNo}) does not implement createEffects`);
    }

    private toCreateEffectSignal(effect: Effect, originId: string): GameCreateEffectSignal {
        return new GameCreateEffectSignal({
            senderId: this.id,
            originId,
            payload: { effect: effect.toPlain() },
        });
    }

    // ===============================================================================
    // query functions (read-only — lifted from the legacy GameEngine.prime.playSupport)
    // ===============================================================================

    public getValidTargetCells(ctx: IGetValidSupportCellsQueryCtx) {
        const { gsm, resolve } = ctx;
        const { playerId, effectIndex } = ctx.signal.payload;

        // Read the resolved template persisted on the card at creation —
        // never re-derive from SUPPORTS_CONFIG / EFFECTS_CONFIG at query time.
        const template = this.effectTemplates[effectIndex];
        if (!template) {
            throw new Error(`getValidTargetCells: effectIndex ${effectIndex} out of range for ${this.refNo}`);
        }

        if (template.range === 0) {
            return resolve({ validCells: [], requiresTarget: false });
        }

        const validCells = this.computeAnchoredCells(gsm, playerId, template);
        resolve({ validCells, requiresTarget: true });
    }

    /**
     * Manhattan-distance reachable cells from the configured anchor. For
     * `any_tile` we treat the whole board as the seed set (no anchor cell).
     */
    private computeAnchoredCells(gsm: IGameStateManager, playerId: string, template: IEffectConfig): ICellLoc[] {
        if (template.anchor === EffectAnchor.AnyTile) {
            const all: ICellLoc[] = [];
            const { rows, cols } = gsm.getBoardDimensions();
            for (let x = 0; x < cols; x++) {
                for (let y = 0; y < rows; y++) {
                    all.push([x, y]);
                }
            }
            return all;
        }

        const anchorCells = this.getAnchorCells(gsm, playerId, template.anchor);
        const reached = new Set<string>();
        anchorCells.forEach((origin) => {
            reached.add(locationToKey(origin));
            PathFinder.getCellsWithinRange({ start: origin, range: template.range }).forEach((cell) =>
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
        const firstEffect = this.effectTemplates[0];

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
            effectTemplates: this.effectTemplates,
            imgSrc: this.imgSrc,
        };
    }

    public static toDomain(plain: IPlainCard): SupportCard {
        return new SupportCard(plain);
    }
}
