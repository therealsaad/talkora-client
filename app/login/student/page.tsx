'use client'

import Link from 'next/link'
import Image from 'next/image'
import { FormEvent, useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { ArrowLeft, ArrowRight, School, Sparkles } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { authService, type StudentProfileOption, type StudentRosterResponse } from '@/services/auth-service'
import { useAuth } from '@/components/auth/auth-provider'
import { MissJulie } from '@/components/student/miss-julie/miss-julie'
import { ClassFilter, GradeFilter, RosterSearch, StudentRosterGrid } from '@/components/student/login/student-roster'
import { StudentPinInput } from '@/components/student/login/student-pin-input'
import { accountAvatar, talkoraAssets } from '@/config/talkora-assets'
import { TalkoraLogo } from '@/components/brand/talkora-logo'
import { useMissJulieVoice } from '@/hooks/use-miss-julie-voice'

export default function StudentLoginPage() {
  const router = useRouter(); const reduced = useReducedMotion()
  const { loginStudent } = useAuth()
  const julieVoice = useMissJulieVoice()
  const [step, setStep] = useState<1 | 2 | 3>(1); const [schoolCode, setSchoolCode] = useState(''); const [schoolName, setSchoolName] = useState(''); const [students, setStudents] = useState<StudentProfileOption[]>([])
  const [selected, setSelected] = useState<StudentProfileOption | null>(null); const [studentCode, setStudentCode] = useState(''); const [grade, setGrade] = useState<number>(); const [classFilter, setClassFilter] = useState(''); const [search, setSearch] = useState('')
  const [facets, setFacets] = useState<StudentRosterResponse['filters']>({ grades: [], classes: [] }); const [pagination, setPagination] = useState({ page: 1, limit: 24, total: 0, pages: 0 }); const [rosterLoading, setRosterLoading] = useState(false)
  const [error, setError] = useState(''); const [loading, setLoading] = useState(false); const [success, setSuccess] = useState(false)

  const classes = useMemo(() => facets.classes.filter((item) => !grade || item.grade === grade).map((item) => item.className), [facets.classes, grade])

  useEffect(() => {
    if (step !== 2 || !schoolCode || !grade) return
    const controller = new AbortController()
    const timer = window.setTimeout(async () => {
      setRosterLoading(true); setError('')
      try {
        const data = await authService.lookupStudents(schoolCode, { grade, className: classFilter || undefined, q: search.trim() || undefined, page: pagination.page, limit: 24 })
        if (!controller.signal.aborted) { setStudents(data.students); setPagination(data.pagination); setFacets(data.filters) }
      } catch (caught) { if (!controller.signal.aborted) setError(caught instanceof Error ? caught.message : "Talkora couldn't connect. Try again.") }
      finally { if (!controller.signal.aborted) setRosterLoading(false) }
    }, search ? 350 : 80)
    return () => { controller.abort(); window.clearTimeout(timer) }
  }, [step, schoolCode, grade, classFilter, search, pagination.page])

  async function enterSchool(event: FormEvent) {
    event.preventDefault(); setLoading(true); setError('')
    try {
      const code = schoolCode.trim().toUpperCase(); const data = await authService.lookupStudents(code, { page: 1, limit: 24 }); setSchoolCode(code); setSchoolName(data.school.name); setFacets(data.filters); setPagination(data.pagination); setStudents(data.students); setGrade(data.filters.grades[0])
      setStep(2)
    } catch { setError("We couldn't find that school code. Check it with your teacher.") } finally { setLoading(false) }
  }
  function chooseStudent(student: StudentProfileOption) { setSelected(student); setStudentCode(''); setError(''); window.setTimeout(() => setStep(3), reduced ? 0 : 480) }
  async function signIn(event: FormEvent) {
    event.preventDefault(); if (!selected) return; setLoading(true); setError('')
    try { await loginStudent(schoolCode, selected.id, studentCode); setSuccess(true); window.setTimeout(() => router.replace('/student/levels'), reduced ? 0 : 520) }
    catch (caught) { setError(caught instanceof Error ? caught.message : 'That code was not correct. Try again or ask your teacher.'); setStudentCode('') }
    finally { setLoading(false) }
  }

  const julieState = success ? 'celebrate' : error ? 'encouraging' : step === 1 ? 'welcome' : step === 2 ? 'pointing' : 'encouraging'
  const julieMessage = success ? `You're in, ${selected?.fullName.split(' ')[0]}!` : error ? 'That is okay. Take a breath and try once more.' : step === 1 ? 'Let us find your Talkora school.' : step === 2 ? 'Hi! Find your name, then tap your photo.' : `Your secret code keeps your journey safe, ${selected?.fullName.split(' ')[0]}.`
  const pageSpeechKey = `page:student-login:${step}:${selected?.id || 'school'}:${error ? 'error' : success ? 'success' : 'ready'}`

  useEffect(() => {
    if (!julieMessage.trim()) return
    const timer = window.setTimeout(() => {
      void julieVoice.speak(julieMessage, pageSpeechKey, 'PAGE_GUIDANCE')
    }, reduced ? 0 : 320)
    return () => window.clearTimeout(timer)
  }, [julieMessage, julieVoice.speak, pageSpeechKey, reduced])

  return <main className={`student-login-v2 login-step-${step}`} style={{ '--student-scene': `url(${talkoraAssets.environments.landing})` } as React.CSSProperties}>
    <Link data-login-enter href="/" className="student-brand login-brand"><TalkoraLogo className="talkora-logo--login" priority /></Link>
    <section className="student-login-scene" data-login-enter><MissJulie state={julieState} size="large" message={julieMessage} speaking={julieVoice.isSpeaking} onSpeak={() => void julieVoice.replay()} /><div className="school-door-light" aria-hidden="true" /></section>
    <section className="student-login-panel" data-login-panel data-login-enter>
      <div className="login-step-dots" aria-label={`Step ${step} of 3`}>{[1, 2, 3].map((item) => <i key={item} className={item <= step ? 'active' : ''} />)}<span>Step {step} of 3</span></div>
      <AnimatePresence mode="wait">
        {step === 1 && <motion.form key="school" initial={false} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} onSubmit={enterSchool} className="student-login-card">
          <span className="student-kicker"><School size={16} /> Enter your school</span><h1>Which school are you from?</h1><p>Type the school code your teacher gave you.</p>
          <label className="school-code-field"><span>School code</span><input required autoFocus value={schoolCode} onChange={(event) => setSchoolCode(event.target.value.toUpperCase())} maxLength={16} placeholder="YOUR SCHOOL CODE" /></label>
          {error && <div className="student-form-error" role="alert">{error}</div>}
          <button className="student-primary-button" disabled={loading}>{loading ? 'Finding your school…' : <>ENTER MY SCHOOL <ArrowRight size={20} /></>}</button>
          <Link className="student-text-link" href="/"><ArrowLeft size={16} /> Back to Talkora</Link>
        </motion.form>}
        {step === 2 && <motion.section key="roster" initial={false} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="student-login-card roster-card">
          <span className="student-kicker"><Sparkles size={16} /> {schoolName}</span><h1>Find Yourself!</h1><p>Choose your class and tap your photo.</p>
          <GradeFilter grades={facets.grades} value={grade} onChange={(nextGrade) => { setGrade(nextGrade); setClassFilter(''); setSearch(''); setPagination((current) => ({ ...current, page: 1 })) }} />
          <div className="roster-tools"><ClassFilter classes={classes} value={classFilter} onChange={(value) => { setClassFilter(value); setPagination((current) => ({ ...current, page: 1 })) }} /><RosterSearch value={search} onChange={(value) => { setSearch(value); setPagination((current) => ({ ...current, page: 1 })) }} /></div>
          <StudentRosterGrid students={students} selected={selected} onSelect={chooseStudent} classLabel={classFilter || (grade ? `Class ${grade}` : '')} loading={rosterLoading} page={pagination.page} pages={pagination.pages} onPage={(page) => setPagination((current) => ({ ...current, page }))} />
          {!rosterLoading && !students.length && <div className="student-empty">No classmates found here. Try another class or spelling.</div>}
          {error && <div className="student-form-error" role="alert">{error}</div>}
          <button className="student-text-link button-link" type="button" onClick={() => setStep(1)}><ArrowLeft size={16} /> Change school</button>
        </motion.section>}
        {step === 3 && selected && <motion.form key="pin" initial={false} animate={error ? { opacity: 1, x: [0, -9, 9, -6, 6, 0] } : { opacity: 1, x: 0 }} exit={{ opacity: 0 }} onSubmit={signIn} className="student-login-card pin-card">
          <div className="pin-student-photo"><span className="photo-tape" aria-hidden="true" /><Image src={accountAvatar(selected.avatar, students.findIndex((student) => student.id === selected.id))} alt="" fill sizes="100px" /></div>
          <span className="student-kicker"><Sparkles size={16} /> Secret code</span><h1>Hi, {selected.fullName.split(' ')[0]}!</h1><p>Enter your secret Talkora code.</p>
          <StudentPinInput value={studentCode} onChange={setStudentCode} invalid={Boolean(error)} success={success} />
          {error && <div className="student-form-error" role="alert">{error}</div>}
          <button className="student-primary-button" disabled={loading || success || !studentCode}>{success ? 'Opening your classroom…' : loading ? 'Checking…' : <>Start my adventure <ArrowRight size={20} /></>}</button>
          <button className="student-text-link button-link" type="button" onClick={() => { setStep(2); setError('') }}><ArrowLeft size={16} /> Pick another student</button>
        </motion.form>}
      </AnimatePresence>
    </section>
  </main>
}
