import CollisionBody from './CollisionBody';
import ObjectPool from './ObjectPool';
import loopInterface from './loop';

const collisionBodyPool = new ObjectPool<CollisionBody>(2, CollisionBody, [1, 1]);

loopInterface.update = update;

export default {
    ...loopInterface,
    collisionBodyPool,
    obtainCollisionBody: collisionBodyPool.obtain,
    releaseCollisionBody: collisionBodyPool.release,
};

// HitBox (pos, owner, sprite, knock-back, duration, damage)t.top = this.position.y - this.height / 2;
function update(dt: number) {
    const len = collisionBodyPool.activeCount;
    for (let i = 0; i < len; i++) {
        // ToDo getSpatialPartition
        collisionBodyPool.items[i].move(dt, collisionBodyPool.items);
    }
}
