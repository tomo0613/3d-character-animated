import { Vector2 } from 'three';

import { BoundingRect } from './BoundingRect';

export default class CollisionBody {
    width: number;
    height: number;
    position: Vector2;
    velocity = new Vector2();
    collidingBodies: CollisionBody[] = [];
    private _boundingRect: BoundingRect;

    constructor(width: number, height: number, x = 0, y = 0) {
        this.position = new Vector2(x, y);
        this._boundingRect = new BoundingRect(width, height, x, y);
    }

    // addEventListener()
    onHit = () => {}

    move(timeStep: number, map: any) {
        const nearCollisionBodies = []; // map.getNearCollisionBodies
        this.collidingBodies.length = 0;

        if (this.velocity.x) {
            const originX = this.position.x;

            this.position.x += this.velocity.x * timeStep;

            if (this.detectCollision(nearCollisionBodies)) {
                this.position.x = originX;
            }
        }

        if (this.velocity.y) {
            const originY = this.position.y;

            this.position.y += this.velocity.y * timeStep;

            if (this.detectCollision(nearCollisionBodies)) {
                this.position.y = originY;
            }
        }

        if (this.collidingBodies.length) {
            // this.intersectionObserver.broadcast(this.intersectingObjects);
        }
    }

    private detectCollision(nearCollisionBodies: CollisionBody[]) {
        const nearCollisionBodyCount = nearCollisionBodies.length;
        let colliding = false;
        let collisionBody: CollisionBody;

        for (let i = 0; i < nearCollisionBodyCount; i++) {
            collisionBody = nearCollisionBodies[i];

            if (this.boundingRect.top < collisionBody.boundingRect.bottom
                && this.boundingRect.right > collisionBody.boundingRect.left
                && this.boundingRect.bottom > collisionBody.boundingRect.top
                && this.boundingRect.left < collisionBody.boundingRect.right
            ) {
                this.collidingBodies.push(collisionBody);
                colliding = true;
            }
        }

        return colliding;
    }

    private get boundingRect() {
        if (!this.position.equals(this._boundingRect.position)) {
            this._boundingRect.position.copy(this.position);
            this._boundingRect.update();
        }

        return this._boundingRect;
    }
}
