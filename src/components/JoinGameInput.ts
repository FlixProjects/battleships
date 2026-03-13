import { IAppState } from "../../shared/types";
import { HTMLInput } from "./native/Input";

export class JoinGameInput extends HTMLInput {
    public ref = document.getElementById("joinCode") as HTMLInputElement;

    reset() {
        this.ref.value = "";
        this.ref.disabled = false;
    }

    updateState(_state?: IAppState): void {
        const element = this.ref;

        if (_state.gameState?.code) {
            element.value = _state.gameState.code;
            element.disabled = true;
        } else {
            this.reset();
        }
    }
}
