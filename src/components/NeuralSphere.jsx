import { useEffect, useRef } from 'react'
import * as THREE from 'three'

const C_IDLE = new THREE.Color(0xb8860b)
const C_LISTEN = new THREE.Color(0xffb300)
const C_RESPOND = new THREE.Color(0xffd700)

export function NeuralSphere({ state = 'idle', audioLevel = 0, voiceLevel = 0 }) {
  const containerRef = useRef(null)
  // Keep latest props accessible inside the animation loop without re-running the effect
  const propsRef = useRef({ state, audioLevel, voiceLevel })

  useEffect(() => {
    propsRef.current = { state, audioLevel, voiceLevel }
  })

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    // ── Scene ──────────────────────────────────────────────────────────────
    const scene = new THREE.Scene()
    const w = container.clientWidth || 500
    const h = container.clientHeight || 500

    const camera = new THREE.PerspectiveCamera(55, w / h, 0.1, 100)
    camera.position.z = 3.8

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setSize(w, h)
    renderer.setClearColor(0x000000, 0)
    container.appendChild(renderer.domElement)

    // ── Particles ──────────────────────────────────────────────────────────
    const N = 200
    const pos = new Float32Array(N * 3)
    const vecs = []

    for (let i = 0; i < N; i++) {
      const u = Math.random()
      const v = Math.random()
      const theta = 2 * Math.PI * u
      const phi = Math.acos(2 * v - 1)
      const r = 1.0 + (Math.random() - 0.5) * 0.28

      const x = r * Math.sin(phi) * Math.cos(theta)
      const y = r * Math.sin(phi) * Math.sin(theta)
      const z = r * Math.cos(phi)

      pos[i * 3] = x
      pos[i * 3 + 1] = y
      pos[i * 3 + 2] = z
      vecs.push(new THREE.Vector3(x, y, z))
    }

    const particleGeo = new THREE.BufferGeometry()
    particleGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3))

    const particleMat = new THREE.PointsMaterial({
      color: C_IDLE,
      size: 0.036,
      transparent: true,
      opacity: 0.9,
      sizeAttenuation: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    })

    const particles = new THREE.Points(particleGeo, particleMat)

    // ── Connections ────────────────────────────────────────────────────────
    const MAX_DIST = 0.52
    const linePos = []

    for (let i = 0; i < N; i++) {
      for (let j = i + 1; j < N; j++) {
        if (vecs[i].distanceTo(vecs[j]) < MAX_DIST) {
          linePos.push(
            vecs[i].x, vecs[i].y, vecs[i].z,
            vecs[j].x, vecs[j].y, vecs[j].z
          )
        }
      }
    }

    const lineGeo = new THREE.BufferGeometry()
    lineGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(linePos), 3))

    const lineMat = new THREE.LineBasicMaterial({
      color: C_IDLE,
      transparent: true,
      opacity: 0.16,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    })

    const lines = new THREE.LineSegments(lineGeo, lineMat)

    // ── Group (particles + connections rotate together) ────────────────────
    const group = new THREE.Group()
    group.add(particles)
    group.add(lines)
    scene.add(group)

    // ── Core glow ──────────────────────────────────────────────────────────
    const coreGeo = new THREE.SphereGeometry(0.32, 32, 32)
    const coreMat = new THREE.MeshBasicMaterial({
      color: C_IDLE,
      transparent: true,
      opacity: 0.12,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    })
    const core = new THREE.Mesh(coreGeo, coreMat)
    scene.add(core)

    // ── Outer halo ─────────────────────────────────────────────────────────
    const haloGeo = new THREE.SphereGeometry(1.4, 16, 16)
    const haloMat = new THREE.MeshBasicMaterial({
      color: C_IDLE,
      transparent: true,
      opacity: 0.022,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    })
    const halo = new THREE.Mesh(haloGeo, haloMat)
    scene.add(halo)

    // ── Animation loop ─────────────────────────────────────────────────────
    let time = 0
    let animId
    const currentColor = new THREE.Color(C_IDLE)
    const targetColor = new THREE.Color(C_IDLE)

    const animate = () => {
      animId = requestAnimationFrame(animate)
      time += 0.004

      const { state, audioLevel, voiceLevel } = propsRef.current
      const level = state === 'responding' ? audioLevel : state === 'listening' ? voiceLevel : 0

      // Color target
      if (state === 'listening') targetColor.copy(C_LISTEN)
      else if (state === 'responding' || state === 'processing') targetColor.copy(C_RESPOND)
      else targetColor.copy(C_IDLE)

      currentColor.lerp(targetColor, 0.045)
      particleMat.color.copy(currentColor)
      lineMat.color.copy(currentColor)
      coreMat.color.copy(currentColor)
      haloMat.color.copy(currentColor)

      // Rotation — faster & more agitated when active
      const baseRotY = state === 'idle' ? 0.0013 : 0.0028
      group.rotation.y += baseRotY + level * 0.012
      group.rotation.x = Math.sin(time * 0.4) * 0.07

      // Particle size reacts to audio/voice
      particleMat.size = 0.033 + level * 0.028

      // Line opacity — denser when active
      lineMat.opacity = 0.14 + level * 0.18

      // Core pulse — processing spins at mid speed between listening and responding
      const pulseMult = state === 'responding' ? 7 : state === 'processing' ? 5 : 3
      const pulsed = 1 + Math.sin(time * pulseMult) * 0.07 + level * 0.22
      core.scale.setScalar(pulsed)
      coreMat.opacity = 0.10 + level * 0.28

      // Halo breathes
      halo.scale.setScalar(1 + level * 0.12)
      haloMat.opacity = 0.018 + level * 0.045

      renderer.render(scene, camera)
    }

    animate()

    // ── Resize ─────────────────────────────────────────────────────────────
    const ro = new ResizeObserver(() => {
      const cw = container.clientWidth
      const ch = container.clientHeight
      camera.aspect = cw / ch
      camera.updateProjectionMatrix()
      renderer.setSize(cw, ch)
    })
    ro.observe(container)

    return () => {
      cancelAnimationFrame(animId)
      ro.disconnect()
      particleGeo.dispose()
      lineGeo.dispose()
      coreGeo.dispose()
      haloGeo.dispose()
      renderer.dispose()
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement)
      }
    }
  }, [])

  return <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
}
