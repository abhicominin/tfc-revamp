'use client'
import { PCFSoftShadowMap } from "three"
import { SRGBColorSpace } from "three"
import { Preload, OrthographicCamera } from "@react-three/drei"
import { Canvas } from "@react-three/fiber"
import { Leva } from "leva"

import { Perf } from "r3f-perf"
import Main from "./Portal/main"
import LoadingScreen from "../_interface/LoadingScreen"


export default function Scene() {
    return(
        <>
         <Leva hidden={process.env.NODE_ENV !== 'development'} />
         <LoadingScreen />
         <main className="w-full h-full fixed top-0 left-0 pointer-events-auto">
           <Canvas
              shadows
              dpr={[0.5, 1]}
              gl={
                {
                    antialias: false,
                    outputColorSpace: SRGBColorSpace,
                }
              }
              onCreated={({ gl }) => {
                gl.autoClear = false;
                gl.setPixelRatio(Math.min(window.devicePixelRatio, 1.0));
                gl.shadowMap.enabled = true;
                gl.shadowMap.type = PCFSoftShadowMap;
              }}
           >
                <Preload all />
                <Main />
                {/* {process.env.NODE_ENV === 'development' && <Perf position="top-left" />} */}
                <OrthographicCamera makeDefault position={[0, 0, 1]} />
           </Canvas>
         </main>
        </>
    )
} 