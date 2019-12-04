import { Vector2 } from 'three';

import { EventListener } from '../common/EventListener';

export default class CollisionBody {
    position: Vector2;
    radius: number;
    velocity = new Vector2();
    orbitAxis = new Vector2();
    orbitalVelocity = 0;
    blocking = false;
    listener = new EventListener<'collision'>();
    collidingBodies: CollisionBody[] = [];

    constructor(radius: number, x = 0, y = 0) {
        this.position = new Vector2(x, y);
        this.radius = radius;
    }

    reConstruct(radius: number, x = 0, y = 0) {
        this.position.set(x, y);
        this.velocity.set(0, 0);
        this.orbitAxis.set(0, 0);
        this.orbitalVelocity = 0;
        this.radius = radius;
        this.listener.clear();
    }

    move(timeStep: number, nearCollisionBodies: CollisionBody[]) {
        this.collidingBodies.length = 0;

        if (this.velocity.x || this.velocity.y || this.orbitalVelocity) {
            const originX = this.position.x;
            const originY = this.position.y;

            if (this.orbitalVelocity) {
                this.position.rotateAround(this.orbitAxis, this.orbitalVelocity);
            }

            this.position.x += this.velocity.x * timeStep;
            this.position.y += this.velocity.y * timeStep;

            if (this.detectCollision(nearCollisionBodies)) {
                this.position.set(originX, originY);
            }
        }

        if (this.collidingBodies.length) {
            this.listener.dispatch('collision', this.collidingBodies);
        }
    }

    private detectCollision(nearCollisionBodies: CollisionBody[]) {
        const nearCollisionBodyCount = nearCollisionBodies.length;
        let blockMovement = false;
        let collisionBody: CollisionBody;

        for (let i = 0; i < nearCollisionBodyCount; i++) {
            collisionBody = nearCollisionBodies[i];

            if (collisionBody === this) {
                continue;
            }

            // https://stackoverflow.com/questions/401847/circle-rectangle-collision-detection-intersection#402010
            if (this.position.distanceTo(collisionBody.position) < this.radius + collisionBody.radius) {
                if (!this.collidingBodies.includes(collisionBody)) {
                    this.collidingBodies.push(collisionBody);
                }
                blockMovement = collisionBody.blocking || blockMovement;
            }
        }

        return blockMovement;
    }
}
