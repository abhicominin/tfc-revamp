varying vec2 vUv;

uniform float uTime;
uniform vec2 uResolution;
uniform sampler2D uSceneOneTexture;
uniform sampler2D uNoiseTexture;
uniform float uInitialTransition;

void main() {
    // Noise texture sampled directly at plane UVs
    float noise = (texture2D(uNoiseTexture, vUv).r - 0.5) * 0.3;

    // Simple fade-in: uInitialTransition 0→1, noise roughens the edge during transition
    float alpha = smoothstep(0.0, 1.0, uInitialTransition + noise);

    vec3 baseColor = texture2D(uSceneOneTexture, vUv).rgb;

    gl_FragColor = vec4(baseColor, alpha);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
}
