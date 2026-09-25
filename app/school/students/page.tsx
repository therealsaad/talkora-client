import { StudentManagementPage } from './student-management-page'

export default async function Page({ searchParams }: { searchParams: Promise<{ grade?: string | string[] }> }) {
  const gradeParam = (await searchParams).grade
  const grade = Number(Array.isArray(gradeParam) ? gradeParam[0] : gradeParam)
  return <StudentManagementPage initialGradeFilter={Number.isInteger(grade) && grade >= 4 && grade <= 10 ? grade : undefined} />
}
