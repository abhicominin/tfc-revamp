'use client'
import { useProgress } from '@react-three/drei'
import { AnimatePresence, motion, useMotionValue, animate, useTransform, useMotionValueEvent } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import useGlobalStore from '../globalstore'

export default function LoadingScreen() {
  const { active, progress } = useProgress()
  const setLoading = useGlobalStore(s => s.setLoading)
  const [canExit, setCanExit] = useState(false)
  const [ready, setReady] = useState(false)
  const readyTimerRef = useRef(null)
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
          clearTimeout(readyTimerRef.current)
          readyTimerRef.current = setTimeout(() => setReady(true), 500)
        }
      },
    })
    return () => {
      controls.stop()
      clearTimeout(readyTimerRef.current)
    }
  }, [progress, active, motionProgress])

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
          className="fixed inset-0 z-[100] flex flex-col gap-2 items-center justify-center bg-black text-white font-futura-medium"
          initial={{ opacity: 1, filter: 'blur(0px)', y: 0 }}
          exit={{ opacity: 0, y: -24, filter: 'blur(12px)' }}
          transition={{ duration: 3.0, ease: [0.76, 0, 0.24, 1] }}
          onClick={ready ? enter : undefined}
          style={ready ? { cursor: 'pointer' } : {}}
        >
          <motion.div
            className="flex flex-col items-center gap-[20px]"
            animate={{ opacity: ready ? 0 : 1 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          >
            <Image src="/icon.png" alt="Logo" width={50} height={50} />

            {/* Progress bar track */}
            <div className="w-40 h-px bg-white/10 relative overflow-hidden">
              <motion.div
                className="absolute inset-y-0 left-0 bg-white"
                style={{ width: barWidth }}
              />
            </div>
          </motion.div>

          {/* Percentage / enter prompt */}
          <div className="relative h-8 flex items-center justify-center whitespace-nowrap">
            <AnimatePresence mode="wait" initial={false}>
              {ready ? (
                <motion.p
                  key="enter"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.5, delay: 0.5 }}
                  className="absolute text-[20px] text-white tracking-widest uppercase -translate-y-1/2"
                >
                  Click to enter
                </motion.p>
              ) : (
                <motion.p
                  key="pct"
                  initial={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.4 }}
                  className="absolute text-[20px] text-white/30 tabular-nums"
                >
                  {displayPct} %
                </motion.p>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
