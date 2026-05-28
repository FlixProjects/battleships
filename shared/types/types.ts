import { IShipAttackSignalPayload, IShipReceiveAttackSignalPayload, ISignal } from "@shared/models/signals/types";
import { AppStatus, CardKind, EFFECT_REF_NO, Faction, SHIP_REF_NO, SUPPORT_REF_NO } from "../config/constants";
import type { GameState, Hull, Player, Ship } from "../models";
import { ICommand } from "../models/commands/types";
import { IDeployAction, IMoveAction, IPlayCardAction, IPlayerAction, IShipAttackAction } from "./action-types";

export interface IGame {
    queueCommand(command: ICommand): Promise<void>;
    runCommandTree(command: ICommand): Promise<void>;
    run(command: ICommand): Promise<ICommand[]>;
    undo(command: ICommand): Promise<void>;
}

export interface IActionResolver {
    resolveAction(action: IPlayerAction): IGameState;
    resolvePlayCard(action: IPlayCardAction): GameState;
    resolveDeploy(action: IDeployAction): GameState;
    resolveMove(action: IMoveAction): GameState;
    resolveAttack(action: IShipAttackAction): GameState;
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
export interface IGameStateManager {
    get gameState(): GameState;
    setGameState(_gameState: IGameState): void;
    getCurrentRound(): number;
    getPlayer(playerId: string): IPlayer;
    getPlayers(): IPlayer[];
    getPlayerShips(playerId: string): IShip[];
    getShip(shipId: string): Ship;
    getShipHulls(shipId: string): Hull[];
    getHulls(locations?: ICellLoc[]): Hull[];
    getPlayerHand(playerId: string): ICard[];
    getPlayerIndex(playerId: string): number;
    updatePlayer(player: Partial<IPlayer>): this;
    updatePlayers(players: Partial<IPlayer>[]): this;
    updateShip(ship: Partial<IShip>): this;
    updateShips(ships: Partial<IShip>[]): this;
    updateHull(hull: Partial<IHull>): this;
    updateHulls(hulls: Partial<IHull>[]): this;
    addHull(hull: IHull): this;
    updateActions(actions: Partial<IPlainAction>[]): this;
    updateAction(action: Partial<IPlainAction>): this;
    addAction(action: IPlainAction): this;
    addEffect(effect: IEffect): this;
    addEffects(effects: IEffect[]): this;
    removeEffect(effectId: string): this;
    getActiveEffects(playerId?: string): IEffect[];
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
    board?: Board;
    winners: string[];
    isOver: boolean;
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
    linkPlayerShips(options?: { reverse?: boolean }): this;
    linkShipHulls(options?: { reverse?: boolean }): this;
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
    receiveSignal(ctx: ISignalHandleCtx): void;
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
    center: ICellLoc;
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
    sourceCardId: string;
    playerId: string;
    createdOnRound: number;
    /** undefined = one-shot (never persisted); otherwise persists through and
     *  including this round number. Expired effects are dropped at round-end. */
    expiresAfterRound?: number;
    payload: TEffectPayload;
    existsOnBoard: boolean;
    location?: ICellLoc;
}

export type IPlainEffect = IEffect;

export interface IEffectConfig {
    refNo: string;
    kind: TEffectKind;
    anchor: TEffectAnchor;
    /** 0 = no targeting needed (untargeted / confirm-only). */
    range: number;
    /** 0 = one-shot; otherwise rounds the effect persists for after creation
     *  (expiresAfterRound = createdOnRound + duration - 1). */
    duration: number;
    existsOnBoard: boolean;
}

export interface ISupportConfig {
    refNo: string;
    name: string;
    commandPointCost: number;
    /** Effect refNos this Support produces, in selection order. Each refNo
     *  must exist in `EFFECTS_CONFIG`. */
    effects: string[];
}

export interface ICard {
    id: string;
    deckId: string; // FK → IDeck.id
    instanceId: string; // FK → underlying entity (today: IShip.id)
    kind: TCardKind;
    refNo: string; // e.g. TShipRefNo — display hint without dereferencing
}

export type TAppStatus = (typeof AppStatus)[keyof typeof AppStatus];
export type TShipRefNo = (typeof SHIP_REF_NO)[keyof typeof SHIP_REF_NO];

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
    effects?: IPlainEffect[];
    actions?: IPlainAction[];
    board?: Board;
    winners: string[];
    isOver: boolean;
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

export interface Board {
    grid: Grid;
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
    refNo: string;
    name: string;
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

export interface ISignalHandleCtx {
    signal: ISignal;
    gsm: IGameStateManager;
    saveAction: () => void;
    saveNewState: (newState: IGameState) => void;
    emitter: (signals: ISignal[], originId: string) => void;
}

export interface IBasicShipAttackSignalHandleCtx extends ISignalHandleCtx {
    signal: ISignal & { payload: IShipAttackSignalPayload };
}

export interface IReceiveShipAttackSignalHandleCtx extends ISignalHandleCtx {
    signal: ISignal & { payload: IShipReceiveAttackSignalPayload };
}
