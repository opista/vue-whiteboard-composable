import { type WhiteboardOptions, defaults } from '@/composables/useWhiteboard'
import { isRef, type Ref } from 'vue'

export const resolveValue = <T>(value: Ref<T> | T): T => (isRef(value) ? value.value : (value as T))

export const buildStyleString = (options: WhiteboardOptions) => {
  const color = resolveValue(options.color) ?? defaults.color
  const styles: Record<string, string> = {
    fill: 'none',
    stroke: color,
    'stroke-width': resolveValue(options.size) ?? defaults.size,
    'stroke-linejoin': options.linejoin ?? defaults.linejoin,
    'stroke-linecap': options.linecap ?? defaults.linecap,
    ...options.lineStyles,
  }
  return Object.entries(styles)
    .map(([key, value]) => `${key}: ${value};`)
    .join(' ')
}

export const toBase64 = (str: string): string => {
  const bytes = new TextEncoder().encode(str)
  const chunk = 8192
  let binary = ''
  for (let i = 0; i < bytes.length; i += chunk) {
    const slice = bytes.subarray(i, i + chunk)
    binary += String.fromCharCode(...Array.from(slice))
  }
  return btoa(binary)
}

export const nodeToDataUrl = (node: SVGElement): string => {
  node.setAttribute('xlink', 'http://www.w3.org/1999/xlink')
  const serializer = new XMLSerializer()
  const svgString = serializer
    .serializeToString(node)
    .replace(/(\w+)?:?xlink=/g, 'xmlns:xlink=')
    .replace(/NS\d+:href/g, 'xlink:href')
  return 'data:image/svg+xml;base64,' + toBase64(svgString)
}
