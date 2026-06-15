import { IGameState, IHull, IPlainShip } from "@shared/index";
import { FERenderHullCommand } from "@shared/models/commands/FERenderHullCommand";
import { Hull } from "@shared/models/Hull";
import { Ship } from "@shared/models/Ship";
import { IGameBoard, IRect } from "@shared/types/fe-types";
import { GridHelper } from "@shared/utils/grid-helper";
import { locationToKey } from "@shared/utils/helpers";
import { getFactionMixin, ShipConstructor } from "@shared/utils/ship-helper";
import { Selectable } from "../../../src/components/Selectable";
import { queueCommand } from "../../../src/utils/game-helper";

export function WithFERendering<TBase extends ShipConstructor>(Base: TBase) {
    return class extends Base {
        public gameBoard!: IGameBoard;
        public shipWrapper!: Selectable;

        public render(gameBoard: IGameBoard) {
            this.gameBoard = gameBoard;

            this.createShipWrapper();
            this.renderHulls();
        }

        public renderHulls() {
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

        public renderHull(hull: Hull, rectToTileMap: Map<string, IRect>) {
            const tileKey = locationToKey(hull.location);

            queueCommand(
                new FERenderHullCommand({
                    parentElement: this.shipWrapper,
                    rect: rectToTileMap.get(tileKey),
                    hullId: hull.id,
                }),
            );
        }

        public createShipWrapper() {
            const shipWrapperId = `ship-${this.id}`;

            this.shipWrapper = new Selectable(shipWrapperId);
            this.shipWrapper.ref = document.createElement("div");
            this.shipWrapper.ref.id = shipWrapperId;
            this.shipWrapper.ref.style.position = "absolute";
        }
    };
}

export class FEShipEntity extends WithFERendering(Ship) {
    public static toDomain(plain: IPlainShip, state: IGameState): FEShipEntity {
        const hullsById = new Map<string, IHull>((state.hulls ?? []).map((h) => [h.id, h]));
        const hulls = plain.hulls.map((id) => hullsById.get(id)).filter((h): h is IHull => h !== undefined);

        const FEFactionShipCtor = getFactionMixin(plain.refNo)(FEShipEntity);

        return new FEFactionShipCtor({ ...plain, hulls }) as FEShipEntity;
    }
}
