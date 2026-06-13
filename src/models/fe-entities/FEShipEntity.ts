import { FERenderHullCommand } from "@shared/models/commands/FERenderHullCommand";
import { Hull } from "@shared/models/Hull";
import { Ship } from "@shared/models/Ship";
import { IGameBoard, IRect } from "@shared/types/fe-types";
import { GridHelper } from "@shared/utils/grid-helper";
import { locationToKey } from "@shared/utils/helpers";
import { Selectable } from "../../../src/components/Selectable";
import { queueCommand } from "../../../src/utils/game-helper";
import { IPlainShip, IGameState, IHull } from "@shared/index";

export class FEShipEntity extends Ship {
    protected gameBoard: IGameBoard;
    private shipWrapper: Selectable;

    public render(gameBoard: IGameBoard) {
        this.gameBoard = gameBoard;

        this.createShipWrapper();
        this.renderHulls();
    }

    private renderHulls() {
        const gh = new GridHelper();
        const topCorner: IRect = gh.getMostTopLeft(this.hulls?.map((hull) => hull.location) ?? []);
        const rectToTileMap = new Map<string, IRect>();

        this.hulls?.forEach((hull) => {
            const tileKey = locationToKey(hull.location);
            rectToTileMap.set(tileKey, gh.getTopLeft(hull.location));
        });

        const shipWrapperElement = this.shipWrapper.ref;

        shipWrapperElement.style.top = `${topCorner?.top ?? 0}px`;
        shipWrapperElement.style.left = `${topCorner?.left ?? 0}px`;

        this.hulls?.forEach((hull) => this.renderHull(hull, gh.getRelativeTopLeft(rectToTileMap)));
    }

    private renderHull(hull: Hull, rectToTileMap: Map<string, IRect>) {
        const tileKey = locationToKey(hull.location);

        queueCommand(
            new FERenderHullCommand({
                parentElement: this.shipWrapper,
                rect: rectToTileMap.get(tileKey),
                hullId: hull.id,
            }),
        );
    }

    private createShipWrapper() {
        const shipWrapperId = `ship-${this.id}`;

        this.shipWrapper = new Selectable(shipWrapperId);
        this.shipWrapper.ref = document.createElement("div");
        this.shipWrapper.ref.id = shipWrapperId;
        this.shipWrapper.ref.style.position = "absolute";
    }

    public static toDomain(plain: IPlainShip, state: IGameState): FEShipEntity {
        const hullsById = new Map<string, IHull>((state.hulls ?? []).map((h) => [h.id, h]));
        const hulls = plain.hulls.map((id) => hullsById.get(id)).filter((h): h is IHull => h !== undefined);
        return new FEShipEntity({ ...plain, hulls });
    }
}
