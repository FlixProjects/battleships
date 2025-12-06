import { IAppState } from "../types";

export abstract class BaseComponent {
    public id?: string;
    public ref: HTMLElement;

    protected children: BaseComponent[] = [];

    public addClickEventListener() {
        this.ref.addEventListener("click", async (e: MouseEvent) => {
            e.stopPropagation();
            await this.onClick();
        });
    }

    public removeClickEventListener() {
        this.ref.removeEventListener("click", async () => await this.onClick());
    }

    public updateState(_state?: IAppState) {
        this.remove();
        this.build();
    }

    public async onClick(e?: MouseEvent) {
        //
    }

    public addChild(child: BaseComponent) {
        this.children.push(child);
    }

    protected addStyles() {}

    protected remove() {
        this.removeChildren();
        this.ref.remove();
    }

    public removeChildren(filterFn?: (child: BaseComponent) => boolean) {
        this.children.filter(filterFn || (() => true)).forEach((child) => child.remove());
        this.children = [];
    }

    protected hide() {
        this.ref.style.display = "none";
    }

    public build(): HTMLElement {
        return this.ref;
    }
}
