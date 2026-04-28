import { TILE_SIZE_PX } from "@shared/constants";
import { ICellLoc } from "@shared/types";
import { IRect } from "@shared/types/fe-types";

export class GridHelper {
    private tileHeight = TILE_SIZE_PX;
    private tileWidth = TILE_SIZE_PX;
    
    public getTopLeft(loc: ICellLoc){
        return {
            top: loc[1] * this.tileHeight,
            left: loc[0] * this.tileWidth,
        }
    }

    public getMostTopLeft(locations: ICellLoc[]) {
        let mostTopLeft = { top: Infinity, left: Infinity };

        locations.forEach((loc) => {
            const topLeft = this.getTopLeft(loc);
            mostTopLeft.top = Math.min(mostTopLeft.top, topLeft.top);
            mostTopLeft.left = Math.min(mostTopLeft.left, topLeft.left);
        });

        return mostTopLeft;
    }

    getRelativeTopLeft(rectMap: Map<string, IRect> ){
        const minLeft = Math.min(...Array.from(rectMap.values()).map(rect => rect.left));
        const minTop = Math.min(...Array.from(rectMap.values()).map(rect => rect.top));

        const relativeRectMap = new Map<string, IRect>();
        rectMap.forEach((rect, key) => {
            relativeRectMap.set(key, {
                top: rect.top - minTop,
                left: rect.left - minLeft,
            });
        });

        return relativeRectMap;
    }
}