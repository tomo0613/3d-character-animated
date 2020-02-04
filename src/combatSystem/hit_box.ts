import { Object3D, Vector2 } from 'three';

import CollisionBody from '../physicsSimulator/CollisionBody';
import Entity from '../entity/Entity';
import { EventListener } from '../common/EventListener';
import physicsSimulator from '../physicsSimulator/simulator';

const tmp_hitBoxPositionOffset = new Vector2();
const tmp_hitBoxInitialPosition = new Vector2();

export class HitBox {
    active: boolean;
    private lifeSpan = Infinity;
    private lifeTime = 0;
    private collisionBody: CollisionBody;
    listener = new EventListener<'hit'|'lifeSpanExpiration'>();
    radius = 2;
    visualEffect: Object3D;
    onLifeSpanExpiration: () => void;

    spawn(owner: Entity, { angularSpeed = 0, distance = 10, rotation = 0, speed = 0, lifeSpan = Infinity }) {
        // radius
        this.lifeTime = 0;
        this.lifeSpan = lifeSpan;
        tmp_hitBoxPositionOffset.copy(owner.direction).multiplyScalar(distance);
        tmp_hitBoxInitialPosition.copy(owner.position).add(tmp_hitBoxPositionOffset);
        tmp_hitBoxInitialPosition.rotateAround(owner.position, rotation);

        this.collisionBody = physicsSimulator.obtainCollisionBody();
        this.collisionBody.reConstruct(this.radius, tmp_hitBoxInitialPosition.x, tmp_hitBoxInitialPosition.y);
        this.collisionBody.orbitAxis.copy(owner.position);
        this.collisionBody.orbitalVelocity = angularSpeed;
        this.collisionBody.velocity.copy(owner.direction).multiplyScalar(speed);
        this.collisionBody.listener.add('collision', this.onHit);

        return this;
    }

    destroy() {
        this.listener.clear();
        physicsSimulator.releaseCollisionBody(this.collisionBody);
        this.collisionBody = undefined;
    }

    update(dt: number) {
        if (this.lifeSpan < Infinity) {
            this.lifeTime += dt;

            if (this.lifeTime >= this.lifeSpan) {
                this.listener.dispatch('lifeSpanExpiration');
                this.destroy();
                return;
            }
        }

        if (this.visualEffect) {
            this.visualEffect.position.x = this.collisionBody.position.x;
            this.visualEffect.position.z = this.collisionBody.position.y;
        }
    }

    private onHit = (collidingBodies: CollisionBody[]) => {
        this.listener.dispatch('hit', collidingBodies);
    }
}
