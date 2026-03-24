'use client'
import { motion, AnimatePresence } from "framer-motion";
import { usePathname } from "next/navigation";
import Image from "next/image";
import AudioButton from "./_interfaceUtils/AudioButton";

const menuDescription = {
  home: "TheFaceCraft is a creative studio where design, 3D art, and modern web technology converge.We craft immersive digital experiences that blur the line between art and interaction.\n",
  about: "TheFaceCraft is driven by a team of designers and developers obsessed with quality and craft.\n",
  projects: "Our projects span brand identity, interactive 3D web experiences, and digital products for forward-thinking clients.\n",
  contact: "Whether you have a project in mind or simply want to talk craft, we would love to hear from you.\n",
  service: "We offer a focused range of services — 3D design and visualisation, interactive web development, and creative direction.\n",
}

export default function Home() {
  const pathname = usePathname();
  return (
    <>
    <AnimatePresence mode='wait'>
      {pathname == '/' && (
      <motion.div className="w-full h-screen flex flex-col p-[40px] justify-between pointer-events-none"
        initial={{ opacity: 0, filter: "blur(10px)" }}
        animate={{ opacity: 1, filter: "blur(0px)" }}
        exit={{ opacity: 0, filter: "blur(10px)" }}
        transition={{ duration: 0.8, ease: "easeInOut" }}
      >
         <div className="header w-full flex justify-between items-center">
            <div className="logo">
                <Image src="/icon.png" alt="Logo" width={50} height={50} />
            </div>
         </div>
         <div className="footer flex w-full justify-between items-center">
            <div className="description basis-7/8 max-w-[500px]">
               <span className="description-text font-montserrat-medium leading-[24px] text-[16px]">{menuDescription.home}</span>
            </div>
            <div className="buttons basis-1/8 flex justify-center items-end">
               <AudioButton />
            </div>
         </div>
      </motion.div>
      )}
    </AnimatePresence>
    </>
  );
}
  