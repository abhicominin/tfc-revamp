import * as THREE from "three"
import { RoundedBoxGeometry, MeshTransmissionMaterial } from "@react-three/drei"
import { useRef, useMemo, useLayoutEffect, forwardRef } from "react";

const rubic_config = {
    cube_size: 0.25,
    cube_gap: 0.001,
    cube_radius: 0.01
}   

function generatePositions()
{
    const positions = [];
    const totalSize = rubic_config.cube_size * 3 + rubic_config.cube_gap * 2;
    const startOffset = -totalSize / 2 + rubic_config.cube_size / 2;

    for (let x = 0; x < 3; x++) {
        for (let y = 0; y < 3; y++) {
            for (let z = 0; z < 3; z++) {
                const posX = startOffset + x * (rubic_config.cube_size + rubic_config.cube_gap);
                const posY = startOffset + y * (rubic_config.cube_size + rubic_config.cube_gap);
                const posZ = startOffset + z * (rubic_config.cube_size + rubic_config.cube_gap);
                positions.push({ pos: [posX, posY, posZ], yIdx: y });
            }
        }
    }
    return positions;
}

const Rubic = forwardRef(function Rubic({ children }, ref) {

    const internalRef = useRef();
    const instancedMeshRef = ref || internalRef;
    const positionsData = useMemo(() => generatePositions(), []);

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

    useLayoutEffect(() => {
        if (!instancedMeshRef.current) return;
        const temp = new THREE.Object3D();
        const mesh = instancedMeshRef.current;
        positionsData.forEach(({ pos }, index) => {
            temp.matrix.identity();
            temp.matrix.setPosition(...pos);
            mesh.setMatrixAt(index, temp.matrix);
        });
        mesh.instanceMatrix.needsUpdate = true;
    }, [positionsData, instancedMeshRef]);

    return(
        <>
          <instancedMesh ref={instancedMeshRef} args={[null, null, 27]} position={[0.25/2, 0.37, 0.25/2]} castShadow >
            <RoundedBoxGeometry
                args={[rubic_config.cube_size, rubic_config.cube_size, rubic_config.cube_size]}
                radius={rubic_config.cube_radius}
                steps={1}
                smoothness={4}
                bevelSegments={4}
                creaseAngle={0.2}
            />
            <MeshTransmissionMaterial 
                {...config}
            />
            {/* <meshPhysicalMaterial
                color="#c0c0c0"
                metalness={0.5}
                roughness={0.3}
                clearcoat={1}
                transmission={0.6}
                thickness={0.2}
                ior={1.6}
                clearcoatRoughness={0.1}
                envMapIntensity={0}
                envMap={null}
                reflectivity={1}
            /> */}
          </instancedMesh>
         {children}
        </>
    )
})
   

export default Rubic;