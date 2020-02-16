import { Vector2 } from 'three';

import CollisionBody from '../physicsSimulator/CollisionBody';
import physicsSimulator from '../physicsSimulator/simulator';

const targetAreaCollisionBodyProps = {
    radius: 1,
};

export default class PathFinder {
    originPosition = new Vector2();
    targetPosition = new Vector2();
    targetArea: CollisionBody;

    async setTarget(x: number, y: number) {
        this.targetPosition.set(x, y);
        this.targetArea = physicsSimulator.obtainCollisionBody().construct(targetAreaCollisionBodyProps);
        this.targetArea.position.set(x, y);

        return this.targetArea;
    }

    async resetTarget(x: number, y: number) {
        this.targetPosition.set(x, y);
        this.targetArea.position.copy(this.targetPosition);

        return this.targetArea;
    }
}
