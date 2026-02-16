import { describe, it, expect } from 'vitest'
import { ref } from 'vue'
import { resolveValue, buildStyleString, toBase64 } from './whiteboard'

describe('whiteboard utilities', () => {
  describe('resolveValue', () => {
    it('resolves a plain value', () => {
      expect(resolveValue('#000')).toBe('#000')
    })

    it('resolves a ref value', () => {
      const color = ref('#fff')
      expect(resolveValue(color)).toBe('#fff')
    })
  })

  describe('buildStyleString', () => {
    it('builds a default style string', () => {
      const styles = buildStyleString({})
      expect(styles).toContain('fill: none')
      expect(styles).toContain('stroke: #333333')
      expect(styles).toContain('stroke-width: 5px')
      expect(styles).toContain('stroke-linejoin: round')
      expect(styles).toContain('stroke-linecap: round')
    })

    it('applies custom options', () => {
      const styles = buildStyleString({
        color: '#ff0000',
        size: '10px',
        linecap: 'butt'
      })
      expect(styles).toContain('stroke: #ff0000')
      expect(styles).toContain('stroke-width: 10px')
      expect(styles).toContain('stroke-linecap: butt')
    })

    it('respects ref options', () => {
      const color = ref('#00ff00')
      const styles = buildStyleString({ color })
      expect(styles).toContain('stroke: #00ff00')
    })

    it('merges lineStyles', () => {
      const styles = buildStyleString({
        lineStyles: { 'stroke-dasharray': '5,5' }
      })
      expect(styles).toContain('stroke-dasharray: 5,5')
    })
  })

  describe('toBase64', () => {
    it('encodes a string to base64', () => {
      const input = 'Hello World'
      const expected = btoa(input)
      expect(toBase64(input)).toBe(expected)
    })

    it('handles non-ASCII characters', () => {
      const input = 'Vue Whiteboard 🖌️'
      // TextEncoder handles multi-byte characters correctly
      const encoded = toBase64(input)
      expect(encoded).toBeTruthy()
      expect(typeof encoded).toBe('string')
    })
  })
})
