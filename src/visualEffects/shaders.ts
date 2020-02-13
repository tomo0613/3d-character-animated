/**
 * https://github.com/RonenNess/partykals
 */

export const vertexShader = `
    attribute float alpha;
    attribute float rotation;
    attribute float size;

    varying float vAlpha;
    varying vec3 vColor;
    varying float vRotation;

    uniform float rendererScale;

    void main() {
        vAlpha = alpha;
        vColor = color;

        vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );
        gl_Position = projectionMatrix * mvPosition;

        vRotation = rotation;
        gl_PointSize = size * (rendererScale / length(mvPosition.xyz));
    }
`;

export const fragmentShader = `
    uniform vec3 globalColor;
    uniform sampler2D texture;

    varying float vAlpha;
    varying vec3 vColor;
    varying float vRotation;


    void main() {
        float mid = 0.5;
        vec2 rotated = vec2(cos(vRotation) * (gl_PointCoord.x - mid) + sin(vRotation) * (gl_PointCoord.y - mid) + mid,
                        cos(vRotation) * (gl_PointCoord.y - mid) - sin(vRotation) * (gl_PointCoord.x - mid) + mid);
        vec4 texture = texture2D(texture,  rotated);

        gl_FragColor = vec4( globalColor * vColor, vAlpha ) * texture;
    }
`;
