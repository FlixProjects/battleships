import {
    DEFAULT_APP_STATE,
    FP_AUTH_TOKEN,
    FP_CURRENT_PLAYER,
    FP_PLAYER_STATES,
    FP_ROUND_SNAPSHOTS,
    LOCAL_OTHER_PLAYER_TOKEN,
} from "@shared/constants";
import { IAppState, IPlainAppState, IPlainGameState, IPlayer } from "@shared/types";
import { mergician } from "mergician";
import { transformPlainAppStateToFEDomain } from "../utils/transformers";
import { getCookie } from "../utils/cookie-helper";

interface PlayerGameStates {
    [playerId: string]: IPlainAppState;
}

/** Turn-playback bookkeeping, per player. Lives in its own storage bucket so
 *  the whole-state `saveAppState` replacements can never clobber it. */
interface IRoundSnapshot {
    /** Board as this player saw it at the start of the current round, before
     *  they staged any actions — as-received, pre-optimistic-resolve. */
    roundStartState?: IPlainGameState;
    /** Previous round's start state: the rewind target for turn playback. */
    priorRoundState?: IPlainGameState;
    /** Watermark making the automatic playback exactly-once per round. */
    lastAnimatedRound?: number;
}

interface RoundSnapshots {
    [playerId: string]: IRoundSnapshot;
}

/**
 * Pure persistence layer over `sessionStorage`. Three responsibilities only:
 *   1. Read/write the per-player plain app state (`fp-player-states`)
 *   2. Read/write the active player id (`fp-current-player`)
 *   3. Read/write the per-player round snapshots for turn playback
 *      (`fp-round-snapshots`)
 *
 * No game logic, no domain<->plain translation inside the save path. Callers
 * pass plain (`IPlainAppState`) — if they have a domain `GameState`, they
 * call `gameState.toPlain()` first. The `state` getter rehydrates plain →
 * domain on read so existing consumers see no contract change.
 */
export class GameManager {
    private playerGameStates: PlayerGameStates;

    constructor() {
        this.playerGameStates = this.loadAllPlayerStates();
    }

    get state(): IAppState {
        return this.getCurrentPlayerState();
    }

    public saveAppState(state: Partial<IPlainAppState>, _options: { saveWithMerge?: boolean } = {}) {
        const options = { saveWithMerge: true, ..._options };
        const playerId = this.getCurrentPlayerId();
        const existing = this.playerGameStates[playerId] ?? {};

        const next = options.saveWithMerge ? (mergician(existing, state) as IPlainAppState) : (state as IPlainAppState);

        this.playerGameStates[playerId] = next;
        this.savePlayerStates();
    }

    public switchLocalPlayerAuthToken() {
        const currToken = getCookie(FP_AUTH_TOKEN);
        const incomingToken = sessionStorage.getItem(LOCAL_OTHER_PLAYER_TOKEN);

        sessionStorage.setItem(LOCAL_OTHER_PLAYER_TOKEN, currToken);
        if (incomingToken) {
            document.cookie = `${FP_AUTH_TOKEN}=${incomingToken}; path=/; SameSite=Lax`;
        }
    }

    public setCurrentPlayer(playerId: string) {
        sessionStorage.setItem(FP_CURRENT_PLAYER, playerId);
    }

    public getAllPlayerIds(): string[] {
        return Object.keys(this.playerGameStates);
    }

    public getPlayer(): IPlayer {
        return this.state.gameState?.players.find((p) => p.id === this.getCurrentPlayerId());
    }

    public getOtherPlayer(): IPlayer {
        return this.state.gameState?.players.find((p) => p.id !== this.getCurrentPlayerId());
    }

    public getCurrentPlayerId(): string {
        const currentPlayerId = sessionStorage.getItem(FP_CURRENT_PLAYER);
        return currentPlayerId ?? "";
    }

    private getCurrentPlayerState(): IAppState {
        const currentPlayerId = this.getCurrentPlayerId();
        if (!currentPlayerId) {
            return transformPlainAppStateToFEDomain(DEFAULT_APP_STATE);
        }
        return this.loadPlayerState(currentPlayerId);
    }

    private loadPlayerState(playerId: string): IAppState {
        const rawState = this.playerGameStates[playerId] ?? DEFAULT_APP_STATE;
        return transformPlainAppStateToFEDomain(rawState);
    }

    private loadAllPlayerStates(): PlayerGameStates {
        const stored = sessionStorage.getItem(FP_PLAYER_STATES);
        return stored ? JSON.parse(stored) : {};
    }

    private savePlayerStates() {
        sessionStorage.setItem(FP_PLAYER_STATES, JSON.stringify(this.playerGameStates));
    }

    /**
     * Record an authoritative (server-received) state for turn playback. Call
     * with the raw response state, BEFORE any optimistic local re-resolve —
     * the rewind target must be the board the player saw at round start.
     */
    public trackRoundSnapshots(playerId: string, incoming: IPlainGameState) {
        const snapshots = this.loadRoundSnapshots();
        snapshots[playerId] = this.nextRoundSnapshot(snapshots[playerId], incoming);
        this.saveRoundSnapshots(snapshots);
    }

    private nextRoundSnapshot(current: IRoundSnapshot | undefined, incoming: IPlainGameState): IRoundSnapshot {
        if (!current?.roundStartState) {
            // First sight of the game — there is no earlier board to rewind
            // to, so the incoming round counts as already animated.
            return { roundStartState: incoming, lastAnimatedRound: incoming.lastResolvedRound ?? 0 };
        }

        const incomingRound = incoming.lastResolvedRound ?? 0;
        const storedRound = current.roundStartState.lastResolvedRound ?? 0;
        if (incomingRound > storedRound) {
            // A resolve happened since the stored round start — rotate: the
            // old round start becomes the rewind target for the playback.
            return { ...current, priorRoundState: current.roundStartState, roundStartState: incoming };
        }

        // Same round: the board hasn't resolved since, but the state may have
        // grown (opponent joined, own submission echoed) — keep the freshest.
        return { ...current, roundStartState: incoming };
    }

    public getPriorRoundState(): IPlainGameState | undefined {
        return this.loadRoundSnapshots()[this.getCurrentPlayerId()]?.priorRoundState;
    }

    public getLastAnimatedRound(): number {
        return this.loadRoundSnapshots()[this.getCurrentPlayerId()]?.lastAnimatedRound ?? 0;
    }

    public setLastAnimatedRound(round: number) {
        const snapshots = this.loadRoundSnapshots();
        const playerId = this.getCurrentPlayerId();
        snapshots[playerId] = { ...snapshots[playerId], lastAnimatedRound: round };
        this.saveRoundSnapshots(snapshots);
    }

    private loadRoundSnapshots(): RoundSnapshots {
        const stored = sessionStorage.getItem(FP_ROUND_SNAPSHOTS);
        return stored ? JSON.parse(stored) : {};
    }

    private saveRoundSnapshots(snapshots: RoundSnapshots) {
        sessionStorage.setItem(FP_ROUND_SNAPSHOTS, JSON.stringify(snapshots));
    }

    // only for local
    public clearPlayerStates() {
        sessionStorage.removeItem(FP_PLAYER_STATES);
        sessionStorage.removeItem(FP_ROUND_SNAPSHOTS);
        this.playerGameStates = {};
    }
}
