import { interactionManager } from "..";
import { ISelectable, TSetSelectableOptions } from "@shared/types/fe-types";
import { BaseComponent } from "./BaseComponent";

export class Selectable extends BaseComponent implements ISelectable {
    public isSelectable?: boolean = undefined;
    public isSelectableAction = true;
    private onSelects?: Array<() => void> = [];

    constructor(public id: string) {
        super();
        this.register();
    }

    public register() {
        interactionManager.register(this);
    }

    public setSelectable(isSelectable: boolean, options: TSetSelectableOptions = {}) {
        if (this.isSelectable !== undefined && this.isSelectable !== null) {
            if (this.isSelectable && !isSelectable) {
                // selectable -> unselectable
                this.runOnUnselectable();
            } else if (!this.isSelectable && isSelectable) {
                // unselectable -> selectable
                this.runOnSelectable();
            }
        }

        this.isSelectable = isSelectable;

        const { onSelectable, onUnselectable } = options;

        if (onSelectable) {
            this.onSelectable = () => onSelectable(this);
        }

        if (onUnselectable) {
            this.onUnselectable = () => onUnselectable(this);
        }

        this.setState();
    }

    protected setState(): void {
        if (this.isSelectable) {
            this.setSelectableStyle();
            this.runOnSelectable();
        } else {
            this.setUnselectableStyle();
            this.runOnUnselectable();
        }
    }

    protected runOnUnselectable() {
        this.onUnselectable?.();
        this.onUnselectable = undefined;
    }

    protected runOnSelectable() {
        this.onSelectable?.();
        this.onSelectable = undefined;
    }

    protected setSelectableStyle() {}

    protected setUnselectableStyle() {}

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
