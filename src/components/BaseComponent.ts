import { IAppState } from "../types";

export abstract class BaseComponent {
    id?: string;
    ref: HTMLElement;
    protected children: BaseComponent[] = [];

    addClickEventListener() {
        this.ref.addEventListener("click", async () => await this.onClick());
    }

    updateState(_state?: IAppState) {
        this.remove();
        this.build()
    }

    async onClick() {
        //
    }

    protected addStyles() {}

    protected addChild(child: BaseComponent) {
        this.children.push(child);
    }

    protected remove() {
        this.children.forEach(child => child.remove());
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
