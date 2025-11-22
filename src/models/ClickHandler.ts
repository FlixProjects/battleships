import { ICellLoc } from "../../shared/types/types";
import { getComponents, updateComponents } from "../components/component-helper";
import { Selectable } from "../components/Selectable";

export class ClickHandler {
    protected removeGlobalClickEventListener: () => void;
    protected selectables: Record<string, Selectable> = {};

    public handleEvent(): { nextClickhandler: (e: MouseEvent) => void } {
        return { nextClickhandler: (e: MouseEvent) => this.handler(e) };
    }

    protected handler(e: MouseEvent) {
        // child should implement
    }

    public load(selectables: Record<string, Selectable>, removeGlobalClickEventListener: () => void) {
        this.selectables = selectables;
        this.removeGlobalClickEventListener = removeGlobalClickEventListener;
        return this;
    }

    protected updateGameBoard(cells: ICellLoc[]) {
        const gameBoard = getComponents().div.gameBoard;
        gameBoard.updateSelectableTiles(cells);
    }

    protected handleInvalidClick(callback?: () => void) {
        callback?.();
        this.removeGlobalClickEventListener();
        return;
    }

    protected clearPriorOnSelects(selectableKeys: string[]) {
        selectableKeys.forEach((index) => {
            this.selectables[index].clearOnSelect();
        });
    }

    protected loadOnSelects(selectableKeys: string[], onDeselect?: () => void) {
        selectableKeys.forEach((index) => {
            this.selectables[index].addOnSelect(() => {
                updateComponents();
                onDeselect?.();
                this.removeGlobalClickEventListener();
            });
        });
    }

    protected addGetIdOfClick = (e: MouseEvent) => {
        const target = e.target as HTMLElement;
        return target.id;
    };
}
