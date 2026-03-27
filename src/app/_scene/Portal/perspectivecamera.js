import { PerspectiveCamera } from "@react-three/drei";
import { forwardRef, useLayoutEffect } from "react";
import { useThree } from "@react-three/fiber";


const PerspectiveCameraComponent = forwardRef(( props, ref ) => {
  const { size } = useThree();
  
      
  // Rebuild frustum planes on viewport resize
  useLayoutEffect(() => {
      if (!ref.current) return;
      ref.current.lookAt(0 + 0.25/2,0.25,0);   
      ref.current.updateProjectionMatrix();
  }, [ref, size]);

  return (
    <>
        <PerspectiveCamera
          ref={ref}
          makeDefault
          position={[0 + 0.25/2, 0.1, 1.6]}
          near={0.1}
          fov={70}
          far={100}
        />
    </>
  );
});

PerspectiveCameraComponent.displayName = 'PerspectiveCameraComponent';

export default PerspectiveCameraComponent;