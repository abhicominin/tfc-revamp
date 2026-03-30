'use client'
import { useGSAP } from "@gsap/react";
import Image from "next/image";
import { motion } from "framer-motion";
import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { usePathname, useRouter } from "next/navigation";

const links = [
    { name: "Home", href: "/" },
    { name: "About", href: "/About" },
    { name: "Project", href: "/Project" },
    { name: "Service", href: "/Service" },
    { name: "Contact", href: "/Contacts" },
]

gsap.registerPlugin(useGSAP, ScrollTrigger);

export default function Footer() {

  const containerRef = useRef(null);
  const pathname = usePathname();
  const router = useRouter();

  useGSAP(() => {


  }, { scope: containerRef });


  return (
    <>
        <main ref={containerRef} className="w-full h-full flex flex-col justify-between items-stretch pointer-events-auto text-white p-[40px] text-[24px] font-futura-medium">
        <div className="h-[20%] w-full flex justify-end items-start gap-[40px]">
           <motion.button whileHover={{ color: '#BF1736' }} transition={{ duration: 0.2 }}>Instagram</motion.button>
           <motion.button whileHover={{ color: '#BF1736' }} transition={{ duration: 0.2 }}>LinkedIn</motion.button>
           <motion.button whileHover={{ color: '#BF1736' }} transition={{ duration: 0.2 }}>Twitter</motion.button>
        </div>
        <div className="h-[60%] w-full flex flex-col justify-center items-center gap-10">
           <Image src="/Images/TFC_cube.png" alt="Domain Logo" width={1000} height={100} />
           <div className="menu-footer flex gap-[40px]">
                {links.map((link) => (
                    <motion.button
                        key={link.name}
                        className="relative"
                        style={{ color: link.href === pathname ? '#BF1736' : undefined }}
                        onClick={() => router.push(link.href)}
                    >
                        {link.name}
                        {link.href === pathname && (
                            <motion.span
                                layoutId="underline"
                                className="absolute left-0 top-full block w-full h-[2px] bg-[#BF1736]"
                            />
                        )}
                    </motion.button>
                ))}
           </div>
        </div>
        <div className="h-[20%] w-full flex justify-between items-end">
           <div className="flex justify-center gap-4">
              <span>TC</span>
              <span>Privacy</span>
            </div> 
           <p className="text-center -translate-x-[60px]">info@thefacecraft.com</p>
           <div className="flex justify-center gap-4">
            </div> 
        </div>
        </main>
    </>
  );
}