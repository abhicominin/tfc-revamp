'use client'
import { motion } from "framer-motion";
import { useRef, useEffect } from "react";
import { ReactLenis } from "lenis/react";
import gsap from "gsap";

export default function PageWrap({ children }) {
    const lenisRef = useRef(null);
  
    useEffect(() => {
      function update(time) {
        if (lenisRef.current?.lenis) {
          lenisRef.current.lenis.raf(time * 1000);
        }
      }
  
      lenisRef.current?.lenis?.on('scroll', ScrollTrigger.update);
      gsap.ticker.add(update);
      gsap.ticker.lagSmoothing(0);
  
      return () => gsap.ticker.remove(update);
    }, []);

    return (
        <>
         <ReactLenis root ref={lenisRef} options={{ autoRaf: false }}/>
         <motion.div
             className="w-full h-screen z-0 pointer-events-none"
             initial={{ opacity: 0, filter: "blur(10px)" }}
             animate={{ opacity: 1, filter: "blur(0px)" }}
             exit={{ opacity: 0, filter: "blur(10px)" }}
             transition={{ duration: 0.8, ease: "easeInOut" }}
         >
             {children}
         </motion.div>
        </>
    );
}