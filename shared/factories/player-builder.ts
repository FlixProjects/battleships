import { Faction } from "../factions";
import { IPlayer } from "../types";
import { Player } from "../models";
import { Builder } from "./builder";

export class PlayerBuilder extends Builder<IPlayer, Player> {
    constructor(defaultOverrides?: Partial<IPlayer>) {
        const defaultProps: IPlayer = {
            id: "",
            name: "",
            order: 0,
            ready: false,
            maxCommandPoints: 2,
            commandPoints: 2,
            pendingActions:[],
            faction: Faction.THE_UNITED_FLEET,
            hand: [],
            deck: "",
        };
        super(defaultProps, defaultOverrides, Player);
    }
}
