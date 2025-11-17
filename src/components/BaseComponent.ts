import { IAppState } from "../types";

export abstract class BaseComponent {
    public id?: string;
    public ref: HTMLElement;

    protected children: BaseComponent[] = [];

    public addClickEventListener() {
        this.ref.addEventListener("click", async () => await this.onClick());
    }

    public removeClickEventListener() {
        this.ref.removeEventListener("click", async () => await this.onClick());
    }

    public updateState(_state?: IAppState) {
        this.remove();
        this.build();
    }

    public async onClick() {
        //
    }

    public addChild(child: BaseComponent) {
        this.children.push(child);
    }
    
    protected addStyles() {}

    protected remove() {
        this.children.forEach((child) => child.remove());
        this.children = [];
        this.ref.remove();
    }

    protected hide() {
        this.ref.style.display = "none";
    }

    public build(): HTMLElement {
        return this.ref;
    }
}
