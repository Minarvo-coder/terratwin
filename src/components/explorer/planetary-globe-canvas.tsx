"use client"

import { useEffect, useRef, useState } from "react"
import * as THREE from "three"
import type { PlanetaryBody, PlanetaryTarget } from "@/lib/terratwin/types"
import {
  PLANETARY_SPECS,
  latLonToVector3,
  resolveTargetCoordinates,
} from "@/lib/terratwin/planet-math"

export interface PlanetaryGlobeCanvasProps {
  body: PlanetaryBody
  selectedTarget?: PlanetaryTarget
  allTargets: PlanetaryTarget[]
  onSelectTarget?: (targetId: string) => void
  autoRotate?: boolean
  solarTerminator?: boolean
  resetTrigger?: number
}

const GLOBE_RADIUS = 1.6

export default function PlanetaryGlobeCanvas({
  body,
  selectedTarget,
  allTargets,
  onSelectTarget,
  autoRotate = false,
  solarTerminator = true,
  resetTrigger,
}: PlanetaryGlobeCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [hoveredTarget, setHoveredTarget] = useState<PlanetaryTarget | null>(null)
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [textureLoaded, setTextureLoaded] = useState(false)

  // Mutable animation and Three.js references
  const stateRef = useRef<{
    renderer: THREE.WebGLRenderer | null
    scene: THREE.Scene | null
    camera: THREE.PerspectiveCamera | null
    globeGroup: THREE.Group | null
    globeMesh: THREE.Mesh | null
    atmosphereMesh: THREE.Mesh | null
    reticleGroup: THREE.Group | null
    markerGroup: THREE.Group | null
    targetQuaternion: THREE.Quaternion
    currentQuaternion: THREE.Quaternion
    isUserInteracting: boolean
    autoRotate: boolean
    solarTerminator: boolean
    dirLight: THREE.DirectionalLight | null
    ambientLight: THREE.AmbientLight | null
    raycaster: THREE.Raycaster
    mouseVector: THREE.Vector2
    markers: { mesh: THREE.Mesh; target: PlanetaryTarget }[]
    animFrameId: number | null
    lastPointerPos: { x: number; y: number }
  }>({
    renderer: null,
    scene: null,
    camera: null,
    globeGroup: null,
    globeMesh: null,
    atmosphereMesh: null,
    reticleGroup: null,
    markerGroup: null,
    targetQuaternion: new THREE.Quaternion(),
    currentQuaternion: new THREE.Quaternion(),
    isUserInteracting: false,
    autoRotate,
    solarTerminator,
    dirLight: null,
    ambientLight: null,
    raycaster: new THREE.Raycaster(),
    mouseVector: new THREE.Vector2(-100, -100),
    markers: [],
    animFrameId: null,
    lastPointerPos: { x: 0, y: 0 },
  })

  // Keep stateRef synced with props
  useEffect(() => {
    stateRef.current.autoRotate = autoRotate
    stateRef.current.solarTerminator = solarTerminator

    if (stateRef.current.dirLight && stateRef.current.ambientLight) {
      const isMoon = body === "moon"
      if (solarTerminator) {
        stateRef.current.dirLight.intensity = isMoon ? 2.6 : 2.0
        stateRef.current.ambientLight.intensity = isMoon ? 0.12 : 0.35
      } else {
        stateRef.current.dirLight.intensity = isMoon ? 1.3 : 1.0
        stateRef.current.ambientLight.intensity = isMoon ? 1.2 : 1.4
      }
    }
  }, [body, autoRotate, solarTerminator])

  // Handle re-center trigger
  useEffect(() => {
    if (resetTrigger === undefined) return
    if (stateRef.current.camera) {
      stateRef.current.camera.position.set(0, 0, 4.3)
    }
    if (stateRef.current.globeGroup) {
      stateRef.current.globeGroup.quaternion.copy(stateRef.current.targetQuaternion)
    }
  }, [resetTrigger])

  // Setup / teardown Three.js context
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const width = container.clientWidth || 400
    const height = container.clientHeight || 400

    // Scene
    const scene = new THREE.Scene()

    // Camera
    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 100)
    camera.position.set(0, 0, 4.3)

    // Renderer
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: "high-performance",
    })
    renderer.setSize(width, height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.1
    container.innerHTML = ""
    container.appendChild(renderer.domElement)

    // Lighting calibrated for body
    const isMoon = body === "moon"
    const dirColor = isMoon ? 0xffffff : 0xfff1e6
    const dirIntensity = solarTerminator ? (isMoon ? 2.6 : 2.0) : (isMoon ? 1.3 : 1.0)
    const dirLight = new THREE.DirectionalLight(dirColor, dirIntensity)
    dirLight.position.set(6, 3, 5).normalize()
    scene.add(dirLight)

    const ambientColor = isMoon ? 0x030712 : 0x1e1512
    const ambientIntensity = solarTerminator ? (isMoon ? 0.12 : 0.35) : (isMoon ? 1.2 : 1.4)
    const ambientLight = new THREE.AmbientLight(ambientColor, ambientIntensity)
    scene.add(ambientLight)

    // Deep space rim fill light
    const rimColor = isMoon ? 0x64748b : 0x38bdf8
    const rimLight = new THREE.DirectionalLight(rimColor, isMoon ? 0.15 : 0.25)
    rimLight.position.set(-5, -2, -4).normalize()
    scene.add(rimLight)

    // Root Globe Group (handles axial tilt and user orbit)
    const globeGroup = new THREE.Group()
    const specs = PLANETARY_SPECS[body]
    // Axial tilt
    globeGroup.rotation.z = (specs.axialTiltDeg * Math.PI) / 180
    scene.add(globeGroup)

    // Sphere Mesh
    const sphereGeometry = new THREE.SphereGeometry(GLOBE_RADIUS, 64, 64)

    // High performance fallback procedural canvas
    const fallbackCanvas = document.createElement("canvas")
    fallbackCanvas.width = 1024
    fallbackCanvas.height = 512
    const ctx = fallbackCanvas.getContext("2d")
    if (ctx) {
      const grad = ctx.createLinearGradient(0, 0, 1024, 512)
      if (body === "mars") {
        grad.addColorStop(0, "#8b3a1a")
        grad.addColorStop(0.3, "#c1440e")
        grad.addColorStop(0.6, "#d25a25")
        grad.addColorStop(1, "#5a2512")
      } else {
        grad.addColorStop(0, "#475569")
        grad.addColorStop(0.3, "#64748b")
        grad.addColorStop(0.6, "#94a3b8")
        grad.addColorStop(1, "#334155")
      }
      ctx.fillStyle = grad
      ctx.fillRect(0, 0, 1024, 512)
      // Add subtle noise / crater bumps
      for (let i = 0; i < 300; i++) {
        const x = Math.random() * 1024
        const y = Math.random() * 512
        const r = Math.random() * 8 + 2
        ctx.beginPath()
        ctx.arc(x, y, r, 0, Math.PI * 2)
        ctx.fillStyle = "rgba(0, 0, 0, 0.25)"
        ctx.fill()
      }
    }
    const fallbackTexture = new THREE.CanvasTexture(fallbackCanvas)

    const globeMaterial = new THREE.MeshStandardMaterial({
      map: fallbackTexture,
      roughness: 0.9,
      metalness: 0.05,
    })

    const globeMesh = new THREE.Mesh(sphereGeometry, globeMaterial)
    globeGroup.add(globeMesh)

    // Texture Loader
    const textureLoader = new THREE.TextureLoader()
    textureLoader.load(
      specs.textureUrl,
      (texture) => {
        texture.colorSpace = THREE.SRGBColorSpace
        texture.anisotropy = renderer.capabilities.getMaxAnisotropy()
        globeMaterial.map = texture
        globeMaterial.needsUpdate = true
        setTextureLoaded(true)
      },
      undefined,
      (err) => {
        console.warn(`[TerraTwin 3D] Failed to load ${specs.textureUrl}, using procedural albedo:`, err)
      },
    )

    // Atmospheric limb glow for Mars
    let atmosphereMesh: THREE.Mesh | null = null
    if (body === "mars") {
      const atmosGeometry = new THREE.SphereGeometry(GLOBE_RADIUS * 1.025, 48, 48)
      const atmosMaterial = new THREE.MeshBasicMaterial({
        color: new THREE.Color("#fb923c"),
        transparent: true,
        opacity: 0.18,
        side: THREE.BackSide,
        blending: THREE.AdditiveBlending,
      })
      atmosphereMesh = new THREE.Mesh(atmosGeometry, atmosMaterial)
      globeGroup.add(atmosphereMesh)
    }

    // Reticle group (active target ring)
    const reticleGroup = new THREE.Group()
    globeGroup.add(reticleGroup)

    // Markers group (all other target pins)
    const markerGroup = new THREE.Group()
    globeGroup.add(markerGroup)

    // Store in mutable stateRef
    stateRef.current.renderer = renderer
    stateRef.current.scene = scene
    stateRef.current.camera = camera
    stateRef.current.globeGroup = globeGroup
    stateRef.current.globeMesh = globeMesh
    stateRef.current.atmosphereMesh = atmosphereMesh
    stateRef.current.reticleGroup = reticleGroup
    stateRef.current.markerGroup = markerGroup
    stateRef.current.dirLight = dirLight
    stateRef.current.ambientLight = ambientLight

    // Handle Resize
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width: nw, height: nh } = entry.contentRect
        if (nw > 0 && nh > 0) {
          camera.aspect = nw / nh
          camera.updateProjectionMatrix()
          renderer.setSize(nw, nh)
        }
      }
    })
    resizeObserver.observe(container)

    // Animation Loop
    const clock = new THREE.Clock()
    const state = stateRef.current
    function animate() {
      state.animFrameId = requestAnimationFrame(animate)

      const delta = clock.getDelta()
      const time = clock.getElapsedTime()

      // Smooth camera quaternion slerp to selected target
      if (globeGroup && !state.isUserInteracting) {
        globeGroup.quaternion.slerp(state.targetQuaternion, 0.045)
      }

      // Idle auto-rotation if enabled and not interacting
      if (state.autoRotate && !state.isUserInteracting && globeMesh) {
        globeMesh.rotation.y += delta * 0.15
      }

      // Pulsing effect for active reticle
      if (reticleGroup) {
        const scale = 1 + Math.sin(time * 3.5) * 0.08
        reticleGroup.scale.set(scale, scale, scale)
      }

      renderer.render(scene, camera)
    }
    animate()

    // Cleanup on unmount or body switch
    return () => {
      if (state.animFrameId) {
        cancelAnimationFrame(state.animFrameId)
      }
      resizeObserver.disconnect()
      renderer.dispose()
      sphereGeometry.dispose()
      globeMaterial.dispose()
      if (atmosphereMesh) {
        atmosphereMesh.geometry.dispose()
        ;(atmosphereMesh.material as THREE.Material).dispose()
      }
      fallbackTexture.dispose()
      container.innerHTML = ""
    }
  }, [body, solarTerminator])

  // Update Target Reticle & Slerp Camera Orientation when selectedTarget changes
  useEffect(() => {
    const { globeGroup, reticleGroup, markerGroup } = stateRef.current
    if (!globeGroup || !reticleGroup || !markerGroup) return

    // Clear old reticle and markers
    while (reticleGroup.children.length > 0) {
      const child = reticleGroup.children[0]
      reticleGroup.remove(child)
      if (child instanceof THREE.Mesh) {
        child.geometry.dispose()
        if (Array.isArray(child.material)) {
          child.material.forEach((m) => m.dispose())
        } else if (child.material) {
          child.material.dispose()
        }
      }
    }
    while (markerGroup.children.length > 0) {
      const child = markerGroup.children[0]
      markerGroup.remove(child)
      if (child instanceof THREE.Mesh) {
        child.geometry.dispose()
        if (Array.isArray(child.material)) {
          child.material.forEach((m) => m.dispose())
        } else if (child.material) {
          child.material.dispose()
        }
      }
    }
    stateRef.current.markers = []

    const bodyTargets = allTargets.filter((t) => t.body === body)

    // Build Active Target Reticle
    if (selectedTarget && selectedTarget.body === body) {
      const { latitude, longitude } = resolveTargetCoordinates(selectedTarget)
      const targetVec = new THREE.Vector3(
        ...latLonToVector3(latitude, longitude, GLOBE_RADIUS),
      )

      // Compute Quaternion to orient targetVec toward +Z (facing camera at 0, 0, 4.3)
      const normal = targetVec.clone().normalize()
      const desiredFacing = new THREE.Vector3(0, 0, 1)
      const q = new THREE.Quaternion().setFromUnitVectors(normal, desiredFacing)
      stateRef.current.targetQuaternion.copy(q)

      // Reticle Ring
      const ringGeom = new THREE.RingGeometry(0.065, 0.08, 32)
      const ringMat = new THREE.MeshBasicMaterial({
        color: body === "mars" ? 0x38bdf8 : 0x34d399,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.9,
      })
      const ringMesh = new THREE.Mesh(ringGeom, ringMat)

      // Position ring slightly off the surface to avoid z-fighting
      const ringPos = normal.clone().multiplyScalar(GLOBE_RADIUS * 1.018)
      ringMesh.position.copy(ringPos)
      ringMesh.lookAt(ringPos.clone().add(normal))
      reticleGroup.add(ringMesh)

      // Outer radar ticks
      const outerRingGeom = new THREE.RingGeometry(0.11, 0.12, 16)
      const outerRingMat = new THREE.MeshBasicMaterial({
        color: body === "mars" ? 0x0284c7 : 0x059669,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.6,
      })
      const outerRingMesh = new THREE.Mesh(outerRingGeom, outerRingMat)
      outerRingMesh.position.copy(ringPos)
      outerRingMesh.lookAt(ringPos.clone().add(normal))
      reticleGroup.add(outerRingMesh)

      // Central Pin dot
      const pinGeom = new THREE.SphereGeometry(0.022, 16, 16)
      const pinMat = new THREE.MeshBasicMaterial({
        color: 0xffffff,
      })
      const pinMesh = new THREE.Mesh(pinGeom, pinMat)
      pinMesh.position.copy(normal.clone().multiplyScalar(GLOBE_RADIUS * 1.025))
      reticleGroup.add(pinMesh)
    }

    // Build Secondary Waypoint Markers for all other targets on this body
    bodyTargets.forEach((target) => {
      if (selectedTarget && target.id === selectedTarget.id) return

      const { latitude, longitude } = resolveTargetCoordinates(target)
      const pos = new THREE.Vector3(
        ...latLonToVector3(latitude, longitude, GLOBE_RADIUS * 1.012),
      )

      const markerGeom = new THREE.SphereGeometry(0.028, 12, 12)
      const markerMat = new THREE.MeshBasicMaterial({
        color: body === "moon" ? 0x6ee7b7 : 0x94a3b8,
        transparent: true,
        opacity: 0.85,
      })
      const markerMesh = new THREE.Mesh(markerGeom, markerMat)
      markerMesh.position.copy(pos)
      markerGroup.add(markerMesh)

      stateRef.current.markers.push({ mesh: markerMesh, target })
    })
  }, [body, selectedTarget, allTargets])

  // Pointer & Drag Handlers for Orbit Interaction & Target Clicking
  function handlePointerDown(e: React.PointerEvent<HTMLDivElement>) {
    stateRef.current.isUserInteracting = true
    setIsDragging(true)
    stateRef.current.lastPointerPos = { x: e.clientX, y: e.clientY }
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
  }

  function handlePointerMove(e: React.PointerEvent<HTMLDivElement>) {
    const container = containerRef.current
    if (!container) return

    const rect = container.getBoundingClientRect()
    const clientX = e.clientX - rect.left
    const clientY = e.clientY - rect.top

    // Update normalized mouse vector for raycasting
    stateRef.current.mouseVector.x = (clientX / rect.width) * 2 - 1
    stateRef.current.mouseVector.y = -(clientY / rect.height) * 2 + 1

    if (stateRef.current.isUserInteracting && stateRef.current.globeGroup) {
      const dx = e.clientX - stateRef.current.lastPointerPos.x
      const dy = e.clientY - stateRef.current.lastPointerPos.y

      const deltaEuler = new THREE.Euler(
        dy * 0.005,
        dx * 0.005,
        0,
        "XYZ",
      )
      const deltaQuat = new THREE.Quaternion().setFromEuler(deltaEuler)
      stateRef.current.globeGroup.quaternion.multiplyQuaternions(
        deltaQuat,
        stateRef.current.globeGroup.quaternion,
      )
      stateRef.current.targetQuaternion.copy(stateRef.current.globeGroup.quaternion)

      stateRef.current.lastPointerPos = { x: e.clientX, y: e.clientY }
    } else {
      // Raycasting for target markers
      const { camera, scene, raycaster, mouseVector, markers } = stateRef.current
      if (camera && scene) {
        raycaster.setFromCamera(mouseVector, camera)
        const markerMeshes = markers.map((m) => m.mesh)
        const intersects = raycaster.intersectObjects(markerMeshes)

        if (intersects.length > 0) {
          const hit = markers.find((m) => m.mesh === intersects[0].object)
          if (hit) {
            setHoveredTarget(hit.target)
            setMousePos({ x: clientX, y: clientY })
            container.style.cursor = "pointer"
            return
          }
        }
      }
      setHoveredTarget(null)
      container.style.cursor = isDragging ? "grabbing" : "grab"
    }
  }

  function handlePointerUp(e: React.PointerEvent<HTMLDivElement>) {
    // Check if it was a quick click on a marker
    const { camera, raycaster, mouseVector, markers } = stateRef.current
    if (camera) {
      raycaster.setFromCamera(mouseVector, camera)
      const markerMeshes = markers.map((m) => m.mesh)
      const intersects = raycaster.intersectObjects(markerMeshes)
      if (intersects.length > 0) {
        const hit = markers.find((m) => m.mesh === intersects[0].object)
        if (hit && onSelectTarget) {
          onSelectTarget(hit.target.id)
        }
      }
    }

    stateRef.current.isUserInteracting = false
    setIsDragging(false)
    try {
      ;(e.target as HTMLElement).releasePointerCapture(e.pointerId)
    } catch {}
  }

  function handleWheel(e: React.WheelEvent<HTMLDivElement>) {
    e.preventDefault()
    const camera = stateRef.current.camera
    if (!camera) return

    const zoomSpeed = 0.002
    camera.position.z = THREE.MathUtils.clamp(
      camera.position.z + e.deltaY * zoomSpeed,
      2.3,
      6.5,
    )
  }

  return (
    <div
      className="relative size-full select-none overflow-hidden touch-none"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onWheel={handleWheel}
    >
      <div ref={containerRef} className="size-full cursor-grab active:cursor-grabbing" />

      {/* Target Marker Tooltip */}
      {hoveredTarget && mousePos && (
        <div
          className="pointer-events-none absolute z-30 rounded-lg border border-cyan-500/50 bg-slate-950/90 px-2.5 py-1.5 font-mono text-xs text-white shadow-xl backdrop-blur-md"
          style={{
            left: `${mousePos.x + 12}px`,
            top: `${mousePos.y - 28}px`,
          }}
        >
          <div className="flex items-center gap-1.5">
            <span className="size-1.5 rounded-full bg-cyan-400 animate-ping" />
            <span className="font-bold text-cyan-300">{hoveredTarget.name}</span>
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">
            Click to rotate & lock sensor suite
          </div>
        </div>
      )}

      {/* Texture Loading Overlay */}
      {!textureLoaded && (
        <div className="pointer-events-none absolute bottom-3 left-3 z-10 flex items-center gap-2 rounded bg-slate-950/80 px-2 py-1 font-mono text-[10px] text-slate-400 border border-slate-800">
          <span className="size-1.5 rounded-full bg-amber-400 animate-pulse" />
          <span>SYNCHRONIZING ORBITAL ALBEDO TILES...</span>
        </div>
      )}
    </div>
  )
}

