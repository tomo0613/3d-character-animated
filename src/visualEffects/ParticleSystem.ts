import * as THREE from 'three';

import { fragmentShader, vertexShader } from './shaders';
import { randomNumberBetween } from '../utils';

/**
 ToDo optimize ??
 only update properties if needed + only set buffer.needsUpdate if change happened
 */

export enum ParticleSystemShape {
    CONE,
    SPHERE,
}

interface ParticleProperties {
    texture: THREE.Texture;
    color: number;
    colorBySpeed?: number[]; /* [n: colorValue, n: speedValueToTriggerTransition, n: transitionAlpha(duration)] */
    size: number;
    sizeOverTime?: number;
    speed: number;
    speedOverTime?: number;
    speedRandomness?: number;
    rotationSpeed?: number;
    rotationSpeedRandomness?: number;
    ttl?: number;
}

interface ParticleSystemProperties {
    emissionShape: ParticleSystemShape;
    emissionRadius: number;
    maxParticleCount?: number;
    initialParticleCount: number;
    particle: ParticleProperties;
    emissionOverDistance?: number[]; /* [n: particleCount, n: distance] */
    emissionOverTime?: number[]; /* [n: particleCount, n: time] */
}

type BufferGeometryAttributeSetter = {
    setAttribute: (name: string, attribute: THREE.BufferAttribute) => THREE.BufferGeometry;
}

export class ParticleSystem {
    active = false;
    isHidden = true;
    particles: THREE.Points;
    private geometry = new THREE.BufferGeometry() as THREE.BufferGeometry & BufferGeometryAttributeSetter;
    private particleCount: number;
    private initialParticleCount: number;
    private particleSize: number;
    private particleSizeOverTime: number;
    private particleSpeed: number;
    private particleSpeedOverTime: number;
    private particleSpeedRandomness: number;
    private particleRotationSpeed: number;
    private particleRotationRandomness: number;
    private particleTTL: number;
    private emissionRadius: number;
    private particleColor: THREE.Color;
    private particleColorBySpeed?: THREE.Color;
    private particleColorTransitionTriggerSpeed?: number;
    private particleColorTransitionAlpha?: number;
    private emissionShape: ParticleSystemShape;
    private perviousPosition = new THREE.Vector3();
    private emissionRateOverDistance = 0;
    private emissionDistance = 0;
    private emissionRateOverTime = 0;
    private emissionTimeInterval = 0;
    private distanceTraveledSinceLastEmission = 0;
    private timePassedSinceLastEmission = 0;
    private lifeTime = 0;
    private particlesToEmit = 0;

    constructor(properties: ParticleSystemProperties) {
        // gravity ? spread ?
        this.initialParticleCount = Math.abs(properties.initialParticleCount);
        this.particleCount = Math.abs(properties.maxParticleCount) || this.initialParticleCount;
        this.particleSize = Math.abs(properties.particle.size);
        this.particleSizeOverTime = properties.particle.sizeOverTime || 0;
        this.particleSpeed = Math.abs(properties.particle.speed);
        this.particleSpeedRandomness = Math.abs(properties.particle.speedRandomness) || 0;
        this.particleSpeedOverTime = properties.particle.speedOverTime || 0;
        this.particleRotationSpeed = properties.particle.rotationSpeed || 0;
        this.particleRotationRandomness = Math.abs(properties.particle.rotationSpeedRandomness) || 0;
        this.particleTTL = Math.abs(properties.particle.ttl) || Infinity;
        this.emissionShape = properties.emissionShape;
        this.emissionRadius = Math.abs(properties.emissionRadius);
        this.particleColor = new THREE.Color(properties.particle.color);

        const uniforms = {
            globalColor: { value: this.particleColor },
            rendererScale: { value: this.particleSize },
            texture: { value: properties.particle.texture },
        };
        const material = new THREE.ShaderMaterial({
            uniforms,
            vertexShader,
            fragmentShader,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            transparent: true,
            vertexColors: THREE.VertexColors,
        });

        this.particles = new THREE.Points(this.geometry, material);

        if (properties.emissionOverDistance) {
            [this.emissionRateOverDistance, this.emissionDistance] = properties.emissionOverDistance;
        }
        if (properties.emissionOverTime) {
            [this.emissionRateOverTime, this.emissionTimeInterval] = properties.emissionOverTime;
        }
        if (properties.particle.colorBySpeed) {
            let colorValue: number;
            [
                colorValue, this.particleColorTransitionTriggerSpeed, this.particleColorTransitionAlpha,
            ] = properties.particle.colorBySpeed;

            this.particleColorBySpeed = new THREE.Color(colorValue);
        }

        this.generateParticleDataBuffers();
    }

    get position() {
        return this.particles.position;
    }

    get quaternion() {
        return this.particles.quaternion;
    }

    get rotation() {
        return this.particles.rotation;
    }

    resetParticles() {
        const positionBuffer = this.geometry.getAttribute('position') as THREE.Float32BufferAttribute;
        const rotationBuffer = this.geometry.getAttribute('rotation') as THREE.Float32BufferAttribute;
        const sizeBuffer = this.geometry.getAttribute('size') as THREE.Float32BufferAttribute;
        const directionBuffer = this.geometry.getAttribute('direction') as THREE.Float32BufferAttribute;
        const speedBuffer = this.geometry.getAttribute('speed') as THREE.Float32BufferAttribute;
        const colorBuffer = this.geometry.getAttribute('color') as THREE.Float32BufferAttribute;
        const alphaBuffer = this.geometry.getAttribute('alpha') as THREE.Float32BufferAttribute;
        const lifeTimeBuffer = this.geometry.getAttribute('lifeTime') as THREE.Float32BufferAttribute;

        for (let i = 0; i < this.particleCount; i++) {
            this.setInitialParticlePosition(positionBuffer, i);
            this.setInitialParticleRotation(rotationBuffer, i);
            this.setInitialParticleSize(sizeBuffer, i);
            this.setInitialParticleState(alphaBuffer, lifeTimeBuffer, i);
            this.setInitialParticleColor(colorBuffer, i);
            this.setInitialParticleDirection(directionBuffer, i);
            this.setInitialParticleSpeed(speedBuffer, i);
        }

        positionBuffer.needsUpdate = true;
        rotationBuffer.needsUpdate = true;
        sizeBuffer.needsUpdate = true;
        colorBuffer.needsUpdate = true;
        alphaBuffer.needsUpdate = true;
    }

    render = () => {
        if (this.isHidden) {
            this.isHidden = false;
            this.particles.visible = true;
        }
    }

    clear = () => {
        this.isHidden = true;
        this.particles.visible = false;
        this.lifeTime = 0;
        this.distanceTraveledSinceLastEmission = 0;
        this.timePassedSinceLastEmission = 0;
        this.resetParticles();
    }

    update = (dt: number) => {
        if (this.isHidden) {
            return;
        }
        if (this.lifeTime) {
            this.distanceTraveledSinceLastEmission += this.perviousPosition.distanceTo(this.position);
        } else {
            this.emitParticles(this.initialParticleCount);
        }
        this.lifeTime += dt;
        this.timePassedSinceLastEmission += dt;

        if (this.emissionRateOverTime && this.timePassedSinceLastEmission > this.emissionTimeInterval) {
            this.timePassedSinceLastEmission = 0;
            this.emitParticles(this.emissionRateOverTime);
        }
        if (this.emissionRateOverDistance && this.distanceTraveledSinceLastEmission > this.emissionDistance) {
            this.distanceTraveledSinceLastEmission = 0;
            this.emitParticles(this.emissionRateOverDistance);
        }
        this.perviousPosition.copy(this.position);

        this.updateParticles(dt);
    }

    private emitParticles(count: number) {
        this.particlesToEmit += count;
    }

    private updateParticles = (dt: number) => {
        const positionBuffer = this.geometry.getAttribute('position') as THREE.Float32BufferAttribute;
        const rotationBuffer = this.geometry.getAttribute('rotation') as THREE.Float32BufferAttribute;
        const sizeBuffer = this.geometry.getAttribute('size') as THREE.Float32BufferAttribute;
        const directionBuffer = this.geometry.getAttribute('direction') as THREE.Float32BufferAttribute;
        const speedBuffer = this.geometry.getAttribute('speed') as THREE.Float32BufferAttribute;
        const colorBuffer = this.geometry.getAttribute('color') as THREE.Float32BufferAttribute;
        const alphaBuffer = this.geometry.getAttribute('alpha') as THREE.Float32BufferAttribute;
        const lifeTimeBuffer = this.geometry.getAttribute('lifeTime') as THREE.Float32BufferAttribute;

        for (let i = 0; i < this.particleCount; i++) {
            const alpha = alphaBuffer.getX(i);
            const lifeTime = lifeTimeBuffer.getX(i);
            const size = sizeBuffer.getX(i);
            const dirX = directionBuffer.getX(i);
            const dirY = directionBuffer.getY(i);
            const dirZ = directionBuffer.getZ(i);
            let speed = speedBuffer.getX(i);
            let posX = positionBuffer.getX(i);
            let posY = positionBuffer.getY(i);
            let posZ = positionBuffer.getZ(i);

            if (!alpha) {
                if (!this.particlesToEmit) {
                    continue;
                }
                alphaBuffer.setX(i, 1); /* set particle active */
                this.particlesToEmit--;
            }
            if (lifeTime > this.particleTTL || size < 0) {
                this.setInitialParticlePosition(positionBuffer, i);
                this.setInitialParticleRotation(rotationBuffer, i);
                this.setInitialParticleSize(sizeBuffer, i);
                this.setInitialParticleState(alphaBuffer, lifeTimeBuffer, i); /* set particle inactive */
                this.setInitialParticleColor(colorBuffer, i);
                this.setInitialParticleDirection(directionBuffer, i);
                this.setInitialParticleSpeed(speedBuffer, i);
                continue;
            }
            if (this.particleSpeedOverTime) {
                speed = Math.max(0, speed + this.particleSpeedOverTime * lifeTime);
            }
            posX += dirX * speed;
            posY += dirY * speed;
            posZ += dirZ * speed;
            positionBuffer.setXYZ(i, posX, posY, posZ);

            if (this.particleSizeOverTime) {
                sizeBuffer.setX(i, size + this.particleSizeOverTime);
            }
            lifeTimeBuffer.setX(i, lifeTime + dt);
            speedBuffer.setX(i, speed);
            this.setParticleRotation(rotationBuffer, i);
            this.setParticleColorBySpeed(colorBuffer, i, speed);
        }

        positionBuffer.needsUpdate = true;
        rotationBuffer.needsUpdate = true;
        sizeBuffer.needsUpdate = true;
        colorBuffer.needsUpdate = true;
        alphaBuffer.needsUpdate = true;

        if (this.particlesToEmit) {
            console.warn(`Not enough particles [${this.particlesToEmit}]`);
        }
        this.particlesToEmit = 0;
    }

    private setParticleRotation(rotationBuffer: THREE.Float32BufferAttribute, index: number) {
        let r = rotationBuffer.getX(index);

        if (r > Math.PI * 2) {
            r = this.particleRotationSpeed;
        } else if (r < -Math.PI * 2) {
            r = -this.particleRotationSpeed;
        }
        r += Math.sign(r) * this.particleRotationSpeed;

        rotationBuffer.setX(index, r);
    }

    private setInitialParticleRotation(rotationBuffer: THREE.Float32BufferAttribute, index: number) {
        rotationBuffer.setX(
            index,
            this.particleRotationSpeed
                + randomNumberBetween(-this.particleRotationRandomness, this.particleRotationRandomness),
        );
    }

    private setInitialParticleSpeed(speedBuffer: THREE.Float32BufferAttribute, index: number) {
        speedBuffer.setX(
            index,
            Math.abs(
                this.particleSpeed + randomNumberBetween(-this.particleSpeedRandomness, this.particleSpeedRandomness),
            ),
        );
    }

    private setInitialParticlePosition(positionBuffer: THREE.Float32BufferAttribute, index: number) {
        positionBuffer.setXYZ(
            index,
            randomNumberBetween(-1, 1) * this.emissionRadius,
            randomNumberBetween(-1, 1) * this.emissionRadius,
            randomNumberBetween(-1, 1) * this.emissionRadius,
        );
    }

    private setInitialParticleSize(sizeBuffer: THREE.Float32BufferAttribute, index: number) {
        sizeBuffer.setX(index, randomNumberBetween(this.particleSize / 2, this.particleSize));
    }

    // eslint-disable-next-line class-methods-use-this
    private setInitialParticleState(
        alphaBuffer: THREE.Float32BufferAttribute, lifeTimeBuffer: THREE.Float32BufferAttribute, index: number,
    ) {
        alphaBuffer.setX(index, 0);
        lifeTimeBuffer.setX(index, 0);
    }

    private setInitialParticleDirection(directionBuffer: THREE.Float32BufferAttribute, index: number) {
        let x = 0;
        let y = 0;
        let z = 0;

        if (this.emissionShape === ParticleSystemShape.SPHERE) {
            x = randomNumberBetween(-1, 1);
            y = randomNumberBetween(-1, 1);
            z = randomNumberBetween(-1, 1);
            // normalize
            const length = Math.sqrt(x * x + y * y + z * z);
            x /= length;
            y /= length;
            z /= length;
        } else {
            x = -1;
        }

        directionBuffer.setXYZ(index, x, y, z);
    }

    private setInitialParticleColor(colorBuffer: THREE.Float32BufferAttribute, index: number) {
        colorBuffer.setXYZ(index, this.particleColor.r, this.particleColor.g, this.particleColor.b);
    }

    private setParticleColorBySpeed(colorBuffer: THREE.Float32BufferAttribute, index: number, speed: number) {
        if (!this.particleColorBySpeed || speed < this.particleColorTransitionTriggerSpeed) {
            return;
        }
        const r = colorBuffer.getX(index);
        const g = colorBuffer.getY(index);
        const b = colorBuffer.getZ(index);

        colorBuffer.setXYZ(
            index,
            r + (this.particleColorBySpeed.r - r) * this.particleColorTransitionAlpha,
            g + (this.particleColorBySpeed.g - g) * this.particleColorTransitionAlpha,
            b + (this.particleColorBySpeed.b - b) * this.particleColorTransitionAlpha,
        );
    }

    private generateParticleDataBuffers() {
        const positionBuffer = new THREE.Float32BufferAttribute({ length: this.particleCount * 3 }, 3);
        const rotationBuffer = new THREE.Float32BufferAttribute({ length: this.particleCount }, 1);
        const sizeBuffer = new THREE.Float32BufferAttribute({ length: this.particleCount }, 1);
        const colorBuffer = new THREE.Float32BufferAttribute({ length: this.particleCount * 3 }, 3);
        const alphaBuffer = new THREE.Float32BufferAttribute({ length: this.particleCount }, 1);
        const directionBuffer = new THREE.Float32BufferAttribute({ length: this.particleCount * 3 }, 3);
        const speedBuffer = new THREE.Float32BufferAttribute({ length: this.particleCount }, 1);
        const lifeTimeBuffer = new THREE.Float32BufferAttribute({ length: this.particleCount }, 1);

        for (let i = 0; i < this.particleCount; i++) {
            this.setInitialParticlePosition(positionBuffer, i);
            this.setInitialParticleRotation(rotationBuffer, i);
            this.setInitialParticleSize(sizeBuffer, i);
            this.setInitialParticleColor(colorBuffer, i);
            this.setInitialParticleState(alphaBuffer, lifeTimeBuffer, i);
            this.setInitialParticleDirection(directionBuffer, i);
            this.setInitialParticleSpeed(speedBuffer, i);
        }

        this.geometry.setAttribute('position', positionBuffer);
        this.geometry.setAttribute('rotation', rotationBuffer);
        this.geometry.setAttribute('size', sizeBuffer);
        this.geometry.setAttribute('color', colorBuffer);
        this.geometry.setAttribute('alpha', alphaBuffer);
        this.geometry.setAttribute('direction', directionBuffer);
        this.geometry.setAttribute('speed', speedBuffer);
        this.geometry.setAttribute('lifeTime', lifeTimeBuffer);
    }
}
