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

export default class Entity {
    animationHandler: AnimationHandler;
    pathFinder: PathFinder;
    model: any; // ToDo
    collisionBody = physicsSimulator.obtainCollisionBody();
    state: State = State.IDLE;
    movementSpeed = 14;

    constructor(animationMixer: THREE.AnimationMixer) {
        this.pathFinder = new PathFinder();
        this.animationHandler = new AnimationHandler(animationMixer, {
            default: 'idle_passive',
        });

        this.model = animationMixer.getRoot();
        this.collisionBody.reset(5, 5);
        this.collisionBody.listener.add('collision', this.onCollision);
    }

    update() {
        this.model.position.set(this.collisionBody.position.x, 0, this.collisionBody.position.y);
        if (this.collisionBody.velocity.x || this.collisionBody.velocity.y) {
            this.model.rotation.y = -Math.atan2(this.collisionBody.velocity.y, this.collisionBody.velocity.x);
        }
    }

    moveTo(x: number, y: number) {
        (this.state === State.WALK ? this.pathFinder.resetTarget(x, y) : this.pathFinder.setTarget(x, y))
            .then(this.onSetTarget)
            .catch();
    }

    setState(state: State) {
        const stateChanged = this.state !== state;
        this.state = state;

        switch (state) {
            case State.IDLE:
                this.collisionBody.velocity.set(0, 0);
                this.animationHandler.playDefault();
                break;
            case State.WALK:
                this.collisionBody.velocity
                    .copy(this.pathFinder.targetPosition)
                    .sub(this.collisionBody.position)
                    .normalize()
                    .multiplyScalar(this.movementSpeed);
                if (stateChanged) {
                    this.animationHandler.play('walk');
                }
                break;
            default:
                break;
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
}
