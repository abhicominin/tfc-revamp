import * as THREE from 'three'
import { useEffect, useMemo } from "react";
import { useTexture } from "@react-three/drei";
import { ASSETS } from '@/app/asset';

export default function Floor()
{
    const sourceMaps = useTexture({
        map: ASSETS.ASSETS.TEXTURES.GROUND_DIFFUSE,
        normalMap: ASSETS.ASSETS.TEXTURES.GROUND_NORMAL,
        aoMap: ASSETS.ASSETS.TEXTURES.GROUND_AO,
        roughnessMap: ASSETS.ASSETS.TEXTURES.GROUND_ROUGH,
    });

    const maps = useMemo(() => {
        const prepared = {};
        for (const [key, texture] of Object.entries(sourceMaps)) {
          const tex = texture.clone();
          if (key === 'map') {
            tex.colorSpace = THREE.SRGBColorSpace;
          }
          tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
          tex.anisotropy = 16;
          tex.repeat.set(170, 170);
          tex.needsUpdate = true;
          prepared[key] = tex;
        }
        return prepared;
    }, [sourceMaps]);

    useEffect(() => {
      return () => {
        Object.values(maps).forEach((tex) => tex.dispose());
      };
    }, [maps]);


    return(
        <>
         <mesh rotation-x={-Math.PI/2} receiveShadow>
             <planeGeometry args={[1000,1000]}/>
             <meshStandardMaterial {...maps}/>
         </mesh>
        </>
    )
}