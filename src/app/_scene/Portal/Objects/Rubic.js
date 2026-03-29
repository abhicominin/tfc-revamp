import * as THREE from "three"
import { RoundedBoxGeometry, MeshTransmissionMaterial } from "@react-three/drei"
import { useRef, useMemo, useLayoutEffect, forwardRef } from "react";
import { useFrame } from "@react-three/fiber";
import { usePathname } from "next/navigation";
import useSceneStore from "../../scenestore";


const rubic_config = {
    cube_size: 0.25,
    cube_gap: 0.001,
    cube_radius: 0.01
}   

const Q = Math.PI / 2; // 90°

const rotation_config = {
    '/' : {
        top_layer:    Q,
        middle_layer: 0,
        bottom_layer: -Q,
        color: '#ffffff'
    },
    '/About' : {
        top_layer:    Q,
        middle_layer: Q,
        bottom_layer: 0,
        color: '#D7D4FA'
    },
    '/Project' : {
        top_layer:    0,
        middle_layer: -Q,
        bottom_layer: -Q,
        color: '#ADA3DC'
    },
    '/Contacts' : {
        top_layer:    -Q,
        middle_layer: 0,
        bottom_layer: Q,
        color: '#C6C0E8'
    },
    '/Service' : {
        top_layer:    -Q,
        middle_layer: -Q,
        bottom_layer: 0,
        color: '#B8B3F6'
    }
}

function generateLayerPositions() {
    const layers = [[], [], []];
    const totalSize = rubic_config.cube_size * 3 + rubic_config.cube_gap * 2;
    const startOffset = -totalSize / 2 + rubic_config.cube_size / 2;

    for (let x = 0; x < 3; x++) {
        for (let y = 0; y < 3; y++) {
            for (let z = 0; z < 3; z++) {
                const posX = startOffset + x * (rubic_config.cube_size + rubic_config.cube_gap);
                const posY = startOffset + y * (rubic_config.cube_size + rubic_config.cube_gap);
                const posZ = startOffset + z * (rubic_config.cube_size + rubic_config.cube_gap);
                layers[y].push([posX, posY, posZ]);
            }
        }
    }
    return layers;
}

const Rubic = forwardRef(function Rubic({ children }, ref) {

    const layer0Ref = useRef();
    const layer1Ref = useRef();
    const layer2Ref = useRef();
    const velocities = useRef([0, 0, 0]);
    const materialRefs = useRef([]);
    const currentColor = useRef(new THREE.Color('#ffffff'));
    const lastHoveredRef = useRef(null);
    const prevPathnameRef = useRef(null);
    const rubicHovered = useRef(false);

    const layerPositions = useMemo(() => generateLayerPositions(), []);

    const textHovered = useSceneStore(state => state.textHovered);
    const groupHovered = useSceneStore(state => state.groupHovered);
    const pathname = usePathname();

    const config = useMemo(() => ({
      meshPhysicalMaterial: false,
      transmissionSampler: true,
      backside: false,
      samples: 10,
      resolution: 512,
      transmission: 0.97,
      roughness: 0.0,
      thickness: 2.66,
      ior: 1.01,
      chromaticAberration: 0.01,
      anisotropy: 1.0,
      distortion: 0.0,
      distortionScale: 0.0,
      temporalDistortion: 0.0,
      clearcoat: 1,
      attenuationDistance: 10,
      attenuationColor: '#ffffff',
      color: '#ffffff',
    }), []);

    useFrame((_, delta) => {
        const stiffness = 90;
        const damping = 7;

        const rubicHoverActive = rubicHovered.current && pathname === '/Contacts';
        const cfg = textHovered
            ? rotation_config[textHovered]
            : rubicHoverActive
            ? rotation_config['/Contacts']
            : null;
        const layerAngles = cfg
            ? [cfg.bottom_layer, cfg.middle_layer, cfg.top_layer]
            : [0, 0, 0];

        [layer0Ref, layer1Ref, layer2Ref].forEach((layerRef, i) => {
            if (!layerRef.current) return;
            const target = layerAngles[i];
            const current = layerRef.current.rotation.y;
            const vel = velocities.current;
            const acceleration = (target - current) * stiffness - vel[i] * damping;
            vel[i] += acceleration * delta;
            layerRef.current.rotation.y += vel[i] * delta;
        });

        // Track last hovered; clear it when the route actually changes
        if (prevPathnameRef.current !== pathname) {
            lastHoveredRef.current = null;
            prevPathnameRef.current = pathname;
        }
        if (textHovered) lastHoveredRef.current = textHovered;

        const isRubicHoverActive = rubicHovered.current && pathname === '/Contacts';
        const activeKey = groupHovered
            ? (textHovered || lastHoveredRef.current || pathname)
            : isRubicHoverActive
            ? '/Contacts'
            : null;
        const targetHex = (activeKey && rotation_config[activeKey])
            ? rotation_config[activeKey].color
            : '#ffffff';
        currentColor.current.set(targetHex);
        materialRefs.current.forEach((mat) => {
            if (!mat) return;
            mat.color.lerp(currentColor.current, 0.04);
        });
    });

    useLayoutEffect(() => {
        const temp = new THREE.Object3D();
        const layerRefs = [layer0Ref, layer1Ref, layer2Ref];
        layerRefs.forEach((layerRef, layerIdx) => {
            if (!layerRef.current) return;
            const mesh = layerRef.current;
            layerPositions[layerIdx].forEach((pos, index) => {
                temp.matrix.identity();
                temp.matrix.setPosition(...pos);
                mesh.setMatrixAt(index, temp.matrix);
            });
            mesh.instanceMatrix.needsUpdate = true;
        });
    }, [layerPositions]);

    return(
        <group
            ref={ref}
            position={[0.25/2, 0.37, 0.25/2]}
            onPointerEnter={(e) => {
                e.stopPropagation();
                if (pathname === '/Contacts') rubicHovered.current = true;
            }}
            onPointerLeave={() => {
                rubicHovered.current = false;
            }}
        >
            {/* Layer 0 — bottom */}
            <instancedMesh ref={layer0Ref} args={[null, null, 9]} castShadow>
                <RoundedBoxGeometry
                    args={[rubic_config.cube_size, rubic_config.cube_size, rubic_config.cube_size]}
                    radius={rubic_config.cube_radius}
                    steps={1}
                    smoothness={4}
                    bevelSegments={4}
                    creaseAngle={0.2}
                />
                <MeshTransmissionMaterial ref={el => materialRefs.current[0] = el} {...config} />
            </instancedMesh>
            {/* Layer 1 — middle */}
            <instancedMesh ref={layer1Ref} args={[null, null, 9]} castShadow>
                <RoundedBoxGeometry
                    args={[rubic_config.cube_size, rubic_config.cube_size, rubic_config.cube_size]}
                    radius={rubic_config.cube_radius}
                    steps={1}
                    smoothness={4}
                    bevelSegments={4}
                    creaseAngle={0.2}
                />
                <MeshTransmissionMaterial ref={el => materialRefs.current[1] = el} {...config} />
            </instancedMesh>
            {/* Layer 2 — top */}
            <instancedMesh ref={layer2Ref} args={[null, null, 9]} castShadow>
                <RoundedBoxGeometry
                    args={[rubic_config.cube_size, rubic_config.cube_size, rubic_config.cube_size]}
                    radius={rubic_config.cube_radius}
                    steps={1}
                    smoothness={4}
                    bevelSegments={4}
                    creaseAngle={0.2}
                />
                <MeshTransmissionMaterial ref={el => materialRefs.current[2] = el} {...config} />
            </instancedMesh>
            {children}
        </group>
    )
})
   

export default Rubic;