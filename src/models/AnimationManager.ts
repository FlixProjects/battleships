import { IAnimation } from "../types";

export class AnimationManager {    
    private queue: IAnimation[] = [];
    private playing = false;

    enqueue(animation: IAnimation): void {
        this.queue.push(animation);
    }

    async play(): Promise<void> {
        this.playing = true;
        while (this.queue.length > 0) {
            const animation = this.queue.shift();
            if (animation) {
                await animation.execute();
            }
        }
        this.playing = false;
    }

    clear(): void {
        this.queue = [];
    }

    isPlaying(): boolean {
        return this.playing;
    }
}

export const animationManager = new AnimationManager();
