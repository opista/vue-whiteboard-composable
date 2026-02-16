<template>
  <div class="app-container">
    <header class="header">
      <h1>Vue Whiteboard Composable</h1>
      <p>A simple, composable-powered whiteboard for your ideas.</p>
    </header>

    <main class="main-content">
      <div class="whiteboard-wrapper">
        <svg ref="svgRef" class="whiteboard" />

        <div class="toolbar">
          <div class="color-picker" role="group" aria-label="Color Palette">
            <button
              v-for="c in colors"
              :key="c.value"
              class="color-btn"
              :class="{ active: color === c.value }"
              :style="{ backgroundColor: c.value }"
              @click="color = c.value"
              :aria-label="c.name"
              :title="c.name"
            ></button>
          </div>

          <div class="separator"></div>

          <div class="size-picker" role="group" aria-label="Brush Size">
            <button
              v-for="s in sizes"
              :key="s.value"
              class="size-btn"
              :class="{ active: size === s.value }"
              @click="size = s.value"
              :title="s.name"
            >
              <div
                class="size-preview"
                :style="{ width: s.previewSize + 'px', height: s.previewSize + 'px' }"
              ></div>
            </button>
          </div>

          <div class="separator"></div>

          <div class="actions">
            <button class="icon-btn" @click="undo" :disabled="!canUndo" title="Undo">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path d="M3 7v6h6" />
                <path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13" />
              </svg>
            </button>
            <button class="icon-btn" @click="redo" :disabled="!canRedo" title="Redo">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path d="M21 7v6h-6" />
                <path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3L21 13" />
              </svg>
            </button>
            <button class="icon-btn danger" @click="clear" title="Clear Board">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path d="M3 6h18" />
                <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
              </svg>
            </button>
            <button class="icon-btn primary" @click="saveImage" title="Save Image">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                <polyline points="17 21 17 13 7 13 7 21" />
                <polyline points="7 3 7 8 15 8" />
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
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useWhiteboard } from './composables/useWhiteboard'

const colors = [
  { name: 'Black', value: '#212121' },
  { name: 'Red', value: '#ff555f' },
  { name: 'Yellow', value: '#ffc93b' },
  { name: 'Blue', value: '#3494ff' },
  { name: 'Green', value: '#4caf50' },
  { name: 'Purple', value: '#9c27b0' },
]

const color = ref('#212121')
const size = ref('4px')
const image = ref<string | undefined>(undefined)
const svgRef = ref<SVGSVGElement | null>(null)

const sizes = [
  { name: 'Thin', value: '2px', previewSize: 4 },
  { name: 'Medium', value: '4px', previewSize: 8 },
  { name: 'Thick', value: '8px', previewSize: 12 },
  { name: 'Extra Thick', value: '16px', previewSize: 18 },
]

const { undo, redo, clear, save, canUndo, canRedo } = useWhiteboard(svgRef, {
  color,
  size,
  lineStyles: { 'mix-blend-mode': 'normal' },
})

async function saveImage() {
  image.value = await save()
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
  background-color: #f3f4f6;
  color: #1f2937;
  -webkit-font-smoothing: antialiased;
}

.app-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-height: 100vh;
  padding: 40px 20px;
  background: radial-gradient(circle at 50% 0%, #eef2f6 0%, #dfe4ea 100%);
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
  margin: 0 0 8px 0;
}

.header p {
  color: #6b7280;
  font-size: 1.1rem;
  margin: 0;
}

.whiteboard-wrapper {
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
  width: 800px;
  height: 600px;
  touch-action: none;
  cursor: crosshair;
  background-image: radial-gradient(#e5e7eb 1px, transparent 1px);
  background-size: 20px 20px;
}

.toolbar {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  padding: 16px 24px;
  background: #ffffff;
  border-top: 1px solid #f3f4f6;
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

@media (max-width: 850px) {
  .whiteboard {
    width: 100%;
    height: 400px;
  }

  .whiteboard-wrapper {
    width: 100%;
  }

  .app-container {
    padding: 20px;
  }
}
</style>
