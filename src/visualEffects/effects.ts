import { Scene, Texture } from 'three';

import { ParticleSystem, ParticleSystemShape } from './ParticleSystem';
import ObjectPool from '../ObjectPool';

const effectProperties = {
    explosion: {
        emissionShape: ParticleSystemShape.SPHERE,
        emissionRadius: 2,
        initialParticleCount: 250,
        particle: {
            texture: undefined,
            color: 0xF77B0E,
            colorBySpeed: [0x4C442A, 1.1, 0.4],
            size: 60,
            speed: 1,
            speedRandomness: 0.5,
            rotationSpeed: 0.2,
            rotationSpeedRandomness: 2,
            sizeOverTime: -1.5,
            speedOverTime: -0.5,
            ttl: 0.5,
        },
    },
    fireBall: {
        emissionShape: ParticleSystemShape.CONE,
        emissionRadius: 1,
        emissionOverDistance: [10, 5],
        initialParticleCount: 30,
        maxParticleCount: 300,
        particle: {
            texture: undefined,
            color: 0xF77B0E,
            colorBySpeed: [0x4C442A, 1.1, 0.4],
            speed: 0,
            speedOverTime: 0.5,
            size: 50,
            sizeOverTime: -1.5,
            rotationSpeed: 0.2,
            rotationSpeedRandomness: 0.2,
            ttl: 0.5,
        },
    },
};

function getEffectPropertiesWithTexture(effect: keyof typeof effectProperties, texture: Texture) {
    const properties = effectProperties[effect];
    properties.particle.texture = texture;

    return properties;
}

let deltaTime = 0;
let fireBallPool: ObjectPool<ParticleSystem>;
let explosionPool: ObjectPool<ParticleSystem>;

function init(scene: Scene, texture: Texture) {
    let i = 3;
    const explosionProperties = getEffectPropertiesWithTexture('explosion', texture);
    const fireBallProperties = getEffectPropertiesWithTexture('fireBall', texture);
    explosionPool = new ObjectPool(i, ParticleSystem, [explosionProperties]);
    fireBallPool = new ObjectPool(i, ParticleSystem, [fireBallProperties]);

    while (i--) {
        scene.add(
            explosionPool.items[i].particles,
            fireBallPool.items[i].particles,
        );
    }

    return function update(dt: number) {
        deltaTime = dt;
        explosionPool.forActive(updateEffect);
        fireBallPool.forActive(updateEffect);
    };
}

function updateEffect(effect: ParticleSystem) {
    effect.update(deltaTime);
}

function getEffectFromPool(effectPool: ObjectPool<ParticleSystem>) {
    const effect = effectPool.obtain();
    const clearEffect = effect.clear;

    effect.clear = () => {
        clearEffect();
        effectPool.release(effect);
        effect.clear = clearEffect;
    };

    return effect;
}

export default {
    init,
    get explosion() {        
        return getEffectFromPool(explosionPool);
    },
    get fireBall() {
        return getEffectFromPool(fireBallPool);
    },
};

// function testSphere() {
//     const material = new MeshBasicMaterial({ color: 0xff0000 });
//     const geometry = new SphereBufferGeometry(2, 4, 4);
//     const sphere = new Mesh(geometry, material);
//     sphere.position.y = 10;
//     return sphere;
// }
