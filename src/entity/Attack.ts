import { Vector2 } from 'three';

import CollisionBody from '../physicsSimulator/CollisionBody';
import Entity from './Entity';
import physicsSimulator from '../physicsSimulator/simulator';

const attackPhases = ['prepare', 'strike', 'recover'];

interface ConfigurableProps {
    animationName: string;
    hitBoxInitialDistance: number;
    hitBoxInitialRotation: number;
    hitBoxAngularSpeed: number;
    duration: number;
    phaseTransitionTimes: [number, number];
}

type Config = Partial<ConfigurableProps>;

export class Attack {
    private animationName: string;
    private owner: Entity;
    private hitBox: CollisionBody;
    private hitBoxInitialPosition = new Vector2();
    private hitBoxPositionOffset = new Vector2();
    private hitBoxInitialDistance = 0;
    private hitBoxInitialRotation = 0;
    private hitBoxAngularSpeed = 0;
    private duration = 1;
    private phaseTransitionTimes = [0, 1];
    private phaseIndex = 0;
    private progress = 0;
    private inProgress = false;
    damage = 1;


    constructor(owner: Entity, config: Config) {
        this.owner = owner;
        Object.entries(config).forEach(([property, value]) => {
            this[property] = value;
        });
    }

    perform = () => {
        this.phaseIndex = 0;
        this.progress = 0;
        this.inProgress = true;
        this.owner.animationHandler.playOnce(this.animationName)
            .then(this.finish);
    }

    update = (elapsedTimeS: number) => {
        this.progress += elapsedTimeS;

        if (attackPhases[this.phaseIndex] !== 'recover'
            && this.progress >= this.phaseTransitionTimes[this.phaseIndex]
        ) {
            this.phaseIndex++;

            if (attackPhases[this.phaseIndex] === 'strike') {
                this.spawnHitBox();
            } else if (attackPhases[this.phaseIndex] === 'recover') {
                this.clearHitBox();
            }
        }
    }

    private finish = () => {
        this.owner.setState();
        this.owner.action = undefined;
    }

    private spawnHitBox() {
        this.hitBox = physicsSimulator.obtainCollisionBody();

        this.hitBoxPositionOffset.copy(this.owner.direction).multiplyScalar(this.hitBoxInitialDistance);
        this.hitBoxInitialPosition.copy(this.owner.position).add(this.hitBoxPositionOffset);
        this.hitBoxInitialPosition.rotateAround(this.owner.position, this.hitBoxInitialRotation);

        this.hitBox.reConstruct(2, this.hitBoxInitialPosition.x, this.hitBoxInitialPosition.y);
        this.hitBox.orbitAxis.copy(this.owner.position);
        this.hitBox.orbitalVelocity = this.hitBoxAngularSpeed;
        this.hitBox.listener.add('collision', this.onHit);
    }

    private clearHitBox() {
        this.hitBox.listener.remove('collision', this.onHit);
        physicsSimulator.releaseCollisionBody(this.hitBox);

        this.hitBox = undefined;
    }

    private onHit = (collidingBodies: CollisionBody[]) => {
        console.log(
            'deal damage',
            collidingBodies.length,
            JSON.stringify(collidingBodies[0].position),
            JSON.stringify(this.hitBox.position),
        );
    }
}
