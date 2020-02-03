import CollisionBody from './CollisionBody';
import ObjectPool from '../ObjectPool';
import loopInterface from './loop';

// ToDo dynamic count
const collisionBodyPool = new ObjectPool<CollisionBody>(10, CollisionBody, [1]);

loopInterface.update = (dt: number) => {
    for (let i = collisionBodyPool.activeCount - 1; i >= 0; i--) {
        // ToDo getSpatialPartition
        collisionBodyPool.items[i].move(dt, collisionBodyPool.items);
    }
};

export default {
    ...loopInterface,
    collisionBodyPool,
    obtainCollisionBody: collisionBodyPool.obtain,
    releaseCollisionBody: collisionBodyPool.release,
};
