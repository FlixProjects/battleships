import { playbackRunner } from "../../models/PlaybackRunner";
import { HTMLButton } from "../native/Button";

/** Re-watches the last resolved round's playback on demand. The automatic
 *  playback is watermark-guarded (once per round); this button bypasses it. */
export class PlaybackButton extends HTMLButton {
    public build() {
        this.ref = document.createElement("button");
        this.ref.textContent = "Playback";
        this.ref.className = "btn";
        this.ref.disabled = !playbackRunner.canReplay() || playbackRunner.isPlaying();
        this.addClickEventListener();
        return this.ref;
    }

    async onClick() {
        await playbackRunner.replay();
    }
}
