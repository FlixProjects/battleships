// Frontend types for components

export interface IBaseComponent {
    ref: HTMLElement;
    build(): HTMLElement;
}

export interface IActionMenu extends IBaseComponent {
    close(): void;
}

export interface ISelectable {}

export interface TSetSelectableOptions {
    onSelectable?: (selectable: ISelectable) => void;
    onUnselectable?: (selectable: ISelectable) => void;
}

export interface IGameBoard {
    updateSelectableTiles: (validCells: [number, number][], options?: TSetSelectableOptions) => void;
}
