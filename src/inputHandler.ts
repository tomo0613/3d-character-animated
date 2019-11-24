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
    const mousePosition = new THREE.Vector2();
    const _onMouseMove = utils.throttle(onMouseMove);
    let clickPositionResolver = initClickPositionResolver();
    let intervalId: number;

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);

    canvas.addEventListener('mousedown', onMouseDown);
    canvas.addEventListener('mouseup', onMouseUp);

    window.addEventListener('resize', utils.debounce(() => {
        canvas.removeEventListener('click', clickPositionResolver);
        clickPositionResolver = initClickPositionResolver();
        canvas.addEventListener('click', clickPositionResolver);
    }, 500));

    return listener;

    function removeMouseListeners() {
        canvas.removeEventListener('mousemove', _onMouseMove);
        canvas.removeEventListener('mouseleave', onMouseLeave);

        window.clearInterval(intervalId);
    }

    function onMouseDown(e: MouseEvent) {
        mousePosition.set(e.clientX, e.clientY);
        intervalId = window.setInterval(clickPositionResolver, 200);

        canvas.addEventListener('mousemove', _onMouseMove);
        canvas.addEventListener('mouseleave', onMouseLeave);
    }

    function onMouseUp(e: MouseEvent) {
        mousePosition.set(e.clientX, e.clientY);
        clickPositionResolver();

        removeMouseListeners();
    }

    function onMouseMove(e: MouseEvent) {
        mousePosition.set(e.clientX, e.clientY);
    }

    function onMouseLeave() {
        removeMouseListeners();
    }

    function initClickPositionResolver() {
        const rayCaster = new THREE.Raycaster();
        const mouseNormalizedDeviceCoordinates = new THREE.Vector2();
        const groundPlane = scene.getObjectByName('groundPlane');
        const canvasBoundingRect = canvas.getBoundingClientRect();

        return () => {
            mouseNormalizedDeviceCoordinates.set(
                ((mousePosition.x - canvasBoundingRect.left) / canvas.width) * 2 - 1,
                -((mousePosition.y - canvasBoundingRect.top) / canvas.height) * 2 + 1,
            );
            rayCaster.setFromCamera(mouseNormalizedDeviceCoordinates, camera);
            const [intersection] = rayCaster.intersectObject(groundPlane);

            if (intersection) {
                listener.dispatch(EventType.MOUSE_DOWN, intersection.point.x, intersection.point.z);
            }
        };
    }
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
