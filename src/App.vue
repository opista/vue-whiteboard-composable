<template>
  <div class="app-container">
    <header class="header">
      <div class="header-content">
        <h1>
          Vue Whiteboard Composable<span class="version">v{{ pkg.version }}</span>
        </h1>
        <p>A lightweight, headless Vue 3 composable for SVG-based whiteboard drawing.</p>
        <div class="links">
          <a :href="`https://www.npmjs.com/package/${pkg.name}`" target="_blank" class="badge-link npm">
            NPM
          </a>
          <a :href="pkg.repository.url.replace('git+', '').replace('.git', '')" target="_blank"
            class="badge-link github">
            GitHub
          </a>
        </div>
      </div>
    </header>

    <main class="workspace">
      <div class="whiteboard-wrapper">
        <div class="canvas-area">
          <svg @mouseenter="isHovering = true" @mouseleave="isHovering = false" @mousemove="handleMouseMove" ref="svgRef"
            class="whiteboard" viewBox="0 0 800 600" preserveAspectRatio="xMidYMid meet">
          </svg>
          <svg class="cursor-overlay" viewBox="0 0 800 600" preserveAspectRatio="xMidYMid meet">
            <circle v-if="isHovering" :cx="mouseX" :cy="mouseY" :r="parseInt(size) / 2" :fill="color"
              stroke="rgba(0,0,0,0.1)" stroke-width="0.5" />
          </svg>
        </div>

        <div class="toolbar">
          <div class="color-picker" role="group" aria-label="Color Palette">
            <button v-for="c in colors" :key="c.value" class="color-btn" :class="{ active: color === c.value }"
              :style="{ backgroundColor: c.value }" @click="color = c.value" :aria-label="c.name"
              :title="c.name"></button>
          </div>

          <div class="separator"></div>

          <div class="size-picker" role="group" aria-label="Brush Size">
            <button v-for="s in sizes" :key="s.value" class="size-btn" :class="{ active: size === s.value }"
              @click="size = s.value" :title="s.name">
              <div class="size-preview" :style="{ width: s.previewSize + 'px', height: s.previewSize + 'px' }"></div>
            </button>
          </div>

          <div class="separator"></div>

          <div class="actions">
            <button class="icon-btn" @click="undo" :disabled="!canUndo" title="Undo">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M3 7v6h6" />
                <path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13" />
              </svg>
            </button>
            <button class="icon-btn" @click="redo" :disabled="!canRedo" title="Redo">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 7v6h-6" />
                <path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3L21 13" />
              </svg>
            </button>
            <button class="icon-btn primary" @click="saveImage" title="Save Image">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                <polyline points="17 21 17 13 7 13 7 21" />
                <polyline points="7 3 7 8 15 8" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <div class="history-panel">
        <div class="history-header">
          <div class="history-title-wrapper">
            <h3>History</h3>
            <span class="badge">{{ history.length }}</span>
          </div>
          <button class="icon-btn sm danger" @click="clear" title="Clear Board" :disabled="history.length === 0">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M3 6h18" />
              <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
              <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
            </svg>
          </button>
        </div>
        <div class="history-list">
          <div class="history-item" :class="{ active: currentIndex === -1 }" @click="jumpTo(-1)">
            <div class="history-icon start">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
              </svg>
            </div>
            <div class="history-content">
              <span class="history-type">Empty Canvas</span>
            </div>
          </div>
          <div v-for="(item, index) in history" :key="item.id" class="history-item"
            :class="{ active: index === currentIndex }" @click="jumpTo(index)" @mouseenter="highlightRecord(index)"
            @mouseleave="unhighlightRecord(index)">
            <div class="history-icon draw">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="m18 15-6-6-6 6" />
              </svg>
            </div>
            <div class="history-content">
              <div class="history-title">
                <span class="history-meta" :style="{ backgroundColor: item.brush.color }"
                  :title="'Color: ' + item.brush.color"></span>
                <span class="history-type capitalize">{{ item.type }}</span>
              </div>
              <span class="history-time">
                {{ formatTime(item.timestamp) }}
                <span> · {{ item.brush.size }}</span>
              </span>
            </div>
            <button class="history-delete-btn" @click.stop="removeFromHistory(index)" title="Remove item">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
        </div>
      </div>

      <div v-if="image" class="preview-overlay" @click.self="image = undefined">
        <div class="preview-card">
          <div class="preview-header">
            <h3>Saved Snapshot</h3>
            <button class="close-btn" @click="image = undefined">&times;</button>
          </div>
          <div class="preview-body">
            <img :src="image" alt="Whiteboard Snapshot" />
          </div>
          <div class="preview-footer">
            <a :href="image" download="whiteboard.png" class="download-btn">Download PNG</a>
          </div>
        </div>
      </div>
    </main>

    <footer class="footer">
      <div class="features-grid">
        <div class="feature-card">
          <h3>🧩 Headless & Composable</h3>
          <p>
            Built as a Vue 3 composable (<code>useWhiteboard</code>), giving you full control over
            the UI while handling the logic.
          </p>
        </div>
        <div class="feature-card">
          <h3>⚡ SVG & D3.js</h3>
          <p>
            Leverages D3.js for efficient SVG manipulation, ensuring smooth drawing and scaling.
          </p>
        </div>
        <div class="feature-card">
          <h3>↺ Undo / Redo</h3>
          <p>Built-in history stack management with robust undo/redo capabilities.</p>
        </div>
        <div class="feature-card">
          <h3>💾 Export to Image</h3>
          <p>Easily export your whiteboard creations to PNG format.</p>
        </div>
      </div>
      <p class="footer-note">
        MIT Licensed • Created by <a href="https://github.com/metacurb" target="_blank">Metacurb</a>
      </p>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useWhiteboard } from './composables/useWhiteboard'
import pkg from '../package.json'
import defaultState from './default-state.json'

const colors = [
  { name: 'Black', value: '#212121' },
  { name: 'Red', value: '#ff555f' },
  { name: 'Yellow', value: '#ffc93b' },
  { name: 'Blue', value: '#3494ff' },
  { name: 'Green', value: '#4caf50' },
  { name: 'Purple', value: '#9c27b0' },
]

const color = ref('#ff555f')
const size = ref('16px')
const image = ref<string | undefined>(undefined)
const svgRef = ref<SVGSVGElement | null>(null)
const mouseX = ref(0)
const mouseY = ref(0)
const isHovering = ref(false)

const sizes = [
  { name: 'Thin', value: '2px', previewSize: 4 },
  { name: 'Medium', value: '4px', previewSize: 8 },
  { name: 'Thick', value: '8px', previewSize: 12 },
  { name: 'Extra Thick', value: '16px', previewSize: 18 },
]

const STORAGE_KEY = 'vue-whiteboard-state'
const getInitialState = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (!saved) return defaultState

    const parsed = JSON.parse(saved)
    return parsed?.length ? parsed : defaultState
  } catch (e) {
    console.error('Failed to load state', e)
    return defaultState
  }
}

const {
  undo,
  redo,
  clear,
  save,
  removeFromHistory,
  canUndo,
  canRedo,
  history,
  currentIndex,
  jumpTo,
  serialize,
} = useWhiteboard(svgRef, {
  color,
  size,
  lineStyles: { 'mix-blend-mode': 'normal' },
  initialState: getInitialState(),
})

watch(
  history,
  () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(serialize()))
  },
  { deep: true },
)

const handleMouseMove = (e: MouseEvent) => {
  if (!svgRef.value) return
  const svg = svgRef.value
  const point = svg.createSVGPoint()
  point.x = e.clientX
  point.y = e.clientY
  const ctm = svg.getScreenCTM()
  if (ctm) {
    const svgPoint = point.matrixTransform(ctm.inverse())
    mouseX.value = svgPoint.x
    mouseY.value = svgPoint.y
  }
}

const highlightRecord = (index: number) => {
  const record = history.value[index]
  if (record?.type === 'line' && record.data) {
    const el = record.data as SVGElement
    el.classList.add('highlighted')
  }
}

const unhighlightRecord = (index: number) => {
  const record = history.value[index]
  if (record?.type === 'line' && record.data) {
    const el = record.data as SVGElement
    el.classList.remove('highlighted')
  }
}

async function saveImage() {
  image.value = await save()
}

function formatTime(timestamp: number) {
  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
  }).format(new Date(timestamp))
}
</script>

<style>
body {
  margin: 0;
  font-family:
    'Inter',
    -apple-system,
    BlinkMacSystemFont,
    'Segoe UI',
    Roboto,
    Helvetica,
    Arial,
    sans-serif;
  background: radial-gradient(circle at 50% 0%, #eef2f6 0%, #dfe4ea 100%);
  color: #1f2937;
  -webkit-font-smoothing: antialiased;
}

.app-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-height: 100vh;
  width: 100%;
  margin: 0 auto;
  padding: 60px 0;
  max-width: 1000px;
}

.header {
  text-align: center;
  margin-bottom: 32px;
}

.header h1 {
  font-size: 2.5rem;
  font-weight: 700;
  color: #111827;
  letter-spacing: -0.025em;
  margin: 0 0 12px 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
}

.version {
  font-size: 0.875rem;
  background: #e5e7eb;
  color: #4b5563;
  padding: 4px 8px;
  border-radius: 6px;
  font-weight: 600;
}

.header p {
  color: #6b7280;
  font-size: 1.1rem;
  margin: 0 0 20px 0;
}

.links {
  display: flex;
  justify-content: center;
  gap: 12px;
}

.badge-link {
  display: inline-flex;
  align-items: center;
  padding: 6px 16px;
  border-radius: 20px;
  text-decoration: none;
  font-weight: 500;
  font-size: 0.9rem;
  transition: all 0.2s;
}

.badge-link.npm {
  background-color: #fff0f0;
  color: #cc3534;
  border: 1px solid #ffcdcd;
}

.badge-link.npm:hover {
  background-color: #ffe6e6;
}

.badge-link.github {
  background-color: #f3f4f6;
  color: #1f2937;
  border: 1px solid #e5e7eb;
}

.badge-link.github:hover {
  background-color: #e5e7eb;
}

.workspace {
  display: flex;
  gap: 24px;
}

.whiteboard-wrapper {
  flex: 1;
  position: relative;
  background: white;
  border-radius: 16px;
  box-shadow:
    0 10px 40px -10px rgba(0, 0, 0, 0.1),
    0 0 0 1px rgba(0, 0, 0, 0.05);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.whiteboard {
  width: 100%;
  max-width: 800px;
  height: 100%;
  touch-action: none;
  cursor: none;
  background-image: radial-gradient(#e5e7eb 1px, transparent 1px);
  background-size: 20px 20px;
  display: block;
}

.canvas-area {
  position: relative;
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.cursor-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 2;
}

.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 16px;
  background: #ffffff;
  border-top: 1px solid #f3f4f6;
  flex-wrap: wrap;
}

.color-picker,
.size-picker,
.actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.separator {
  width: 1px;
  height: 24px;
  background-color: #e5e7eb;
  margin: 0 8px;
}

.color-btn {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: 2px solid transparent;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
}

.color-btn:hover {
  transform: scale(1.1);
}

.color-btn.active {
  border-color: #111827;
  transform: scale(1.1);
  box-shadow: 0 0 0 2px rgba(255, 255, 255, 1);
}

.size-btn {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  border: 1px solid transparent;
  background: transparent;
  cursor: pointer;
  transition: all 0.2s ease;
  color: #4b5563;
}

.size-btn:hover {
  background-color: #f3f4f6;
  color: #111827;
}

.size-btn.active {
  background-color: #f3f4f6;
  border-color: #e5e7eb;
  color: #111827;
}

.size-preview {
  background-color: currentColor;
  border-radius: 50%;
}

.icon-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 8px;
  border: none;
  background: transparent;
  color: #4b5563;
  cursor: pointer;
  transition: all 0.2s ease;
}

.icon-btn:hover:not(:disabled) {
  background-color: #f3f4f6;
  color: #111827;
}

.icon-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.icon-btn.danger:hover:not(:disabled) {
  background-color: #fee2e2;
  color: #ef4444;
}

.icon-btn.primary {
  background-color: #111827;
  color: white;
}

.icon-btn.primary:hover:not(:disabled) {
  opacity: 0.9;
  background-color: #111827;
  color: white;
  transform: translateY(-1px);
}

.icon-btn.sm {
  width: 28px;
  height: 28px;
  padding: 4px;
}

.history-title-wrapper {
  display: flex;
  align-items: center;
  gap: 8px;
}

/* History Panel */
.history-panel {
  width: 280px;
  background: white;
  border-radius: 16px;
  box-shadow:
    0 10px 40px -10px rgba(0, 0, 0, 0.1),
    0 0 0 1px rgba(0, 0, 0, 0.05);
  display: flex;
  flex-direction: column;
  height: 600px;
  /* Match whiteboard height */
  overflow: hidden;
}

.history-header {
  padding: 16px;
  border-bottom: 1px solid #f3f4f6;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.history-header h3 {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  color: #111827;
}

.badge {
  background: #f3f4f6;
  color: #4b5563;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 500;
}

.history-list {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
}

.history-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  user-select: none;
}

.history-item:hover {
  background-color: #f9fafb;
}

.history-item.active {
  background-color: #f3f4f6;
}

.history-item.active .history-type {
  font-weight: 600;
  color: #111827;
}

.history-icon {
  width: 24px;
  height: 24px;
  border-radius: 6px;
  background: #f3f4f6;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #6b7280;
}

.history-item.active .history-icon {
  background: #e5e7eb;
  color: #111827;
}

.history-icon.draw {
  color: #3b82f6;
  background: #eff6ff;
}

.history-icon.clear {
  color: #ef4444;
  background: #fef2f2;
}

.history-icon.start {
  color: #9ca3af;
}

.history-content {
  display: flex;
  flex-direction: column;
}

.history-type {
  font-size: 0.875rem;
  color: #4b5563;
}

.history-type.capitalize {
  text-transform: capitalize;
}

.history-time {
  font-size: 0.75rem;
  color: #9ca3af;
}

/* Modal/Preview */
.preview-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  animation: fadeIn 0.2s ease-out;
}

.preview-card {
  background: white;
  padding: 24px;
  border-radius: 12px;
  box-shadow:
    0 20px 25px -5px rgba(0, 0, 0, 0.1),
    0 10px 10px -5px rgba(0, 0, 0, 0.04);
  max-width: 90vw;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  gap: 16px;
  animation: scaleIn 0.2s ease-out;
}

.preview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.preview-header h3 {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #6b7280;
  padding: 0;
  line-height: 1;
}

.preview-body {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  overflow: auto;
  display: flex;
  justify-content: center;
  background-image:
    linear-gradient(45deg, #f0f0f0 25%, transparent 25%),
    linear-gradient(-45deg, #f0f0f0 25%, transparent 25%),
    linear-gradient(45deg, transparent 75%, #f0f0f0 75%),
    linear-gradient(-45deg, transparent 75%, #f0f0f0 75%);
  background-size: 20px 20px;
  background-position:
    0 0,
    0 10px,
    10px -10px,
    -10px 0px;
}

.preview-body img {
  max-width: 100%;
  max-height: 60vh;
  object-fit: contain;
}

.preview-footer {
  display: flex;
  justify-content: flex-end;
}

.download-btn {
  display: inline-block;
  background-color: #111827;
  color: white;
  padding: 10px 20px;
  border-radius: 6px;
  text-decoration: none;
  font-weight: 500;
  transition: opacity 0.2s;
}

.download-btn:hover {
  opacity: 0.9;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }

  to {
    opacity: 1;
  }
}

@keyframes scaleIn {
  from {
    transform: scale(0.95);
    opacity: 0;
  }

  to {
    transform: scale(1);
    opacity: 1;
  }
}

@media (max-width: 1100px) {
  .workspace {
    flex-direction: column;
    align-items: stretch;
    width: 100%;
    max-width: 800px;
  }

  .whiteboard-wrapper {
    width: 100%;
  }

  .history-panel {
    width: 100%;
    height: 300px;
  }
}

@media (max-width: 1100px) {
  .app-container {
    padding-right: 10px;
    padding-left: 10px;
    width: auto;
  }
}

@media (max-width: 700px) {
  .header h1 {
    font-size: 1.75rem;
    flex-wrap: wrap;
  }

  .whiteboard {
    aspect-ratio: 1 / 1;
  }

  .toolbar {
    gap: 8px;
    padding: 8px;
    flex-direction: column;
  }

  .separator {
    display: none;
  }
}

.history-title {
  display: flex;
  align-items: center;
  gap: 6px;
}

.history-meta {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  display: inline-block;
  border: 1px solid rgba(0, 0, 0, 0.1);
}

.history-delete-btn {
  opacity: 0;
  background: none;
  border: none;
  cursor: pointer;
  color: #9ca3af;
  padding: 4px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  margin-left: auto;
}

.history-item:hover .history-delete-btn {
  opacity: 1;
}

.history-delete-btn:hover {
  background-color: #fee2e2;
  color: #ef4444;
}

.whiteboard path.highlighted {
  filter: drop-shadow(0 0 4px #000);
}

/* Footer & Features */
.footer {
  margin-top: 60px;
  text-align: center;
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 24px;
  margin-bottom: 40px;
}

.feature-card {
  background: white;
  padding: 24px;
  border-radius: 12px;
  border: 1px solid rgba(0, 0, 0, 0.05);
  text-align: left;
  transition: transform 0.2s;
}

.feature-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 30px -10px rgba(0, 0, 0, 0.05);
}

.feature-card h3 {
  font-size: 1.1rem;
  margin: 0 0 8px 0;
  color: #111827;
}

.feature-card p {
  font-size: 0.95rem;
  color: #6b7280;
  margin: 0;
  line-height: 1.5;
}

.feature-card code {
  background: #f3f4f6;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 0.9em;
  color: #ec4899;
}

.footer-note {
  color: #9ca3af;
  font-size: 0.9rem;
}

.footer-note a {
  color: #6b7280;
  text-decoration: none;
  font-weight: 500;
}

.footer-note a:hover {
  color: #111827;
}

@media (max-width: 1100px) {
  .footer {
    max-width: 800px;
  }

  .features-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 850px) {
  .features-grid {
    grid-template-columns: 1fr;
  }
}
</style>
