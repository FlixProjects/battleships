import { TILE_GAP_PX, TILE_SIZE_PX } from "@shared/constants";
import { CellNodeEntity } from "@shared/models/entities/CellNodeEntity";
import { ICellNode } from "@shared/types";
import { refNoToCellNodeClassMap } from "@shared/utils/cell-node-helper";

export type CellNodeConstructor<T extends CellNodeEntity = CellNodeEntity> = new (...args: any[]) => T;

export function WithFERendering<TBase extends CellNodeConstructor>(Base: TBase) {
    return class extends Base {
        public render(staticLayer: HTMLElement): void {
            if (!this.imgSrc) return;

            const sprite = document.createElement("img");
            sprite.src = this.imgSrc.startsWith(".") ? this.imgSrc : `./${this.imgSrc}`;
            sprite.alt = this.refNo ?? "";
            this.applyPositioning(sprite);

            staticLayer.appendChild(sprite);
        }

        private applyPositioning(sprite: HTMLImageElement): void {
            const [col, row] = this.location;
            const tileStride = TILE_SIZE_PX + TILE_GAP_PX;
            sprite.style.position = "absolute";
            sprite.style.left = `${col * tileStride}px`;
            sprite.style.top = `${row * tileStride}px`;
            sprite.style.width = `${TILE_SIZE_PX}px`;
            sprite.style.height = `${TILE_SIZE_PX}px`;
            sprite.style.objectFit = "cover";
            sprite.style.borderRadius = "6px";
            sprite.style.pointerEvents = "none";
            sprite.style.zIndex = "0";
        }
    };
}

export class FECellNodeEntity extends WithFERendering(CellNodeEntity) {
    public static toDomain(plain: ICellNode): FECellNodeEntity {
        const Base = refNoToCellNodeClassMap[plain.refNo];
        const FECellNodeCtor = WithFERendering(Base);

        return new FECellNodeCtor(plain) as FECellNodeEntity;
    }
}
