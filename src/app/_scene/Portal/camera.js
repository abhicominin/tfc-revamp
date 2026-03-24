import { forwardRef, useLayoutEffect } from "react";
import { OrthographicCamera } from "@react-three/drei";
import { useThree } from "@react-three/fiber";

const FRUSTUM = 3.5;

const CAMERA_CONFIG = {
    '/':         { zoom: 2.9, lookAt: [-0.1, 0,    0] },
    '/About':    { zoom: 2.9, lookAt: [-0.1, 0,    0] },
    '/Project':  { zoom: 15.0, lookAt: [-0.1, 0.258, 0] },
    '/Contacts': { zoom: 3.4, lookAt: [-0.1, 0.15, 0] },
    '/Service':  { zoom: 2.9, lookAt: [-0.1, 0,    0] },
};

const Camera = forwardRef(( props, ref ) => {
    const { size } = useThree();
    
    // Rebuild frustum planes on viewport resize
    useLayoutEffect(() => {
        if (!ref.current) return;
        const aspect = size.width / size.height;
        ref.current.left   = -FRUSTUM * aspect;
        ref.current.right  =  FRUSTUM * aspect;
        ref.current.top    =  FRUSTUM;
        ref.current.bottom = -FRUSTUM;
        ref.current.lookAt(-0.1,0,0);   
        ref.current.updateProjectionMatrix();
    }, [ref, size]);

    return (
        <OrthographicCamera
            ref={ref}
            position={[5, 5, 5]}
            near={0.1}
            far={1000}
            zoom={2.9}
        />
    );
});

export default Camera;