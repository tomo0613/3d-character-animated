import * as THREE from 'three';
import { EventListener } from './common/EventListener';
import utils from './utils';

export enum EventType {
    KEY_UP,
    KEY_DOWN,
    MOUSE_DOWN,
}

const listener = new EventListener<EventType>();
const browserNavigationKeys = new Set([
    ' ',
    'Home', 'End',
    'PageUp', 'PageDown',
    'ArrowUp', 'ArrowRight', 'ArrowLeft', 'ArrowDown',
]);

export default {
    init,
    listener,
};

function init(scene: THREE.Scene, camera: THREE.Camera, canvas: HTMLCanvasElement) {
    let clickPositionResolver = initClickPositionResolver(scene, camera, canvas);

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);

    canvas.addEventListener('click', clickPositionResolver);

    window.addEventListener('resize', utils.debounce(() => {
        canvas.removeEventListener('click', clickPositionResolver);
        clickPositionResolver = initClickPositionResolver(scene, camera, canvas);
        canvas.addEventListener('click', clickPositionResolver);
    }, 500));

    return listener;
}

function onKeyDown(e: KeyboardEvent) {
    // prevent page scrolling
    if (browserNavigationKeys.has(e.key)) {
        e.preventDefault(); // ToDo prevent ctrl+f/s/w...
    }
    if (e.repeat) {
        return;
    }
    listener.dispatch(EventType.KEY_DOWN, e.key.toUpperCase());
}

function onKeyUp({ key }: KeyboardEvent) {
    listener.dispatch(EventType.KEY_UP, key.toUpperCase());
}

function initClickPositionResolver(scene: THREE.Scene, camera: THREE.Camera, canvas: HTMLCanvasElement) {
    const rayCaster = new THREE.Raycaster();
    const mouseNormalizedDeviceCoordinates = new THREE.Vector2();
    const groundPlane = scene.getObjectByName('groundPlane');
    const canvasBoundingRect = canvas.getBoundingClientRect();

    return (e: MouseEvent) => {
        mouseNormalizedDeviceCoordinates.set(
            ((e.clientX - canvasBoundingRect.left) / canvas.width) * 2 - 1,
            -((e.clientY - canvasBoundingRect.top) / canvas.height) * 2 + 1,
        );
        rayCaster.setFromCamera(mouseNormalizedDeviceCoordinates, camera);
        const [intersection] = rayCaster.intersectObject(groundPlane);

        if (intersection) {
            listener.dispatch(EventType.MOUSE_DOWN, intersection.point.x, intersection.point.z);
        }
    };
}
