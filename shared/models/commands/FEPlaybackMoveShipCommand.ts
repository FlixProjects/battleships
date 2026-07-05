import { MoveShipAnimation } from "../../../src/models/animations/MoveShipAnimation";
import { IMoveShipAnimationProps } from "../../../src/types/animations/types";
import { DEPLOYED_SHIP_PREFIX } from "../../constants";
import { FEAnimationCommand } from "./FEAnimationCommand";

/** Playback variant of `FEMoveShipAnimationCommand`. The at-click command
 *  fills `newLoc` from post-save state; here every coordinate comes from the
 *  recorded `ShipMoved` event, and the run is awaited so the PlaybackRunner
 *  steps events strictly one after another. The runner's post-event render
 *  (from the patched playback state) puts the sprite at the destination. */
export class FEPlaybackMoveShipCommand extends FEAnimationCommand {
    constructor(private props: IMoveShipAnimationProps) {
        super();
    }

    public async execute(): Promise<void> {
        const { shipId } = this.props;

        const animation = new MoveShipAnimation(this.props);
        this.gameBoard.addToAnimatingMap(shipId, animation.id);
        this.animationManager.enqueue(animation, () => {
            this.gameBoard.removeFromAnimatingMap(shipId);
        });

        const playing = this.animationManager.play();
        // play() clones the hull sprites synchronously before its first await,
        // so the original wrapper can be dropped now — otherwise a ghost ship
        // sits on the start tile for the whole animation.
        document.getElementById(`${DEPLOYED_SHIP_PREFIX}${shipId}`)?.remove();
        await playing;
    }

    public async undo(): Promise<void> {
        // Animations have nothing to undo.
    }
}
