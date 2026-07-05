import { ExplosionAnimation } from "../../../src/models/animations/ExplosionAnimation";
import { ICellLoc } from "../../types/types";
import { FEAnimationCommand } from "./FEAnimationCommand";

/** Plays the one-shot explosion burst for an `EffectDetonated` turn event.
 *  Companion damage/destruction gets its own commands from the translator —
 *  this command owns only the detonation flash. */
export class FEEffectDetonationAnimationCommand extends FEAnimationCommand {
    constructor(private props: { location: ICellLoc }) {
        super();
    }

    public async execute(): Promise<void> {
        this.animationManager.enqueue(new ExplosionAnimation({ location: this.props.location }));
        await this.animationManager.play();
    }

    public async undo(): Promise<void> {
        // Animations have nothing to undo.
    }
}
