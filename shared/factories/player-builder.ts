import { IPlayer } from "../types";
import { Builder } from "./builder";

export class PlayerBuilder extends Builder<IPlayer> {
    constructor(defaultOverrides?: Partial<IPlayer>) {
        const defaultProps: IPlayer = {
            id: "",
            name: "",
            order: 0,
            ready: false,
            maxCommandPoints: 2,
            commandPoints: 2,
        };
        super(defaultProps, defaultOverrides);
    }
}
