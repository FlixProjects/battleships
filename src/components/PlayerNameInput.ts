import { getComponents } from "./component-helper";
import { Input } from "./native/Input";

export class PlayerNameInput extends Input {
    public ref = document.getElementById("playerName") as HTMLInputElement;;

    shakeForAwhile() {
        this.shake();
        setTimeout(() => this.stopShake(), 2000);
    }

    shake() {
        this.ref.classList.add("shake");
    }

    stopShake() {
        this.ref.classList.remove("shake");
        this.ref.focus();
    }
}
