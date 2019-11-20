import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

import AnimationHandler from './AnimationHandler';
import CONFIG from './config';
import Entity from './entity/Entity';
import inputHandler, { EventType } from './inputHandler';
import physicsSimulator from './physicsSimulator/simulator';
import utils from './utils';

type FBX = THREE.Group & {
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
    initCamera(camera);
    const scene = new THREE.Scene();
    buildEnvironment(scene);

    let characterModel: FBX;

    try {
        characterModel = await utils.loadModel('assets/3D-Objects/Paladin.fbx') as FBX;
    } catch (e) {
        console.error(e);
    }

    characterModel.traverse((node: any/* THREE.Object3D & THREE.Mesh */) => {
        if (node.material) {
            node.material.side = THREE.DoubleSide;
        }
        if (CONFIG.renderShadows && node.isMesh) {
            node.castShadow = true;
            node.receiveShadow = true;
        }
    });

    scene.add(characterModel);

    const animationMixer = new THREE.AnimationMixer(characterModel);
    const character = new Entity(animationMixer);
    initCharacterAnimationController(animationMixer);
    const renderCollisionBodies = initPhysicsDebugRender(physicsSimulator, scene);

    function render(elapsedTime = performance.now()) {
        if (paused) {
            return;
        }
        physicsSimulator.step(elapsedTime);
        // ToDo rm
        renderCollisionBodies();
        // character.update(clock.getDelta()); // ToDo
        character.update();
        animationMixer.update(clock.getDelta());

        renderer.render(scene, camera);

        requestAnimationFrame(render);
    }

    physicsSimulator.start();
    render();

    inputHandler.init(scene, camera, renderer.domElement);
    // ToDo mouse move
    inputHandler.listener.add(EventType.MOUSE_DOWN, (x: number, y: number) => {
        character.moveTo(x, y);
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

function initCamera(camera: THREE.PerspectiveCamera) {
    const cameraController = new OrbitControls(camera);

    camera.position.x = -30;
    camera.position.y = 20;

    cameraController.target = new THREE.Vector3(0, 10, 0);
    cameraController.minDistance = 10;
    cameraController.update();
}

// ToDo rm
function initCharacterAnimationController(animationMixer: THREE.AnimationMixer) {
    const animationHandler = new AnimationHandler(animationMixer, {
        default: 'idle_passive',
    });

    const controllerContainer = Object.assign(
        document.createElement('aside'),
        { id: 'animation-controller-container' },
    );
    const animations = (animationMixer.getRoot() as FBX).animations
        .filter((animation) => !/^Armature\|\w+/.test(animation.name));

    animations.forEach((animation) => {
        const button = Object.assign(
            document.createElement('button'),
            { textContent: animation.name, onclick: onClick },
        );
        button.dataset.animation_name = animation.name;
        controllerContainer.appendChild(button);
    });
    document.body.appendChild(controllerContainer);

    animationHandler.playDefault();

    function onClick({ currentTarget }: MouseEvent & {currentTarget: HTMLButtonElement}) {
        currentTarget.disabled = true;

        animationHandler.playOnce(currentTarget.dataset.animation_name).then(() => {
            currentTarget.disabled = false;
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
    const squares = Array.from({ length: _physicsSimulator.collisionBodyPool.items.length }).map(createSquare);

    return () => {
        const { activeCount } = _physicsSimulator.collisionBodyPool;
        const len = squares.length;
        let square: THREE.Mesh;

        for (let i = 0; i < len; i++) {
            square = squares[i];
            square.visible = i < activeCount;
            if (square.visible) {
                const collisionBody = _physicsSimulator.collisionBodyPool.items[i];
                square.scale.set(collisionBody.width, collisionBody.height, 1);
                square.position.set(collisionBody.position.x, 0, collisionBody.position.y);
            }
        }
    };

    function createSquare() {
        const square = new THREE.Mesh(
            new THREE.PlaneBufferGeometry(1, 1),
            new THREE.MeshPhongMaterial({ color: 0x33BB11, depthWrite: false }),
        );
        square.rotation.x = -Math.PI / 2;
        scene.add(square);

        return square;
    }
}
