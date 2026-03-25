'use client'
import { SRGBColorSpace } from "three"
import { Preload, OrthographicCamera } from "@react-three/drei"
import { Canvas } from "@react-three/fiber"

import { Perf } from "r3f-perf"
import Main from "./Portal/main"
import LoadingScreen from "../_interface/LoadingScreen"


export default function Scene() {
    return(
        <>
         <LoadingScreen />
         <main className="w-full h-full fixed top-0 left-0 pointer-events-auto">
           <Canvas shadows
              gl={
                {
                    antialias: false,
                    dpr: [1],
                    outputColorSpace: SRGBColorSpace,
                }
              }
           >
                <Preload all />
                <Main />
                <Perf position="top-left" />
                <OrthographicCamera makeDefault position={[0, 0, 1]} />
           </Canvas>
         </main>
        </>
    )
}