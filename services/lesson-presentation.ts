import type { ActivityItem } from '@/services/curriculum-service'

export type WarmupPrompt = {
  label: string
  emoji: string
}

const WARMUP_FALLBACK: WarmupPrompt[] = [
  { label: 'Playing cricket', emoji: '🏏' },
  { label: 'Singing', emoji: '🎤' },
  { label: 'Reading stories', emoji: '📚' },
  { label: 'Eating cake', emoji: '🎂' },
  { label: 'Running races', emoji: '🏃' },
  { label: 'Eating red chilli', emoji: '🌶️' },
]

const EMOJI_BY_KEYWORD: Array<[string, string]> = [
  ['cricket', '🏏'],
  ['sing', '🎤'],
  ['music', '🎵'],
  ['read', '📚'],
  ['book', '📚'],
  ['homework', '✏️'],
  ['cake', '🎂'],
  ['chilli', '🌶️'],
  ['chili', '🌶️'],
  ['run', '🏃'],
  ['football', '⚽'],
  ['draw', '🎨'],
  ['dance', '💃'],
  ['travel', '✈️'],
  ['friend', '🧑‍🤝‍🧑'],
]

function cleanLabel(value: string) {
  return value.trim().replace(/[?.!]+$/, '')
}

function emojiFor(label: string, index: number) {
  const normalized = label.toLowerCase()
  return (
    EMOJI_BY_KEYWORD.find(([keyword]) => normalized.includes(keyword))?.[1] ||
    WARMUP_FALLBACK[index % WARMUP_FALLBACK.length].emoji
  )
}

export function getWarmupPrompts(activity?: ActivityItem): WarmupPrompt[] {
  const source = activity?.content?.visualPrompts

  if (!Array.isArray(source) || source.length === 0) {
    return WARMUP_FALLBACK
  }

  return source
    .map((item, index): WarmupPrompt | null => {
      if (typeof item === 'string') {
        const label = cleanLabel(item)
        if (!label) return null
        return { label, emoji: emojiFor(label, index) }
      }

      if (item && typeof item === 'object') {
        const record = item as Record<string, unknown>
        const label = cleanLabel(String(record.label || record.text || '').trim())
        if (!label) return null
        return {
          label,
          emoji: String(record.emoji || emojiFor(label, index)),
        }
      }

      return null
    })
    .filter((item): item is WarmupPrompt => Boolean(item))
}

export function warmupQuestion(label: string) {
  const cleaned = cleanLabel(label)
  return `Do you like ${cleaned.toLowerCase()}?`
}

export function warmupAnswer(label: string, likesIt: boolean) {
  const cleaned = cleanLabel(label).toLowerCase()
  return likesIt
    ? `Yes, I do. I like ${cleaned}.`
    : `No, I don't. I don't like ${cleaned}.`
}

export function warmupReaction(label: string, likesIt: boolean) {
  const key = label.toLowerCase()

  if (key.includes('chilli') || key.includes('chili')) {
    return likesIt
      ? 'Wow, you are brave! Red chilli can be very spicy.'
      : 'Fair choice! Red chilli can be very spicy.'
  }

  if (key.includes('homework')) {
    return likesIt
      ? 'Great! Practice helps your brain remember new things.'
      : 'That is okay. A little practice can still make learning easier.'
  }

  if (key.includes('cricket')) {
    return likesIt
      ? 'Nice! Cricket is fun and full of teamwork.'
      : 'That is okay. Everyone enjoys different games.'
  }

  if (key.includes('sing')) {
    return likesIt
      ? 'Lovely! Singing is a fun way to use your voice confidently.'
      : 'That is okay. We all enjoy different activities.'
  }

  if (key.includes('cake')) {
    return likesIt
      ? 'Yum! Cake can be a lovely treat.'
      : 'That is completely okay. Everyone has different tastes.'
  }

  if (key.includes('run')) {
    return likesIt
      ? 'Wonderful! Running keeps your body active and strong.'
      : 'That is okay. Maybe another activity is more fun for you.'
  }

  return likesIt
    ? 'Nice! Thanks for telling me what you like.'
    : 'That is okay. Different people can have different favourites.'
}

export function isWarmupActivity(activity?: ActivityItem) {
  const stage = String(activity?.stage || '').toUpperCase()
  const digitalType = String(activity?.metadata?.digitalType || '').toUpperCase()
  return stage === 'WARM_UP' || digitalType === 'VISUAL_WARM_UP'
}
