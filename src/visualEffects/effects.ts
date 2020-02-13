import { Scene, Texture } from 'three';

import { ParticleSystem, ParticleSystemShape } from './ParticleSystem';

let fireBall: ParticleSystem;
let explosion: ParticleSystem;

export default {
    init,
    get explosion() {
        return explosion;
    },
    get fireBall() {
        return fireBall;
    },
};

function init(scene: Scene, texture: Texture) {
    fireBall = new ParticleSystem({
        emissionShape: ParticleSystemShape.CONE,
        emissionRadius: 1,
        emissionOverDistance: [10, 5],
        initialParticleCount: 30,
        maxParticleCount: 300,
        particle: {
            texture,
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
    });
    scene.add(fireBall.particles);

    explosion = new ParticleSystem({
        emissionShape: ParticleSystemShape.SPHERE,
        emissionRadius: 2,
        initialParticleCount: 250,
        particle: {
            texture,
            color: 0xF77B0E,
            colorBySpeed: [0x4C442A, 1.1, 0.4],
            size: 100,
            speed: 1,
            speedRandomness: 0.5,
            rotationSpeed: 0.3,
            rotationSpeedRandomness: 1,
            sizeOverTime: -2,
            speedOverTime: -0.015,
            ttl: 2,
        },
    });
    scene.add(explosion.particles);

    return function update(dt: number) {
        fireBall.update(dt);
        explosion.update(dt);
    };
}

// function testSphere() {
//     const material = new MeshBasicMaterial({ color: 0xff0000 });
//     const geometry = new SphereBufferGeometry(2, 4, 4);
//     const sphere = new Mesh(geometry, material);
//     sphere.position.y = 10;
//     return sphere;
// }
