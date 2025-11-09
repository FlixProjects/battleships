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
}
