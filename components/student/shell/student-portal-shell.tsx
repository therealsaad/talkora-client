'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useEffect, useState, type ReactNode } from 'react'
import { usePathname } from 'next/navigation'
import { Flame, Star } from 'lucide-react'
import { progressService } from '@/services/progress-service'
import { StudentNav } from '@/components/student/navigation/student-nav'
import { accountAvatar, learnerAvatar } from '@/config/talkora-assets'
import { TalkoraLogo } from '@/components/brand/talkora-logo'
import { useAuth } from '@/components/auth/auth-provider'

export function StudentPortalShell({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const { session } = useAuth()
  const [stats, setStats] = useState<{ xp?: number; streak?: number; stars?: number }>({})
  const isLesson = pathname.startsWith('/student/lesson')
  const isMap = pathname === '/student/levels'

  useEffect(() => {
    let alive = true
    if (!session?.student) {
      setStats({})
      return () => { alive = false }
    }

    progressService
      .getMyProgress()
      .then((progress) => {
        if (!alive) return
        setStats({
          xp: progress.totalXp,
          streak: progress.streak,
          stars: progress.levelProgresses?.reduce((sum, level) => sum + (Number(level.stars) || 0), 0) || 0,
        })
      })
      .catch(() => {
        if (alive) setStats({})
      })

    return () => {
      alive = false
    }
  }, [session?.student?.id])

  const student = session?.student
  const studentName = student?.fullName?.split(' ')[0] || 'Explorer'
  const studentGrade = student?.className || (student?.grade ? `Class ${student.grade}` : 'Class 4')
  const avatarUrl = accountAvatar(student?.avatar) || learnerAvatar(student?.avatarType)

  return (
    <div
      className={`talkora-app-shell ${
        isLesson ? 'talkora-app-shell--lesson' : ''
      } ${isMap ? 'talkora-app-shell--map' : ''}`}
    >
      {/* Adventure map owns its sidebar; hide the global rail there to avoid dual nav. */}
      {!isLesson && !isMap && <StudentNav />}

      <div className="talkora-main-wrapper">
        {!isLesson && (
          <header className="talkora-top-hud">
            <div className="talkora-hud-left">
              <Link href="/student/home" className="talkora-mobile-brand">
                <TalkoraLogo className="talkora-logo--mobile" priority />
              </Link>
            </div>

            <div className="talkora-hud-right">
              {/* XP Counter */}
              <div className="talkora-hud-pill talkora-hud-pill--xp" title="Total XP Earned">
                <span className="talkora-hud-pill__icon">⭐</span>
                <span className="talkora-hud-pill__val">{stats.xp ?? 0}</span>
                <span className="talkora-hud-pill__unit">XP</span>
              </div>

              {/* Stars Counter */}
              <div className="talkora-hud-pill talkora-hud-pill--stars" title="Stars Collected">
                <Star size={16} className="talkora-hud-pill__star-icon" />
                <span className="talkora-hud-pill__val">{stats.stars ?? 0}</span>
              </div>

              {/* Streak Counter */}
              <div className="talkora-hud-pill talkora-hud-pill--streak" title="Learning Streak">
                <Flame size={16} className="talkora-hud-pill__flame-icon" />
                <span className="talkora-hud-pill__val">{stats.streak ?? 0}</span>
                <span className="talkora-hud-pill__unit">d</span>
              </div>

              {/* Student Profile Pill */}
              <Link href="/student/profile" className="talkora-hud-student-pill">
                <div className="talkora-hud-avatar-wrap">
                  <Image
                    src={avatarUrl}
                    alt={studentName}
                    width={32}
                    height={32}
                    className="talkora-hud-avatar-img"
                  />
                </div>
                <div className="talkora-hud-student-meta">
                  <span className="talkora-hud-student-name">{studentName}</span>
                  <small className="talkora-hud-student-class">{studentGrade}</small>
                </div>
              </Link>
            </div>
          </header>
        )}
<main
  key={pathname}
  className={`talkora-content-area ${
    isLesson ? 'talkora-content-area--lesson' : ''
  } ${isMap ? 'talkora-content-area--map' : ''}`}
>
  {children}
</main>
      </div>
    </div>
  )
}
