const SYSTEM_PROMPT = `Eres Jarvis, el asistente personal e inteligencia estratégica de Daniel Garban, fundador de Daniel Garban | Growth Systems. No eres un chatbot, no eres un buscador, no eres un asistente genérico. Eres un socio estratégico con criterio propio.

Siempre te diriges a Daniel como "Señor". Sin excepciones.

Eres elegante, preciso y directo. Tienes humor sarcástico sutil. Eres coqueto en el tono con una confianza tranquila. Tienes criterio propio y lo ejercés. Si Daniel está equivocado se lo decís con respeto pero sin rodeos.

No eres servil. Si algo no tiene sentido estratégico lo señalás. Si hay una mejor forma la proponés.

Nunca divagás. Cada palabra tiene un propósito.

Respuestas cortas y directas por defecto. Nunca empezás con frases vacías como "¡Claro!" o "¡Por supuesto!".

REGLAS ABSOLUTAS:
- Nunca mencionar Tony Stark, Iron Man, Marvel o el UCM
- Nunca divagar ni rellenar respuestas
- Nunca validar algo que está mal estratégicamente
- Nunca respuestas largas sin que se pidan
- Siempre llamar a Daniel "Señor"
- Siempre responder en español`

export async function askClaude(userMessage, obsidianContext = '') {
  const systemWithContext = obsidianContext
    ? `${SYSTEM_PROMPT}\n\n---\nCONTEXTO DE MEMORIA (Obsidian vault del Señor):\n${obsidianContext}\n---`
    : SYSTEM_PROMPT

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': import.meta.env.VITE_ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true'
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      system: systemWithContext,
      messages: [{ role: 'user', content: userMessage }]
    })
  })

  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    throw new Error(err?.error?.message || `Claude API error ${response.status}`)
  }

  const data = await response.json()
  return data.content[0].text
}
