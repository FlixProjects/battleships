import { interactionManager } from "..";
import { BaseComponent } from "./BaseComponent";

export class Selectable extends BaseComponent {
    public isSelectableAction = true;
    private onSelects?: Array<() => void> = [];
    constructor(public id: string) {
        super();
        this.register();
    }

    public register() {
        interactionManager.register(this);
    }

    public setAsUnselectable() {}

    public setAsSelectable() {}

    public clearOnSelect() {
        this.onSelects = [];
    }

    public addOnSelect(callback: () => void) {
        this.onSelects.push(callback);
    }

    public runOnSelects() {
        this.onSelects.forEach((callback) => callback());
    }
}
