import * as THREE from 'three';

import AnimationHandler from '../AnimationHandler';
import CollisionBody from '../physicsSimulator/CollisionBody';
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
    animationHandler: AnimationHandler;
    pathFinder: PathFinder;
    model: any; // ToDo
    collisionBody = physicsSimulator.obtainCollisionBody();
    direction = new THREE.Vector2(1, 0);
    state: State = State.IDLE;
    attackSpeed = 1;
    movementSpeed = 14; // 1
    abilities = [];
    private tmp_targetQuaternion = new THREE.Quaternion();

    constructor(animationMixer: THREE.AnimationMixer) {
        this.pathFinder = new PathFinder();
        this.animationHandler = new AnimationHandler(animationMixer, {
            default: 'idle_passive',
        });

        this.model = animationMixer.getRoot();
        this.collisionBody.reConstruct(5, 5);
        this.collisionBody.listener.add('collision', this.onCollision);
    }

    update() {
        this.model.position.set(this.collisionBody.position.x, 0, this.collisionBody.position.y);
        if (this.collisionBody.velocity.x || this.collisionBody.velocity.y) {
            this.direction.copy(this.collisionBody.velocity).normalize();
            this.tmp_targetQuaternion.setFromAxisAngle(
                yAxis,
                -Math.atan2(this.collisionBody.velocity.y, this.collisionBody.velocity.x),
            );
            this.model.quaternion.slerp(this.tmp_targetQuaternion, 0.15);
        }
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
                // prepare / strike / recover
                // lock state?
                if (this.state !== State.IDLE) {
                    return;
                }
                swordSlash(this);
                this.animationHandler.playOnce('slash_inward')
                    .then(this.setState);
                break;
            default:
                this.collisionBody.velocity.set(0, 0);
                this.animationHandler.playDefault();
        }

        this.state = state;
    }

    moveTo = (x: number, y: number) => {
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

function swordSlash(owner: Entity) {
    const damage = 1;
    const angularSpeed = 0.05;
    const duration = 500;
    const range = 10;
    const hitBox = physicsSimulator.obtainCollisionBody();
    // ToDo
    const offset = new THREE.Vector2().copy(owner.direction).multiplyScalar(range);
    const position = new THREE.Vector2().copy(owner.position).add(offset);

    // get Direction
    hitBox.reConstruct(3, 3, position.x, position.y);
    hitBox.orbitAxis.copy(owner.position);
    hitBox.orbitalVelocity = angularSpeed;
    hitBox.listener.add('collision', onHit);

    window.setTimeout(() => {
        hitBox.listener.remove('collision', onHit);
        physicsSimulator.releaseCollisionBody(hitBox);
    }, duration);

    function onHit(collidingBodies: CollisionBody[]) {
        console.log('deal damage', collidingBodies.length, collidingBodies[0], hitBox);
    }
}
