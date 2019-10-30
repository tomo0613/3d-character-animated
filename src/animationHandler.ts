type AnimationLoopEvent = THREE.Event & {action: THREE.AnimationAction, loopDelta: number};

interface AnimationHandlerConfig {
    default: string;
}

const crossFadeDuration = 1;

export class AnimationHandler {
    private mixer: THREE.AnimationMixer;
    private defaultAnimationAction: THREE.AnimationAction;

    constructor(animationMixer: THREE.AnimationMixer, config: AnimationHandlerConfig) {
        this.mixer = animationMixer;

        this.defaultAnimationAction = this.getAnimationActionByName(config.default);
    }

    playDefault = () => {
        this.start(this.defaultAnimationAction);
    }

    // ToDo keyof config...
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

    // ToDo keyof config...
    private getAnimationActionByName(animationName: string) {
        return (<any>this.mixer.clipAction)(animationName) as THREE.AnimationAction;
    }
}
