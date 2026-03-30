varying vec2 vUv;

uniform vec2 uResolution;

uniform sampler2D uSceneOneTexture;
uniform sampler2D uNoiseTexture;
uniform sampler2D uBlurNoiseSampleTexture;

uniform float uTime;
uniform float uInitialTransition;
uniform float uChromaticAberration;
uniform float uGrayScale;
uniform float uBrighness;
uniform float uContrast;
uniform float uSaturation;
uniform vec2  uVignetteSize;
uniform float uVignetteRoundness;
uniform float uVignetteSmoothness;
uniform float uBlurProgress;

uniform vec2  uBlurMaskSize;
uniform float uBlurMaskRoundness;
uniform float uBlurMaskSmoothness;
uniform float uBlurMaskStrength;


// ---------------------------------------------------------------------------
// Vignette (advanced): rounded-rectangle shape, based on glsl-vignette/advanced.
// size       – half-extents in UV space (0.5, 0.5) fills the frame
// roundness  – 0.0 = hard box corners, 1.0 = fully rounded
// smoothness – fade width in UV units
// ---------------------------------------------------------------------------
float sdSquare(vec2 point, float width) {
    vec2 d = abs(point) - width;
    return min(max(d.x, d.y), 0.0) + length(max(d, 0.0));
}

float vignette(vec2 uv, vec2 size, float roundness, float smoothness) {
    uv -= 0.5;
    float minWidth = min(size.x, size.y);
    uv.x = sign(uv.x) * clamp(abs(uv.x) - abs(minWidth - size.x), 0.0, 1.0);
    uv.y = sign(uv.y) * clamp(abs(uv.y) - abs(minWidth - size.y), 0.0, 1.0);
    float boxSize = minWidth * (1.0 - roundness);
    float dist = sdSquare(uv, boxSize) - (minWidth * roundness);
    return 1.0 - smoothstep(0.0, smoothness, dist);
}

// ---------------------------------------------------------------------------
// RGB shift: samples R, G, B channels at slightly offset UVs to simulate
// chromatic aberration.  strength=0 → no effect, strength=1 → full shift.
// ---------------------------------------------------------------------------
vec3 rgbShift(sampler2D tex, vec2 uv, float strength) {
    vec2 offset = vec2(strength * 0.008, 0.0);
    float r = texture2D(tex, uv + offset).r;
    float g = texture2D(tex, uv).g;
    float b = texture2D(tex, uv - offset).b;
    return vec3(r, g, b);
}

// ---------------------------------------------------------------------------
// Grayscale: converts colour to luminance using standard Rec.709 weights,
// then mixes back with the original.  amount=0 → colour, amount=1 → gray.
// ---------------------------------------------------------------------------
vec3 grayscale(vec3 color, float amount) {
    float luma = dot(color, vec3(0.2126, 0.7152, 0.0722));
    // Darken the gray target slightly (0.78 = ~22% darker)
    return mix(color, vec3(luma * (1.0 - amount * 0.22)), amount);
}

// ---------------------------------------------------------------------------
// Contrast, Saturation, Brightness: basic colour grade adjustment.
// For all settings: 1.0 = 100%, 0.5 = 50%, 1.5 = 150%.
// ---------------------------------------------------------------------------
vec3 ContrastSaturationBrightness(vec3 color, float brt, float sat, float con)
{
	const float AvgLumR = 0.5;
	const float AvgLumG = 0.5;
	const float AvgLumB = 0.5;
	
	const vec3 LumCoeff = vec3(0.2125, 0.7154, 0.0721);
	
	vec3 AvgLumin  = vec3(AvgLumR, AvgLumG, AvgLumB);
	vec3 brtColor  = color * brt;
	vec3 intensity = vec3(dot(brtColor, LumCoeff));
	vec3 satColor  = mix(intensity, brtColor, sat);
	vec3 conColor  = mix(AvgLumin, satColor, con);
	
	return conColor;
}

// ---------------------------------------------------------------------------
// Jittered Noise Blur: optimized tap sampling using noise texture.
// ---------------------------------------------------------------------------
vec3 boxBlur(sampler2D tex, sampler2D noiseTex, vec2 uv, float progress, vec2 res, float chromatic) {
    if (progress <= 0.0) {
        if (chromatic > 0.0) return rgbShift(tex, uv, chromatic);
        return texture2D(tex, uv).rgb;
    }
    
    float radius = progress * 10.0; 
    vec3 acc = vec3(0.0);
    
    // Increased noise frequency (tiling) for finer jitter
    // Using a single noise sample to derive multiple offsets for performance
    vec4 noise = texture2D(noiseTex, uv * 8.0); 
    
    // Static pre-calculated base directions for better distribution
    const vec2 dirs[8] = vec2[8](
        vec2(1.0, 0.0), vec2(-1.0, 0.0), vec2(0.0, 1.0), vec2(0.0, -1.0),
        vec2(0.707, 0.707), vec2(-0.707, 0.707), vec2(0.707, -0.707), vec2(-0.707, -0.707)
    );

    // Center sample
    if (chromatic > 0.0) acc += rgbShift(tex, uv, chromatic);
    else acc += texture2D(tex, uv).rgb;

    // Jittered taps
    for(int i = 0; i < 8; i++) {
        // Use noise to scramble the static directions
        float jitter = (i % 2 == 0) ? noise.r : noise.g;
        vec2 offsetUv = uv + (dirs[i] * jitter * radius) / res;
        
        if (chromatic > 0.0) {
            acc += rgbShift(tex, offsetUv, chromatic);
        } else {
            acc += texture2D(tex, offsetUv).rgb;
        }
    }
    
    return acc / 9.0;
}



void main() {
    // Noise texture sampled directly at plane UVs
    float noiseVal = (texture2D(uNoiseTexture, vUv).r - 0.5) * 0.3;

    // Simple fade-in: uInitialTransition 0→1, noise roughens the edge during transition
    float alpha = smoothstep(0.0, 1.0, uInitialTransition + noiseVal);

    // Calculate vignette mask for color
    float vMask = vignette(vUv, uVignetteSize, uVignetteRoundness, uVignetteSmoothness);
    
    // Calculate separate blur mask based on new factors
    float bMask = vignette(vUv, uBlurMaskSize, uBlurMaskRoundness, uBlurMaskSmoothness);
    
    // Blur inversely following the blur mask, also scaled by global uBlurProgress
    float blurAmt = uBlurMaskStrength * (1.0 - bMask) * uBlurProgress;
    
    // Sample texture with jittered noise blur and chromatic aberration handled together
    vec3 color = boxBlur(uSceneOneTexture, uBlurNoiseSampleTexture, vUv, blurAmt, uResolution, uChromaticAberration);

    // Grayscale
    color = grayscale(color, uGrayScale);


    // Contrast, saturation, brightness
    color = ContrastSaturationBrightness(color, uBrighness, uSaturation, uContrast);

    // Vignette (advanced): apply the mask
    color *= vMask;

    gl_FragColor = vec4(color, alpha);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
}
