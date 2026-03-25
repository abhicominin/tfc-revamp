'use client'
import { useProgress } from '@react-three/drei'
import { AnimatePresence, motion, useMotionValue, animate, useTransform, useMotionValueEvent } from 'framer-motion'
import { useEffect, useState } from 'react'
import useGlobalStore from '../globalstore'

export default function LoadingScreen() {
  const { active, progress } = useProgress()
  const setLoading = useGlobalStore(s => s.setLoading)
  const [canExit, setCanExit] = useState(false)
  const [ready, setReady] = useState(false)
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
          setTimeout(() => setReady(true), 500)
        }
      },
    })
    return controls.stop
  }, [progress, active])

  const enter = () => {
    // Dispatch synchronously — audio.play() inside the handler
    // inherits the transient user activation from this click event
    window.dispatchEvent(new CustomEvent('audio-unlock'))
    setCanExit(true)
    setLoading(false)
  }

  return (
    <AnimatePresence>
      {!canExit && (
        <motion.div
          key="loading-screen"
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-white"
          initial={{ opacity: 1, filter: 'blur(0px)', y: 0 }}
          exit={{ opacity: 0, y: -24, filter: 'blur(12px)' }}
          transition={{ duration: 1.5, ease: [0.76, 0, 0.24, 1] }}
          onClick={ready ? enter : undefined}
          style={ready ? { cursor: 'pointer' } : {}}
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

          {/* Percentage / enter prompt */}
          <AnimatePresence mode="wait" initial={false}>
            {ready ? (
              <motion.p
                key="enter"
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="font-futura-light text-[10px] text-black/50 mt-3 tracking-widest uppercase"
              >
                Click to enter
              </motion.p>
            ) : (
              <motion.p
                key="pct"
                className="font-futura-light text-[10px] text-black/30 mt-3 tabular-nums tracking-widest"
              >
                {displayPct} %
              </motion.p>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
