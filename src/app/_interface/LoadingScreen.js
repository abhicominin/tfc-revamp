'use client'
import { useProgress } from '@react-three/drei'
import { AnimatePresence, motion, useMotionValue, animate, useTransform, useMotionValueEvent } from 'framer-motion'
import { useEffect, useState } from 'react'

export default function LoadingScreen() {
  const { active, progress } = useProgress()
  const [canExit, setCanExit] = useState(false)
  const motionProgress = useMotionValue(0)
  const barWidth = useTransform(motionProgress, v => `${v}%`)
  const [displayPct, setDisplayPct] = useState(0)

  useMotionValueEvent(motionProgress, 'change', v => setDisplayPct(Math.round(v)))

  useEffect(() => {
    const controls = animate(motionProgress, progress, {
      duration: 1.4,
      ease: 'easeOut',
      onComplete: () => {
        if (!active && progress === 100) {
          // Show 100% briefly before fading out
          setTimeout(() => setCanExit(true), 500)
        }
      },
    })
    return controls.stop
  }, [progress, active])

  return (
    <AnimatePresence>
      {!canExit && (
        <motion.div
          key="loading-screen"
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-white"
          initial={{ opacity: 1, filter: 'blur(0px)', y: 0 }}
          exit={{ opacity: 0, y: -24, filter: 'blur(12px)' }}
          transition={{ duration: 1.5, ease: [0.76, 0, 0.24, 1] }}
        >
          <p className="font-futura-light tracking-[0.4em] text-xs text-black/40 mb-12 uppercase">
            TheFaceCraft
          </p>

          {/* Progress bar track */}
          <div className="w-40 h-px bg-black/10 relative overflow-hidden">
            <motion.div
              className="absolute inset-y-0 left-0 bg-black"
              style={{ width: barWidth }}
            />
          </div>

          {/* Percentage */}
          <p className="font-futura-light text-[10px] text-black/30 mt-3 tabular-nums tracking-widest">
            {displayPct} %
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
