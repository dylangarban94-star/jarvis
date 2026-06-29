import { useState, useCallback, useRef } from 'react'

export function useVoice() {
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [voiceLevel, setVoiceLevel] = useState(0)

  const recognitionRef = useRef(null)
  const audioCtxRef = useRef(null)
  const streamRef = useRef(null)
  const animRef = useRef(null)

  const cleanup = useCallback(() => {
    cancelAnimationFrame(animRef.current)
    streamRef.current?.getTracks().forEach(t => t.stop())
    streamRef.current = null
    setVoiceLevel(0)
  }, [])

  const startListening = useCallback(async (onResult, onEnd) => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SR) {
      console.error('SpeechRecognition no está soportado en este navegador')
      return
    }

    // Mic access for real-time level visualization
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false })
      streamRef.current = stream

      if (!audioCtxRef.current || audioCtxRef.current.state === 'closed') {
        audioCtxRef.current = new AudioContext()
      }
      if (audioCtxRef.current.state === 'suspended') {
        await audioCtxRef.current.resume()
      }

      const source = audioCtxRef.current.createMediaStreamSource(stream)
      const analyser = audioCtxRef.current.createAnalyser()
      analyser.fftSize = 256
      source.connect(analyser)

      const data = new Uint8Array(analyser.frequencyBinCount)
      const tick = () => {
        analyser.getByteFrequencyData(data)
        const avg = data.reduce((a, b) => a + b, 0) / data.length
        setVoiceLevel(avg / 255)
        animRef.current = requestAnimationFrame(tick)
      }
      tick()
    } catch (e) {
      console.warn('Micrófono no disponible para visualización:', e.message)
    }

    const recognition = new SR()
    recognition.lang = 'es-ES'
    recognition.continuous = false
    recognition.interimResults = true
    recognition.maxAlternatives = 1

    recognition.onstart = () => setIsListening(true)

    recognition.onresult = (event) => {
      const result = event.results[event.results.length - 1]
      const text = result[0].transcript
      setTranscript(text)
      if (result.isFinal && text.trim()) {
        onResult(text.trim())
      }
    }

    recognition.onerror = (event) => {
      console.error('SpeechRecognition error:', event.error)
      cleanup()
      setIsListening(false)
      onEnd?.()
    }

    recognition.onend = () => {
      cleanup()
      setIsListening(false)
      onEnd?.()
    }

    recognitionRef.current = recognition
    recognition.start()
  }, [cleanup])

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop()
    cleanup()
    setIsListening(false)
  }, [cleanup])

  return { isListening, transcript, voiceLevel, startListening, stopListening }
}
