'use client';
import { useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import useGlobalStore from '../globalstore';

const BAR_COUNT = 5;

// Per-bar wave heights — offset per index so they feel organic
const WAVE_KEYFRAMES = [
  [0.25, 1.0, 0.4, 0.75, 0.3, 0.9, 0.25],
  [0.6, 0.3, 1.0, 0.45, 0.8, 0.35, 0.6],
  [0.4, 0.85, 0.3, 1.0, 0.5, 0.7, 0.4],
  [0.9, 0.4, 0.7, 0.3, 1.0, 0.45, 0.9],
  [0.35, 0.7, 0.5, 0.85, 0.25, 1.0, 0.35],
];

function barVariant(i) {
  return {
    playing: {
      scaleY: WAVE_KEYFRAMES[i],
      transition: {
        duration: 4,
        repeat: Infinity,
        repeatType: 'loop',
        ease: 'easeInOut',
        delay: i * 0.1,
      },
    },
    paused: {
      scaleY: 0.28,
      transition: { duration: 0.4, ease: 'easeOut' },
    },
  };
}

const FADE_STEPS = 20;
const FADE_INTERVAL_MS = 2000 / FADE_STEPS;

export default function AudioButton({ src = '/Audio/Meditation.mp3', volume = 0.2 }) {
  const audioRef = useRef(null);
  const fadeTimerRef = useRef(null);
  const isPlayingRef = useRef(false);
  const volumeRef = useRef(volume);

  const isPlaying = useGlobalStore(s => s.playmusic);
  const setPlayMusic = useGlobalStore(s => s.setPlayMusic);

  useEffect(() => { volumeRef.current = volume; }, [volume]);

  useEffect(() => {
    const audio = new Audio(src);
    audio.loop = true;
    audio.volume = 0;
    audioRef.current = audio;
    return () => {
      clearInterval(fadeTimerRef.current);
      audio.pause();
      audio.src = '';
    };
  }, [src]);

  const startPlayback = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || isPlayingRef.current) return;
    clearInterval(fadeTimerRef.current);
    audio.volume = 0;
    audio.play().catch(() => {
      isPlayingRef.current = false;
      setPlayMusic(false);
    });
    isPlayingRef.current = true;
    setPlayMusic(true);
    const targetVol = volumeRef.current;
    let step = 0;
    fadeTimerRef.current = setInterval(() => {
      step++;
      audio.volume = Math.min(targetVol * (step / FADE_STEPS), targetVol);
      if (step >= FADE_STEPS) {
        clearInterval(fadeTimerRef.current);
        audio.volume = targetVol;
      }
    }, FADE_INTERVAL_MS);
  }, [setPlayMusic]);

  const stopPlayback = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || !isPlayingRef.current) return;
    clearInterval(fadeTimerRef.current);
    isPlayingRef.current = false;
    setPlayMusic(false);
    const startVol = audio.volume;
    let step = 0;
    fadeTimerRef.current = setInterval(() => {
      step++;
      audio.volume = Math.max(startVol * (1 - step / FADE_STEPS), 0);
      if (step >= FADE_STEPS) {
        clearInterval(fadeTimerRef.current);
        audio.volume = 0;
        audio.pause();
      }
    }, FADE_INTERVAL_MS);
  }, [setPlayMusic]);

  const toggle = useCallback(() => {
    if (isPlayingRef.current) stopPlayback();
    else startPlayback();
  }, [startPlayback, stopPlayback]);

  // Play triggered by loading screen click — runs synchronously inside the
  // user-gesture call stack, so audio.play() is allowed by the browser
  useEffect(() => {
    const handle = () => startPlayback();
    window.addEventListener('audio-unlock', handle, { once: true });
    return () => window.removeEventListener('audio-unlock', handle);
  }, [startPlayback]);

  return (
    <button
      onClick={toggle}
      aria-label={isPlaying ? 'Pause audio' : 'Play audio'}
      title={isPlaying ? 'Pause' : 'Play'}
      className="group flex flex-row items-center gap-1 cursor-pointer pointer-events-auto focus:outline-none"
    >
      {/* bars */}
      <div className="flex gap-[4px] h-[36px] mt-[20px]">
        {Array.from({ length: BAR_COUNT }, (_, i) => (
          <motion.span
            key={i}
            variants={barVariant(i)}
            animate={isPlaying ? 'playing' : 'paused'}
            className="block w-[1px] rounded-full origin-center"
            style={{ height: '100%' }}
            transition={{ backgroundColor: { duration: 0.5 } }}
            initial={{ backgroundColor: 'rgba(255,255,255,0.45)' }}
          />
        ))}
      </div>
      {/* label */}
      <div className="relative overflow-hidden h-[14px] w-[38px]">
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={isPlaying ? 'pause' : 'sound'}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="absolute inset-0 flex items-center justify-center font-futura-medium text-[11px] tracking-widest text-white/60 group-hover:text-white/90 uppercase"
          >
            {isPlaying ? 'Pause' : 'Play'}
          </motion.span>
        </AnimatePresence>
      </div>
    </button>
  );
}
