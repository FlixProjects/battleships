// Frontend types for components

export interface IBaseComponent {
    ref: HTMLElement;
    build(): HTMLElement;
}

export interface IActionMenu extends IBaseComponent {
    close(): void;
}