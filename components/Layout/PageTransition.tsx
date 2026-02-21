import React from 'react';
import { motion, Variants } from 'framer-motion';

export const pageVariants: Variants = {
    initial: { opacity: 0, y: 15 },
    animate: {
        opacity: 1,
        y: 0,
        transition: {
            duration: 0.6,
            ease: [0.16, 1, 0.3, 1], // snappy ease
            staggerChildren: 0.05
        }
    },
    exit: {
        opacity: 0,
        y: -10,
        transition: {
            duration: 0.4,
            ease: [0.25, 1, 0.5, 1] // smooth ease
        }
    }
};

interface PageTransitionProps {
    children: React.ReactNode;
    viewKey: string;
    className?: string;
}

const PageTransition: React.FC<PageTransitionProps> = ({ children, viewKey, className = "w-full" }) => {
    return (
        <motion.div
            key={viewKey}
            initial="initial"
            animate="animate"
            exit="exit"
            variants={pageVariants}
            className={className}
        >
            {children}
        </motion.div>
    );
};

export default PageTransition;
