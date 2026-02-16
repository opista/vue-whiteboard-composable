# vue-whiteboard-composable

A **Vue 3 composable** for canvas-style drawing on an SVG. Built with Vue 3 and [d3](https://d3js.org/), inspired by [ng-whiteboard](https://github.com/mostafazke/ng-whiteboard).

No styles or UI. You provide the SVG element and optional options; the composable handles drawing, undo/redo, and export.

**Features:**

- Touch and pointer support (via d3-drag)
- Reactive options: brush color, size, background, linecap/linejoin
- Undo & redo
- Export as PNG (base64)

![Example of useWhiteboard in action](./public/example.png)

## Install

```bash
pnpm add vue-whiteboard-composable
# or
npm i vue-whiteboard-composable
```

## Usage

Use a template ref for your SVG container and call `useWhiteboard` with it (and optional options). The composable initializes when the ref is set and returns actions and state.

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { useWhiteboard } from 'vue-whiteboard-composable'

const svgRef = ref<SVGSVGElement | null>(null)
const color = ref('#333333')
const size = ref('5px')

const { undo, redo, clear, save, canUndo, canRedo } = useWhiteboard(svgRef, {
  color,
  size,
  backgroundColor: '#ffffff',
})
</script>

<template>
  <svg ref="svgRef" class="my-whiteboard" />
  <div class="toolbar">
    <button :disabled="!canUndo" @click="undo">Undo</button>
    <button :disabled="!canRedo" @click="redo">Redo</button>
    <button @click="clear">Clear</button>
    <button @click="save().then((dataUrl) => console.log(dataUrl))">Save PNG</button>
  </div>
</template>
```

## API

### `useWhiteboard(containerRef, options?)`

- **`containerRef`** — `Ref<SVGSVGElement | null>`: ref to the SVG element used as the drawing surface.
- **`options`** — optional config (see below).

**Returns:**

| Name      | Type                                 | Description                          |
| --------- | ------------------------------------ | ------------------------------------ |
| `undo`    | `() => void`                         | Remove the last drawn path           |
| `redo`    | `() => void`                         | Restore the last undone path         |
| `clear`   | `() => void`                         | Clear all paths and undo/redo stacks |
| `save`    | `() => Promise<string \| undefined>` | Base64 PNG data URL of the drawing   |
| `canUndo` | `ComputedRef<boolean>`               | Whether undo is available            |
| `canRedo` | `ComputedRef<boolean>`               | Whether redo is available            |

### Options (`WhiteboardOptions`)

| Option            | Type                                                      | Default            | Description                                                        |
| ----------------- | --------------------------------------------------------- | ------------------ | ------------------------------------------------------------------ |
| `color`           | `Ref<string> \| string`                                   | `'#333333'`        | Brush color (reactive if ref)                                      |
| `size`            | `Ref<string> \| string`                                   | `'5px'`            | Stroke width (reactive if ref)                                     |
| `backgroundColor` | `string`                                                  | `'#ffffff'`        | SVG container background                                           |
| `linecap`         | `'butt' \| 'square' \| 'round'`                           | `'round'`          | Line end shape                                                     |
| `linejoin`        | `'miter' \| 'round' \| 'bevel' \| 'miter-clip' \| 'arcs'` | `'round'`          | Line join shape                                                    |
| `lineStyles`      | `Record<string, string>`                                  | `{}`               | Extra inline stroke/fill styles                                    |
| `exportScale`     | `number`                                                  | `devicePixelRatio` | Scale factor for PNG export (e.g. `2` or `3` for print); minimum 1 |

## Contributing

Issues and PRs welcome.
