import { useState, useCallback, useRef } from 'react'

export function useAudio() {
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [audioLevel, setAudioLevel] = useState(0)

  const audioCtxRef = useRef(null)
  const animRef = useRef(null)
  const sourceRef = useRef(null)

  const stop = useCallback(() => {
    sourceRef.current?.stop()
    cancelAnimationFrame(animRef.current)
    setIsSpeaking(false)
    setAudioLevel(0)
  }, [])

  const playAudio = useCallback((blobUrl) => {
    return new Promise(async (resolve, reject) => {
      try {
        if (!audioCtxRef.current || audioCtxRef.current.state === 'closed') {
          audioCtxRef.current = new AudioContext()
        }
        if (audioCtxRef.current.state === 'suspended') {
          await audioCtxRef.current.resume()
        }

        const res = await fetch(blobUrl)
        const arrayBuffer = await res.arrayBuffer()
        const audioBuffer = await audioCtxRef.current.decodeAudioData(arrayBuffer)

        const source = audioCtxRef.current.createBufferSource()
        source.buffer = audioBuffer
        sourceRef.current = source

        const analyser = audioCtxRef.current.createAnalyser()
        analyser.fftSize = 256

        source.connect(analyser)
        analyser.connect(audioCtxRef.current.destination)

        setIsSpeaking(true)

        const data = new Uint8Array(analyser.frequencyBinCount)
        const tick = () => {
          analyser.getByteFrequencyData(data)
          const avg = data.reduce((a, b) => a + b, 0) / data.length
          setAudioLevel(avg / 255)
          animRef.current = requestAnimationFrame(tick)
        }
        tick()

        source.onended = () => {
          cancelAnimationFrame(animRef.current)
          setIsSpeaking(false)
          setAudioLevel(0)
          URL.revokeObjectURL(blobUrl)
          resolve()
        }

        source.start(0)
      } catch (err) {
        setIsSpeaking(false)
        setAudioLevel(0)
        reject(err)
      }
    })
  }, [])

  return { isSpeaking, audioLevel, playAudio, stop }
}
