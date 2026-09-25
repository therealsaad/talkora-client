'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'

import { ActivityEngine } from '@/components/lessons/activity-engine'
import { TalkoraLoader } from '@/components/student/talkora-loader'

import {
  curriculumService,
  type ActivityItem,
  type CurriculumClass,
  type LevelItem,
  type LessonItem,
} from '@/services/curriculum-service'

import { useAuth } from '@/components/auth/auth-provider'
import { progressService } from '@/services/progress-service'

type LessonLoadState =
  | 'loading'
  | 'ready'
  | 'error'

export default function StudentLessonPage() {
  const params = useParams()
  const router = useRouter()

  const routeId = useMemo(() => {
    const raw = params?.id

    if (Array.isArray(raw)) {
      return raw[0] || ''
    }

    return typeof raw === 'string'
      ? raw
      : ''
  }, [params])

  const { session, student } = useAuth()

  const [curriculumClass, setCurriculumClass] =
    useState<CurriculumClass | null>(null)

  const [level, setLevel] =
    useState<LevelItem | null>(null)

  const [lesson, setLesson] =
    useState<LessonItem | null>(null)

  const [activities, setActivities] =
    useState<ActivityItem[]>([])
  const [completedActivityIds, setCompletedActivityIds] = useState<string[]>([])

  const [status, setStatus] =
    useState<LessonLoadState>('loading')

  const [error, setError] =
    useState('')

  useEffect(() => {
    let cancelled = false

    async function loadLesson() {
      setStatus('loading')
      setError('')

      try {
        const studentGrade =
          Number(student?.grade)

        if (
          !Number.isFinite(studentGrade) ||
          studentGrade <= 0
        ) {
          throw new Error(
            'Your class information is missing. Please ask your teacher for help.',
          )
        }

        /* ================================================
           2. FIND ONLY THE STUDENT'S REAL GRADE
           ================================================ */

        const classes =
          await curriculumService.getClasses()

        if (cancelled) {
          return
        }

        const matchingClass =
          classes.find(
            (item) =>
              Number(item.grade) === studentGrade,
          )

        if (!matchingClass) {
          throw new Error(
            `No published curriculum is available for Class ${studentGrade} yet.`,
          )
        }

        setCurriculumClass(matchingClass)

        /* ================================================
           3. LOAD ONLY THIS GRADE'S LEVELS
           ================================================ */

        const gradeLevels =
          await curriculumService.getLevels(
            matchingClass.id,
          )

        if (cancelled) {
          return
        }

        if (!gradeLevels.length) {
          throw new Error(
            `No learning worlds have been published for Class ${studentGrade} yet.`,
          )
        }

        /* ================================================
           4. RESOLVE ROUTE

           Current route can contain:
           - lesson id
           - level id
           - level number

           We support all three safely.
           ================================================ */

        let resolvedLevel:
          | LevelItem
          | undefined

        let resolvedLesson:
          | LessonItem
          | undefined

        /* --------------------------------
           Try route as lesson id first.
           -------------------------------- */

        try {
          const directLesson =
            await curriculumService.getLesson(
              routeId,
            )

          const owningLevel =
            gradeLevels.find(
              (item) =>
                item.id ===
                directLesson.levelId,
            )

          /*
           * CRITICAL:
           * If the lesson belongs to another
           * grade/class, do not accept it.
           */
          if (owningLevel) {
            resolvedLesson =
              directLesson

            resolvedLevel =
              owningLevel
          }
        } catch {
          /*
           * It may be a level id/number instead.
           * Continue below.
           */
        }

        /* --------------------------------
           Try route as level id/number.
           -------------------------------- */

        if (
          !resolvedLevel ||
          !resolvedLesson
        ) {
          resolvedLevel =
            gradeLevels.find(
              (item) => {
                if (item.id === routeId) {
                  return true
                }

                if (
                  String(item.number) ===
                  routeId
                ) {
                  return true
                }

                if (
                  item.unitNumber != null &&
                  String(
                    item.unitNumber,
                  ) === routeId
                ) {
                  return true
                }

                return false
              },
            )

          /*
           * If route doesn't match a level,
           * do NOT silently choose Unit 1.
           */
          if (!resolvedLevel) {
            throw new Error(
              'This learning world is not available for your class.',
            )
          }

          const lessons =
            await curriculumService.getLessons(
              resolvedLevel.id,
            )

          if (cancelled) {
            return
          }

          resolvedLesson =
            lessons[0]
        }

        /* ================================================
           5. ENSURE REAL LESSON EXISTS
           ================================================ */

        if (
          !resolvedLevel ||
          !resolvedLesson
        ) {
          throw new Error(
            'This lesson has not been published yet.',
          )
        }

        /* ================================================
           6. DOUBLE-CHECK GRADE OWNERSHIP
           ================================================ */

        const levelBelongsToGrade =
          gradeLevels.some(
            (item) =>
              item.id ===
              resolvedLevel?.id,
          )

        if (!levelBelongsToGrade) {
          throw new Error(
            'You cannot open lessons from another class.',
          )
        }

        /* ================================================
           7. LOAD REAL ACTIVITIES ONLY
           ================================================ */

        const lessonActivities =
          await curriculumService.getActivities(
            resolvedLesson.id,
          )

        if (cancelled) {
          return
        }

        if (!lessonActivities.length) {
          throw new Error(
            'No activities have been published for this lesson yet.',
          )
        }

        /* ================================================
           8. ORDER ACTIVITY DATA
           ================================================ */

        const orderedActivities =
          [...lessonActivities].sort(
            (a, b) =>
              Number(a.order || 0) -
              Number(b.order || 0),
          )

        setLevel(resolvedLevel)
        setLesson(resolvedLesson)
        setActivities(
          orderedActivities,
        )

        const progress = await progressService.getClassProgress(matchingClass.id) as {
          levels?: Array<{ levelId: string; lessons?: Array<{ lessonId: string; completedActivityIds?: string[] }> }>
        }
        const saved = progress.levels?.find((item) => String(item.levelId) === resolvedLevel.id)
          ?.lessons?.find((item) => String(item.lessonId) === resolvedLesson.id)
        if (cancelled) return
        setCompletedActivityIds((saved?.completedActivityIds || []).map(String))

        setStatus('ready')
      } catch (loadError) {
        if (cancelled) {
          return
        }

        console.error(
          '[TALKORA LESSON] Failed to load lesson',
          loadError,
        )

        setLevel(null)
        setLesson(null)
        setActivities([])

        setError(
          getErrorMessage(loadError),
        )

        setStatus('error')
      }
    }

    if (!routeId) {
      setError(
        'This lesson link is not valid.',
      )

      setStatus('error')

      return () => {
        cancelled = true
      }
    }

    void loadLesson()

    return () => {
      cancelled = true
    }
  }, [routeId, student?.grade])

  /* ======================================================
     LOADING
     ====================================================== */

  if (status === 'loading') {
    return (
      <TalkoraLoader
        message="Miss Julie is preparing your lesson..."
      />
    )
  }

  /* ======================================================
     ERROR
     ====================================================== */

  if (status === 'error') {
    return (
      <main className="talkora-error">
        <div className="talkora-error__icon">
          !
        </div>

        <span className="talkora-error__eyebrow">
          ADVENTURE PAUSED
        </span>

        <h1>
          Oops! This adventure didn&apos;t load.
        </h1>

        <p>
          {error ||
            'Something went wrong while opening your lesson.'}
        </p>

        <div className="talkora-error__actions">
          <button
            type="button"
            onClick={() =>
              window.location.reload()
            }
          >
            TRY AGAIN
          </button>

          <button
            type="button"
            className="talkora-error__secondary"
            onClick={() =>
              router.push(
                '/student/levels',
              )
            }
          >
            BACK TO ADVENTURE
          </button>
        </div>
      </main>
    )
  }

  /* ======================================================
     SAFETY CHECK
     ====================================================== */

  if (
    !session?.student ||
    !curriculumClass ||
    !level ||
    !lesson ||
    !activities.length
  ) {
    return (
      <main className="talkora-error">
        <h1>
          This lesson is not ready yet.
        </h1>

        <button
          type="button"
          onClick={() =>
            router.push(
              '/student/levels',
            )
          }
        >
          BACK TO ADVENTURE
        </button>
      </main>
    )
  }

  /* ======================================================
     REAL ACTIVITY ENGINE
     ====================================================== */

  return (
    <ActivityEngine
      activities={activities}
      levelTitle={
        level.place ||
        level.title
      }
      syllabusName={level.title}
      levelNumber={
        level.unitNumber ??
        level.number
      }
      avatarType={
        session.student.avatarType
      }
      studentName={
        student?.fullName?.trim() || 'Explorer'
      }
      completedActivityIds={completedActivityIds}
    />
  )
}

/* ========================================================
   ERROR NORMALIZER
   ======================================================== */

function getErrorMessage(
  error: unknown,
) {
  if (
    error instanceof Error &&
    error.message.trim()
  ) {
    return error.message
  }

  if (
    typeof error === 'string' &&
    error.trim()
  ) {
    return error
  }

  return (
    'We could not open this lesson. Please try again.'
  )
}
