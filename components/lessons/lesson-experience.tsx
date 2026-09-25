'use client'

import Link from 'next/link'
import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Award, BookOpen, Sparkles, Trophy } from 'lucide-react'
import type { ActivityItem } from '@/services/curriculum-service'
import { voiceService, type VoiceAIResponse, type VoicePriority } from '@/services/voice-service'
import { useMissJulieVoice } from '@/hooks/use-miss-julie-voice'
import { LessonHud } from '@/components/student/lesson/lesson-hud'
import { LessonWorld, TalkoraWorldLoader } from '@/components/student/lesson/lesson-world'
import type { ActivityResponsePhase } from '@/components/student/lesson/activity-response'
import { resolveStageLabel, resolveWorldForLevel } from '@/components/student/worlds/world-config'
import type { JulieVisualState } from '@/components/student/lesson/miss-julie-character'
import { getWarmupPrompts, isWarmupActivity, warmupQuestion } from '@/services/lesson-presentation'
import { progressService } from '@/services/progress-service'
import { firstUnfinishedActivity, isOpenLessonConversation, personalizeLessonText, shouldUseLessonVoice } from '@/services/lesson-progress'

export interface LessonExperienceProps {
  activities: ActivityItem[]
  levelTitle?: string
  syllabusName?: string
  levelNumber?: number
  avatarType?: 'BOY' | 'GIRL'
  studentName?: string
  onLessonComplete?: (xpEarned: number) => void
  completedActivityIds?: string[]
}

type ConversationPhase = 'entering' | 'julie_preparing' | 'julie_speaking' | 'waiting_for_student' | 'student_recording' | 'transcribing' | 'student_submitted' | 'julie_thinking' | 'julie_text_ready' | 'julie_audio_pending' | 'retry_required' | 'hinting' | 'transitioning' | 'activity_complete' | 'lesson_complete' | 'recoverable_error'
type ExperienceState = ConversationPhase
type Evidence = { skill: string; utterance: string; support: 'INDEPENDENT' | 'SUPPORTED' }
type TeacherTurn = {
  id: string
  text: string
  emotion?: JulieVisualState
  intent?: 'ask' | 'react' | 'correct' | 'hint' | 'model' | 'answer' | 'celebrate' | 'transition'
  requiresStudentResponse: boolean
  retryRequired?: boolean
  hintLevel?: number
  modelSentence?: string
  sentenceStarter?: string
  activityComplete?: boolean
  conversationComplete?: boolean
  xpAwarded?: number
  evidence?: unknown[]
  memoryUpdates?: unknown[]
  voicePriority?: VoicePriority
}
type StudentTurn = { id: string; text: string; source: 'microphone' | 'typed' | 'choice'; transcriptConfidence?: number; durationMs?: number; status: 'captured' | 'transcribing' | 'evaluating' | 'accepted' | 'retry' }
type HistoryTurn = { id: string; role: 'teacher' | 'student'; text: string }

import { ImmersiveLessonStage } from '@/components/student/lesson/immersive-lesson-stage'

export function LessonExperience({ activities, levelTitle = 'Favourite Fair', syllabusName = 'My Favourite Things', levelNumber = 1, avatarType = 'BOY', studentName = 'Explorer', onLessonComplete, completedActivityIds = [] }: LessonExperienceProps) {
  const [index, setIndex] = useState(() => firstUnfinishedActivity(activities.map((item) => item.id), new Set(completedActivityIds)))
  const [experience, setExperience] = useState<ExperienceState>('entering')
  const [selected, setSelected] = useState('')
  const [transcript, setTranscript] = useState('')
  const [teacherText, setTeacherText] = useState('')
  const [feedback, setFeedback] = useState('')
  const [modelSentence, setModelSentence] = useState('')
  const [expectedPhrase, setExpectedPhrase] = useState('')
  const [activityComplete, setActivityComplete] = useState(false)
  const [conversationTurn, setConversationTurn] = useState(0)
  const [evidence, setEvidence] = useState<Evidence[]>([])
  const [xp, setXp] = useState(0)
  const [seconds, setSeconds] = useState(0)
  const [pose, setPose] = useState<JulieVisualState>('greeting')
  const [teacherTurn, setTeacherTurn] = useState<TeacherTurn | null>(null)
  const [studentTurn, setStudentTurn] = useState<StudentTurn | null>(null)
  const [history, setHistory] = useState<HistoryTurn[]>([])
  const [retryAttempt, setRetryAttempt] = useState(0)

  const activity = activities[index]
  const julie = useMissJulieVoice()
  const recorder = useRef<MediaRecorder | null>(null)
  const stream = useRef<MediaStream | null>(null)
  const sessionId = useRef<string | null>(null)
  const interval = useRef<number | null>(null)
  const recordingTimeout = useRef<number | null>(null)
  const recordingStartedAt = useRef<number | null>(null)
  const activeRecordingSessionId = useRef<string | null>(null)
  const teacherSequence = useRef(0)
  const spokenTurnIds = useRef(new Set<string>())
  const playbackGeneration = useRef(0)
  const lastSpokenTurnIdRef = useRef<string | null>(null)
  const currentTeacherTurnRef = useRef<TeacherTurn | null>(null)

  const world = resolveWorldForLevel(levelNumber, levelTitle)
  const warmupPrompts = useMemo(() => getWarmupPrompts(activity), [activity])
  const isWarmup = isWarmupActivity(activity)
  const activityTtsText =
    typeof activity?.metadata?.ttsText === 'string'
      ? activity.metadata.ttsText
      : ''
  const firstRepeatLine = activity?.type === 'REPEAT_SENTENCE' && Array.isArray(activity.content?.dialogueTurns)
    ? (activity.content.dialogueTurns[0] as { text?: string } | undefined)?.text
    : undefined
  const initialLine = personalizeLessonText(
    isWarmup && warmupPrompts[0]
      ? warmupQuestion(warmupPrompts[0].label)
      : activityTtsText ||
        activity?.teacherPrompt ||
        activity?.prompt ||
        activity?.instruction ||
        activity?.target ||
        '', studentName)
  const dialogue = personalizeLessonText(teacherText || initialLine, studentName)
  const hasMic = Boolean(activity?.voiceEnabled || activity?.allowMic || activity?.metadata?.micMode || ['SPEAK', 'INTERACT', 'FOLLOW_UP', 'REASONS', 'FINAL_TALK', 'FINAL_CHALLENGE'].includes(String(activity?.stage)))
  const isConversation = Boolean(activity && isOpenLessonConversation(activity))
  const audioEnabled = shouldUseLessonVoice(activity || {})

  useEffect(() => {
    const reveal = window.setTimeout(() => setExperience('waiting_for_student'), 300)
    return () => window.clearTimeout(reveal)
  }, [])

  useEffect(() => {
    if (!activity || experience === 'entering') return
    playbackGeneration.current += 1
    julie.stop()
    setSelected('')
    setTranscript('')
    setTeacherText('')
    setFeedback('')
    setModelSentence('')
    setExpectedPhrase(personalizeLessonText(firstRepeatLine || activity.target || '', studentName))
    setActivityComplete(false)
    setConversationTurn(0)
    setStudentTurn(null)
    setRetryAttempt(0)
    spokenTurnIds.current.clear()
    setPose(index === 0 ? 'greeting' : 'teaching')
    setExperience('julie_preparing')
    const timer = window.setTimeout(() => {
      void commitTeacherTurn({
        id: `teacher-${activity?.id || index}-intro`,
        text: initialLine,
        emotion: index === 0 ? 'greeting' : 'teaching',
        intent: 'ask',
        requiresStudentResponse: hasMic,
        retryRequired: false,
        hintLevel: 0,
        activityComplete: false,
        // This first line is deterministic syllabus copy, so route it through
        // the cached lesson voice. Only AI-generated replies use Groq TTS.
        voicePriority: 'LESSON',
      }, hasMic ? 'waiting_for_student' : 'transitioning')
    }, 350)
    return () => window.clearTimeout(timer)
    // Activity identity is the reset boundary.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activity?.id, index, experience === 'entering'])

  useEffect(() => () => resetRecorder(), [])

  useEffect(() => {
    if (julie.state === 'speaking') setExperience('julie_speaking')
    if (julie.state === 'loading') setExperience('julie_audio_pending')
  }, [julie.state])

  function normalizeTeacherTurnFromAi(result: VoiceAIResponse | undefined, fallbackText: string, baseTurn?: Partial<TeacherTurn>): TeacherTurn {
    const normalizedText = [result?.message, result?.followUpQuestion].filter(Boolean).join(' ') || fallbackText || 'Thanks for sharing that.'
    const retryRequired = Boolean(result?.shouldRetry || result?.conversation?.retryState?.waiting)
    const activityComplete = Boolean(result?.activityComplete || result?.conversation?.complete)
    const conversationComplete = Boolean(result?.conversation?.complete)
    const hintLevel = Math.max(0, Number(result?.hintLevel ?? result?.conversation?.retryState?.hintLevel ?? 0))

    return {
      id: baseTurn?.id || `teacher-${activity?.id || index}-${++teacherSequence.current}`,
      text: normalizedText,
      emotion: baseTurn?.emotion || (retryRequired ? 'gentle-correction' : activityComplete ? 'celebrating' : result?.emotion === 'thinking' ? 'thinking' : result?.emotion === 'curious' ? 'curious' : 'encouraging'),
      intent: baseTurn?.intent || (retryRequired ? 'correct' : activityComplete ? 'celebrate' : result?.followUpQuestion ? 'ask' : 'react'),
      requiresStudentResponse: !activityComplete && !conversationComplete,
      retryRequired,
      hintLevel,
      modelSentence: result?.modelSentence || result?.correction?.corrected || baseTurn?.modelSentence,
      sentenceStarter: baseTurn?.sentenceStarter,
      activityComplete,
      conversationComplete,
      xpAwarded: result?.conversation?.complete ? 0 : baseTurn?.xpAwarded,
      evidence: result?.conversation?.skillEvidence ?? baseTurn?.evidence,
      memoryUpdates: result?.conversation ? [] : baseTurn?.memoryUpdates,
      voicePriority:
        result && (isConversation || Boolean(result.conversation))
          ? 'CONVERSATION'
          : 'LESSON',
    }
  }

  async function commitTeacherTurn(input: TeacherTurn, afterState?: ExperienceState) {
    const turn = { ...input, text: personalizeLessonText(input.text, studentName), id: input.id || `teacher-${activity?.id || index}-${++teacherSequence.current}` }
    setTeacherTurn(turn)
    setTeacherText(turn.text)
    currentTeacherTurnRef.current = turn
    setHistory((current) => [...current, { id: turn.id, role: 'teacher', text: turn.text } satisfies HistoryTurn].slice(-8))
    await speakTeacherTurn(turn, afterState)
  }

  async function speakTeacherTurn(turn: TeacherTurn, afterState?: ExperienceState) {
    if (!turn.text.trim()) return
    const generation = playbackGeneration.current
    if (spokenTurnIds.current.has(turn.id)) {
      setExperience(afterState || (turn.retryRequired ? 'retry_required' : turn.activityComplete || turn.conversationComplete ? 'activity_complete' : 'waiting_for_student'))
      return
    }
    spokenTurnIds.current.add(turn.id)
    lastSpokenTurnIdRef.current = turn.id
    if (audioEnabled) {
      setExperience('julie_audio_pending')
      await julie.speak(turn.text, `${turn.id}:${++teacherSequence.current}`, turn.voicePriority || 'LESSON')
    }
    if (generation !== playbackGeneration.current) return
    setExperience(afterState || (turn.retryRequired ? 'retry_required' : turn.activityComplete || turn.conversationComplete ? 'activity_complete' : turn.requiresStudentResponse ? 'waiting_for_student' : 'transitioning'))
  }

  async function replayCurrentTeacherTurn() {
    if (audioEnabled) await julie.replay()
  }

  function resetRecorder() {
    if (interval.current !== null) {
      window.clearInterval(interval.current)
      interval.current = null
    }

    if (recordingTimeout.current !== null) {
      window.clearTimeout(recordingTimeout.current)
      recordingTimeout.current = null
    }

    stream.current?.getTracks().forEach((track) => track.stop())
    stream.current = null
    recorder.current = null
    recordingStartedAt.current = null
    setSeconds(0)
  }

  async function cancelActiveVoiceSession() {
    const id = activeRecordingSessionId.current || sessionId.current
    activeRecordingSessionId.current = null
    sessionId.current = null

    if (!id) return

    try {
      await voiceService.cancelSession(id)
    } catch {
      // Best-effort cleanup only. The original microphone/STT error is more useful.
    }
  }

  const stopMic = () => {
    if (recordingTimeout.current !== null) {
      window.clearTimeout(recordingTimeout.current)
      recordingTimeout.current = null
    }

    if (recorder.current?.state === 'recording') {
      recorder.current.stop()
    }
  }

  async function startMic() {
    if (!activity || julie.isSpeaking || julie.state === 'loading') return
    if (recorder.current?.state === 'recording') return

    julie.stop()
    setExperience('student_recording')
    setPose('listening')
    setTranscript('')
    setFeedback('')
    setSeconds(0)

    try {
      if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
        throw new Error('Voice is not available in this browser.')
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true })
      stream.current = mediaStream

      const session = await voiceService.startSession({
        lessonId: activity.lessonId,
        activityId: activity.id,
        // OPEN conversation follows teacherPrompt/question on the server; do not
        // leak a stale pronunciation target into Qwen's live teaching context.
        expectedPhrase: isConversation ? undefined : (expectedPhrase || activity.target || undefined),
      })

      sessionId.current = session._id
      activeRecordingSessionId.current = session._id

      const preferredTypes = [
        'audio/webm;codecs=opus',
        'audio/webm',
        'audio/ogg;codecs=opus',
        'audio/mp4',
      ]

      const mimeType =
        preferredTypes.find((type) => MediaRecorder.isTypeSupported(type)) || ''

      const chunks: Blob[] = []
      const activeRecorder = new MediaRecorder(
        mediaStream,
        mimeType ? { mimeType } : undefined,
      )

      activeRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunks.push(event.data)
      }

      activeRecorder.onerror = () => {
        setFeedback('The microphone recorder stopped unexpectedly. Please try again.')
        setExperience('recoverable_error')
        setPose('encouraging')
        void cancelActiveVoiceSession()
        resetRecorder()
      }

      activeRecorder.onstop = async () => {
        const startedAt = recordingStartedAt.current
        const stoppedAt = performance.now()
        const measuredDurationMs =
          startedAt === null
            ? undefined
            : Math.round(stoppedAt - startedAt)

        // Capture the session before any cleanup changes refs.
        const currentSessionId =
          activeRecordingSessionId.current || sessionId.current

        resetRecorder()

        if (!currentSessionId) {
          setFeedback('The voice session ended unexpectedly. Please try again.')
          setExperience('recoverable_error')
          setPose('encouraging')
          return
        }

        try {
          const blob = new Blob(chunks, {
            type: activeRecorder.mimeType || mimeType || 'audio/webm',
          })

          if (!blob.size) {
            throw new Error('I could not hear enough. Please try again.')
          }

          if (
            measuredDurationMs !== undefined &&
            measuredDurationMs < 250
          ) {
            throw new Error('Please speak for a little longer and try again.')
          }

          // Backend accepts 250..10,000 ms. Clamp timer drift at the upper edge
          // so a nominal 10 s recording never becomes 10,012 ms and gets a 400.
          const durationMs =
            measuredDurationMs === undefined
              ? undefined
              : Math.min(10_000, measuredDurationMs)

          if (process.env.NODE_ENV !== 'production') {
            console.info('[STT CLIENT] upload', {
              bytes: blob.size,
              mimeType: blob.type,
              durationMs,
            })
          }

          setExperience('transcribing')

          const result = await voiceService.transcribeAudio(
            blob,
            durationMs,
            'en-IN',
          )

          const normalizedText = result.trim()

          if (!normalizedText) {
            throw new Error('I could not hear that clearly. Try once more.')
          }

          setTranscript(normalizedText)

          const capturedTurn: StudentTurn = {
            id: `student-${activity.id}-${Date.now()}`,
            text: normalizedText,
            source: 'microphone',
            status: 'captured',
            durationMs,
          }

          setStudentTurn(capturedTurn)
          setHistory((current) => [
            ...current,
            {
              id: capturedTurn.id,
              role: 'student',
              text: normalizedText,
            } satisfies HistoryTurn,
          ].slice(-8))

          setExperience('student_submitted')

          // submitTranscript completes the server-side VoiceSession. Do not clear
          // its id until this call has finished.
          await submit(normalizedText, currentSessionId, 'MIC')

          activeRecordingSessionId.current = null
          sessionId.current = null
        } catch (error) {
          setFeedback(
            error instanceof Error
              ? error.message
              : 'I could not hear that clearly.',
          )
          setExperience('recoverable_error')
          setPose('encouraging')

          activeRecordingSessionId.current = currentSessionId
          sessionId.current = currentSessionId
          await cancelActiveVoiceSession()
        }
      }

      recorder.current = activeRecorder
      recordingStartedAt.current = performance.now()
      activeRecorder.start()

      interval.current = window.setInterval(() => {
        const startedAt = recordingStartedAt.current
        if (startedAt === null) return
        setSeconds(Math.min(10, Math.floor((performance.now() - startedAt) / 1000)))
      }, 250)

      if (recordingTimeout.current !== null) {
        window.clearTimeout(recordingTimeout.current)
      }

      // Stop a little before the backend's hard 10,000 ms duration ceiling.
      recordingTimeout.current = window.setTimeout(() => {
        if (activeRecorder.state === 'recording') {
          activeRecorder.stop()
        }
      }, 9_800)
    } catch (error) {
      resetRecorder()
      await cancelActiveVoiceSession()

      const message =
        error instanceof DOMException && error.name === 'NotAllowedError'
          ? 'Microphone permission was denied. Please allow microphone access and try again.'
          : error instanceof DOMException && error.name === 'NotFoundError'
            ? 'No microphone was found on this device.'
            : error instanceof DOMException && error.name === 'NotReadableError'
              ? 'Your microphone is being used by another app. Close it there and try again.'
              : error instanceof Error
                ? error.message
                : 'Please allow microphone access.'

      setFeedback(message)
      setExperience('recoverable_error')
      setPose('encouraging')
    }
  }

  async function submit(text: string, id: string, inputMode: 'MIC' | 'TEXT' | 'OPTION' = 'MIC') {
    setExperience('julie_thinking')
    setPose('thinking')
    try {
      const result = await voiceService.submitTranscript(id, text, inputMode)
      const ai = result.aiResponse
      const fallbackText = result.evaluation?.feedback || 'Thank you for sharing that.'
      const retryRequired = Boolean(ai?.shouldRetry || ai?.conversation?.retryState?.waiting)
      const serverComplete = Boolean(ai?.activityComplete || ai?.conversation?.complete)
      const controlledComplete = !ai && Number(result.evaluation?.score || 0) >= 70
      const complete = serverComplete || controlledComplete
      const normalizedTurn = normalizeTeacherTurnFromAi(ai, fallbackText, {
        id: `teacher-${activity?.id || index}-${ai?.conversation?.id || id}-${ai?.conversation?.turnCount || conversationTurn + 1}`,
        emotion: poseFromAi(ai, retryRequired, complete),
        intent: retryRequired ? 'correct' : complete ? 'celebrate' : 'react',
        requiresStudentResponse: !complete,
        retryRequired,
        hintLevel: ai?.hintLevel || ai?.conversation?.retryState?.hintLevel || 0,
        modelSentence: ai?.modelSentence || ai?.correction?.corrected || undefined,
        activityComplete: complete,
      })

      setTeacherText(normalizedTurn.text)
      setFeedback(ai ? (retryRequired ? ai.correction?.explanation || result.evaluation?.feedback || '' : '') : result.evaluation?.feedback || '')
      setModelSentence(retryRequired ? normalizedTurn.modelSentence || '' : '')
      setXp((value) => value + (result.xpAwarded || 0))
      setConversationTurn((value) => value + 1)
      setActivityComplete(complete)
      setPose(poseFromAi(ai, retryRequired, complete))
      setRetryAttempt(ai?.conversation?.retryState?.attempt || 0)
      setStudentTurn((current) => current ? { ...current, status: retryRequired ? 'retry' : 'accepted' } : current)
      setExperience('julie_text_ready')
      const additions = ai?.conversation?.skillEvidence || []
      if (additions.length) setEvidence((current) => uniqueEvidence([...current, ...additions]))
      await commitTeacherTurn(normalizedTurn, complete ? 'activity_complete' : retryRequired ? 'retry_required' : 'waiting_for_student')
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : 'Miss Julie could not check that turn.')
      setExperience('recoverable_error')
      setPose('encouraging')
    }
  }

  async function choose(value: string, source: 'choice' | 'typed' = 'choice') {
    setSelected(value)
    if (!activity || isWarmupActivity(activity)) return
    const capturedTurn: StudentTurn = {
      id: `student-${activity.id}-${Date.now()}`,
      text: value,
      source,
      status: 'evaluating',
    }
    setStudentTurn(capturedTurn)
    setTranscript(value)
    setHistory((current) => [...current, { id: capturedTurn.id, role: 'student', text: value } satisfies HistoryTurn].slice(-8))
    const session = await voiceService.startSession({
      lessonId: activity.lessonId,
      activityId: activity.id,
      expectedPhrase: isConversation ? undefined : (expectedPhrase || activity.target || undefined),
    })
    await submit(value, session._id, source === 'typed' ? 'TEXT' : 'OPTION')
  }

  function advance() {
    if (experience === 'retry_required' || experience === 'recoverable_error' || (!activityComplete && isConversation)) return
    if (index >= activities.length - 1 || activity.stage === 'REWARD') {
      setExperience('lesson_complete')
      setPose('celebrating')
      onLessonComplete?.(xp)
      void commitTeacherTurn({
        id: `teacher-${activity?.id || index}-complete`,
        text: `You did it, ${studentName}! You shared your favourites, gave reasons, and took real conversation turns.`,
        emotion: 'celebrating',
        intent: 'celebrate',
        requiresStudentResponse: false,
        retryRequired: false,
        hintLevel: 0,
        activityComplete: true,
        voicePriority: 'LESSON',
      }, 'lesson_complete')
      return
    }
    setExperience('transitioning')
    window.setTimeout(() => setIndex((value) => value + 1), 320)
  }

  const responsePhase: ActivityResponsePhase = experience === 'student_recording' ? 'listening_mic' : ['transcribing', 'student_submitted', 'julie_thinking'].includes(experience) ? 'evaluating' : experience === 'retry_required' || experience === 'recoverable_error' ? 'retry' : experience === 'activity_complete' ? 'correct' : experience === 'lesson_complete' ? 'completed' : isConversation && conversationTurn > 0 ? 'conversation' : 'ready'
  const learnerState = experience === 'student_recording' ? 'speaking' : experience === 'transcribing' || experience === 'student_submitted' || experience === 'julie_thinking' ? 'thinking' : experience === 'activity_complete' ? 'happy' : experience === 'retry_required' || experience === 'recoverable_error' ? 'retry' : julie.isSpeaking ? 'listening' : 'idle'
  const statusText = experience === 'student_recording' ? 'Listening to you…' : experience === 'transcribing' ? 'Turning your voice into words…' : experience === 'julie_thinking' ? 'Miss Julie is thinking…' : julie.state === 'loading' ? 'Julie is getting ready to speak…' : ''
  const stageLabel = resolveStageLabel(activity?.stage, world.stageLabel)
  const reflection = useMemo(() => evidence.slice(-3), [evidence])

  if (!activity) return <main className="lesson-empty-state"><h2>No activities found.</h2><Link href="/student/levels">Back to Adventure Map</Link></main>

  return (
    <LessonWorld activity={activity} levelNumber={levelNumber} worldName={levelTitle} syllabusName={syllabusName}>
      <AnimatePresence>{experience === 'entering' ? <TalkoraWorldLoader key="arrival" destination={levelTitle} subtitle={`Opening ${levelTitle}...`} /> : null}</AnimatePresence>
      <div className={`talkora-lesson ${experience === 'lesson_complete' ? 'is-celebrating' : ''}`} data-experience={experience}>
        <LessonHud title={syllabusName} levelLabel={stageLabel} xp={xp} index={index} total={activities.length} mode={hasMic ? 'speak' : 'listen'} onModeChange={() => undefined} hideModes />

        {experience !== 'lesson_complete' ? (
          <main className="talkora-lesson__immersive-stage">
            <ImmersiveLessonStage
              activity={activity}
              index={index}
              totalActivities={activities.length}
              julieMessage={dialogue}
              julieState={julie.isSpeaking ? 'speaking' : pose}
              isJulieSpeaking={julie.isSpeaking}
              audioEnabled={audioEnabled}
              transcript={transcript}
              studentTurnText={studentTurn?.text}
              learnerState={learnerState}
              avatarType={avatarType}
              studentName={studentName}
              statusText={statusText}
              feedback={feedback}
              modelSentence={modelSentence}
              expectedPhrase={expectedPhrase}
              seconds={seconds}
              isRecording={responsePhase === 'listening_mic'}
              isProcessing={responsePhase === 'evaluating'}
              isCompleted={experience === 'activity_complete'}
              isRetry={experience === 'retry_required' || experience === 'recoverable_error'}
              conversationTurn={conversationTurn}
              xpEarned={xp}
              onReplayFromStart={index > 0 && completedActivityIds.length > 0 ? () => setIndex(0) : undefined}
              onStartMic={() => void startMic()}
              onStopMic={stopMic}
              onReplayJulie={() => void replayCurrentTeacherTurn()}
              onSelectChoice={(val: string) => void choose(val, 'choice')}
              onSubmitText={(text: string) => void choose(text, 'typed')}
              onAdvance={advance}
              onSpeakText={async (text, key) => {
                if (!audioEnabled || !text.trim()) return
                setTeacherText(text)
                await julie.speak(text, `${key || `activity:${activity.id}`}:${++teacherSequence.current}`, 'LESSON')
              }}
              onLocalComplete={(message?: string, answer?: string) => {
                if (!answer) return
                setExperience('julie_thinking')
                void progressService.completeLocalActivity(activity.id, answer).then((result) => {
                  if (message) setFeedback(message)
                  setXp((value) => value + (result.xpAwarded || 0))
                  setActivityComplete(true)
                  setPose('celebrating')
                  setExperience('activity_complete')
                }).catch((error) => {
                  setFeedback(error instanceof Error ? error.message : 'Progress could not be saved. Please try again.')
                  setExperience('recoverable_error')
                })
              }}
            />
          </main>
        ) : (
          <RewardScene studentName={studentName} xp={xp} evidence={reflection} onReplay={() => {
            playbackGeneration.current += 1
            julie.stop()
            setIndex(0)
            setXp(0)
            setEvidence([])
            setHistory([])
            setExperience('waiting_for_student')
          }} />
        )}
      </div>
    </LessonWorld>
  )
}

function poseFromAi(ai: VoiceAIResponse | undefined, retry: boolean, complete: boolean): JulieVisualState {
  if (retry) return ai?.teachingAction?.includes('MODEL') ? 'modeling' : 'gentle-correction'
  if (complete) return 'celebrating'
  const emotion = ai?.emotion
  if (emotion === 'curious' || emotion === 'thinking' || emotion === 'listening' || emotion === 'surprised' || emotion === 'proud' || emotion === 'modeling') return emotion
  if (emotion === 'delighted' || emotion === 'celebrating') return 'celebrating'
  return 'encouraging'
}

function uniqueEvidence(items: Evidence[]) {
  return items.filter((item, index) => items.findIndex((candidate) => candidate.skill === item.skill) === index)
}


function RewardScene({ studentName, xp, evidence, onReplay }: { studentName: string; xp: number; evidence: Evidence[]; onReplay: () => void }) {
  return <main className="talkora-reward">
    <div className="talkora-reward__sky" aria-hidden="true">{Array.from({ length: 14 }, (_, index) => <motion.i key={index} animate={{ y: [0, -22, 0], rotate: [0, 35, 0], opacity: [0.25, 1, 0.25] }} transition={{ duration: 1.6 + index * 0.08, repeat: Infinity, delay: index * 0.06 }} />)}</div>
    <motion.div className="talkora-reward__badge" initial={{ scale: 0, rotate: -18 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring', stiffness: 160, damping: 12 }}><Award /><span>Favourite Finder</span></motion.div>
    <span className="talkora-reward__eyebrow"><Trophy /> ADVENTURE COMPLETE</span>
    <h1>You found your conversation power, {studentName}!</h1>
    <p>Miss Julie heard what you can really do in English.</p>
    <div className="talkora-reward__evidence">{evidence.length ? evidence.map((item) => <span key={item.skill}><BookOpen /> {friendlySkill(item.skill)}</span>) : <><span><BookOpen /> Shared a favourite</span><span><BookOpen /> Spoke in complete sentences</span></>}</div>
    <motion.div className="talkora-reward__xp" initial={{ y: 18, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.45 }}><Sparkles /><strong>+{xp} XP</strong></motion.div>
    <p className="talkora-reward__home">At home, ask a family member about their favourites. Record your conversation and notice how your English has grown.</p>
    <div className="talkora-reward__actions">
      <button type="button" className="talkora-reward__continue talkora-reward__continue--secondary" onClick={onReplay}>Replay lesson</button>
      <Link href="/student/practice/talk" className="talkora-reward__continue talkora-reward__continue--secondary">Practice with Miss Julie</Link>
      <Link href="/student/practice/home" className="talkora-reward__continue talkora-reward__continue--secondary">Record home conversation</Link>
      <Link href="/student/levels" className="talkora-reward__continue">Continue Adventure</Link>
    </div>
  </main>
}

function friendlySkill(skill: string) {
  return skill.replaceAll('_', ' ').replace(/^./, (letter) => letter.toUpperCase())
}
