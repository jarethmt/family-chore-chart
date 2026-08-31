// Little moments of delight — confetti + synthesized sounds. Sounds are generated
// with the Web Audio API so we ship no audio files and it all works offline. Both
// respect the device's sound + reduced-motion settings.

import { device } from '../store/device.js'

let audioCtx = null
function ctx() {
  if (!audioCtx) {
    const AC = window.AudioContext || window.webkitAudioContext
    if (AC) audioCtx = new AC()
  }
  return audioCtx
}

function tone(freq, start, dur, type = 'sine', gain = 0.14) {
  const ac = ctx()
  if (!ac) return
  const osc = ac.createOscillator()
  const g = ac.createGain()
  osc.type = type
  osc.frequency.value = freq
  g.gain.setValueAtTime(0, ac.currentTime + start)
  g.gain.linearRampToValueAtTime(gain, ac.currentTime + start + 0.02)
  g.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + start + dur)
  osc.connect(g)
  g.connect(ac.destination)
  osc.start(ac.currentTime + start)
  osc.stop(ac.currentTime + start + dur + 0.02)
}

export function playChime(kind = 'done') {
  if (!device.soundOn) return
  const ac = ctx()
  if (ac && ac.state === 'suspended') ac.resume()
  if (kind === 'done') {
    tone(660, 0, 0.18, 'triangle')
    tone(880, 0.08, 0.22, 'triangle')
  } else if (kind === 'section') {
    tone(523, 0, 0.16, 'triangle')
    tone(659, 0.1, 0.16, 'triangle')
    tone(784, 0.2, 0.28, 'triangle')
  } else if (kind === 'reward') {
    tone(784, 0, 0.14, 'square', 0.1)
    tone(988, 0.1, 0.14, 'square', 0.1)
    tone(1319, 0.22, 0.3, 'triangle')
  } else if (kind === 'tap') {
    tone(520, 0, 0.06, 'sine', 0.08)
  }
}

const CONFETTI = ['🐱', '⭐', '💛', '✨', '🎉', '🐾']

export function burst(x, y, count = 18) {
  if (device.reduceMotion) return
  const layer = document.createElement('div')
  layer.style.cssText =
    'position:fixed;left:0;top:0;width:100%;height:100%;pointer-events:none;z-index:9999;overflow:hidden'
  document.body.appendChild(layer)
  for (let i = 0; i < count; i++) {
    const el = document.createElement('span')
    el.textContent = CONFETTI[i % CONFETTI.length]
    const angle = (Math.PI * 2 * i) / count + Math.random()
    const dist = 80 + Math.random() * 160
    const dx = Math.cos(angle) * dist
    const dy = Math.sin(angle) * dist - 60
    el.style.cssText = `position:absolute;left:${x}px;top:${y}px;font-size:${18 + Math.random() * 18}px;transition:transform .9s cubic-bezier(.2,.7,.3,1),opacity .9s ease;transform:translate(-50%,-50%)`
    layer.appendChild(el)
    requestAnimationFrame(() => {
      el.style.transform = `translate(${dx}px,${dy}px) rotate(${Math.random() * 540 - 270}deg) scale(${0.6 + Math.random()})`
      el.style.opacity = '0'
    })
  }
  setTimeout(() => layer.remove(), 1000)
}

export function vibrate(ms = 18) {
  if (device.reduceMotion) return
  try {
    if (navigator.vibrate) navigator.vibrate(ms)
  } catch {
    /* not supported */
  }
}
