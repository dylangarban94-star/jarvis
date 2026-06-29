import { useState, useCallback, useRef } from 'react'

export function useVoice() {
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [voiceLevel, setVoiceLevel] = useState(0)

  const recognitionRef = useRef(null)
  const animRef = useRef(null)
  const timeRef = useRef(0)

  const stopAnimation = useCallback(() => {
    cancelAnimationFrame(animRef.current)
    setVoiceLevel(0)
  }, [])

  const startListening = useCallback((onResult) => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SR) {
      console.error('SpeechRecognition no está soportado en este navegador')
      return
    }

    const recognition = new SR()
    recognition.lang = 'es-ES'
    recognition.continuous = true   // keeps mic open until user finishes speaking
    recognition.interimResults = true
    recognition.maxAlternatives = 1

    recognition.onstart = () => {
      setIsListening(true)
      timeRef.current = 0
      const tick = () => {
        timeRef.current += 0.08
        const t = timeRef.current
        // Simulate voice activity on the sphere while listening
        const level = 0.22 + Math.sin(t * 2.8) * 0.14 + Math.sin(t * 6.3) * 0.07
        setVoiceLevel(Math.max(0, Math.min(1, level)))
        animRef.current = requestAnimationFrame(tick)
      }
      tick()
    }

    recognition.onresult = (event) => {
      const result = event.results[event.results.length - 1]
      const text = result[0].transcript
      setTranscript(text)
      if (result.isFinal && text.trim()) {
        recognition.stop()
        stopAnimation()
        onResult(text.trim())
      }
    }

    recognition.onerror = (event) => {
      if (event.error !== 'no-speech') {
        console.error('SpeechRecognition error:', event.error)
      }
      stopAnimation()
      setIsListening(false)
    }

    recognition.onend = () => {
      stopAnimation()
      setIsListening(false)
    }

    recognitionRef.current = recognition
    recognition.start()
  }, [stopAnimation])

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop()
    stopAnimation()
    setIsListening(false)
  }, [stopAnimation])

  return { isListening, transcript, voiceLevel, startListening, stopListening }
}
