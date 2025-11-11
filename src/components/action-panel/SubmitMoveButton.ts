import { IAppState } from "../../types";
import { HTMLButton } from "../native/Button";

export class SubmitMoveButton extends HTMLButton {
    constructor() {
        super();
    }

    updateState(_state?: IAppState): void {}

    public build() {
        this.ref = document.createElement("button");
        this.ref.textContent = "Submit Move";
        this.ref.className = "btn primary";
        this.ref.style.marginTop = "12px";

        this.addClickEventListener();

        return this.ref;
    }

    async onClick() {
        console.log("Submit move clicked");
    }
}
