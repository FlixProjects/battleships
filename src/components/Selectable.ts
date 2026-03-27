import { interactionManager } from "..";
import { ISelectable } from "@shared/types/fe-types";
import { BaseComponent } from "./BaseComponent";

export class Selectable extends BaseComponent implements ISelectable {
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

    public onSelectable?: () => void;

    public onUnselectable?: () => void;

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
