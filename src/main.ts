import * as THREE from 'three';
import { GLTF } from 'three/examples/jsm/loaders/GLTFLoader';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

import inputHandler, { EventType } from './inputHandler';
import CONFIG from './config';
import Entity from './entity/Entity';
import combatSystem from './combatSystem/combatSystem';
import physicsSimulator from './physicsSimulator/simulator';
import utils from './utils';
import { ParticleSystem } from './vfx/ParticleSystem';

export type FBX = THREE.Group & {
    animations: THREE.AnimationClip[];
};

let paused = false;

window.addEventListener('DOMContentLoaded', async () => {
    const handlers = await init();

    inputHandler.listener.add(EventType.KEY_UP, (key: string) => {
        if (key === 'P') {
            paused = !paused;
            handlers.togglePause();
        }
    });
});

async function init() {
    const clock = new THREE.Clock();
    const renderer = new THREE.WebGLRenderer({ alpha: CONFIG.transparentBackground, antialias: CONFIG.antialias });
    renderer.gammaFactor = 2.2;
    renderer.gammaOutput = true;
    renderer.shadowMap.enabled = CONFIG.renderShadows;

    document.body.appendChild(renderer.domElement);
    renderer.setSize(CONFIG.viewWidth, CONFIG.viewHeight);

    const camera = new THREE.PerspectiveCamera(
        CONFIG.fieldOfView,
        CONFIG.aspectRatio,
        CONFIG.cameraNear,
        CONFIG.cameraFar,
    );
    const scene = new THREE.Scene();
    buildEnvironment(scene);

    let sorceressGLTF: GLTF;
    let paladinGLTF: GLTF;

    try {
        [sorceressGLTF, paladinGLTF] = await Promise.all([
            utils.loadModel('assets/3D-Objects/Sorceress.glb'),
            utils.loadModel('assets/3D-Objects/Paladin.glb'),
        ]);
    } catch (e) {
        console.error(e);
    }

    const sorceressModel = sorceressGLTF.scene;
    const paladinModel = paladinGLTF.scene;

    sorceressModel.traverse(setMeshProperties);
    paladinModel.traverse(setMeshProperties);

    const updateCamera = initCamera(camera, sorceressModel.position);

    const character = new Entity(sorceressGLTF, scene, {
        default: 'idle',
        IDLE: 'idle',
        WALK: 'walk',
        ATTACK: 'cast-forward',
        // DEATH: 'collapse',
    });
    const companion = new Entity(paladinGLTF, scene, {
        default: 'idle',
        IDLE: 'idle',
        WALK: 'walk',
        ATTACK: 'slash_inward',
        DEATH: 'collapse',
    });
    companion.position.set(10, -10);

    // ToDo rm
    const fireBall = new ParticleSystem({
        count: 100,
        size: 50,
        speed: 0.1,
        rotationSpeed: 0.1,
        maxDistance: 50,
        radius: 2,
        colorValue: 0xF77B0E,
    });
    fireBall.position.set(0, 13, 10);
    fireBall.rotation.y = 1;
    scene.add(fireBall.particles);

    initCharacterAnimationController(character);
    const renderCollisionBodies = initPhysicsDebugRender(physicsSimulator, scene);
    const entities = [character, companion];
    const entityCount = entities.length;
    let dt = 0;

    function render(elapsedTime = performance.now()) {
        if (paused) {
            return;
        }
        dt = clock.getDelta();

        combatSystem.update(dt);
        physicsSimulator.step(elapsedTime);

        // ToDo rm
        renderCollisionBodies();

        for (let i = 0; i < entityCount; i++) {
            entities[i].update(dt);
        }

        // ToDo rm
        fireBall.update(dt);

        updateCamera();
        renderer.render(scene, camera);

        requestAnimationFrame(render);
    }

    combatSystem.init(scene);
    physicsSimulator.start();
    render();

    inputHandler.init(scene, camera, renderer.domElement);
    inputHandler.listener.add(EventType.MOUSE_DOWN, character.setTarget);
    inputHandler.listener.add(EventType.KEY_UP, (key: string) => {
        if (key === 'X') {
            character.attack(0, 0);
        }
    });

    return {
        togglePause: () => {
            if (paused) {
                physicsSimulator.stop();
                clock.stop();
            } else {
                physicsSimulator.start();
                clock.start();
                render();
            }
        },
    };
}

function setMeshProperties(node: any/* ToDo THREE.Object3D & THREE.Mesh */) {
    if (CONFIG.renderShadows && node.isMesh) {
        node.castShadow = true;
        node.receiveShadow = true;
    }
}

function initCamera(camera: THREE.PerspectiveCamera, targetPosition: THREE.Vector3) {
    // const cameraController = new OrbitControls(camera);
    // cameraController.target = new THREE.Vector3(0, 10, 0);
    // cameraController.minDistance = 10;
    // cameraController.update();
    const cameraPositionOffset = new THREE.Vector3(-100, 50, 0);
    const cameraDirectionOffset = new THREE.Vector3(0, 10, 0);
    const cameraPosition = new THREE.Vector3();
    const cameraDirection = new THREE.Vector3();

    updateCameraPosition();

    return updateCameraPosition;

    function updateCameraPosition() {
        cameraPosition.copy(targetPosition).add(cameraPositionOffset);
        cameraDirection.copy(targetPosition).add(cameraDirectionOffset);
        camera.position.copy(cameraPosition);
        camera.lookAt(cameraDirection);
    }
}

// ToDo rm
function initCharacterAnimationController(entity: Entity) {
    const controllerContainer = Object.assign(
        document.createElement('aside'),
        { id: 'animation-controller-container' },
    );
    const buttons: HTMLButtonElement[] = [];

    entity.animationHandler.animations.forEach((animation, animationName) => {
        const button = Object.assign(
            document.createElement('button'),
            { textContent: animationName, onclick: onClick },
        );
        button.dataset.animation_name = animationName;
        controllerContainer.appendChild(button);

        buttons.push(button);
    });
    document.body.appendChild(controllerContainer);

    function onClick({ currentTarget }: MouseEvent & {currentTarget: HTMLButtonElement}) {
        setButtonsDisabledAttribute(true);
        entity.animationHandler.playOnce(currentTarget.dataset.animation_name).then(() => {
            setButtonsDisabledAttribute(false);
        });
    }

    function setButtonsDisabledAttribute(disabled: boolean) {
        buttons.forEach((button) => {
            button.disabled = disabled;
        });
    }
}

function buildEnvironment(scene: THREE.Scene) {
    scene.background = new THREE.Color(0xa0a0a0);
    scene.fog = new THREE.Fog(0xa0a0a0, 200, 1000);

    const ambientLight = new THREE.HemisphereLight(0xffffff, 0x444444);
    ambientLight.position.set(0, 200, 0);
    scene.add(ambientLight);

    const light = new THREE.DirectionalLight(0xffffff);
    light.position.set(0, 200, 100);
    light.castShadow = CONFIG.renderShadows;
    if (CONFIG.renderShadows) {
        light.shadow.camera.top = 180;
        light.shadow.camera.bottom = -100;
        light.shadow.camera.left = -120;
        light.shadow.camera.right = 120;
    }
    scene.add(light);

    const groundPlane = new THREE.Mesh(
        new THREE.PlaneBufferGeometry(2000, 2000),
        new THREE.MeshPhongMaterial({ color: 0x444444, depthWrite: false }),
    );
    groundPlane.name = 'groundPlane';
    groundPlane.rotation.x = -Math.PI / 2;
    groundPlane.receiveShadow = CONFIG.renderShadows;
    scene.add(groundPlane);

    // ToDo types
    const grid: any = new THREE.GridHelper(2000, 20, 0x000000, 0x000000);
    grid.material.opacity = 0.2;
    grid.material.transparent = true;
    scene.add(grid);
}

// ToDo rm
function initPhysicsDebugRender(_physicsSimulator: typeof physicsSimulator, scene: THREE.Scene) {
    const circles = Array.from({ length: _physicsSimulator.collisionBodyPool.items.length }).map(createCircle);

    return () => {
        const { activeCount } = _physicsSimulator.collisionBodyPool;
        const len = circles.length;
        let circle: THREE.Mesh;

        for (let i = 0; i < len; i++) {
            circle = circles[i];
            circle.visible = i < activeCount;
            if (circle.visible) {
                const collisionBody = _physicsSimulator.collisionBodyPool.items[i];
                circle.scale.set(collisionBody.radius, collisionBody.radius, 1);
                circle.position.set(collisionBody.position.x, 0, collisionBody.position.y);
            }
        }
    };

    function createCircle() {
        const square = new THREE.Mesh(
            new THREE.CircleBufferGeometry(1, 8),
            new THREE.MeshPhongMaterial({ color: 0x33BB11, depthWrite: false }),
        );
        square.rotation.x = -Math.PI / 2;
        scene.add(square);

        return square;
    }
}
