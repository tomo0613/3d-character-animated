import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import CONFIG from './config';
import utils from './utils';
import {AnimationHandler} from './animationHandler';

type FBX = THREE.Group & {
    animations: THREE.AnimationClip[]
};

let paused = false;

window.addEventListener('DOMContentLoaded', async () => {
    const handlers = await init();

    window.addEventListener('keyup', (e) => {
        if (e.key.toUpperCase() === 'P') {
            paused = !paused;
            handlers.onPause();
        }
    });
});

async function init() {
    const clock = new THREE.Clock();
    const renderer = new THREE.WebGLRenderer({alpha: CONFIG.transparentBackground, antialias: CONFIG.antialias});
    renderer.gammaFactor = 2.2;
    renderer.gammaOutput = true;
    renderer.shadowMap.enabled = CONFIG.renderShadows;

    renderer.setSize(CONFIG.viewWidth, CONFIG.viewHeight);
    document.body.appendChild(renderer.domElement);

    const camera = new THREE.PerspectiveCamera(CONFIG.fieldOfView, CONFIG.aspectRatio, CONFIG.cameraNear, CONFIG.cameraFar);
    initCamera(camera);
    const scene = new THREE.Scene();
    buildEnvironment(scene);

    const character = await utils.loadModel('assets/3D-Objects/Paladin.fbx') as FBX;

    character.traverse((node: any/* THREE.Object3D & THREE.Mesh*/) => {
        if (node.material) {
            node.material.side = THREE.DoubleSide;
        }
        if (CONFIG.renderShadows && node.isMesh) {
            node.castShadow = true;
            node.receiveShadow = true;
        }
    });
    scene.add(character);

    const animationMixer = new THREE.AnimationMixer(character);
    initCharacterAnimationController(animationMixer);

    function render() {
        if (paused) {
            return;
        }
        animationMixer.update(clock.getDelta());
    
        renderer.render(scene, camera);
    
        requestAnimationFrame(render);
    };
    render();

    return {
        onPause: () => {
            if (paused) {
                clock.stop();
            } else {
                clock.start();
                render();
            }
        },
    };
}

function initCamera(camera: THREE.PerspectiveCamera) {
    const cameraController = new OrbitControls(camera);
    
    camera.position.x = -25;
    camera.position.y = 20;

    cameraController.target = new THREE.Vector3(0, 10, 0);
    cameraController.minDistance = 2;
    cameraController.update();
}

function initCharacterAnimationController(animationMixer: THREE.AnimationMixer) {
    const animationHandler = new AnimationHandler(animationMixer, {
        default: 'idle_passive',
    });

    const controllerContainer = Object.assign(document.createElement('aside'), {id: 'animation-controller-container'});
    const animations = (<FBX>animationMixer.getRoot()).animations.filter(animation => !/^Armature\|\w+/.test(animation.name));

    animations.forEach((animation) => {
        const button = Object.assign(
            document.createElement('button'),
            {textContent: animation.name, onclick: onClick},
        );
        button.dataset.animation_name = animation.name;
        controllerContainer.appendChild(button);
    });
    document.body.appendChild(controllerContainer);

    animationHandler.playDefault();

    function onClick({currentTarget}: MouseEvent & {currentTarget: HTMLButtonElement}) {
        currentTarget.disabled = true;
      
        animationHandler.playOnce(currentTarget.dataset.animation_name).then(() => {
            currentTarget.disabled = false;
            animationHandler.playDefault();
        });
    }
}

function buildEnvironment(scene) {
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
        new THREE.MeshPhongMaterial({color: 0x444444, depthWrite: false}),
    );
    groundPlane.rotation.x = -Math.PI / 2;
    groundPlane.receiveShadow = CONFIG.renderShadows;
    scene.add(groundPlane);
    
    // ToDo types 
    const grid: any = new THREE.GridHelper(2000, 20, 0x000000, 0x000000);
    grid.material.opacity = 0.2;
    grid.material.transparent = true;
    scene.add(grid);
}
