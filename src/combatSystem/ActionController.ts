import Entity from '../entity/Entity';
import { EventListener } from '../common/EventListener';

const animationPhases = ['prepare', 'strike', 'recover'] as const;

export interface AnimationInfo {
    animationDuration: number;
    animationPhaseTransitionTimes: [number, number];
}
// interface ConfigurableProps {
//     animationName: string;
//     hitBoxInitialDistance: number;
//     hitBoxInitialRotation: number;
//     hitBoxAngularSpeed: number;
//     duration: number;
//     phaseTransitionTimes: [number, number];
// }

// type Config = Partial<ConfigurableProps>;

export class ActionController {
    listener = new EventListener<typeof animationPhases[number]>();
    active = false;
    owner: Entity;
    private animationDuration = 1;
    private animationPhaseTransitionTimes = [0, 1];
    private phaseIndex = 0;
    private progress = 0;

    constructor(owner: Entity, animationInfo: AnimationInfo) {
        this.owner = owner;
        Object.entries(animationInfo).forEach(([property, value]) => {
            this[property] = value;
        });
    }

    start = () => {
        this.active = true;
        this.phaseIndex = 0;
        this.progress = 0;

        this.listener.dispatch('prepare', this);
    }

    update = (elapsedTimeS: number) => {
        this.progress += elapsedTimeS;

        if (animationPhases[this.phaseIndex] !== 'recover'
            && this.progress >= this.animationPhaseTransitionTimes[this.phaseIndex]
        ) {
            this.phaseIndex++;

            if (animationPhases[this.phaseIndex] === 'strike') {
                this.listener.dispatch('strike', this);
            } else if (animationPhases[this.phaseIndex] === 'recover') {
                this.listener.dispatch('recover', this);
            }
        }
    }

    private finish = () => {
        // this.owner.setState();
        // this.owner.action = undefined;
    }
}
