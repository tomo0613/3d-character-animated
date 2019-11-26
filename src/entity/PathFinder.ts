import { Vector2 } from 'three';

import CollisionBody from '../physicsSimulator/CollisionBody';
import physicsSimulator from '../physicsSimulator/simulator';

export default class PathFinder {
    originPosition = new Vector2();
    targetPosition = new Vector2();
    targetArea: CollisionBody;

    async setTarget(x: number, y: number) {
        this.targetPosition.set(x, y);
        this.targetArea = physicsSimulator.obtainCollisionBody();
        this.targetArea.reConstruct(1, 1, x, y);

        return this.targetArea;
    }

    async resetTarget(x: number, y: number) {
        this.targetPosition.set(x, y);
        this.targetArea.position.copy(this.targetPosition);

        return this.targetArea;
    }
}