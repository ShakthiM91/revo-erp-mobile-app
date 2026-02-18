<template>
  <ion-modal :is-open="open" @didDismiss="$emit('close')">
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-button @click="apply">OK</ion-button>
        </ion-buttons>
        <ion-title>Amount</ion-title>
        <ion-buttons slot="end">
          <ion-button @click="$emit('close')">Cancel</ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
    <ion-content class="calculator-content">
      <div class="calculator-display">{{ display }}</div>
      <div class="calculator-error" v-if="error">{{ error }}</div>
      <div class="calculator-grid">
        <ion-button class="calc-btn" @click="append('7')">7</ion-button>
        <ion-button class="calc-btn" @click="append('8')">8</ion-button>
        <ion-button class="calc-btn" @click="append('9')">9</ion-button>
        <ion-button class="calc-btn calc-op" @click="append('/')">/</ion-button>
        <ion-button class="calc-btn" @click="append('4')">4</ion-button>
        <ion-button class="calc-btn" @click="append('5')">5</ion-button>
        <ion-button class="calc-btn" @click="append('6')">6</ion-button>
        <ion-button class="calc-btn calc-op" @click="append('*')">×</ion-button>
        <ion-button class="calc-btn" @click="append('1')">1</ion-button>
        <ion-button class="calc-btn" @click="append('2')">2</ion-button>
        <ion-button class="calc-btn" @click="append('3')">3</ion-button>
        <ion-button class="calc-btn calc-op" @click="append('-')">−</ion-button>
        <ion-button class="calc-btn" @click="append('0')">0</ion-button>
        <ion-button class="calc-btn" @click="append('.')">.</ion-button>
        <ion-button class="calc-btn calc-eq" @click="onEquals">=</ion-button>
        <ion-button class="calc-btn calc-op" @click="append('+')">+</ion-button>
        <ion-button class="calc-btn calc-clear" @click="clear">C</ion-button>
      </div>
    </ion-content>
  </ion-modal>
</template>

<script setup>
import { ref, watch } from 'vue'
import { IonModal, IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, IonContent } from '@ionic/vue'

const props = defineProps({
  open: { type: Boolean, default: false },
  modelValue: { type: Number, default: 0 }
})

const emit = defineEmits(['close', 'update:modelValue'])

const display = ref('')
const error = ref('')

function safeEval(expr) {
  const s = String(expr).replace(/\s/g, '')
  if (!s) return null
  // Only allow digits, one ., +, -, *, /
  if (!/^[\d.+*-/]+$/.test(s)) return null
  // Simple evaluator: split by + and - (lowest precedence), then * and /
  const parts = []
  let i = 0
  let current = ''
  while (i < s.length) {
    const c = s[i]
    if (c === '+' || c === '-' || c === '*' || c === '/') {
      if (current) {
        const num = parseFloat(current)
        if (Number.isNaN(num)) return null
        parts.push({ type: 'num', value: num })
        current = ''
      }
      if (c === '-' && (parts.length === 0 || parts[parts.length - 1].type === 'op')) {
        current = '-'
        i++
        continue
      }
      parts.push({ type: 'op', value: c })
      i++
    } else {
      current += c
      i++
    }
  }
  if (current) {
    const num = parseFloat(current)
    if (Number.isNaN(num)) return null
    parts.push({ type: 'num', value: num })
  }
  if (parts.length === 0) return null
  // First pass: * and /
  const reduced = []
  for (let j = 0; j < parts.length; j++) {
    const p = parts[j]
    if (p.type === 'op' && (p.value === '*' || p.value === '/')) {
      const a = reduced.pop()
      const b = parts[j + 1]
      if (!a || a.type !== 'num' || !b || b.type !== 'num') return null
      if (p.value === '/' && b.value === 0) return NaN
      reduced.push({ type: 'num', value: p.value === '*' ? a.value * b.value : a.value / b.value })
      j++
    } else {
      reduced.push(p)
    }
  }
  // Second pass: + and -
  let result = reduced[0]?.type === 'num' ? reduced[0].value : null
  for (let j = 1; j < reduced.length; j += 2) {
    const op = reduced[j]
    const next = reduced[j + 1]
    if (op?.type !== 'op' || next?.type !== 'num' || result == null) return null
    if (op.value === '+') result += next.value
    else if (op.value === '-') result -= next.value
  }
  return result
}

function append(char) {
  error.value = ''
  if (char === '.') {
    if (display.value === '' || /[+\-*/]$/.test(display.value)) {
      display.value += '0.'
      return
    }
    const lastOp = Math.max(display.value.lastIndexOf('+'), display.value.lastIndexOf('-'), display.value.lastIndexOf('*'), display.value.lastIndexOf('/'))
    const segment = lastOp === -1 ? display.value : display.value.slice(lastOp + 1)
    if (segment.includes('.')) return
  }
  if (['+', '-', '*', '/'].includes(char)) {
    if (display.value === '' && char === '-') {
      display.value = '-'
      return
    }
    if (display.value === '' || /[+\-*/]$/.test(display.value)) return
  }
  display.value += char
}

function clear() {
  display.value = ''
  error.value = ''
}

/** Evaluate current display and update display with result; do not close or emit. */
function onEquals() {
  error.value = ''
  if (!display.value.trim()) return
  const result = safeEval(display.value)
  if (result == null) {
    error.value = 'Invalid expression'
    return
  }
  if (Number.isNaN(result)) {
    error.value = 'Cannot divide by zero'
    return
  }
  const rounded = Math.round(result * 100) / 100
  display.value = String(rounded)
}

/** Apply current value to model and close modal. */
function apply() {
  error.value = ''
  if (!display.value.trim()) {
    emit('close')
    return
  }
  const result = safeEval(display.value)
  if (result == null) {
    error.value = 'Invalid expression'
    return
  }
  if (Number.isNaN(result)) {
    error.value = 'Cannot divide by zero'
    return
  }
  const rounded = Math.round(result * 100) / 100
  emit('update:modelValue', rounded)
  emit('close')
}

watch(() => props.open, (isOpen) => {
  if (isOpen) {
    display.value = props.modelValue != null && props.modelValue !== 0 ? String(props.modelValue) : ''
    error.value = ''
  }
})

watch(() => props.modelValue, (v) => {
  if (props.open && (v == null || v === 0) && display.value === '') return
  if (props.open) display.value = v != null ? String(v) : ''
})
</script>

<style scoped>
.calculator-content {
  --padding-bottom: 24px;
}
.calculator-display {
  font-size: 1.5rem;
  font-weight: 600;
  text-align: right;
  padding: 16px 20px;
  margin: 8px 16px;
  background: var(--ion-color-light);
  border-radius: 8px;
  min-height: 48px;
  word-break: break-all;
}
.calculator-error {
  color: var(--ion-color-danger);
  font-size: 0.875rem;
  padding: 0 20px 8px;
  text-align: center;
}
.calculator-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
  padding: 0 16px 16px;
}
.calc-btn {
  min-height: 52px;
  font-size: 1.25rem;
  font-weight: 500;
  margin: 0;
}
.calc-op { --ion-color-primary: var(--ion-color-primary-shade); }
.calc-eq { --background: var(--ion-color-primary); --color: var(--ion-color-primary-contrast); }
.calc-clear { --background: var(--ion-color-medium); --color: var(--ion-color-medium-contrast); }
</style>
