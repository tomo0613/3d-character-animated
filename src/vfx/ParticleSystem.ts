import * as THREE from 'three';

import { fragmentShader, vertexShader } from './shaders';
import { randomNumberBetween } from '../utils';

interface ParticleSystemConfig {
    count: number;
    size: number;
    radius: number;
    speed: number;
    rotationSpeed?: number;
    maxDistance: number;
    colorValue: number;
}

type BufferGeometryAttributeSetter = {
    setAttribute: (name: string, attribute: THREE.BufferAttribute) => THREE.BufferGeometry;
}

export class ParticleSystem {
    particles: THREE.Points;
    private geometry = new THREE.BufferGeometry() as THREE.BufferGeometry & BufferGeometryAttributeSetter;
    private particleCount: number;
    private particleSize: number;
    private particleSpeed: number;
    private particleRotationSpeed: number;
    private radius: number;
    private maxDistance: number;
    private color: THREE.Color;

    constructor({ count, radius, size, maxDistance, speed, rotationSpeed, colorValue }: ParticleSystemConfig) {
        // loop: boolean;
        //
        // emission
        //   rate over time
        //   rate over distance ()
        //   burst
        //
        // shape
        //    cone | sphere | hemisphere

        this.particleCount = count;
        this.particleSize = size;
        this.particleSpeed = speed;
        this.particleRotationSpeed = rotationSpeed;
        this.radius = radius;
        this.maxDistance = maxDistance;
        this.color = new THREE.Color(colorValue);
        this.particles = new THREE.Points(this.geometry, getMaterial(this.color, size));

        this.generateParticleDataBuffers();
    }

    get position() {
        return this.particles.position;
    }

    get rotation() {
        return this.particles.rotation;
    }

    update = (dt: number) => {
        const positionBuffer = this.geometry.getAttribute('position') as THREE.Float32BufferAttribute;
        const rotationBuffer = this.geometry.getAttribute('rotation') as THREE.Float32BufferAttribute;
        const sizeBuffer = this.geometry.getAttribute('size') as THREE.Float32BufferAttribute;

        for (let i = 0; i < this.particleCount; i++) {
            let x = positionBuffer.getX(i);
            let y = positionBuffer.getY(i);
            let z = positionBuffer.getZ(i);
            const lengthSquared = x * x + y * y + z * z;

            if (lengthSquared > this.maxDistance * this.maxDistance) {
                this.setInitialParticlePosition(positionBuffer, i);
                this.setInitialParticleRotation(rotationBuffer, i);
                this.setInitialParticleSize(sizeBuffer, i);
                continue;
            }

            // acceleration / speedOverTime
            x -= Math.abs(x) / 10 + this.particleSpeed;
            positionBuffer.setXYZ(i, x, y, z);

            this.setParticleRotation(rotationBuffer, i);
            if (lengthSquared > 25) {
                sizeBuffer.setX(i, sizeBuffer.getX(i) - 1);
            }
        }
        positionBuffer.needsUpdate = true;
        rotationBuffer.needsUpdate = true;
        sizeBuffer.needsUpdate = true;
    }

    private setInitialParticlePosition(positionBuffer: THREE.Float32BufferAttribute, index: number) {
        positionBuffer.setXYZ(
            index,
            randomNumberBetween(-1, 1) * this.radius,
            randomNumberBetween(-1, 1) * this.radius,
            randomNumberBetween(-1, 1) * this.radius,
        );
    }

    private setInitialParticleRotation(rotationBuffer: THREE.Float32BufferAttribute, index: number) {
        rotationBuffer.setX(index, Math.sign(Math.random() - 0.5) * this.particleRotationSpeed);
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

    private setInitialParticleSize(sizeBuffer: THREE.Float32BufferAttribute, index: number) {
        sizeBuffer.setX(index, this.particleSize);
    }

    private setParticleColor(colorBuffer: THREE.Float32BufferAttribute, index: number) {
        colorBuffer.setXYZ(index, this.color.r, this.color.g, this.color.b);
    }

    private generateParticleDataBuffers() {
        const positionBuffer = new THREE.Float32BufferAttribute({ length: this.particleCount * 3 }, 3);
        const rotationBuffer = new THREE.Float32BufferAttribute({ length: this.particleCount }, 1);
        const sizeBuffer = new THREE.Float32BufferAttribute({ length: this.particleCount }, 1);
        const colorBuffer = new THREE.Float32BufferAttribute({ length: this.particleCount * 3 }, 3);
        const alphaBuffer = new THREE.Float32BufferAttribute({ length: this.particleCount }, 1);

        for (let i = 0; i < this.particleCount; i++) {
            this.setInitialParticlePosition(positionBuffer, i);
            this.setInitialParticleRotation(rotationBuffer, i);
            this.setParticleColor(colorBuffer, i);
            this.setInitialParticleSize(sizeBuffer, i);
            alphaBuffer.setX(i, 1);
        }

        this.geometry.setAttribute('position', positionBuffer);
        this.geometry.setAttribute('rotation', rotationBuffer);
        this.geometry.setAttribute('size', sizeBuffer);
        this.geometry.setAttribute('color', colorBuffer);
        this.geometry.setAttribute('alpha', alphaBuffer);
    }
}

function getMaterial(color: THREE.Color, size: number) {
    // ToDo load async
    const uniforms = {
        globalColor: { value: color },
        rendererScale: { value: size },
        texture: { value: new THREE.TextureLoader().load('assets/sprites/particle1.png') },
    };

    return new THREE.ShaderMaterial({
        uniforms,
        vertexShader,
        fragmentShader,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        depthTest: false,
        transparent: true,
        vertexColors: THREE.VertexColors,
    });
}
