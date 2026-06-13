import { IAnimation } from "../../types/animations/types";
import { BaseAnimation } from "./Animation";

// TODO: not used for now but to be used for animations that need to be coordinated
export class ConcurrentAnimation extends BaseAnimation {
    constructor(private animations: IAnimation[]) {
        super({ duration: Math.max(...animations.map((anim) => anim.duration || 0)) });
    }
    public async execute(): Promise<void> {
        await Promise.all(this.animations.map((anim) => anim.execute()));
    }
}
