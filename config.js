export default {
    antialias: false,

    fieldOfView: 45,

    cameraNear: 0.1,

    cameraFar: 1000,

    viewWidth: 512,

    viewHeight: 512,

    renderShadows: false,

    transparentBackground: false,

    get aspectRatio() {
        return this.viewWidth / this.viewHeight;
    },
};
