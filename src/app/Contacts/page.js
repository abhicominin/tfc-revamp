'use client';
import PageWrap from "../_helpers/pagewrapper";
import { motion } from "framer-motion";

const containerVariants = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.35,
      delayChildren: 0.2,
    },
  },
};

const columnVariants = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.22,
    },
  },
};

const socialsVariants = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.18,
    },
  },
};

const headingVariants = {
  hidden: { opacity: 0, filter: 'blur(12px)' },
  show: { opacity: 1, filter: 'blur(0px)', transition: { duration: 1.6, ease: [0.22, 1, 0.36, 1] } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 28, filter: 'blur(10px)' },
  show: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 1.1, ease: [0.22, 1, 0.36, 1] } },
};

export default function Contacts() {
  return (
    <>
      <PageWrap>
        <motion.main
          className="w-full h-full flex justify-between items-center pointer-events-none p-[40px]"
          variants={containerVariants}
          initial="hidden"
          animate="show"
        >
          <motion.div variants={columnVariants} className="basis-1/3 h-full flex flex-col justify-between">
            <motion.h1 variants={headingVariants} className="text-[120px] font-futura-light translate-y-[260px] translate-x-[20px] select-none">CONTACT</motion.h1>
            <motion.span variants={itemVariants} className='leading-[24px] text-[16px] font-montserrat-medium select-none'>Tell us what you're building, <br /> rethinking, or struggling with.</motion.span>
          </motion.div>
          <motion.div variants={columnVariants} className="basis-1/3 h-[70%] font-montserrat-medium gap-[24px] flex flex-col text-[16px] justify-center pl-[80px] pointer-events-auto">
            <motion.button variants={itemVariants} className="email text-start transition-colors duration-800 hover:text-[#BF1736] -translate-y-2 whitespace-nowrap" onClick={() => window.open("https://mail.google.com/mail/?view=cm&to=hello@thefacecraft.com&su=Hello%20The%20Facecraft%20%E2%80%94%20Let%27s%20Create%20Something%20Amazing!", "_blank")}>hello@thefacecraft.com</motion.button>
            <motion.button variants={itemVariants} className="phone text-start transition-colors duration-800 hover:text-[#BF1736] -translate-y-2 whitespace-nowrap" onClick={() => window.open("tel:+41767152336", "_self")}>+41 76 715 23 36</motion.button>
            <motion.button variants={itemVariants} className="address-switzerland text-start transition-colors duration-800 hover:text-[#BF1736] -translate-y-2 whitespace-nowrap" onClick={() => window.open("https://maps.app.goo.gl/f6TZ9mgkrgW65Yzq9", "_blank")}>Grossmatte O 24B, 6014 Luzern, Switzerland</motion.button>
            <motion.button variants={itemVariants} className="address-malaysia text-start transition-colors duration-800 hover:text-[#BF1736] -translate-y-2 whitespace-nowrap" onClick={() => window.open("https://maps.app.goo.gl/LjoLMURbm73z6UNE9", "_blank")}>Lot G02-G07, Level 3, Platinum Sentral, Jalan Stesen <br/> Sentral 2, Kuala Lumpur Sentral, 50470 Kuala Lumpur, <br/> Wilayah Persekutuan Kuala Lumpur, Malaysia</motion.button>
            <motion.div variants={socialsVariants} className="socials flex gap-[24px]">
              <motion.button variants={itemVariants} className="instagram text-start transition-colors duration-800 hover:text-[#BF1736] -translate-y-2">Instagram</motion.button>
              <motion.button variants={itemVariants} className="linkedin text-start transition-colors duration-800 hover:text-[#BF1736] -translate-y-2">LinkedIn</motion.button>
              <motion.button variants={itemVariants} className="facebook text-start transition-colors duration-800 hover:text-[#BF1736] -translate-y-2">Facebook</motion.button>
            </motion.div>
          </motion.div>
        </motion.main>
      </PageWrap>
    </>
  );
}