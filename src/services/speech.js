function getSpanishVoice() {
  const voices = window.speechSynthesis.getVoices()

  // Spanish male names across browsers/OS
  const malePriority = [
    v => v.lang.startsWith('es') && /male|hombre|jorge|diego|carlos|miguel|pablo/i.test(v.name),
    v => v.lang === 'es-ES',
    v => v.lang === 'es-MX',
    v => v.lang.startsWith('es'),
  ]

  for (const test of malePriority) {
    const match = voices.find(test)
    if (match) return match
  }

  return null
}

export function speak(text) {
  return new Promise((resolve, reject) => {
    window.speechSynthesis.cancel()

    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = 'es-ES'
    utterance.rate = 0.88
    utterance.pitch = 0.82
    utterance.volume = 1

    // Voices may load async — try immediately, then after load
    const applyVoice = () => {
      const voice = getSpanishVoice()
      if (voice) utterance.voice = voice
    }

    applyVoice()

    if (window.speechSynthesis.getVoices().length === 0) {
      window.speechSynthesis.addEventListener('voiceschanged', applyVoice, { once: true })
    }

    utterance.onend = () => resolve()
    utterance.onerror = (e) => {
      if (e.error === 'interrupted' || e.error === 'canceled') resolve()
      else reject(new Error(e.error))
    }

    window.speechSynthesis.speak(utterance)
  })
}

export function stopSpeaking() {
  window.speechSynthesis.cancel()
}
