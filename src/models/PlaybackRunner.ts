import { IPlainAppState, IPlainGameState, ITurnEvent } from "@shared/types";
import clone from "lodash.clonedeep";
import { gameManager } from "..";
import { updateComponents } from "../components/component-helper";
import { queueCommand } from "../utils/game-helper";
import { turnEventToCommand } from "../utils/turn-event-translator";
import { animationManager } from "./AnimationManager";
import { PlaybackStateApplier } from "./PlaybackStateApplier";

/**
 * Rewind-and-replay of the last resolved round: renders the board from the
 * viewer's prior-round snapshot, steps through the recorded turn events (each
 * step patches a transient playback state, animates, then re-renders so the
 * board sits in its post-event arrangement), and finally swaps back to the
 * real working state.
 *
 * While playing, every click is swallowed at capture phase and skips the rest
 * of the playback straight to the final swap — that is both the "input
 * disabled" and the "interrupt" behaviour.
 */
export class PlaybackRunner {
    private playing = false;
    private skipRequested = false;

    /** Automatic trigger — exactly-once per resolved round via the watermark. */
    public async playIfUnseen(): Promise<void> {
        const round = this.getResolvedRound();
        if (round === undefined) return;
        if (round <= gameManager.getLastAnimatedRound()) return;

        // Mark before playing: re-mounts and repeated refreshes while (or
        // after) this run must not fire the automatic playback again.
        gameManager.setLastAnimatedRound(round);
        await this.play();
    }

    /** Playback button — re-watch the last resolved round, watermark ignored. */
    public async replay(): Promise<void> {
        await this.play();
    }

    public canReplay(): boolean {
        if (this.getResolvedRound() === undefined) return false;
        if (!gameManager.getPriorRoundState()) return false;
        return this.getEvents().length > 0;
    }

    public isPlaying(): boolean {
        return this.playing;
    }

    private async play(): Promise<void> {
        if (this.playing) return;
        const rewindState = gameManager.getPriorRoundState();
        const events = this.getEvents();
        if (!rewindState || events.length === 0) return;

        this.playing = true;
        this.skipRequested = false;

        const finalAppState = this.captureAppState();
        const playback = clone(rewindState);
        const applier = new PlaybackStateApplier(finalAppState.gameState, events);

        const swallowClickAndSkip = (e: MouseEvent) => {
            e.stopPropagation();
            e.preventDefault();
            this.requestSkip();
        };
        document.addEventListener("click", swallowClickAndSkip, { capture: true });

        try {
            this.renderTransient(finalAppState, playback);
            for (let i = 0; i < events.length; i++) {
                if (this.skipRequested) break;
                await this.playEvent(finalAppState, playback, applier, events[i], i);
            }
        } finally {
            document.removeEventListener("click", swallowClickAndSkip, { capture: true });
            this.playing = false;
        }

        this.restore(finalAppState);
    }

    private async playEvent(
        finalAppState: IPlainAppState,
        playback: IPlainGameState,
        applier: PlaybackStateApplier,
        event: ITurnEvent,
        index: number,
    ): Promise<void> {
        // A ship entering vision at this event must be on the board before
        // its animation tries to copy the sprite.
        if (applier.ensurePresence(playback, index)) {
            this.renderTransient(finalAppState, playback);
        }

        applier.apply(playback, index);
        const command = turnEventToCommand(event);
        if (command) {
            await queueCommand(command);
        }
        this.renderTransient(finalAppState, playback);
    }

    private requestSkip(): void {
        this.skipRequested = true;
        // Drop everything still queued; the in-flight animation finishes its
        // own short run, then the loop breaks to the final swap.
        animationManager.clear();
    }

    private getResolvedRound(): number | undefined {
        return gameManager.state.gameState?.lastResolvedRound;
    }

    private getEvents(): ITurnEvent[] {
        return gameManager.state.gameState?.lastTurnEvents ?? [];
    }

    private captureAppState(): IPlainAppState {
        const { status, currentPlayer, gameState } = gameManager.state;
        return { status, loading: false, currentPlayer, gameState: gameState.toPlain() };
    }

    /** Persist the playback state as the (temporary) working state so the
     *  whole existing render pipeline — board rebuild, visibility, commands
     *  reading `gameManager.state` — presents it. `restore` undoes this. */
    private renderTransient(finalAppState: IPlainAppState, playback: IPlainGameState): void {
        gameManager.saveAppState({ ...finalAppState, gameState: playback }, { saveWithMerge: false });
        updateComponents();
    }

    private restore(finalAppState: IPlainAppState): void {
        gameManager.saveAppState(finalAppState, { saveWithMerge: false });
        updateComponents();
    }
}

export const playbackRunner = new PlaybackRunner();
