import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

const progressDisplayContainer = document.getElementById('progress-display-container');

export default {
    loadModel,
};

function loadModel(resourceUrl: string) {
    let finished = false;
    let loader: FBXLoader|GLTFLoader;
    let progressDisplay: HTMLElement;
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
            return Promise.reject(new Error(`Failed to load resource: "${resourceUrl}" due it has unknown extension`));
    }

    return new Promise((resolve, reject) => {
        const onLoad = (resource) => {
            resolve(resource);
        };
        const onError = (e) => {
            console.error(`Failed to load resource: ${e}`);
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
        });
    }
}

function bytesToReadable(value: number, scale: 'k'|'M'|'G'|'T') {
    const n = ['k', 'M', 'G', 'T'].indexOf(scale) + 1;

    for (let i = 0; i < n; i++) {
        value /= 1020;
    }

    return value.toFixed(2);
}
