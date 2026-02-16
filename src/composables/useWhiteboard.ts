import { curveBasis, drag, line, select, type Selection } from 'd3'
import { computed, markRaw, ref, type Ref, watch } from 'vue'
import {
  buildStyleString,
  nodeToDataUrl,
} from '@/utils/whiteboard'

export interface WhiteboardOptions {
  color?: Ref<string> | string
  backgroundColor?: string
  linecap?: 'butt' | 'square' | 'round'
  linejoin?: 'miter' | 'round' | 'bevel' | 'miter-clip' | 'arcs'
  lineStyles?: Record<string, string>
  size?: Ref<string> | string
  /** Scale factor for PNG export (default: devicePixelRatio). Use e.g. 2 or 3 for print. */
  exportScale?: number
}

export const defaults = {
  backgroundColor: '#ffffff',
  color: '#333333',
  linecap: 'round',
  linejoin: 'round',
  size: '5px',
} as const


export function useWhiteboard(
  containerRef: Ref<SVGSVGElement | null>,
  options: WhiteboardOptions = {},
) {
  const d3Line = line().curve(curveBasis)

  const undoStack = ref<SVGElement[]>([])
  const redoStack = ref<SVGElement[]>([])

  let svg: ReturnType<typeof select<SVGSVGElement, unknown>> | null = null
  let activeLine: Selection<SVGPathElement, [number, number][], null, undefined> | null = null

  const canUndo = computed(() => undoStack.value.length > 0)
  const canRedo = computed(() => redoStack.value.length > 0)

  const clearSvg = () => {
    svg?.selectAll('*').remove()
  }

  const init = () => {
    const container = containerRef.value
    if (!container) return

    if (options.backgroundColor) {
      container.style.backgroundColor = options.backgroundColor
    }

    svg = select(container).call(
      drag<SVGSVGElement, unknown, [number, number][]>()
        .container(container)
        .subject(({ x, y }) => [
          [x, y],
          [x, y],
        ])
        .on('start', (event) => {
          if (redoStack.value.length > 0) {
            redoStack.value = []
          }

          activeLine = svg!
            .append('path')
            .datum(event.subject)
            .attr('class', 'line')
            .attr('style', buildStyleString(options))

          activeLine?.attr('d', (d) => d3Line(d))

          event.on('drag', (e: { x: number; y: number }) => {
            activeLine!.datum().push([e.x, e.y])
            activeLine!.attr('d', (d) => d3Line(d))
          })

          event.on('end', () => {
            activeLine!.attr('d', (d) => d3Line(d))
            const node = activeLine!.node() as SVGElement
            undoStack.value.push(markRaw(node))
            activeLine = null
          })
        }),
    )
  }

  const undo = () => {
    const node = undoStack.value.pop()
    if (!node) return

    if (node.parentNode) {
      node.parentNode.removeChild(node)
    }
    redoStack.value.push(node)
  }

  const redo = () => {
    const node = redoStack.value.pop()
    if (!node) return

    svg?.node()?.appendChild(node)
    undoStack.value.push(node)
  }

  const clear = () => {
    clearSvg()
    undoStack.value = []
    redoStack.value = []
  }

  const save = async (): Promise<string | undefined> => {
    if (!undoStack.value.length || !containerRef.value) return

    const width = containerRef.value.clientWidth
    const height = containerRef.value.clientHeight

    const container = containerRef.value.cloneNode(true) as SVGElement
    const clonedSvg = select(container)
    clonedSvg.selectAll('*').remove()
    undoStack.value.forEach((node) => clonedSvg.node()?.appendChild(node.cloneNode(true)))

    const linejoin = options.linejoin ?? defaults.linejoin
    const linecap = options.linecap ?? defaults.linecap
    container.querySelectorAll('path').forEach((path) => {
      path.setAttribute('stroke-linejoin', linejoin)
      path.setAttribute('stroke-linecap', linecap)
    })

    container.setAttribute('width', String(width))
    container.setAttribute('height', String(height))
    container.setAttribute('viewBox', `0 0 ${width} ${height}`)
    container.setAttribute('shape-rendering', 'geometricPrecision')
    const svgData = nodeToDataUrl(container)

    const scale = Math.max(
      1,
      options.exportScale ?? (typeof window !== 'undefined' ? window.devicePixelRatio : 1) ?? 1,
    )
    const scaledWidth = Math.round(width * scale)
    const scaledHeight = Math.round(height * scale)

    const canvas = document.createElement('canvas')
    const context = canvas.getContext('2d')!
    canvas.width = scaledWidth
    canvas.height = scaledHeight

    return new Promise<string>((resolve) => {
      const image = new Image()
      image.onload = () => {
        context.clearRect(0, 0, scaledWidth, scaledHeight)
        context.imageSmoothingEnabled = true
        context.imageSmoothingQuality = 'high'
        context.drawImage(image, 0, 0, scaledWidth, scaledHeight)
        resolve(canvas.toDataURL('image/png'))
      }
      image.src = svgData
    })
  }

  watch(
    containerRef,
    (el) => {
      if (el) init()
    },
    { immediate: true },
  )

  return { undo, redo, clear, save, canUndo, canRedo }
}
