import { ParticleSystem } from './ParticleSystem';

const particleSettings = {
    fireBall: {
        count: 100,
        size: 50,
        speed: 0.1,
        rotationSpeed: 0.1,
        maxDistance: 40,
        radius: 2,
        colorValue: 0xF77B0E,
    },
    // explosion: {},
};

export default {
    get fireBall() {
        return new ParticleSystem(particleSettings.fireBall);
    },
};
