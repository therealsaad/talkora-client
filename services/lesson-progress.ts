export function firstUnfinishedActivity(ids: string[], completed: ReadonlySet<string>): number {
  const next = ids.findIndex((id) => !completed.has(id))
  return next < 0 ? 0 : next
}

export function personalizeLessonText(text: string, studentName: string): string {
  return text.replace(/\bAarav\b/gi, studentName)
}

export function isOpenLessonConversation(activity: {
  type?: string
  stage?: string
  metadata?: Record<string, unknown>
  aiEnabled?: boolean
}): boolean {
  const type = String(activity.type || '').toUpperCase()
  const stage = String(activity.stage || '').toUpperCase()
  const digitalType = String(activity.metadata?.digitalType || '').toUpperCase()

  if (activity.metadata?.conversationMode === 'OPEN') return true

  if (
    ['OPEN_CONVERSATION', 'FOLLOW_UP_CONVERSATION', 'FINAL_CONVERSATION', 'CONVERSATION'].includes(type) ||
    ['INTERACT', 'FOLLOW_UP', 'REASONS', 'RESPECT_DIFFERENCES', 'FINAL_TALK', 'SPEAK'].includes(stage)
  ) {
    return true
  }

  // Warm-up and other controlled steps can still use live AI turns.
  if (activity.aiEnabled && digitalType === 'VISUAL_WARM_UP') return true

  return false
}

export function shouldUseLessonVoice(activity: { type?: string; stage?: string; metadata?: Record<string, unknown> }): boolean {
  const type = String(activity.type || '').toUpperCase()
  const digitalType = String(activity.metadata?.digitalType || '').toUpperCase()
  return ['LIKE_DISLIKE', 'LISTEN_MODEL', 'LISTEN_AND_REPEAT', 'REPEAT_SENTENCE', 'CONVERSATION', 'OPEN_CONVERSATION', 'FOLLOW_UP_CONVERSATION', 'FINAL_CONVERSATION'].includes(type)
    || ['VISUAL_WARM_UP', 'MODEL_CONVERSATION', 'READ_REPEAT', 'EXACT_LINE_ROLE_SWAP'].includes(digitalType)
    || activity.metadata?.conversationMode === 'OPEN'
}
