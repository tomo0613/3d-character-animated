import { AnimationAction, AnimationClip, AnimationMixer } from 'three';

type AnimationLoopEvent = THREE.Event & {action: THREE.AnimationAction; loopDelta: number};

interface BaseAnimationHandlerConfig {
    default: string;
}
// ToDo fix S
// export type AnimationHandlerConfig<S> = Record<S, string> & BaseAnimationHandlerConfig;
export type AnimationHandlerConfig = Record<string, string> & BaseAnimationHandlerConfig;

const crossFadeDuration = 0.3;

export default class AnimationHandler {
    animations = new Map<string, AnimationAction>(); // private ?
    private mixer: AnimationMixer;
    private defaultAnimationAction: AnimationAction;
    currentAnimationAction: AnimationAction;

    constructor(animationMixer: AnimationMixer, animations: AnimationClip[], config: AnimationHandlerConfig) {
        animations.forEach((clip) => {
            this.animations.set(clip.name, animationMixer.clipAction(clip));
        });
        this.mixer = animationMixer;
        this.defaultAnimationAction = this.animations.get(config.default);
        this.currentAnimationAction = this.defaultAnimationAction;
    }

    // ToDo keyof config...
    play = (animationName: string) => {
        this.currentAnimationAction = this.animations.get(animationName);
        this.start(this.currentAnimationAction);
        this.defaultAnimationAction.crossFadeTo(this.currentAnimationAction, crossFadeDuration, false);
    }

    playDefault = () => {
        this.start(this.defaultAnimationAction);
        if (this.currentAnimationAction && this.currentAnimationAction !== this.defaultAnimationAction) {
            this.defaultAnimationAction.crossFadeFrom(this.currentAnimationAction, crossFadeDuration, false);
        }
        this.currentAnimationAction = this.defaultAnimationAction;
    }

    playOnce = (animationName: string) => {
        this.currentAnimationAction = this.animations.get(animationName);

        this.start(this.currentAnimationAction);
        this.defaultAnimationAction.crossFadeTo(this.currentAnimationAction, crossFadeDuration, false);

        return new Promise((resolve) => {
            const animationRepeatListener = (e: AnimationLoopEvent) => {
                if (e.action !== this.currentAnimationAction) {
                    return;
                }
                this.mixer.removeEventListener('loop', animationRepeatListener);

                this.currentAnimationAction.stop();
                this.currentAnimationAction = null;
                this.playDefault();

                resolve();
            };
            this.mixer.addEventListener('loop', animationRepeatListener);
        });
    }

    start = (animationAction: AnimationAction) => {
        animationAction.time = 0;
        animationAction.enabled = true;
        animationAction.setEffectiveTimeScale(1);
        animationAction.setEffectiveWeight(1);
        animationAction.play();
    }
}
