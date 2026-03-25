// Frontend types for components
import { IAnimation } from "../../src/types";
import { IHull, IShip } from "./types";

export interface IBaseComponent {
    ref: HTMLElement;
    build(): HTMLElement;
}

export interface IActionMenu extends IBaseComponent {
    close(): void;
}

export interface ISelectable {
    runOnSelects: () => void;
}

export interface TSetSelectableOptions {
    onSelectable?: (selectable: ISelectable) => void;
    onUnselectable?: (selectable: ISelectable) => void;
}

export interface IGameBoard {
    updateSelectableTiles: (validCells: [number, number][], options?: TSetSelectableOptions) => void;
    addToAnimatingMap: (elementId: string, animationId: string) => void;
    removeFromAnimatingMap: (elementId: string) => void;
    renderShip: (ship: IShip, hulls: IHull[], isFirstPlayer?: boolean) => void;
}

export interface IAnimationManager {
    enqueue: (animation: IAnimation, onEndCallback?: () => void) => void;
    play: () => Promise<void>;
}
