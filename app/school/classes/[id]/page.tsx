'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { BookOpen } from 'lucide-react'
import { SchoolShell } from '@/components/school/school-shell'
import { curriculumService, type CurriculumClass, type LevelItem } from '@/services/curriculum-service'

export default function ClassCurriculumPreviewPage() {
  const { id } = useParams<{ id: string }>()
  const [curriculumClass, setCurriculumClass] = useState<CurriculumClass | null>(null)
  const [levels, setLevels] = useState<LevelItem[]>([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [reload, setReload] = useState(0)

  useEffect(() => {
    let active = true
    void Promise.all([curriculumService.getClass(id), curriculumService.getLevels(id)])
      .then(([klass, items]) => {
        if (!active) return
        setCurriculumClass(klass)
        setLevels([...items].sort((a, b) => a.order - b.order))
        setError('')
      })
      .catch((cause) => { if (active) setError(cause instanceof Error ? cause.message : 'Curriculum could not load.') })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [id, reload])

  return <SchoolShell title={curriculumClass ? `${curriculumClass.name} curriculum` : 'Curriculum preview'} subtitle="Published and upcoming learning levels for this grade.">
    <Link href="/school/classes" style={{ display: 'inline-block', marginBottom: 18, color: '#0369a1', fontWeight: 800 }}>← Back to classes</Link>
    {loading ? <p style={{ color: '#64748b' }}>Loading curriculum…</p> : null}
    {error ? <div role="alert" style={{ padding: 16, borderRadius: 12, background: '#fff1f0', color: '#9f332d' }}>{error} <button type="button" onClick={() => { setLoading(true); setReload((value) => value + 1) }} style={{ marginLeft: 10 }}>Retry</button></div> : null}
    {!loading && !error && levels.length === 0 ? <p style={{ color: '#64748b' }}>No levels have been authored for this class yet.</p> : null}
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
      {levels.map((level) => <article key={level.id} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, padding: 20, display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 7, color: '#1e6591', fontWeight: 800, fontSize: 12 }}><BookOpen size={16} /> Level {level.number}</span>
          <span style={{ padding: '5px 9px', borderRadius: 99, background: level.availability === 'UPCOMING' ? '#fff7e6' : '#eaf8f1', color: level.availability === 'UPCOMING' ? '#9a6400' : '#18764b', fontSize: 11, fontWeight: 800 }}>{level.availability === 'UPCOMING' ? 'Upcoming' : 'Published'}</span>
        </div>
        <h2 style={{ fontSize: 19, color: '#0f172a', margin: 0 }}>{level.title}</h2>
        <p style={{ color: '#64748b', fontSize: 13, lineHeight: 1.5, margin: 0, flex: 1 }}>{level.description}</p>
        {level.learningObjectives?.length ? <small style={{ color: '#475569' }}>Goals: {level.learningObjectives.slice(0, 3).join(' · ')}</small> : null}
        {level.sourcePages?.length ? <small style={{ color: '#64748b' }}>Syllabus pages {level.sourcePages.join(', ')}</small> : null}
      </article>)}
    </div>
  </SchoolShell>
}
