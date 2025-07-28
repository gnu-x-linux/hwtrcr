import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function generateId(): string {
  return Math.random().toString(36).substr(2, 9) + Date.now().toString(36)
}

export function formatTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60
  return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
}

export function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60

  if (hours === 0) return `${mins}m`
  if (mins === 0) return `${hours}h`
  return `${hours}h ${mins}m`
}

export function getTimeUntilDue(dueDate: string): string {
  const now = new Date()
  const due = new Date(dueDate)
  const diffMs = due.getTime() - now.getTime()

  if (diffMs < 0) return "Overdue"

  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))

  if (diffDays > 0) return `${diffDays} day${diffDays > 1 ? "s" : ""}`
  if (diffHours > 0) return `${diffHours} hour${diffHours > 1 ? "s" : ""}`

  const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))
  return `${diffMinutes} minute${diffMinutes > 1 ? "s" : ""}`
}

export function calculateGPA(subjects: Array<{ currentGrade?: number; credits: number }>): number {
  const validSubjects = subjects.filter((s) => s.currentGrade !== undefined)
  if (validSubjects.length === 0) return 0

  const totalPoints = validSubjects.reduce((sum, subject) => {
    const gradePoint = gradeToGPA(subject.currentGrade!)
    return sum + gradePoint * subject.credits
  }, 0)

  const totalCredits = validSubjects.reduce((sum, subject) => sum + subject.credits, 0)

  return totalCredits > 0 ? totalPoints / totalCredits : 0
}

export function gradeToGPA(grade: number): number {
  if (grade >= 97) return 4.0
  if (grade >= 93) return 3.7
  if (grade >= 90) return 3.3
  if (grade >= 87) return 3.0
  if (grade >= 83) return 2.7
  if (grade >= 80) return 2.3
  if (grade >= 77) return 2.0
  if (grade >= 73) return 1.7
  if (grade >= 70) return 1.3
  if (grade >= 67) return 1.0
  if (grade >= 65) return 0.7
  return 0.0
}

export function exportToCSV(data: any[], filename: string): void {
  if (data.length === 0) return

  const headers = Object.keys(data[0])
  const csvContent = [
    headers.join(","),
    ...data.map((row) =>
      headers
        .map((header) => {
          const value = row[header]
          return typeof value === "string" && value.includes(",") ? `"${value}"` : value
        })
        .join(","),
    ),
  ].join("\n")

  const blob = new Blob([csvContent], { type: "text/csv" })
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = `${filename}.csv`
  link.click()
  window.URL.revokeObjectURL(url)
}

export function getWeekDates(date: Date): Date[] {
  const week = []
  const startOfWeek = new Date(date)
  startOfWeek.setDate(date.getDate() - date.getDay())

  for (let i = 0; i < 7; i++) {
    const day = new Date(startOfWeek)
    day.setDate(startOfWeek.getDate() + i)
    week.push(day)
  }

  return week
}

export function isToday(date: Date): boolean {
  const today = new Date()
  return date.toDateString() === today.toDateString()
}

export function isSameDay(date1: Date, date2: Date): boolean {
  return date1.toDateString() === date2.toDateString()
}
