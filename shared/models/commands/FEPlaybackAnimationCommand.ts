import { IAnimation } from "../../../src/types/animations/types";
import { FEAnimationCommand } from "./FEAnimationCommand";

/** Playback-only: runs one prebuilt animation to completion. The factory is
 *  deferred to execute time so DOM elements are captured against the board as
 *  the playback has arranged it, not as it was at translate time. Unlike the
 *  at-click animation commands it awaits the queue — the PlaybackRunner steps
 *  events strictly one after another. */
export class FEPlaybackAnimationCommand extends FEAnimationCommand {
    constructor(private readonly createAnimation: () => IAnimation) {
        super();
    }

    public async execute(): Promise<void> {
        this.animationManager.enqueue(this.createAnimation());
        await this.animationManager.play();
    }

    public async undo(): Promise<void> {
        // Animations have nothing to undo.
    }
}
