import { useState, useCallback, useRef } from 'react'
import { speak, stopSpeaking } from '../services/speech'

export function useAudio() {
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [audioLevel, setAudioLevel] = useState(0)
  const animRef = useRef(null)
  const timeRef = useRef(0)

  const stop = useCallback(() => {
    stopSpeaking()
    cancelAnimationFrame(animRef.current)
    setIsSpeaking(false)
    setAudioLevel(0)
  }, [])

  // Speech Synthesis doesn't expose audio data, so we simulate
  // a reactive level for the sphere animation
  const playAudio = useCallback(async (text) => {
    setIsSpeaking(true)
    timeRef.current = 0

    const tick = () => {
      timeRef.current += 0.07
      const t = timeRef.current
      const level = 0.28 + Math.sin(t * 3.1) * 0.18 + Math.sin(t * 7.3) * 0.08 + (Math.random() * 0.06)
      setAudioLevel(Math.max(0, Math.min(1, level)))
      animRef.current = requestAnimationFrame(tick)
    }
    tick()

    try {
      await speak(text)
    } finally {
      cancelAnimationFrame(animRef.current)
      setIsSpeaking(false)
      setAudioLevel(0)
    }
  }, [])

  return { isSpeaking, audioLevel, playAudio, stop }
}
