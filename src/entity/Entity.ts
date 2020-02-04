import * as THREE from 'three';
import { GLTF } from 'three/examples/jsm/loaders/GLTFLoader';

import AnimationHandler, { AnimationHandlerConfig } from '../AnimationHandler';
import CollisionBody from '../physicsSimulator/CollisionBody';
import PathFinder from './PathFinder';
import combatSystem from '../combatSystem/combatSystem';
import physicsSimulator from '../physicsSimulator/simulator';

export enum State {
    IDLE = 'IDLE',
    WALK = 'WALK',
    ATTACK = 'ATTACK',
    DEATH = 'DEATH',
}

const yAxis = new THREE.Vector3(0, 1, 0);

export default class Entity {
    model: THREE.Object3D;
    animationHandler: AnimationHandler;
    animationMixer: THREE.AnimationMixer;
    pathFinder: PathFinder;
    collisionBody: CollisionBody;
    direction = new THREE.Vector2(1, 0);
    attackSpeed = 1;
    movementSpeed = 14; // 1
    state: State = State.IDLE;
    private tmp_targetQuaternion = new THREE.Quaternion();

    constructor(model: GLTF, scene: THREE.Scene, animationConfig: AnimationHandlerConfig) {
        this.model = model.scene;
        this.pathFinder = new PathFinder();
        this.animationMixer = new THREE.AnimationMixer(model.scene);
        this.animationHandler = new AnimationHandler(this.animationMixer, model.animations, animationConfig);

        this.collisionBody = physicsSimulator.obtainCollisionBody().reConstruct(4);
        this.collisionBody.listener.add('collision', this.onCollision);

        this.animationHandler.playDefault();
        scene.add(this.model);
    }

    update(elapsedTimeS: number) {
        this.model.position.x = this.collisionBody.position.x;
        this.model.position.z = this.collisionBody.position.y;

        if (this.collisionBody.velocity.x || this.collisionBody.velocity.y) {
            this.direction.copy(this.collisionBody.velocity).normalize();
            this.tmp_targetQuaternion.setFromAxisAngle(
                yAxis,
                -Math.atan2(this.collisionBody.velocity.y, this.collisionBody.velocity.x),
            );
            this.model.quaternion.slerp(this.tmp_targetQuaternion, 0.15);
        }

        this.animationMixer.update(elapsedTimeS);
    }

    setState = (state = State.IDLE) => {
        // assertState(this.state, state);
        const isNewState = this.state !== state;

        switch (state) {
            case State.WALK:
                if (this.state !== State.IDLE && this.state !== State.WALK) {
                    return;
                }
                this.collisionBody.velocity
                    .copy(this.pathFinder.targetPosition)
                    .sub(this.collisionBody.position)
                    .normalize()
                    .multiplyScalar(this.movementSpeed);
                if (isNewState) {
                    this.animationHandler.play('walk');
                }
                break;
            case State.ATTACK:
                // lock state?
                if (this.state !== State.IDLE) {
                    return;
                }
                combatSystem.initAction(this, 'castFireball', {
                    animationDuration: 1.46,
                    animationPhaseTransitionTimes: [0.5, 0.6],
                });
                this.animationHandler.playOnce('cast-forward')
                    .then(this.setState);
                // this.animationHandler.
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
