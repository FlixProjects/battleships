import { IAnimation } from "../../../src/types/animations/types";
import { FEAnimationCommand } from "./FEAnimationCommand";

/** Playback-only: runs one event's animations (a concurrent group) to
 *  completion. The factory is deferred to execute time so DOM elements are
 *  captured against the board as the playback has arranged it, not as it was
 *  at translate time. Unlike the at-click animation commands it awaits the
 *  queue — the PlaybackRunner steps events strictly one after another. */
export class FEPlaybackAnimationCommand extends FEAnimationCommand {
    constructor(private readonly createAnimations: () => IAnimation[]) {
        super();
    }

    public async execute(): Promise<void> {
        this.animationManager.enqueueMany(this.createAnimations().map((animation) => ({ animation })));
        await this.animationManager.play();
    }

    public async undo(): Promise<void> {
        // Animations have nothing to undo.
    }
}
