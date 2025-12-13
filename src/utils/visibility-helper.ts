import { IPlayer, locationToKey, PathHelper } from "../../shared";

export const getVisibleTiles = (player: IPlayer): Set<string> => {
    const visible = new Set<string>();

    player.ships
        .filter((s) => s.deployed && !s.destroyed)
        .forEach((ship) => {
            const visionRange = 2; // TEMP: tiles around each ship

            ship.hullLocations?.forEach((hull) => {
                visible.add(locationToKey(hull.location));
                const cells = new PathHelper().getReachableCells({
                    start: hull.location,
                    range: visionRange,
                });

                cells.forEach((cell) => {
                    visible.add(locationToKey(cell));
                });
            });
        });

    return visible;
};
