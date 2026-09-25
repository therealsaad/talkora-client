'use client'

import Image from 'next/image'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { talkoraAssets } from '@/config/talkora-assets'

export type JulieVisualState =
  | 'greeting'
  | 'teaching'
  | 'curious'
  | 'listening'
  | 'thinking'
  | 'speaking'
  | 'encouraging'
  | 'gentle-correction'
  | 'modeling'
  | 'surprised'
  | 'proud'
  | 'celebrating'

function poseForState(state: JulieVisualState): keyof typeof talkoraAssets.julie {
  switch (state) {
    case 'greeting':
      return 'welcome'
    case 'listening':
    case 'curious':
      return 'listening'
    case 'thinking':
      return 'thinking'
    case 'speaking':
      return 'speaking'
    case 'teaching':
      return 'teaching'
    case 'encouraging':
    case 'gentle-correction':
      return 'encouraging'
    case 'modeling':
      return 'reading'
    case 'proud':
      return 'proud'
    case 'celebrating':
      return 'celebrate'
    case 'surprised':
      return 'correct'
    default:
      return 'standing'
  }
}

export function MissJulieCharacter({
  state = 'teaching',
  isSpeaking = false,
}: {
  state?: JulieVisualState
  isSpeaking?: boolean
}) {
  const reduced = useReducedMotion()
  const poseKey = poseForState(state)
  const pose =
    talkoraAssets.julie[poseKey] ||
    talkoraAssets.julie.standing ||
    '/miss-julie/standing.png'

  const chipLabel = isSpeaking
    ? 'Speaking'
    : state === 'listening'
    ? 'Listening to you'
    : state === 'thinking'
    ? 'Thinking...'
    : state === 'celebrating' || state === 'proud'
    ? 'Celebrating!'
    : state === 'encouraging' || state === 'gentle-correction'
    ? 'Encouraging'
    : 'Miss Julie'

  return (
    <div
      className="lesson-character-figure lesson-character-figure--julie"
      data-julie-state={state}
    >
      <div className="lesson-character-aura" aria-hidden="true" />
      <div className="lesson-character-shadow" aria-hidden="true" />

      {/* Smooth AnimatePresence crossfade between poses without flashing or TTS re-trigger */}
      <AnimatePresence mode="wait">
        <motion.div
          key={poseKey}
          className="lesson-julie-art"
          initial={reduced ? { opacity: 0 } : { opacity: 0, x: -14, scale: 0.98 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={reduced ? { opacity: 0 } : { opacity: 0, x: 10, scale: 0.98 }}
          transition={{ duration: 0.28, ease: 'easeOut' }}
        >
          <Image
            src={pose}
            alt="Miss Julie, your AI English Teacher"
            width={440}
            height={580}
            priority
            className="lesson-julie-img"
          />
        </motion.div>
      </AnimatePresence>

      <motion.div
        className="lesson-julie-state-chip"
        key={chipLabel}
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
      >
        <span className="lesson-julie-state-dot" aria-hidden="true" />
        <span>{chipLabel}</span>
      </motion.div>
    </div>
  )
}
