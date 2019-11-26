import { Vector2 } from 'three';

import { BoundingRect } from './BoundingRect';
import { EventListener } from '../common/EventListener';

export default class CollisionBody {
    position: Vector2;
    velocity = new Vector2();
    orbitAxis = new Vector2();
    orbitalVelocity = 0;
    blocking = false;
    listener = new EventListener<'collision'>();
    collidingBodies: CollisionBody[] = [];
    private _boundingRect: BoundingRect;

    constructor(width: number, height: number, x = 0, y = 0) {
        this.position = new Vector2(x, y);
        this._boundingRect = new BoundingRect(width, height, x, y);
    }

    reConstruct(width: number, height: number, x = 0, y = 0) {
        this.position.set(x, y);
        this.velocity.set(0, 0);
        this.orbitAxis.set(0, 0);
        this.orbitalVelocity = 0;
        this.width = width;
        this.height = height;
        this._boundingRect.update();
        this.listener.clear();
    }

    move(timeStep: number, nearCollisionBodies: CollisionBody[]) {
        this.collidingBodies.length = 0;

        if (this.velocity.x || this.velocity.y || this.orbitalVelocity) {
            const originX = this.position.x;
            const originY = this.position.y;
            const cos = Math.cos(this.orbitalVelocity);
            const sin = Math.sin(this.orbitalVelocity);
            const { x, y } = this.position.sub(this.orbitAxis);

            this.position.x = (this.orbitalVelocity
                ? x * cos - y * sin + this.orbitAxis.x
                : this.position.x) + this.velocity.x * timeStep;

            if (this.detectCollision(nearCollisionBodies)) {
                this.position.x = originX;
            }

            this.position.y = (this.orbitalVelocity
                ? x * sin + y * cos + this.orbitAxis.y
                : this.position.y) + this.velocity.y * timeStep;

            if (this.detectCollision(nearCollisionBodies)) {
                this.position.y = originY;
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
            if (this.boundingRect.top > collisionBody.boundingRect.bottom
                && this.boundingRect.right > collisionBody.boundingRect.left
                && this.boundingRect.bottom < collisionBody.boundingRect.top
                && this.boundingRect.left < collisionBody.boundingRect.right
            ) {
                if (!this.collidingBodies.includes(collisionBody)) {
                    this.collidingBodies.push(collisionBody);
                }
                blockMovement = collisionBody.blocking || blockMovement;
            }
        }

        return blockMovement;
    }

    set width(width: number) {
        this._boundingRect.width = width;
    }

    get width() {
        return this._boundingRect.width;
    }

    set height(height: number) {
        this._boundingRect.height = height;
    }

    get height() {
        return this._boundingRect.height;
    }

    private get boundingRect() {
        if (!this.position.equals(this._boundingRect.position)) {
            this._boundingRect.position.copy(this.position);
            this._boundingRect.update();
        }

        return this._boundingRect;
    }
}
