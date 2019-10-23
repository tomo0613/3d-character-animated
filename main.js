import * as THREE from './node_modules/three/build/three.module.js';
import { OrbitControls } from './node_modules/three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from './node_modules/three/examples/jsm/loaders/GLTFLoader.js';
import { FBXLoader } from './node_modules/three/examples/jsm/loaders/FBXLoader.js';
import CONFIG from './config.js';

window.paused = false;

(async function init() {
    const clock = new THREE.Clock();
    const renderer = new THREE.WebGLRenderer({alpha: CONFIG.transparentBackground, antialias: CONFIG.antialias});
    renderer.gammaFactor = 2.2;
    renderer.gammaOutput = true;
    renderer.shadowMap.enabled = CONFIG.renderShadows;

    renderer.setSize(CONFIG.viewWidth, CONFIG.viewHeight);
    document.body.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    buildEnvironment(scene);

    const character = await loadModel('./3D-Objects/Paladin.fbx');
    character.traverse((node) => {
        if (node.material) {
            node.material.side = THREE.DoubleSide;
        }
        if (CONFIG.renderShadows && node.isMesh) {
            node.castShadow = true;
            node.receiveShadow = true;
        }
    });
    scene.add(character);

    const _animationMixer = new THREE.AnimationMixer(character);
    initCharacterAnimationController(_animationMixer, character);
    
    const renderContext = {
        _animationMixer,
        _renderer: renderer,
        _scene: scene,
        _camera: initCamera(),
        _clock: clock,
    };
    const _render = render.bind(renderContext);
    renderContext._render = _render;
    const handlers = {
        onPause: () => {
            if (window.paused) {
                clock.stop();
            } else {
                clock.start();
                _render();
            }
        },
    };

    _render();

    return handlers;
})().then((handlers) => {
    window.addEventListener('keyup', (e) => {
        if (e.key.toUpperCase() === 'P') {
            window.paused = !window.paused;
            handlers.onPause();
        }
    });
});

function render() {
    if (window.paused) {
        return;
    }
    this._animationMixer.update(this._clock.getDelta());

    this._renderer.render(this._scene, this._camera);

    requestAnimationFrame(this._render);
}

function initCamera() {
    const camera = new THREE.PerspectiveCamera(CONFIG.fieldOfView, CONFIG.aspectRatio, CONFIG.cameraNear, CONFIG.cameraFar);
    const cameraController = new OrbitControls(camera);
    
    camera.position.x = -25;
    camera.position.y = 20;

    cameraController.target = new THREE.Vector3(0, 10, 0);
    cameraController.minDistance = 2;
    cameraController.update();

    return camera;
}

function initCharacterAnimationController(animationMixer, character) {
    const controllerContainer = Object.assign(document.createElement('aside'), {id: 'animation-controller-container'});
    const animations = character.animations.filter(animation => !/^Armature\|\w+/.test(animation.name));

    animations.forEach((animation, index) => {
        const button = Object.assign(
            document.createElement('input'),
            {type: 'radio', name: 'animation', id: animation.name, value: index, onchange: onChange},
        );
        const label = Object.assign(document.createElement('label'), {textContent: animation.name});
        label.setAttribute('for', button.id);
        const input = document.createElement('div');
        input.appendChild(button);
        input.appendChild(label);
        controllerContainer.appendChild(input);
        document.body.appendChild(controllerContainer);
    });

    function onChange(e) {
        const selectedAnimation = animations[e.currentTarget.value];
        animationMixer.stopAllAction()
        animationMixer.clipAction(selectedAnimation).play();
    }

    animationMixer.clipAction(animations.find(animation => animation.name === 'idle_bored')).play();
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
    
    const grid = new THREE.GridHelper(2000, 20, 0x000000, 0x000000);
    grid.material.opacity = 0.2;
    grid.material.transparent = true;
    scene.add(grid);
}

function loadModel(resourceUrl) {
    let loader;
    const extension = resourceUrl.split('.').pop().toUpperCase();

    switch (extension) {
        case 'GLB':
        case 'GLTF':
            loader = new GLTFLoader();
            break;
        case 'FBX':
            loader = new FBXLoader();
            break;
        default:
            console.error(`Failed to load resource: "${resourceUrl}" due it has unknown extension`);
            return Promise.reject(null);
    }

    return new Promise((resolve, reject) => {
        const onLoad = (resource) => resolve(resource);
        const onProgress = () => {};
        const onError = (e) => {
            console.error('Failed to load resource: ' + e);
            reject(e);
        };

        loader.load(resourceUrl, onLoad, onProgress, onError);
    });
}
