import CollisionBody from './CollisionBody';
import ObjectPool from '../ObjectPool';
import loopInterface from './loop';

const collisionBodyPool = new ObjectPool<CollisionBody>(10, CollisionBody, [1]);
let deltaTime: number;

loopInterface.update = (dt: number) => {
    deltaTime = dt;
    collisionBodyPool.forActive(moveCollisionBody);
};

function moveCollisionBody(collisionBody: CollisionBody) {
    collisionBody.move(deltaTime, collisionBodyPool.items);
}

export default {
    ...loopInterface,
    collisionBodyPool,
    obtainCollisionBody: collisionBodyPool.obtain,
    releaseCollisionBody: collisionBodyPool.release,
};
