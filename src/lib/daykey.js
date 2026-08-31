// Timezone-safe "day key" math.
//
// A chore's "today" must be the SAME calendar day on every device, even across
// timezones, and it flips at a configurable reset hour (default 4am) so a late
// bedtime doesn't wipe the evening list. We compute the key from a canonical
// family timezone + reset hour rather than each device's raw clock.
//
// Trick: "a new day starts at resetHour local time" == "shift the instant back by
// resetHour hours, then take the calendar date in the family timezone."

export function dayKey(ts, timeZone, resetHour = 4) {
  const shifted = new Date(ts - resetHour * 3600_000)
  try {
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: timeZone || undefined,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).formatToParts(shifted)
    const y = parts.find((p) => p.type === 'year').value
    const m = parts.find((p) => p.type === 'month').value
    const d = parts.find((p) => p.type === 'day').value
    return `${y}-${m}-${d}`
  } catch {
    // Bad/unknown timezone string — fall back to device local.
    const y = shifted.getFullYear()
    const m = String(shifted.getMonth() + 1).padStart(2, '0')
    const d = String(shifted.getDate()).padStart(2, '0')
    return `${y}-${m}-${d}`
  }
}

export function todayKey(timeZone, resetHour = 4) {
  return dayKey(Date.now(), timeZone, resetHour)
}

// Number of consecutive day-keys ending today that have at least one completion.
export function streakLength(completedDayKeys, timeZone, resetHour = 4) {
  const set = new Set(completedDayKeys)
  let streak = 0
  let cursor = Date.now()
  // Walk backwards one day at a time.
  for (let i = 0; i < 3650; i++) {
    const key = dayKey(cursor, timeZone, resetHour)
    if (set.has(key)) {
      streak++
      cursor -= 24 * 3600_000
    } else if (i === 0) {
      // Today not done yet — that's fine, keep counting from yesterday.
      cursor -= 24 * 3600_000
    } else {
      break
    }
  }
  return streak
}

export function guessTimeZone() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
  } catch {
    return 'UTC'
  }
}

// Coarse part-of-day for greetings / auto-focusing morning vs evening.
export function partOfDay(ts = Date.now(), timeZone) {
  let hour
  try {
    hour = Number(
      new Intl.DateTimeFormat('en-US', {
        timeZone: timeZone || undefined,
        hour: 'numeric',
        hour12: false
      }).format(new Date(ts))
    )
  } catch {
    hour = new Date(ts).getHours()
  }
  if (hour < 12) return 'morning'
  if (hour < 17) return 'afternoon'
  return 'evening'
}
