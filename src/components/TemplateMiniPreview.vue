<template>
  <canvas ref="canvasEl" class="mini-preview-canvas"></canvas>
</template>

<script setup lang="ts">
import { ref, onMounted, watchEffect } from 'vue'
import type { Template } from '@/types'
import { templateDimensions } from '@/composables/useTemplateMode'

const props = defineProps<{ template: Template }>()
const canvasEl = ref<HTMLCanvasElement>()

const CANVAS_W = 240
const G_PX     = 2   // pixel gutter

function draw() {
  const canvas = canvasEl.value
  if (!canvas) return
  const ctx = canvas.getContext('2d')!
  const { totalWidth, maxHeight } = templateDimensions(props.template)
  const scaleX = CANVAS_W / totalWidth
  const scaleY = (CANVAS_W / 2) / maxHeight
  const scale  = Math.min(scaleX, scaleY)
  const canvasH = Math.round(maxHeight * scale)

  canvas.width  = CANVAS_W
  canvas.height = canvasH

  // Background
  ctx.fillStyle = '#edf2f7'
  ctx.fillRect(0, 0, CANVAS_W, canvasH)

  // Frame outlines
  let cx = 0
  for (const f of props.template.frames) {
    const fw = f.aspectRatio.width  * scale
    const fh = f.aspectRatio.height * scale
    const fy = (canvasH - fh) / 2
    ctx.strokeStyle = '#cbd5e0'
    ctx.lineWidth   = 1
    ctx.strokeRect(Math.round(cx) + 0.5, Math.round(fy) + 0.5, Math.round(fw) - 1, Math.round(fh) - 1)
    cx += fw
  }

  // Slot rects
  for (const slot of props.template.slots) {
    const x = slot.x * totalWidth  * scale + G_PX
    const y = slot.y * maxHeight   * scale + G_PX
    const w = slot.w * totalWidth  * scale - G_PX * 2
    const h = slot.h * maxHeight   * scale - G_PX * 2
    ctx.fillStyle = '#bee3f8'
    ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h))
    ctx.strokeStyle = '#3182ce'
    ctx.lineWidth = 1
    ctx.strokeRect(Math.round(x) + 0.5, Math.round(y) + 0.5, Math.round(w) - 1, Math.round(h) - 1)

    // Tiny image icon
    ctx.fillStyle = '#3182ce'
    ctx.font = `${Math.max(8, Math.round(Math.min(w, h) * 0.3))}px sans-serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('⬛', Math.round(x + w / 2), Math.round(y + h / 2))
  }
}

onMounted(draw)
watchEffect(draw)
</script>

<style scoped>
.mini-preview-canvas {
  width: 100%;
  height: 100%;
  display: block;
}
</style>
