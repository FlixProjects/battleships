import { ICell } from "..";

export class Cell implements ICell {
    public loc: [number, number];
    public selectable = false;
    public hidden: boolean;
    public visibleTo: string[];

    constructor(props: Readonly<Cell>) {
        Object.assign(this, props);
    }
}
