import { curveBasis, drag, line, select, type Selection } from 'd3'
import { computed, markRaw, ref, type Ref, watch, unref } from 'vue'
import { buildStyleString, nodeToDataUrl } from '@/utils/whiteboard'

export interface WhiteboardOptions {
  /** Brush color. Can be a reactive Vue Ref or a static string. */
  color?: Ref<string> | string
  /** Background color of the SVG container. */
  backgroundColor?: string
  /** The shape of the end of the lines. Defaults to 'round'. */
  linecap?: 'butt' | 'square' | 'round'
  /** The shape of the corners where two lines meet. Defaults to 'round'. */
  linejoin?: 'miter' | 'round' | 'bevel' | 'miter-clip' | 'arcs'
  /** Additional CSS styles for the stroke paths (e.g. blend mode). */
  lineStyles?: Record<string, string>
  /** Brush size (stroke-width). Can be a reactive Vue Ref or a static string. */
  size?: Ref<string> | string
  /** Scale factor for PNG export (default: devicePixelRatio). Use e.g. 2 or 3 for print. */
  exportScale?: number
  /** Initial state to populate the whiteboard with. */
  initialState?: SerializableRecord[]
}

export const defaults = {
  backgroundColor: '#ffffff',
  color: '#333333',
  linecap: 'round',
  linejoin: 'round',
  size: '5px',
} as const

export interface HistoryRecord {
  id: string
  type: 'line'
  timestamp: number
  data: SVGElement | SVGElement[]
  options: {
    color: string
    size: string
  }
}

export interface SerializableRecord {
  id: string
  type: 'line'
  timestamp?: number
  pathData: string
  options: {
    color: string
    size: string
  }
}

export function useWhiteboard(
  containerRef: Ref<SVGSVGElement | null>,
  options: WhiteboardOptions = {},
) {
  const d3Line = line().curve(curveBasis)

  const history = ref<HistoryRecord[]>([])
  const currentIndex = ref(-1)

  let svg: ReturnType<typeof select<SVGSVGElement, unknown>> | null = null
  let activeLine: Selection<SVGPathElement, [number, number][], null, undefined> | null = null

  const canUndo = computed(() => currentIndex.value >= 0)
  const canRedo = computed(() => currentIndex.value < history.value.length - 1)

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
          if (currentIndex.value < history.value.length - 1) {
            history.value = history.value.slice(0, currentIndex.value + 1)
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

            const record: HistoryRecord = {
              id: crypto.randomUUID(),
              type: 'line',
              timestamp: Date.now(),
              data: markRaw(node),
              options: {
                color: unref(options.color) || defaults.color,
                size: unref(options.size) || defaults.size,
              },
            }

            history.value.push(record)
            currentIndex.value++
            activeLine = null
          })
        }),
    )

    if (options.initialState && options.initialState.length > 0 && history.value.length === 0) {
      options.initialState.forEach((record) => {
        const path = svg!
          .append('path')
          .attr('class', 'line')
          .attr('d', record.pathData)
          .attr(
            'style',
            buildStyleString({
              ...options,
              color: record.options.color,
              size: record.options.size,
            }),
          )

        const node = path.node() as SVGElement
        history.value.push({
          id: record.id,
          type: record.type,
          timestamp: record.timestamp ?? Date.now(),
          data: markRaw(node),
          options: {
            color: record.options.color,
            size: record.options.size,
          },
        })
      })
      currentIndex.value = history.value.length - 1
    }
  }

  const undo = () => {
    if (!canUndo.value) return

    const record = history.value[currentIndex.value]

    if (!record) return

    if (record.type === 'line') {
      const node = record.data as SVGElement
      if (node && node.parentNode) {
        node.parentNode.removeChild(node)
      }
    }

    currentIndex.value--
  }

  const redo = () => {
    if (!canRedo.value) return

    currentIndex.value++
    const record = history.value[currentIndex.value]

    if (!record) return

    if (record.type === 'line') {
      const node = record.data as SVGElement
      svg?.node()?.appendChild(node)
    }
  }

  const clear = () => {
    clearSvg()
    history.value = []
    currentIndex.value = -1
  }

  const jumpTo = (index: number) => {
    if (index === currentIndex.value) return

    if (index < currentIndex.value) {
      while (currentIndex.value > index) {
        undo()
      }
    } else {
      while (currentIndex.value < index) {
        redo()
      }
    }
  }

  const save = async (): Promise<string | undefined> => {
    if (history.value.length === 0 || !containerRef.value) return

    const width = containerRef.value.clientWidth
    const height = containerRef.value.clientHeight

    const container = containerRef.value.cloneNode(true) as SVGElement
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

  const removeFromHistory = (index: number) => {
    const record = history.value[index]
    if (!record) return

    if (record.type === 'line') {
      const node = record.data as SVGElement
      if (node && node.parentNode) {
        node.parentNode.removeChild(node)
      }
    }

    history.value.splice(index, 1)

    if (index <= currentIndex.value) {
      currentIndex.value--
    }
  }

  const serialize = (): SerializableRecord[] => {
    return history.value.map((record) => {
      const node = record.data as SVGElement
      const pathData = node.getAttribute('d') || ''
      return {
        id: record.id,
        type: record.type,
        timestamp: record.timestamp,
        pathData,
        options: record.options,
      }
    })
  }

  return {
    /** Undoes the last drawing action. */
    undo,
    /** Redoes the last undone drawing action. */
    redo,
    /** Clears the entire canvas and resets history. */
    clear,
    /**
     * Exports the current whiteboard state as a PNG data URL.
     * Uses exportScale option for quality.
     */
    save,
    /** Removes a specific record from history by index and removes its element from SVG. */
    removeFromHistory,
    /** Reactive boolean indicating if undo is possible. */
    canUndo,
    /** Reactive boolean indicating if redo is possible. */
    canRedo,
    /** Reactive array containing all history records. */
    history,
    /** The current index in history. -1 means empty, 0 is the first record. */
    currentIndex,
    /** Navigates to a specific point in history by replaying actions. */
    jumpTo,
    /** Serializes the current history into a JSON-compatible format. */
    serialize,
  }
}
