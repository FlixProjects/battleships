import { IGameState, IPlainPlayer, IPlayer, IPlayerAction } from "../types";
import { Card } from "./Card";
import { PlayerEntity } from "./entities/PlayerEntity";

export class Player extends PlayerEntity {
    constructor(props: IPlayer) {
        super(props);
    }

    public playCard(card: Card): this {
        if (!this.hand.includes(card.id)) return this;
        this.hand = this.hand.filter((id) => id !== card.id);
        card.onPlay();
        return this;
    }

    public getVisibilityFromShips() {
        const visibleTilesets = this.ships.map((ship) => ship.getVisibleTiles());

        const visibleTiles = new Set<string>();

        visibleTilesets.forEach((tileset) => {
            tileset.forEach((tile) => {
                visibleTiles.add(tile);
            });
        });

        return visibleTiles;
    }

    public updateVisibility(visibleTiles: Set<string>) {
        this.ships.forEach((ship) => {
            ship.updateVisibility(visibleTiles);
        });
        this.removeInvisibleShips();
        return this;
    }

    public removeInvisibleShips() {
        this.ships = this.ships.filter((ship) => ship.isVisible);
        return this;
    }

    /** Flattens ships and pendingActions to ID arrays. */
    public toPlain(): IPlainPlayer {
        return {
            ...this,
            ships: this.ships?.map((s) => s.id) ?? [],
            pendingActions: this.pendingActions?.map((a) => a.id) ?? [],
        };
    }

    /**
     *  Caller must have hydrated ships and actions first.
     */
    public static toDomain(plain: IPlainPlayer | IPlayer, state: IGameState): Player {
        if (plain instanceof Player) return plain;

        const ships = state.ships?.filter((s) => s.playerId === plain.id) ?? [];

        const pendingActionIds = plain.pendingActions.map((a: string | IPlayerAction) =>
            typeof a === "string" ? a : a.id,
        );

        const pendingActions = (state.actions ?? []).filter((a) => pendingActionIds.includes(a.id));

        return new Player({ ...plain, ships, pendingActions } as IPlayer);
    }
}
