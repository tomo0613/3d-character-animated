import { Mesh, MeshBasicMaterial, Scene, SphereBufferGeometry } from 'three';

import { ActionController, AnimationInfo } from './ActionController';
import Entity from '../entity/Entity';
import { HitBox } from './hit_box';
import ObjectPool from '../ObjectPool';

const hitBoxPool = new ObjectPool<HitBox>(5, HitBox);
const actionControllers = new Map<Entity, ActionController>();
let gScene: Scene;
let dt = 0;

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
    actionController.update(dt);
}

const actions = {
    castFireball(actionController: ActionController) {
        // ToDo get config
        const effect = vfx();
        const hitBox = hitBoxPool.obtain();
        hitBox.onHit = (c) => {
            console.log('HitBox hit', c.length, c[0]);
            hitBoxPool.release(hitBox);
            gScene.remove(effect);
        };
        hitBox.spawn(actionController.owner, {
            lifeSpan: 3,
            distance: 7,
            speed: 100,
        });
        hitBox.visualEffect = effect;
        gScene.add(effect);
        hitBox.onLifeSpanExpiration = () => {
            hitBoxPool.release(hitBox);
            gScene.remove(effect);
        };
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
    init(scene: Scene) {
        gScene = scene;
    },
    initAction(owner: Entity, type: keyof typeof actions, animationInfo: AnimationInfo) {
        const actionController = obtainActionController(owner, animationInfo);

        actionController.listener.clear();
        actionController.listener.add('strike', actions[type]);
        actionController.start();
    },
    update(delta: number) {
        dt = delta;

        actionControllers.forEach(updateActionController);

        for (let i = hitBoxPool.activeCount - 1; i >= 0; i--) {
            hitBoxPool.items[i].update(dt);
        }
    },
};

function vfx() {
    const material = new MeshBasicMaterial({ color: 0xff0000 });
    const geometry = new SphereBufferGeometry(2, 4, 4);
    const cube = new Mesh(geometry, material);
    cube.position.y = 10;

    return cube;
}

// private onHit = (collidingBodies: CollisionBody[]) => {
//     console.log(
//         'deal damage',
//         collidingBodies.length,
//         JSON.stringify(collidingBodies[0].position),
//         JSON.stringify(this.hitBox.position),
//     );
// }

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
