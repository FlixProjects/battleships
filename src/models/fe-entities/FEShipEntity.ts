import { FERenderHullCommand } from "@shared/models/commands/FERenderHullCommand";
import { Hull } from "@shared/models/Hull";
import { Ship } from "@shared/models/Ship";
import { IGameBoard, IRect } from "@shared/types/fe-types";
import { GridHelper } from "@shared/utils/grid-helper";
import { locationToKey } from "@shared/utils/helpers";
import { Selectable } from "../../../src/components/Selectable";
import { queueCommand } from "../../../src/utils/game-helper";
import { FEEntity } from "./FEEntity";

export class FEShipEntity extends FEEntity<Ship> {
    protected gameBoard!: IGameBoard;
    private shipWrapper!: Selectable;

    public render(gameBoard: IGameBoard) {
        this.gameBoard = gameBoard;

        this.createShipWrapper();
        this.renderHulls();
    }

    private renderHulls() {
        const gh = new GridHelper();
        const topCorner: IRect = gh.getMostTopLeft(this.entityProps.hulls?.map((hull) => hull.location) ?? []);
        const rectToTileMap = new Map<string, IRect>();

        this.entityProps.hulls?.forEach((hull) => {
            const tileKey = locationToKey(hull.location);
            rectToTileMap.set(tileKey, gh.getTopLeft(hull.location));
        });

        const shipWrapperElement = this.shipWrapper.ref;

        shipWrapperElement.style.top = `${topCorner?.top ?? 0}px`;
        shipWrapperElement.style.left = `${topCorner?.left ?? 0}px`;

        this.entityProps.hulls?.forEach((hull) => this.renderHull(hull, gh.getRelativeTopLeft(rectToTileMap)));
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
        const shipWrapperId = `ship-${this.entityProps.id}`;

        this.shipWrapper = new Selectable(shipWrapperId);
        this.shipWrapper.ref = document.createElement("div");
        this.shipWrapper.ref.id = shipWrapperId;
        this.shipWrapper.ref.style.position = "absolute";
    }
}
