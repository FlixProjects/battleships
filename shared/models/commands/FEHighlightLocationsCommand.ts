import { IGameBoard, TSetSelectableOptions } from "../../types/fe-types";
import { ICellLoc } from "../../types/types";
import { FECommand } from "./FECommand";

export class FEHighlightLocationsCommand extends FECommand {
    constructor(
        private gameBoard: IGameBoard,
        private locations: ICellLoc[],
        private options?: TSetSelectableOptions,
    ) {
        super();
    }
    execute(): Promise<void> {
        this.gameBoard.updateSelectableTiles(this.locations, this.options);
        return;
    }
    undo(): Promise<void> {
        this.gameBoard.updateSelectableTiles([]); // TODO: should we only unhighlight the tiles we selected?
        return;
    }
}
