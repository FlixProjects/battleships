// Frontend types for components
import { IAnimation } from "../../src/types/animations/types";
import { IHull, IShip } from "./types";

export interface IBaseComponent {
    ref: HTMLElement;
    build(): HTMLElement;
    addChild(child: IBaseComponent): void;
}

export interface IActionMenu extends ISelectable {
    close(): void;
}

export interface ISelectable extends IBaseComponent {
    ref: HTMLElement;
    runOnSelects: () => void;
}

export interface IUpdateSelectableOptions extends TSetSelectableOptions {
    setAllAsUnselectableBeforeUpdate?: boolean;
}

export interface TSetSelectableOptions {
    onSelectable?: (selectable: ISelectable) => void;
    onUnselectable?: (selectable: ISelectable) => void;
}

export interface IGameBoard {
    tiles: Record<string, ISelectable>;
    updateSelectableTiles: (validCells: [number, number][], options?: TSetSelectableOptions) => void;
    addToAnimatingMap: (elementId: string, animationId: string) => void;
    removeFromAnimatingMap: (elementId: string) => void;
    renderShip: (ship: IShip, hulls: IHull[], isFirstPlayer?: boolean) => void;
}

export interface IAnimationManager {
    enqueue: (animation: IAnimation, onEndCallback?: () => void) => void;
    enqueueMany: (
        animations: {
            animation: IAnimation;
            onEndCallback?: () => void;
        }[],
    ) => void;
    play: () => Promise<void>;
}

export interface IRect {
    top: number;
    left: number;
}