type AnimationLoopEvent = THREE.Event & {action: THREE.AnimationAction; loopDelta: number};

interface AnimationHandlerConfig {
    default: string;
}

const crossFadeDuration = 0.3;

export default class AnimationHandler {
    private mixer: THREE.AnimationMixer;
    private defaultAnimationAction: THREE.AnimationAction;
    currentAnimationAction: THREE.AnimationAction;

    constructor(animationMixer: THREE.AnimationMixer, config: AnimationHandlerConfig) {
        this.mixer = animationMixer;

        this.defaultAnimationAction = this.getAnimationActionByName(config.default);
        this.currentAnimationAction = this.defaultAnimationAction;
    }

    // ToDo keyof config...
    play = (animationName: string) => {
        this.currentAnimationAction = this.getAnimationActionByName(animationName);

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
        this.currentAnimationAction = this.getAnimationActionByName(animationName);

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

    start = (animationAction: THREE.AnimationAction) => {
        animationAction.time = 0;
        animationAction.enabled = true;
        animationAction.setEffectiveTimeScale(1);
        animationAction.setEffectiveWeight(1);
        animationAction.play();
    }

    private getAnimationActionByName(animationName: string) {
        return (this.mixer.clipAction as any)(animationName) as THREE.AnimationAction;
    }
}
