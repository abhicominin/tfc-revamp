'use client';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const links = [
    { name: "About", href: "/About" },
    { name: "Project", href: "/Project" },
    { name: "Service", href: "/Service" },
    { name: "Contact", href: "/Contacts" },
]

export default function Menu() {

    const [buttonHovered, setButtonHovered] = useState(false);
    const pathname = usePathname();


    return(
        <>
          <AnimatePresence mode='wait'>
          {pathname !== '/' && (
          <motion.div className='z-10 w-full h-auto flex flex-col justify-between items-center p-[40px] text-[18px] text-white absolute top-0 '
            initial={{ opacity: 0, filter: "blur(4px)" }}
            animate={{ opacity: 1, filter: "blur(0px)" }}
            exit={{ opacity: 0, filter: "blur(4px)" }}
            transition={{ duration: 0.8, ease: "easeInOut" }}
          >
            <div className='flex w-full'>
              <div className='basis-1/2 h-full font-montserrat-medium'>
                   <motion.button className='flex gap-1' onHoverStart={() => setButtonHovered(true)} onHoverEnd={() => setButtonHovered(false)} >
                    <Link href="/">
                       Back 
                       <AnimatePresence mode='wait'>
                          { buttonHovered && 
                            <motion.span 
                             initial={{ opacity: 0, transform: "translateX(-10px)", filter: "blur(2px)" }}
                             animate={{ opacity: 1, transform: "translateX(0)", filter: "blur(0px)" }}
                             exit={{ opacity: 0, transform: "translateX(-10px)", filter: "blur(2px)" }} 
                             className='pl-1'
                            >
                              to Home
                            </motion.span> }
                       </AnimatePresence>
                    </Link>
                   </motion.button>
              </div>
 
              <div className='basis-1/2 h-full flex justify-end items-center font-futura-medium'>
                 <ul className="flex gap-10">
                     {links.map((link) => (
                       <li key={link.name}>
                         <Link
                           className={`relative transition-colors duration-300 ${
                             pathname === link.href ? "text-[#BF1736]" : "text-white"
                           }`}
                           href={link.href}
                         >
                           {link.href === pathname && (
                             <motion.span
                               layoutId="underline"
                               className="absolute left-0 top-full block w-full h-[2px] bg-[#BF1736]"
                             />
                           )}
                           {link.name}
                         </Link>
                       </li>
                     ))}
                 </ul>
              </div>
            </div> 
          </motion.div>
          )}
          </AnimatePresence>
        </>
    );
}