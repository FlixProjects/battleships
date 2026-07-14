// Type-only: turn-event-types imports types from this module, so a runtime
// import here would create a require cycle.
import type { ITurnEvent } from "./turn-event-types";
import {
    IDeckAddToPlayedSignalPayload,
    IEffectAttackLocationSignalPayload,
    IReceiveEffectAttackLocationSignalPayload,
    IGameCreateEffectSignalPayload,
    IGameCreateHullSignalPayload,
    IGameProjectVisibilitySignalPayload,
    IGameRefillHandsSignalPayload,
    IGameRemoveSubmissionCommandPointsSignalPayload,
    IGetValidAttackCellsQueryPayload,
    IGetValidAttackCellsQueryResult,
    IGetValidDeployCellsQueryPayload,
    IGetValidDeployCellsQueryResult,
    IGetValidMoveCellsQueryPayload,
    IGetValidMoveCellsQueryResult,
    IGetValidMoveRoutesQueryPayload,
    IGetValidMoveRoutesQueryResult,
    IGetValidSupportCellsQueryPayload,
    IGetValidSupportCellsQueryResult,
    IHullDestroyedSignalPayload,
    IHullMoveSignalPayload,
    IHullReceiveAttackSignalPayload,
    IHullReceiveDamageSignalPayload,
    IPlayCardSignalPayload,
    IPlayerGainCommandPointsSignalPayload,
    IPlayerRemoveCardFromHandSignalPayload,
    IPlayerSpendCommandPointsSignalPayload,
    IShipAttackSignalPayload,
    IShipDeploySignalPayload,
    IShipMoveSignalPayload,
    IShipReceiveAttackSignalPayload,
    ISignal,
} from "@shared/models/signals/types";
import {
    AppScreen,
    AppStatus,
    CardKind,
    CELL_NODE_REF_NO,
    EFFECT_REF_NO,
    Faction,
    MAP_REF_NO,
    SHIP_REF_NO,
    SUPPORT_REF_NO,
} from "../config/constants";
import type { Card, Deck, GameState, Hull, Player, Ship } from "../models";
import type { Movement } from "../models/Movement";
import { ICommand } from "../models/commands/types";
import { IPlayerAction } from "./action-types";

export type TGameStateInput = IGameState | IGameStateData | IPlainGameState;
export interface IGame {
    queueCommand(command: ICommand): Promise<void>;
    runCommandTree(command: ICommand): Promise<void>;
    run(command: ICommand): Promise<ICommand[]>;
    undo(command: ICommand): Promise<void>;
}

export interface IActionResolver {
    resolveAction(action: IPlayerAction): IGameState;
}

export interface IGameManager {
    state: IAppState;
    getCurrentPlayerId: () => string;
    saveAppState: (
        state: Partial<IPlainAppState>,
        _options?: {
            saveWithMerge?: boolean;
        },
    ) => void;
}

export type TGameStateManagerCtor = new (_gameState: TGameStateInput) => IGameStateManager;

export interface IGameStateManager {
    get gameState(): GameState;
    setGameState(_gameState: IGameState): void;
    getCurrentRound(): number;
    getPlayer(playerId: string): Player;
    getPlayers(): IPlayer[];
    getPlayerShips(playerId: string): IShip[];
    getShip(shipId: string): Ship;
    getHull(hullId: string): Hull;
    getShipHulls(shipId: string): Hull[];
    getHulls(locations?: ICellLoc[]): Hull[];
    getCard(cardId: string): Card | undefined;
    getDeck(deckId: string): Deck | undefined;
    getPlayerHand(playerId: string): ICard[];
    getPlayerIndex(playerId: string): number;
    updatePlayer(player: Partial<IPlayer>): this;
    updatePlayers(players: Partial<IPlayer>[]): this;
    updateShip(ship: Partial<IShip>): this;
    updateShips(ships: Partial<IShip>[]): this;
    updateHull(hull: Partial<IHull>): this;
    updateHulls(hulls: Partial<IHull>[]): this;
    addHull(hull: IHull): this;
    addHulls(hulls: IHull[]): this;
    updateActions(actions: Partial<IPlainAction>[]): this;
    updateAction(action: Partial<IPlainAction>): this;
    addPendingAction(action: IPlayerAction): this;
    addAction(action: IPlainAction): this;
    addEffect(effect: IEffect): this;
    addEffects(effects: IEffect[]): this;
    getEffects(filter: {
        ids?: string[];
        effectKinds?: TEffectKind[] | undefined;
        effectRefNos?: TEffectRefNo[];
    }): IEffect[];
    removeEffect(effectId: string): this;
    getActiveEffects(playerId?: string): IEffect[];
    resolveLocalActionsForPlayer(playerId: string): this;
    isFlagshipDeployed(playerId: string): boolean;
    getBoardDimensions(): IBoardDimensions;
}

export interface IGameStateData {
    code: string;
    currentRound: number;
    initiative?: string;
    players: IPlayer[];
    ships: IShip[];
    hulls?: IHull[];
    cards: ICard[];
    decks: IDeck[];
    effects?: IEffect[];
    actions?: IPlayerAction[];
    board?: IBoard;
    winners: string[];
    isOver: boolean;
    /** What happened in the most recent authoritative resolve — drives the FE
     *  rewind-and-replay playback. Overwritten wholesale each resolve. */
    lastTurnEvents?: ITurnEvent[];
    /** The round `lastTurnEvents` describes (stamped pre-round-increment). */
    lastResolvedRound?: number;
}

export interface IGameState extends IGameStateData {
    effects: IEffect[];
    toPlain(): IPlainGameState;

    update(props: Partial<IGameStateData>): this;

    getPlayer(playerId: string): Player;
    getPlayers(): Player[];
    getShip(shipId: string): Ship;
    getHull(hullId: string): Hull;
    getShipHulls(shipId: string): Hull[];

    getFirstPlayerId(): string | undefined;
    isFirstPlayer(playerId: string): boolean;

    updatePlayer(player: Partial<IPlayer>): this;
    updateShip(ship: Partial<IShip>): this;
    updateHull(hull: Partial<IHull>): this;
    updateAction(action: Partial<IPlayerAction>): this;
    addHull(hull: IHull): this;
    addAction(action: IPlayerAction): this;
    addEffect(effect: IEffect): this;
    removeEffect(effectId: string): this;
    getActiveEffects(playerId?: string): IEffect[];

    refillPlayerHand(playerId: string, maxHandSize: number): this;
    playCard(playerId: string, cardId: string): this;

    getVisibleTilesforPlayer(playerId: string): Set<string>;
    removeInvisibleFromPlayer(visibleTiles: Set<string>, playerId: string): IGameState;
    obscureOtherPlayer(playerId: string): IGameState;
    isFlagshipDeployed(playerId: string): boolean;
    linkPlayerShips(options?: { reverse?: boolean }): this;
    linkShipHulls(options?: { reverse?: boolean }): this;
    getBoardDimensions(): IBoardDimensions;
}

export interface IPlayer {
    name: string;
    id: string;
    order: number;
    ready: boolean;
    ships?: IShip[];
    pendingActions: IPlayerAction[];
    maxCommandPoints: number;
    commandPoints: number;
    faction: TFaction;
    hand: string[]; // Card IDs currently in this player's hand
    deck: string; // Deck ID
}

export interface IShip extends IShipTemplate {
    id: string;
    playerId: string; // FK reference
    destroyed: boolean;
    hulls?: IHull[];
    remainingMovement: number;
    remainingAttacks: number;
}

export interface IHull extends IHullTemplate {
    id: string;
    shipId: string; // FK reference
    location: ICellLoc;
    remainingHealth: number;
    remainingArmor: number;
    destroyed: boolean;
}

export interface IGameObjectEntity {
    id: string;
    update(entity: Partial<IGameObjectEntity>): void;
    receiveSignal(ctx: ISignalHandleCtxBase): void;
}

export type IDeckTemplateEntry = IShipDeckTemplateEntry | ISupportDeckTemplateEntry;

export interface IShipDeckTemplateEntry {
    kind: typeof CardKind.Ship;
    refNo: TShipRefNo;
    count: number;
}

export interface ISupportDeckTemplateEntry {
    kind: typeof CardKind.Support;
    refNo: TSupportRefNo;
    count: number;
}

export type DeckTemplate = IDeckTemplateEntry[];

export interface IFactionConfig {
    name: string;
    deck: DeckTemplate;
}

// ============================================================================
// Effects — persistent or one-shot side effects produced by SupportCards (and
// in the future, Ships). One Card may register >1 Effect; each Effect is keyed
// by `refNo` into the Effect ctor registry (see shared/utils/effect-helper.ts).
// ============================================================================

export const EffectKind = {
    Vision: "vision",
    CommandPoint: "command_point",
    Damage: "damage",
    MovementBuff: "movement_buff",
    AttackBuff: "attack_buff",
} as const;

export type TEffectKind = (typeof EffectKind)[keyof typeof EffectKind];

export const EffectAnchor = {
    Flagship: "flagship",
    DeploymentRow: "deployment_row",
    AnyFriendlyHull: "any_friendly_hull",
    AnyTile: "any_tile",
} as const;

export type TEffectAnchor = (typeof EffectAnchor)[keyof typeof EffectAnchor];

export interface IVisionEffectPayload {
    kind: typeof EffectKind.Vision;
    /** Set when the effect is activated (targeted). Undefined while the effect
     *  is pre-created but inactive. */
    center?: ICellLoc;
    range: number;
}

export interface ICommandPointEffectPayload {
    kind: typeof EffectKind.CommandPoint;
    amount: number;
}

export type TEffectPayload = IVisionEffectPayload | ICommandPointEffectPayload;

export interface IEffect {
    id: string;
    refNo: string;
    kind: TEffectKind;
    sourceCardId?: string;
    playerId: string;
    /** Rounds the effect persists once created. `expiresAfterRound` is derived
     *  from this (`createdOnRound + duration`). 0 = one-shot (never persisted). */
    duration?: number;
    isActive: boolean;
    createdOnRound: number;
    /** Persists through and including this round number; once the round passes
     *  it the effect is removed from state. Undefined for one-shots. */
    expiresAfterRound?: number;
    existsOnBoard: boolean;
    imgSrc?: string;
}

export interface IVisionEffect extends IEffect {
    kind: typeof EffectKind.Vision;
    location: ICellLoc;
    range: number;
}

export interface IFlareEffect extends IVisionEffect {
    refNo: typeof EFFECT_REF_NO.flare;
}

export interface IFlarePersistentEffect extends IVisionEffect {
    refNo: typeof EFFECT_REF_NO.flarePersistent;
}

/** Command-point effects (Inspire) grant `commandPointAmount` to the owner. */
export interface ICommandPointEffect extends IEffect {
    kind: typeof EffectKind.CommandPoint;
    commandPointAmount: number;
}

export interface IGainCommandPointEffect extends ICommandPointEffect {
    refNo: typeof EFFECT_REF_NO.gainCommandPoint;
}

/** Delayed board-damage effects (Airstrike): a warning marker on a tile that
 *  detonates on the next persistent-effects tick, dealing `damage` to any hull
 *  standing on `location`. */
export interface IDamageEffect extends IEffect {
    kind: typeof EffectKind.Damage;
    location: ICellLoc;
    damage: number;
}

export interface IAirstrikeEffect extends IDamageEffect {
    refNo: typeof EFFECT_REF_NO.airstrike;
}

export const isVisionEffect = (effect: IEffect): effect is IVisionEffect => effect.kind === EffectKind.Vision;

export const isDamageEffect = (effect: IEffect): effect is IDamageEffect => effect.kind === EffectKind.Damage;

export type IPlainEffect = IEffect;

export interface IEffectConfig {
    refNo: string;
    kind?: TEffectKind;
    anchor?: TEffectAnchor;
    /** 0 = no targeting needed (untargeted / confirm-only). */
    range?: number;
    /** 0 = one-shot; otherwise rounds the effect persists for after creation
     *  (expiresAfterRound = createdOnRound + duration). */
    duration?: number;
    existsOnBoard: boolean;
    imgSrc?: string;
}

/** Vision effects (Flare) reveal `range` tiles around their target — no extra
 *  fields, only a narrowed `kind` so the template union stays discriminable. */
export interface IVisionEffectConfig extends IEffectConfig {
    kind: typeof EffectKind.Vision;
}

/** Command-point effects (Inspire) grant `commandPointAmount` to the owner. */
export interface ICommandPointEffectConfig extends IEffectConfig {
    kind: typeof EffectKind.CommandPoint;
    commandPointAmount: number;
}

export interface IAttackBuffEffectconfig extends IEffectConfig {
    kind: typeof EffectKind.AttackBuff;
}

/** Damage effects (Airstrike) carry the per-tile `damage` they deal on
 *  detonation; `range` (> 0) makes the card require a target tile. */
export interface IDamageEffectConfig extends IEffectConfig {
    kind: typeof EffectKind.Damage;
    damage: number;
    range: number;
}

/** A resolved, per-kind effect config — an `EFFECTS_CONFIG` default merged with
 *  a Support's overrides, persisted on the SupportCard at creation and used to
 *  mint live Effects when the card is played. */
export type IEffectTemplate =
    | IVisionEffectConfig
    | ICommandPointEffectConfig
    | IAttackBuffEffectconfig
    | IDamageEffectConfig;

/** A Support's reference to one effect it produces: the effect's `refNo` plus
 *  any kind-typed field overrides layered over its `EFFECTS_CONFIG` default. */
export type IVisionEffectOverride = Partial<IVisionEffectConfig> & {
    refNo: string;
};

export type ICommandPointEffectOverride = Partial<ICommandPointEffectConfig> & {
    refNo: string;
};

export type IDamageEffectOverride = Partial<IDamageEffectConfig> & {
    refNo: string;
};

export type IEffectOverride = IVisionEffectOverride | ICommandPointEffectOverride | IDamageEffectOverride;

export interface ISupportConfig {
    refNo: TSupportRefNo;
    name: string;
    description: string;
    commandPointCost: number;
    /** The effects this Support produces, in selection order, each layered over
     *  its `EFFECTS_CONFIG` default. */
    effectTemplates: IEffectOverride[];
    imgSrc?: string;
}

/** Per-Support configs narrow `effectTemplates` to the override kind that
 *  Support actually produces, so its config can't reference a mismatched kind. */
export interface IFlareSupportConfig extends ISupportConfig {
    refNo: typeof SUPPORT_REF_NO.flare;
    effectTemplates: IVisionEffectOverride[];
}

export interface IInspireSupportConfig extends ISupportConfig {
    refNo: typeof SUPPORT_REF_NO.inspire;
    effectTemplates: ICommandPointEffectOverride[];
}

export interface IAirstrikeSupportConfig extends ISupportConfig {
    refNo: typeof SUPPORT_REF_NO.airstrike;
    effectTemplates: IDamageEffectOverride[];
}

export type TSupportConfig = IFlareSupportConfig | IInspireSupportConfig | IAirstrikeSupportConfig;

export interface ICard {
    id: string;
    deckId: string; // FK → IDeck.id
    instanceId: string; // FK → underlying entity (ShipCard → IShip.id, SupportCard → primary IEffect.id)
    kind: TCardKind;
    refNo: string; // e.g. TShipRefNo — display hint without dereferencing
    name: string; // resolved at creation (ship: ship name, support: support name)
    // Further resolved-at-creation display/play data (persisted, never re-derived
    // from *_CONFIG at hydration). Populated for SupportCards.
    description?: string;
    commandPointCost?: number;
    /** SupportCard only: the resolved per-kind effect templates this card
     *  produces, in selection order. Drives FE targeting and mints live Effects
     *  when the card is played. */
    effectTemplates?: IEffectTemplate[];
    /** SupportCard only: resolved sprite path for the card's hand icon. */
    imgSrc?: string;
}

export type TAppStatus = (typeof AppStatus)[keyof typeof AppStatus];
export type TAppScreen = (typeof AppScreen)[keyof typeof AppScreen];
export type TShipRefNo = (typeof SHIP_REF_NO)[keyof typeof SHIP_REF_NO];
export type TMapRefNo = (typeof MAP_REF_NO)[keyof typeof MAP_REF_NO];
export type TCellNodeRefNo = (typeof CELL_NODE_REF_NO)[keyof typeof CELL_NODE_REF_NO];

export type TSupportRefNo = (typeof SUPPORT_REF_NO)[keyof typeof SUPPORT_REF_NO];

export type TEffectRefNo = (typeof EFFECT_REF_NO)[keyof typeof EFFECT_REF_NO];

export type TCardKind = (typeof CardKind)[keyof typeof CardKind];

export type TFaction = (typeof Faction)[keyof typeof Faction];

export type TCardRefNo = TShipRefNo | TSupportRefNo;

export interface ISupportCard extends ICard {}

export interface IDeck {
    id: string;
    playerId: string; // FK → IPlayer.id
    faction: TFaction;
    cards: ICard[]; // domain shape; randomized order, shrinks as cards are drawn
    played: ICard[]; // discard pile — cards that have been used out of the hand
}

export type IPlainCard = ICard;
export type IPlainDeck = Omit<IDeck, "cards" | "played"> & { cards: string[]; played: string[] };

export interface IAppState {
    status: TAppStatus;
    // Injected at fan-out time by updateComponents() from sessionStorage
    // (fp-app-screen) — never persisted inside the per-player app state,
    // because that store is keyed by player id, which doesn't exist pre-game.
    screen?: TAppScreen;
    loading: boolean;
    gameState: IGameState;
    currentPlayer?: string;
}

export interface IPlainAppState {
    status: TAppStatus;
    loading: boolean;
    currentPlayer?: string;
    gameState: IPlainGameState;
}

// ============================================================================
// Plain State - For transfer and storage
// ============================================================================

export interface IPlainGameState {
    code: string;
    currentRound: number;
    initiative?: string;
    players: IPlainPlayer[];
    ships: IPlainShip[];
    hulls?: IHull[];
    cards: IPlainCard[];
    decks: IPlainDeck[];
    effects: IPlainEffect[];
    actions?: IPlainAction[];
    board?: IBoard;
    winners: string[];
    isOver: boolean;
    lastTurnEvents?: ITurnEvent[];
    lastResolvedRound?: number;
}

export interface IPlainPlayer {
    id: string;
    name: string;
    order: number;
    ready: boolean;
    ships: string[];
    pendingActions: string[];
    maxCommandPoints: number;
    commandPoints: number;
    faction: TFaction;
    hand: string[];
    deck: string;
}
export type IPlainShip = Omit<IShip, "hulls"> & { hulls: string[] };
export type IPlainAction = IPlayerAction;

// ============================================================================
// HELPER TYPES - For type-safe denormalized views
// ============================================================================

export type IShipWithHulls = IShip & {
    hulls: IHull[];
};

export type IPlayerWithShips = IPlayer & {
    ships: IShipWithHulls[];
};

export type IPlayerShallow = IPlayer & {
    ships: IShip[];
};

export type IBoard = Record<string, ICellNode>;

export interface IBoardConfig {
    rows: number;
    columns: number;
    nodes: Record<string, ICellNode>;
}
export interface IBoardDimensions {
    rows: number;
    cols: number;
}

export interface ICellNode extends ICellNodeConfig {
    id: string;
    location: ICellLoc;
}

export interface ICellNodeConfig {
    refNo: TCellNodeRefNo;
    imgSrc?: string;
}

export interface IPathTraveller {
    movement: Movement;
}

export interface IPathCellNode {
    /** Terrain-intrinsic, traveller-independent. Cheap predicate used by range
     *  scans (vision/attack) that have no traveller. */
    isEnterable(): boolean;
    /** Per-tile, traveller-aware entry decision. Defaults to isEnterable(). */
    canBeEntered(traveller: IPathTraveller): boolean;
    /** Side-effect applied when a traveller lands on this tile. No-op default. */
    onEnter(traveller: IPathTraveller): void;
}

export type Grid = Array<ICell>;

export interface ICell {
    loc: ICellLoc;
    selectable: boolean;
    hidden: boolean;
    visibleTo?: string[];
}
export type ICellLoc = [number, number];

export interface IShipTemplate {
    refNo: TShipRefNo;
    name: string;
    description: string;
    dimensions: [number, number];
    deployed: boolean;
    commandPointCost: number;
    movementRange: number;
    movementCommandPointCost: number;
    attackCountMax: number;
    attackCommandPointCost: number;
    attackRange: number;
    attackDamage: number;
    attackMinRange: number;
    hullTemplates: IHullTemplate[];
    isFlagship: boolean;
    iconImgName: string;
    /** Visual scale applied to the deployed hull sprites (1 = full tile size). Defaults to 1. */
    renderScale?: number;
}

export interface IHullTemplate extends Omit<IGOWithVisibility, "id"> {
    templateLocation: ICellLoc;
    maxHealth: number;
    armor: number;
    imgSrc?: string;
    front?: boolean;
    orientation: number;
}

export interface IGameObject {
    id: string;
}

export interface IGOWithVisibility extends IGameObject {
    visionRange: number;
    location?: ICellLoc;
}

export type THullCalculatorConstructor = new (gsm: IGameStateManager, isFirstPlayer: boolean) => IHullCalculator;

export interface IHullCalculator {
    getDeployedHullLocation(selectedLoc: ICellLoc, _hullTemplateLoc: ICellLoc): ICellLoc;
    getDeployedHullLocations(selectedLoc: ICellLoc, _hullTemplateLocs: ICellLoc[]): ICellLoc[];
    getValidDeploymentLocations(selectableLocations: ICellLoc[], hullTemplateLocs: ICellLoc[]): ICellLoc[];
}

export interface INewOldHullLocMap {
    oldLoc: ICellLoc;
    newLoc: ICellLoc;
}

export interface IGameObjectSignalHandlerOptions {
    onMove?: (signal: ISignal, gsm: IGameStateManager) => void;
    onAttack?: (signal: ISignal, gsm: IGameStateManager) => void;
    onDeploy?: (signal: ISignal, gsm: IGameStateManager) => void;
}

// Common base every handler ctx shares. Listener wiring (predicates, receiveSignal)
// only needs `signal`; mutation vs. query capabilities are added by the subtypes.
export interface ISignalHandleCtxBase {
    signal: ISignal;
    gsm: IGameStateManager;
}

export interface ISignalHandleCtx extends ISignalHandleCtxBase {
    saveNewState: (newState: IGameState) => void;
    emitter: (signals: ISignal[]) => void;
}

// Read-only ctx for query signals. No saveNewState/emitter — single-hop is
// enforced by the type: a handler physically cannot mutate state or emit.
export interface IQuerySignalHandleCtx<T> extends ISignalHandleCtxBase {
    resolve: (result: T) => void;
}

export interface IGetValidDeployCellsQueryCtx extends IQuerySignalHandleCtx<IGetValidDeployCellsQueryResult> {
    signal: ISignal & { payload: IGetValidDeployCellsQueryPayload };
}

export interface IGetValidMoveCellsQueryCtx extends IQuerySignalHandleCtx<IGetValidMoveCellsQueryResult> {
    signal: ISignal & { payload: IGetValidMoveCellsQueryPayload };
}

export interface IGetValidMoveRoutesQueryCtx extends IQuerySignalHandleCtx<IGetValidMoveRoutesQueryResult> {
    signal: ISignal & { payload: IGetValidMoveRoutesQueryPayload };
}

export interface IGetValidAttackCellsQueryCtx extends IQuerySignalHandleCtx<IGetValidAttackCellsQueryResult> {
    signal: ISignal & { payload: IGetValidAttackCellsQueryPayload };
}

export interface IGetValidSupportCellsQueryCtx extends IQuerySignalHandleCtx<IGetValidSupportCellsQueryResult> {
    signal: ISignal & { payload: IGetValidSupportCellsQueryPayload };
}

export interface IBasicShipAttackSignalHandleCtx extends ISignalHandleCtx {
    signal: ISignal & { payload: IShipAttackSignalPayload };
}

export interface IReceiveShipAttackSignalHandleCtx extends ISignalHandleCtx {
    signal: ISignal & { payload: IShipReceiveAttackSignalPayload };
}

export interface IBasicShipMoveSignalHandleCtx extends ISignalHandleCtx {
    signal: ISignal & { payload: IShipMoveSignalPayload };
}

export interface IBasicShipDeploySignalHandleCtx extends ISignalHandleCtx {
    signal: ISignal & { payload: IShipDeploySignalPayload };
}

export interface IHullReceiveAttackSignalHandleCtx extends ISignalHandleCtx {
    signal: ISignal & { payload: IHullReceiveAttackSignalPayload };
}

export interface IHullReceiveDamageSignalHandleCtx extends ISignalHandleCtx {
    signal: ISignal & { payload: IHullReceiveDamageSignalPayload };
}

export interface IHullMoveSignalHandleCtx extends ISignalHandleCtx {
    signal: ISignal & { payload: IHullMoveSignalPayload };
}

export interface IHullDestroyedSignalHandleCtx extends ISignalHandleCtx {
    signal: ISignal & { payload: IHullDestroyedSignalPayload };
}

export interface IPlayerSpendCommandPointsSignalHandleCtx extends ISignalHandleCtx {
    signal: ISignal & { payload: IPlayerSpendCommandPointsSignalPayload };
}

export interface IPlayerGainCommandPointsSignalHandleCtx extends ISignalHandleCtx {
    signal: ISignal & { payload: IPlayerGainCommandPointsSignalPayload };
}

export interface IGameCreateHullSignalHandleCtx extends ISignalHandleCtx {
    signal: ISignal & { payload: IGameCreateHullSignalPayload };
}

export interface IPlayCardSignalHandleCtx extends ISignalHandleCtx {
    signal: ISignal & { payload: IPlayCardSignalPayload };
}

export interface IPlayerRemoveCardFromHandSignalHandleCtx extends ISignalHandleCtx {
    signal: ISignal & { payload: IPlayerRemoveCardFromHandSignalPayload };
}

export interface IDeckAddToPlayedSignalHandleCtx extends ISignalHandleCtx {
    signal: ISignal & { payload: IDeckAddToPlayedSignalPayload };
}

export interface IGameCreateEffectSignalHandleCtx extends ISignalHandleCtx {
    signal: ISignal & { payload: IGameCreateEffectSignalPayload };
}

export interface IGameRemoveSubmissionCommandPointsSignalHandleCtx extends ISignalHandleCtx {
    signal: ISignal & { payload: IGameRemoveSubmissionCommandPointsSignalPayload };
}

export interface IGameRefillHandsSignalHandleCtx extends ISignalHandleCtx {
    signal: ISignal & { payload: IGameRefillHandsSignalPayload };
}

export interface IGameProjectVisibilitySignalHandleCtx extends ISignalHandleCtx {
    signal: ISignal & { payload: IGameProjectVisibilitySignalPayload };
}

export interface IEffectAttackLocationSignalHandleCtx extends ISignalHandleCtx {
    signal: ISignal & { payload: IEffectAttackLocationSignalPayload };
}

export interface IReceiveEffectAttackLocationSignalHandleCtx extends ISignalHandleCtx {
    signal: ISignal & { payload: IReceiveEffectAttackLocationSignalPayload };
}
