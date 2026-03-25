import { ShadowAlpha } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import * as THREE from 'three'
import * as CANNON from "cannon-es";
import { useEffect, useMemo, useRef } from "react";
import { createNoise3D } from "simplex-noise";

export default function Curtain(){
  const nX = 16
  const nY = 16
  const mass = 1
  const clothSize = 4
  const dist = clothSize / nX  

  const geometryRef = useRef()
  const particles = useRef()

  const world = useMemo(() =>
  {
    return new CANNON.World({
        gravity: new CANNON.Vec3(0, -9.81, 0)
    })
  
  },[])

  const noise = useMemo(() => createNoise3D(), []);

  function connect(i1, j1, i2, j2){
    world.addConstraint(
        new CANNON.DistanceConstraint(
            particles.current[i1][j1],
            particles.current[i2][j2],
            dist
        )
    )
  }

  function updateParticles(){
    for( let i = 0; i < nX + 1; i++ )
        for( let j = 0; j < nY + 1; j++ )
        {
            const index = j * (nX + 1) + i;

            const positionAttribute = geometryRef.current.attributes.position
            const position = particles.current[i][nY - j].position
            positionAttribute.setXYZ(index, position.x, position.y, position.z)
            positionAttribute.needsUpdate = true

        }
  }

  function applyWind(time) {
      for (let i = 0; i < nX + 1; i++) {
        for (let j = 0; j < nY + 1; j++) {
          const particle = particles.current[i][j];
          const wind = noise(
            (time + particle.position.x) * 1,
            (time + particle.position.y) * 1,
            (time + particle.position.z) * 1
          );
          particle.applyForce(
            new CANNON.Vec3(wind * 0.04, 0, 0),
            particle.position
          );
        }
      }
  }

  useEffect(() =>
  {
    const shape = new CANNON.Particle()
    particles.current = []

    for( let x = 0; x < nX + 1; x++ )
    {
        particles.current.push([])
        for( let y = 0; y < nY + 1; y++ )
        {
            const particle = new CANNON.Body({
                mass: y === nY ? 0 : mass,
                shape,
                position: new CANNON.Vec3(
                  (x - nX * 0.5) * dist,
                  (y - nY * 0.5) * dist,
                  0
                ),
                velocity: new CANNON.Vec3(0, 0, -0.09 * (nY - y)),
            })

            particles.current[x].push(particle);
            world.addBody(particle);
        }
    }

    for (let i = 0; i < nX + 1; i++) {
      for (let j = 0; j < nY + 1; j++) {
        // if (i < nX) connect(i, j, i + 1, j);
        if (j < nY) connect(i, j, i, j + 1);
      }
    }
  
  }, [])

  const timeStep = 1 / 60;
  useFrame(({ clock }) => {
    applyWind(clock.elapsedTime);
    updateParticles();
    world.step(timeStep);
  });

  
  return(
      <>
      <mesh castShadow position={[-2.5, 1.2, 0]} scale-y={2}>
      <planeGeometry ref={geometryRef} args={[clothSize, clothSize, nX, nY]} />
      <meshBasicMaterial opacity={0.00001} transparent side={THREE.DoubleSide}/>
      <ShadowAlpha opacity={0.7} />
    </mesh>
      </>
  )
}