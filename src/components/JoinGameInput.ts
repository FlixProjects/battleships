import { IAppState } from "@shared/types";
import { HTMLInput } from "./native/Input";

export class JoinGameInput extends HTMLInput {
    public ref = document.getElementById("joinCode") as HTMLInputElement;

    reset() {
        this.ref.value = "";
        this.ref.disabled = false;
    }

    updateState(_state?: IAppState): void {
        this.reset();
    }
}
