import { IAnimation } from "../types";
import { AnimationLayer } from "./AnimationLayer";

export class AnimationManager {
    private queue: Array<IAnimation | IAnimation[]> = [];
    private animationLayer = new AnimationLayer();
    private animationCallbackMap: Map<string, () => void> = new Map();
    private playing = false;

    /**
     * @param onEndCallback called when the animation ends
     * FIXME: perhaps the onEndCallback should be part of the IAnimation interface?
     */
    enqueue(animation: IAnimation, onEndCallback?: () => void): void {
        animation.loadLayer(this.animationLayer);
        if (onEndCallback) {
            this.animationCallbackMap.set(animation.id, onEndCallback);
        }
        this.queue.push(animation);
    }

    enqueueMany(animations: { animation: IAnimation; onEndCallback?: () => void }[]): void {
        animations.forEach(({ animation, onEndCallback }) => {
            animation.loadLayer(this.animationLayer);

            if (onEndCallback) {
                this.animationCallbackMap.set(animation.id, onEndCallback);
            }
        });
        this.queue.push(animations.map(({ animation }) => animation));
    }

    async play(): Promise<void> {
        this.playing = true;
        while (this.queue.length > 0) {
            const animation = this.queue.shift();
            if (Array.isArray(animation)) {
                await Promise.all(animation.map((anim) => this.playAnimation(anim)));
            } else {
                await this.playAnimation(animation);
            }
        }
        this.playing = false;
    }

    async playAnimation(animation: IAnimation): Promise<void> {
        await animation.execute();
        this.executeCallback(animation.id);
        this.animationLayer.destroyCopiedElements(animation.id);
    }

    private executeCallback(animationId: string): void {
        if (this.animationCallbackMap.has(animationId)) {
            const callback = this.animationCallbackMap.get(animationId);
            if (callback) {
                callback();
            }
            this.animationCallbackMap.delete(animationId);
        }
    }

    clear(): void {
        this.queue = [];
    }

    isPlaying(): boolean {
        return this.playing;
    }
}

export const animationManager = new AnimationManager();
