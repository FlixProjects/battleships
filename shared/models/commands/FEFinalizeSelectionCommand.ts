import { ISelectable } from "../../types/fe-types";
import { FECommand } from "./FECommand";

/**
 * Finishes a click interaction: clears the selectable element's on-select
 * handlers and fires the success callback. Returned *after* the animation
 * command so that `Game.runCommandTree` runs it once the ship is already
 * registered as animating — otherwise a callback-triggered board re-render
 * would paint the ship at its final tile while its clone is still moving.
 */
export class FEFinalizeSelectionCommand extends FECommand {
    constructor(
        private props: {
            locationElement?: ISelectable;
            onSuccessCb?: () => void;
        },
    ) {
        super();
    }

    async execute(): Promise<void> {
        this.props.locationElement?.runOnSelects();
        this.props.onSuccessCb?.();
    }

    async undo(): Promise<void> {}
}
