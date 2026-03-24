'use client'
import { motion } from "framer-motion";

export default function PageWrap({ children }) {
    return (
        <motion.div
            className="w-full h-screen z-0 pointer-events-none"
            initial={{ opacity: 0, filter: "blur(10px)" }}
            animate={{ opacity: 1, filter: "blur(0px)" }}
            exit={{ opacity: 0, filter: "blur(10px)" }}
            transition={{ duration: 0.8, ease: "easeInOut" }}
        >
            {children}
        </motion.div>
    );
}