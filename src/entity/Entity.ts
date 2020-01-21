import * as THREE from 'three';

import AnimationHandler from '../AnimationHandler';
import { Attack } from './Attack';
import CollisionBody from '../physicsSimulator/CollisionBody';
import { FBX } from '../main';
import PathFinder from './PathFinder';
import physicsSimulator from '../physicsSimulator/simulator';

export enum State {
    IDLE = 'IDLE',
    WALK = 'WALK',
    ATTACK = 'ATTACK',
    DEATH = 'DEATH',
}

const yAxis = new THREE.Vector3(0, 1, 0);

export default class Entity {
    model: FBX;
    animationHandler: AnimationHandler;
    animationMixer: THREE.AnimationMixer;
    pathFinder: PathFinder;
    collisionBody = physicsSimulator.obtainCollisionBody();
    direction = new THREE.Vector2(1, 0);
    attackSpeed = 1;
    movementSpeed = 14; // 1
    state: State = State.IDLE;
    action: Attack|undefined;
    abilities: {[name: string]: Attack} = {};
    private tmp_targetQuaternion = new THREE.Quaternion();

    constructor(model: FBX) {
        this.model = model;
        this.pathFinder = new PathFinder();
        this.animationMixer = new THREE.AnimationMixer(model);
        this.animationHandler = new AnimationHandler(this.animationMixer, {
            default: 'idle_passive',
        });

        this.collisionBody.reConstruct(4);
        this.collisionBody.listener.add('collision', this.onCollision);

        this.abilities.swordSlash = new Attack(this, {
            animationName: 'slash_inward',
            duration: 1.66,
            phaseTransitionTimes: [0.6, 0.9],
            hitBoxInitialDistance: 15,
            hitBoxInitialRotation: -Math.PI / 3,
            hitBoxAngularSpeed: 0.1,
        });
    }

    update(elapsedTimeS: number) {
        this.model.position.set(this.collisionBody.position.x, 0, this.collisionBody.position.y);

        if (this.collisionBody.velocity.x || this.collisionBody.velocity.y) {
            this.direction.copy(this.collisionBody.velocity).normalize();
            this.tmp_targetQuaternion.setFromAxisAngle(
                yAxis,
                -Math.atan2(this.collisionBody.velocity.y, this.collisionBody.velocity.x),
            );
            this.model.quaternion.slerp(this.tmp_targetQuaternion, 0.15);
        }

        if (this.action) {
            this.action.update(elapsedTimeS);
        }
        this.animationMixer.update(elapsedTimeS);
    }

    setState = (state = State.IDLE) => {
        const repeatState = this.state === state;

        switch (state) {
            case State.WALK:
                if (this.state === State.ATTACK) {
                    return;
                }
                this.collisionBody.velocity
                    .copy(this.pathFinder.targetPosition)
                    .sub(this.collisionBody.position)
                    .normalize()
                    .multiplyScalar(this.movementSpeed);
                if (!repeatState) {
                    this.animationHandler.play('walk');
                }
                break;
            case State.ATTACK:
                // lock state?
                if (this.state !== State.IDLE) {
                    return;
                }
                this.action = this.abilities.swordSlash;
                this.action.perform();
                break;
            default:
                this.collisionBody.velocity.set(0, 0);
                this.animationHandler.playDefault();
        }

        this.state = state;
    }

    setTarget = (x: number, y: number) => {
        if (this.state === State.ATTACK) {
            return;
        }
        // ToDo mv to setState
        (this.state === State.WALK ? this.pathFinder.resetTarget(x, y) : this.pathFinder.setTarget(x, y))
            .then(this.onSetTarget)
            .catch();
    }

    attack = (x: number, y: number) => {
        if (this.state === State.IDLE) {
            this.setState(State.ATTACK);
        }
    }

    onSetTarget = () => {
        this.setState(State.WALK);
    }

    onCollision = (collidingBodies: CollisionBody[]) => {
        if (collidingBodies.includes(this.pathFinder.targetArea)) {
            physicsSimulator.releaseCollisionBody(this.pathFinder.targetArea);
            this.setState(State.IDLE);
        }
    }

    get position() {
        return this.collisionBody.position;
    }
}
