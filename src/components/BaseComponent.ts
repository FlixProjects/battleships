import { IAppState } from "../types";

export abstract class BaseComponent {
    id?: string;
    ref: HTMLElement;

    addClickEventListener() {
        this.ref.addEventListener("click", async () => await this.onClick());
    }
    updateState(_state?: IAppState) {}

    async onClick() {
        //
    }

    protected addStyles() {}

    protected remove() {
        this.ref.remove();
    }

    protected hide() {
        this.ref.style.display = "none";
    }

    public build(): HTMLElement {
        return this.ref;
    }
}
