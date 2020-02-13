import { ActionController, AnimationInfo } from './ActionController';
import CollisionBody from '../physicsSimulator/CollisionBody';
import Entity from '../entity/Entity';
import { HitBox } from './hit_box';
import ObjectPool from '../ObjectPool';
import effects from '../visualEffects/effects';

const hitBoxPool = new ObjectPool<HitBox>(5, HitBox);
const actionControllers = new Map<Entity, ActionController>();
let deltaTime = 0;

const actions = {
    castFireball(actionController: ActionController) {
        const effect = effects.fireBall;
        const effect2 = effects.explosion;
        const hitBox = hitBoxPool.obtain().spawn(actionController.owner, {
            ttl: 3,
            distance: 7,
            rotation: 0.5,
            speed: 120,
        });
        hitBox.listener.add('hit', (collidingBodies: CollisionBody[]) => {
            console.log('HIT - deal damage');
            hitBox.destroy();
            effect.clear();
            effect2.render();
            // ToDo async
            setTimeout(() => {
                effect2.clear();
            }, 2000);

            hitBoxPool.release(hitBox);
        });
        hitBox.listener.add('ttlExpired', () => {
            console.log('EXPIRY');
            effect.clear();
            // destroyed
            hitBoxPool.release(hitBox);
        });

        effect.position.y = 13;
        // ToDo fix rotation
        effect.rotation.y = actionController.owner.model.rotation.y;
        hitBox.visualEffect = effect;
        effect.render();
    },
    swordSlash() {
        const cfg = {
            hitBoxInitialDistance: 15,
            hitBoxInitialRotation: -Math.PI / 3,
            hitBoxAngularSpeed: 0.1,
        };
    },
    shieldBlock() {
        //
    },
};

export default {
    initAction(owner: Entity, type: keyof typeof actions, animationInfo: AnimationInfo) {
        const actionController = obtainActionController(owner, animationInfo);

        actionController.listener.clear();
        actionController.listener.add('strike', actions[type]);
        actionController.start();
    },
    update(dt: number) {
        deltaTime = dt;
        actionControllers.forEach(updateActionController);
        hitBoxPool.forActive(updateHitBox);
    },
};

function obtainActionController(owner: Entity, animationInfo: AnimationInfo) {
    // ToDo animation + s
    if (actionControllers.has(owner)) {
        return actionControllers.get(owner);
    }
    const actionController = new ActionController(owner, animationInfo);
    actionControllers.set(owner, actionController);

    return actionController;
}

function updateActionController(actionController: ActionController) {
    actionController.update(deltaTime);
}

function updateHitBox(hitBox: HitBox) {
    hitBox.update(deltaTime);
}

// this.abilities.attack1 = new Attack(this, {
//     animationName: 'cast-forward',
//     // duration: 1.46, // 44 frameCount
//     duration: 5.46, // 44 frameCount
//     // phaseTransitionTimes: [0.5, 0.6], // 15, 18 phaseTransitionFrames
//     phaseTransitionTimes: [0.5, 2],
//     hitBoxInitialDistance: 7,
// });

// this.abilities.swordSlash = new Attack(this, {
//     animationName: 'slash_inward',
//     duration: 1.66, // 51
//     phaseTransitionTimes: [0.6, 0.9], // 24 27
//     hitBoxInitialDistance: 15,
//     hitBoxInitialRotation: -Math.PI / 3,
//     hitBoxAngularSpeed: 0.1,
// });
