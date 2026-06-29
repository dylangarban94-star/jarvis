const getBase = () => import.meta.env.VITE_OBSIDIAN_URL
const getKey = () => import.meta.env.VITE_OBSIDIAN_API_KEY

function headers() {
  return { Authorization: `Bearer ${getKey()}` }
}

async function listFolder(folderPath) {
  try {
    const res = await fetch(`${getBase()}/vault/${encodeURIComponent(folderPath)}/`, {
      headers: headers()
    })
    if (!res.ok) return []
    const data = await res.json()
    return (data.files || []).filter(f => typeof f === 'string' && f.endsWith('.md'))
  } catch {
    return []
  }
}

async function readFile(filePath) {
  try {
    const res = await fetch(`${getBase()}/vault/${encodeURIComponent(filePath)}`, {
      headers: headers()
    })
    if (!res.ok) return ''
    return await res.text()
  } catch {
    return ''
  }
}

async function searchVault(query) {
  try {
    const res = await fetch(
      `${getBase()}/search/simple/?query=${encodeURIComponent(query)}&contextLength=200`,
      { headers: headers() }
    )
    if (!res.ok) return []
    return await res.json()
  } catch {
    return []
  }
}

export async function getObsidianContext(query) {
  try {
    const parts = []

    // Priority: 00-Yo/ folder (personal context about Daniel)
    const yoFiles = await listFolder('00-Yo')
    for (const file of yoFiles.slice(0, 4)) {
      const content = await readFile(file)
      if (content) {
        parts.push(`[${file}]\n${content.slice(0, 800)}`)
      }
    }

    // Relevant search results
    const results = await searchVault(query)
    for (const result of results.slice(0, 3)) {
      const filename = result.filename || result.path
      if (!filename) continue
      // Skip files already included from 00-Yo/
      if (yoFiles.includes(filename)) continue
      const content = await readFile(filename)
      if (content) {
        parts.push(`[${filename}]\n${content.slice(0, 600)}`)
      }
    }

    return parts.join('\n\n')
  } catch (error) {
    console.warn('Obsidian context unavailable:', error.message)
    return ''
  }
}
