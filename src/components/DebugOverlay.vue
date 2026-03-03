<template>
  <!-- Toggle button always visible in bottom-left -->
  <button class="debug-toggle" @click="open = !open" title="Debug log">🐛</button>

  <div v-if="open" class="debug-panel">
    <div class="debug-header">
      <span>Debug Log</span>
      <div class="debug-header-actions">
        <button @click="copyLog" title="Copy log">📋</button>
        <button @click="clearLog" title="Clear">🗑</button>
        <button @click="open = false">✕</button>
      </div>
    </div>
    <div class="debug-storage" v-if="storageInfo">
      <strong>Storage:</strong> {{ storageInfo }}
    </div>
    <div class="debug-scroll" ref="scrollEl">
      <div
        v-for="(entry, i) in entries"
        :key="i"
        class="debug-entry"
        :class="entry.level"
      >
        <span class="debug-time">{{ entry.time }}</span>
        <span class="debug-msg">{{ entry.msg }}</span>
      </div>
      <div v-if="entries.length === 0" class="debug-empty">No entries yet.</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick, watch } from 'vue'
import localforage from 'localforage'

interface LogEntry { time: string; level: 'info' | 'warn' | 'error'; msg: string }

const open       = ref(false)
const entries    = ref<LogEntry[]>([])
const storageInfo = ref('')
const scrollEl   = ref<HTMLElement>()

const fmt = (d: Date) =>
  `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}:${String(d.getSeconds()).padStart(2,'0')}.${String(d.getMilliseconds()).padStart(3,'0')}`

const dbgLog = (level: LogEntry['level'], ...args: unknown[]) => {
  const msg = args.map(a => {
    if (a instanceof Error) return `${a.name}: ${a.message}${a.stack ? '\n' + a.stack : ''}`
    if (typeof a === 'object') { try { return JSON.stringify(a) } catch { return String(a) } }
    return String(a)
  }).join(' ')
  entries.value.push({ time: fmt(new Date()), level, msg })
  if (entries.value.length > 200) entries.value.splice(0, entries.value.length - 200)
}

// Auto-scroll when new entries arrive
watch(() => entries.value.length, async () => {
  await nextTick()
  if (scrollEl.value) scrollEl.value.scrollTop = scrollEl.value.scrollHeight
})

const copyLog = () => {
  const text = entries.value.map(e => `[${e.time}] [${e.level}] ${e.msg}`).join('\n')
  navigator.clipboard?.writeText(text).catch(() => {/* ignore */})
}

const clearLog = () => { entries.value = [] }

// Intercept console methods
const _origError = console.error.bind(console)
const _origWarn  = console.warn.bind(console)
const _origLog   = console.log.bind(console)

console.error = (...a) => { dbgLog('error', ...a); _origError(...a) }
console.warn  = (...a) => { dbgLog('warn',  ...a); _origWarn(...a)  }
console.log   = (...a) => { dbgLog('info',  ...a); _origLog(...a)   }

// Capture unhandled errors and promise rejections
window.addEventListener('error', e => {
  dbgLog('error', `Unhandled: ${e.message} (${e.filename}:${e.lineno})`)
})
window.addEventListener('unhandledrejection', e => {
  dbgLog('error', `UnhandledRejection: ${e.reason}`)
})

onMounted(async () => {
  // Report which localforage driver was selected and storage estimate
  try {
    const driver = localforage.driver()
    const driverName = driver?.split('.').pop() ?? driver ?? 'unknown'
    let quota = ''
    if (navigator.storage?.estimate) {
      const est = await navigator.storage.estimate()
      const usedMB  = ((est.usage  ?? 0) / 1048576).toFixed(2)
      const quotaMB = ((est.quota  ?? 0) / 1048576).toFixed(2)
      quota = ` | ${usedMB}MB / ${quotaMB}MB`
    }
    storageInfo.value = `${driverName}${quota}`
    dbgLog('info', `LocalForage driver: ${driverName}${quota}`)
  } catch (e) {
    dbgLog('error', 'Could not read storage info', e)
  }
})
</script>

<style scoped>
.debug-toggle {
  position: fixed;
  bottom: 70px;
  left: 8px;
  z-index: 9990;
  background: rgba(0,0,0,0.6);
  color: white;
  border: none;
  border-radius: 50%;
  width: 36px;
  height: 36px;
  font-size: 1rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0.7;
}
.debug-toggle:hover { opacity: 1; }

.debug-panel {
  position: fixed;
  bottom: 110px;
  left: 8px;
  right: 8px;
  max-height: 55vh;
  background: rgba(15, 15, 20, 0.97);
  color: #e2e8f0;
  border-radius: 0.5rem;
  z-index: 9991;
  display: flex;
  flex-direction: column;
  font-family: 'Menlo', 'Consolas', monospace;
  font-size: 0.7rem;
  box-shadow: 0 8px 32px rgba(0,0,0,0.5);
  overflow: hidden;
}

.debug-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.4rem 0.6rem;
  background: rgba(255,255,255,0.08);
  font-weight: 700;
  font-size: 0.75rem;
  flex-shrink: 0;
}
.debug-header-actions { display: flex; gap: 0.25rem; }
.debug-header-actions button {
  background: none;
  border: none;
  color: #a0aec0;
  cursor: pointer;
  font-size: 0.85rem;
  padding: 0.1rem 0.2rem;
}
.debug-header-actions button:hover { color: white; }

.debug-storage {
  padding: 0.25rem 0.6rem;
  background: rgba(255,255,255,0.04);
  color: #90cdf4;
  font-size: 0.68rem;
  flex-shrink: 0;
}

.debug-scroll {
  flex: 1;
  overflow-y: auto;
  padding: 0.25rem 0;
}

.debug-entry {
  display: flex;
  gap: 0.4rem;
  padding: 0.1rem 0.6rem;
  line-height: 1.5;
  border-bottom: 1px solid rgba(255,255,255,0.04);
  word-break: break-all;
}
.debug-entry.info  { color: #e2e8f0; }
.debug-entry.warn  { color: #f6e05e; background: rgba(246,224,94,0.05); }
.debug-entry.error { color: #fc8181; background: rgba(252,129,129,0.08); }

.debug-time { color: #718096; flex-shrink: 0; }
.debug-msg  { flex: 1; }

.debug-empty { padding: 0.5rem 0.6rem; color: #718096; }
</style>
