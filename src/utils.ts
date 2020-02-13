import { GLTF, GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { Texture, TextureLoader } from 'three';

const progressDisplayContainer = document.getElementById('progress-display-container');
const supportedExtensions = ['GLB', 'GLTF'];

export default {
    debounce,
    throttle,
    loadModel,
    loadTexture,
};

function loadModel(resourceUrl: string) {
    let finished = false;
    let progressDisplay: HTMLElement;
    const loader = new GLTFLoader();
    const extension = resourceUrl.split('.').pop().toUpperCase();

    if (!supportedExtensions.includes(extension)) {
        return Promise.reject(new Error(`Failed to load model: "${resourceUrl}" due it has unsupported extension`));
    }

    return new Promise<GLTF>((resolve, reject) => {
        const onLoad = (resource: GLTF) => {
            resolve(resource);
        };
        const onError = (e) => {
            console.error(`Failed to load model: ${e}`);
            reject(e);
        };

        loader.load(resourceUrl, onLoad, onProgress, onError);
    });

    function onProgress({ total, loaded }: ProgressEvent) {
        finished = total === loaded;

        if (!progressDisplay) {
            addProgressDisplay();
        }
        updateProgressDisplay(total, loaded);
        if (finished) {
            if (progressDisplay) {
                removeProgressDisplay();
            }
        }
    }

    function addProgressDisplay() {
        progressDisplay = document.createElement('aside');
        progressDisplay.classList.add('progress-display', 'visible');
        progressDisplayContainer.appendChild(progressDisplay);
    }

    function updateProgressDisplay(total: number, loaded: number) {
        progressDisplay.textContent = `\
            Loading model: ${resourceUrl} (${bytesToReadable(loaded, 'M')} / ${bytesToReadable(total, 'M')}MB)\
        `;
    }

    function removeProgressDisplay() {
        progressDisplay.classList.add('fade-out');
        progressDisplay.addEventListener('transitionend', () => {
            progressDisplayContainer.removeChild(progressDisplay);
            progressDisplay = null;

            if (!progressDisplayContainer.childElementCount) {
                progressDisplayContainer.hidden = true;
            }
        });
    }
}

function loadTexture(resourceUrl: string) {
    const loader = new TextureLoader();

    return new Promise<Texture>((resolve, reject) => {
        const onLoad = (resource: Texture) => {
            resolve(resource);
        };
        const onError = (e) => {
            console.error(`Failed to load texture: ${e}`);
            reject(e);
        };

        loader.load(resourceUrl, onLoad, undefined, onError);
    });
}

function bytesToReadable(value: number, scale: 'k'|'M'|'G'|'T') {
    let result = value;
    const n = ['k', 'M', 'G', 'T'].indexOf(scale) + 1;

    for (let i = 0; i < n; i++) {
        result /= 1024;
    }

    return result.toFixed(2);
}

function debounce(fnc: Function, delay = 200, immediate = false) {
    let timeoutId: number;

    return (...args: any[]) => {
        if (immediate && !timeoutId) {
            fnc(...args);
        }
        window.clearTimeout(timeoutId);
        timeoutId = window.setTimeout(() => fnc(...args), delay);
    };
}

function throttle(fnc: Function, timeToWaitBeforeNextCall = 200) {
    let timeoutId: number;
    let prevCallTime: number;
    let timeStamp: number;
    let nextScheduledCallTime: number;

    return (...args: any[]) => {
        nextScheduledCallTime = prevCallTime + timeToWaitBeforeNextCall;
        timeStamp = performance.now();

        if (!prevCallTime || timeStamp > nextScheduledCallTime) {
            fnc(...args);
            prevCallTime = timeStamp;
        } else {
            window.clearTimeout(timeoutId);
            timeoutId = window.setTimeout(() => {
                fnc(...args);
                prevCallTime = timeStamp;
            }, timeToWaitBeforeNextCall - (timeStamp - prevCallTime));
        }
    };
}

export function randomNumberBetween(a: number, b: number) {
    const max = Math.max(a, b);
    const min = Math.min(a, b);
    const range = max - min;

    return max - Math.random() * range;
}
