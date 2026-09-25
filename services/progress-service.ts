import { apiClient } from '@/lib/api-client'

export interface AttemptSubmission {
  answer: string
  startedAt: string
  hintsUsed?: number
  idempotencyKey?: string
}

export interface AttemptResult {
  attempt: any
  xpAwarded: number
  streak?: number
  levelProgress?: {
    levelId: string
    status: 'locked' | 'available' | 'in-progress' | 'completed'
    accuracy: number
    stars: number
    xp: number
  }
  unlockedAchievements?: Array<{
    key: string
    title: string
    description: string
    category: string
  }>
}

export interface StudentOverallProgress {
  xp: number
  stars: number
  streak: number
  curriculumVersion?: string
  lastActivityAt?: string
  levels: Array<{
    levelId: string
    status: 'locked' | 'unlocked' | 'in-progress' | 'completed'
    accuracy: number
    totalTimeMs: number
    unlockedAt?: string
    completedAt?: string
    lessons: Array<{
      lessonId: string
      completedActivityIds: string[]
      completed: boolean
      accuracy: number
      totalTimeMs: number
      completedAt?: string
    }>
  }>
}

export interface AchievementItem {
  id: string
  key: string
  title: string
  description: string
  category: 'completion' | 'speaking' | 'learning' | 'streak'
  unlocked: boolean
  unlockedAt?: string
}

export interface DailyChallengeItem {
  id: string
  date: string
  title: string
  description: string
  category: string
  targetCount: number
  xpReward: number
  progress?: number
  completed?: boolean
}

export interface HomePracticeReflection {
  reflection: string
  submittedAt: string
}

export const progressService = {
  async getHomePractice(): Promise<HomePracticeReflection | null> {
    return apiClient<HomePracticeReflection | null>('/progress/home-practice/favourites')
  },
  async saveHomePractice(reflection: string): Promise<HomePracticeReflection> {
    return apiClient<HomePracticeReflection>('/progress/home-practice/favourites', {
      method: 'PUT',
      body: JSON.stringify({ reflection }),
    })
  },
  async completeLocalActivity(activityId: string, answer: string): Promise<AttemptResult> {
    return apiClient<AttemptResult>(`/progress/activities/${activityId}/complete-local`, {
      method: 'POST',
      body: JSON.stringify({ answer }),
    })
  },
  async submitAttempt(activityId: string, submission: AttemptSubmission): Promise<AttemptResult> {
    return apiClient<AttemptResult>(`/progress/activities/${activityId}/attempts`, {
      method: 'POST',
      body: JSON.stringify(submission),
    })
  },

  async getClassProgress(classId: string): Promise<any> {
    return apiClient(`/progress/classes/${classId}`)
  },

  async getMyProgress(): Promise<StudentOverallProgress> {
    return apiClient<StudentOverallProgress>('/students/me/progress')
  },

  async getMyAchievements(): Promise<AchievementItem[]> {
    return apiClient<AchievementItem[]>('/achievements/mine')
  },

  async getMyDailyChallenge(): Promise<DailyChallengeItem | null> {
    return apiClient<DailyChallengeItem | null>('/daily-challenges/today')
  },
}
