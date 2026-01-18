import { IAnimation } from "../types";
import { AnimationLayer } from "./AnimationLayer";

export class AnimationManager {
    private queue: IAnimation[] = [];
    private animationLayer = new AnimationLayer();
    private animationCallbackMap: Map<string, () => void> = new Map();
    private playing = false;

    /**
     * @param onEndCallback called when the animation ends
     */
    enqueue(animation: IAnimation, onEndCallback?: () => void): void {
        animation.loadLayer(this.animationLayer);
        if (onEndCallback) {
            this.animationCallbackMap.set(animation.id, onEndCallback);
        }
        this.queue.push(animation);
    }

    async play(): Promise<void> {
        this.playing = true;
        while (this.queue.length > 0) {
            const animation = this.queue.shift();
            if (animation) {
                await animation.execute();
                this.executeCallback(animation.id);
                this.animationLayer.destroyCopiedElements(animation.id);
            }
        }
        this.playing = false;
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
