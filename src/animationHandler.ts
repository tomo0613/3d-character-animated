type AnimationLoopEvent = THREE.Event & {action: THREE.AnimationAction; loopDelta: number};

interface AnimationHandlerConfig {
    default: string;
}

const crossFadeDuration = 0.3;

export class AnimationHandler {
    private mixer: THREE.AnimationMixer;
    private defaultAnimationAction: THREE.AnimationAction;

    constructor(animationMixer: THREE.AnimationMixer, config: AnimationHandlerConfig) {
        this.mixer = animationMixer;

        this.defaultAnimationAction = this.getAnimationActionByName(config.default);
    }

    // ToDo keyof config...
    play = (animationName: string) => {
        const animationAction = this.getAnimationActionByName(animationName);

        this.start(animationAction);
        this.defaultAnimationAction.crossFadeTo(animationAction, crossFadeDuration, false);

        return () => {
            this.playDefault();
            this.defaultAnimationAction.crossFadeFrom(animationAction, crossFadeDuration, false);
        };
        // return new Promise((resolve) => {
        //     // this.?.addEventListener(arg[1]);
        // });
    }

    playDefault = () => {
        this.start(this.defaultAnimationAction);
    }

    playOnce = (animationName: string) => {
        const animationAction = this.getAnimationActionByName(animationName);

        this.start(animationAction);
        this.defaultAnimationAction.crossFadeTo(animationAction, crossFadeDuration, false);

        return new Promise((resolve) => {
            const animationRepeatListener = (e: AnimationLoopEvent) => {
                if (e.action !== animationAction) {
                    return;
                }
                this.mixer.removeEventListener('loop', animationRepeatListener);

                animationAction.stop();
                this.playDefault();
                // this.defaultAnimationAction.crossFadeFrom(animationAction, crossFadeDuration, false);
                // animationAction.crossFadeTo(this.defaultAnimationAction, 1, false);
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
