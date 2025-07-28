export interface Assignment {
  id: string
  title: string
  subject: string
  dueDate: string
  priority: "low" | "medium" | "high"
  status: "pending" | "in-progress" | "completed"
  description: string
  estimatedTime: number
  actualTime?: number
  grade?: number
  attachments?: FileAttachment[]
  tags: string[]
  createdAt: string
  updatedAt: string
  completedAt?: string
  notes: string
  dependencies?: string[]
  reminderSet: boolean
  reminderTime?: string
}

export interface Subject {
  id: string
  name: string
  color: string
  teacher: string
  credits: number
  currentGrade?: number
  targetGrade?: number
  room?: string
  schedule?: ClassSchedule[]
  syllabus?: string
  createdAt: string
}

export interface ClassSchedule {
  day: string
  startTime: string
  endTime: string
  location?: string
}

export interface StudySession {
  id: string
  assignmentId?: string
  subjectId?: string
  duration: number
  date: string
  notes: string
  type: "focused" | "review" | "break" | "research"
  productivity: number
  distractions: number
}

export interface FileAttachment {
  id: string
  name: string
  size: number
  type: string
  url: string
  uploadedAt: string
}

export interface StudyGoal {
  id: string
  title: string
  description: string
  targetValue: number
  currentValue: number
  unit: string
  deadline: string
  type: "daily" | "weekly" | "monthly" | "custom"
  isCompleted: boolean
  createdAt: string
}

export interface UserSettings {
  theme: "light" | "dark" | "system"
  notifications: {
    assignments: boolean
    studyReminders: boolean
    goals: boolean
    email: boolean
    push: boolean
  }
  studyPreferences: {
    pomodoroLength: number
    shortBreakLength: number
    longBreakLength: number
    autoStartBreaks: boolean
    autoStartPomodoros: boolean
  }
  defaultView: string
  timeFormat: "12h" | "24h"
  weekStartsOn: number
  language: string
}

class StorageManager {
  private getStorageKey(key: string): string {
    return `studyplanner_${key}`
  }

  private getData<T>(key: string): T[] {
    try {
      const data = localStorage.getItem(this.getStorageKey(key))
      return data ? JSON.parse(data) : []
    } catch (error) {
      console.error(`Error loading ${key}:`, error)
      return []
    }
  }

  private setData<T>(key: string, data: T[]): void {
    try {
      localStorage.setItem(this.getStorageKey(key), JSON.stringify(data))
    } catch (error) {
      console.error(`Error saving ${key}:`, error)
    }
  }

  // Assignments
  getAssignments(): Assignment[] {
    return this.getData<Assignment>("assignments")
  }

  saveAssignment(assignment: Assignment): void {
    const assignments = this.getAssignments()
    const existingIndex = assignments.findIndex((a) => a.id === assignment.id)

    if (existingIndex >= 0) {
      assignments[existingIndex] = { ...assignment, updatedAt: new Date().toISOString() }
    } else {
      assignments.push(assignment)
    }

    this.setData("assignments", assignments)
  }

  deleteAssignment(id: string): void {
    const assignments = this.getAssignments().filter((a) => a.id !== id)
    this.setData("assignments", assignments)
  }

  // Subjects
  getSubjects(): Subject[] {
    return this.getData<Subject>("subjects")
  }

  saveSubject(subject: Subject): void {
    const subjects = this.getSubjects()
    const existingIndex = subjects.findIndex((s) => s.id === subject.id)

    if (existingIndex >= 0) {
      subjects[existingIndex] = subject
    } else {
      subjects.push(subject)
    }

    this.setData("subjects", subjects)
  }

  deleteSubject(id: string): void {
    const subjects = this.getSubjects().filter((s) => s.id !== id)
    this.setData("subjects", subjects)
  }

  // Study Sessions
  getStudySessions(): StudySession[] {
    return this.getData<StudySession>("studySessions")
  }

  saveStudySession(session: StudySession): void {
    const sessions = this.getStudySessions()
    sessions.push(session)
    this.setData("studySessions", sessions)
  }

  // Study Goals
  getStudyGoals(): StudyGoal[] {
    return this.getData<StudyGoal>("studyGoals")
  }

  saveStudyGoal(goal: StudyGoal): void {
    const goals = this.getStudyGoals()
    const existingIndex = goals.findIndex((g) => g.id === goal.id)

    if (existingIndex >= 0) {
      goals[existingIndex] = goal
    } else {
      goals.push(goal)
    }

    this.setData("studyGoals", goals)
  }

  deleteStudyGoal(id: string): void {
    const goals = this.getStudyGoals().filter((g) => g.id !== id)
    this.setData("studyGoals", goals)
  }

  // Settings
  getSettings(): UserSettings {
    try {
      const settings = localStorage.getItem(this.getStorageKey("settings"))
      return settings ? JSON.parse(settings) : this.getDefaultSettings()
    } catch (error) {
      return this.getDefaultSettings()
    }
  }

  saveSettings(settings: UserSettings): void {
    localStorage.setItem(this.getStorageKey("settings"), JSON.stringify(settings))
  }

  private getDefaultSettings(): UserSettings {
    return {
      theme: "dark",
      notifications: {
        assignments: true,
        studyReminders: true,
        goals: true,
        email: false,
        push: false,
      },
      studyPreferences: {
        pomodoroLength: 25,
        shortBreakLength: 5,
        longBreakLength: 15,
        autoStartBreaks: false,
        autoStartPomodoros: false,
      },
      defaultView: "dashboard",
      timeFormat: "12h",
      weekStartsOn: 0,
      language: "en",
    }
  }

  // Bulk operations
  exportData(): string {
    const data = {
      assignments: this.getAssignments(),
      subjects: this.getSubjects(),
      studySessions: this.getStudySessions(),
      studyGoals: this.getStudyGoals(),
      settings: this.getSettings(),
      exportedAt: new Date().toISOString(),
    }
    return JSON.stringify(data, null, 2)
  }

  importData(jsonData: string): boolean {
    try {
      const data = JSON.parse(jsonData)

      if (data.assignments) this.setData("assignments", data.assignments)
      if (data.subjects) this.setData("subjects", data.subjects)
      if (data.studySessions) this.setData("studySessions", data.studySessions)
      if (data.studyGoals) this.setData("studyGoals", data.studyGoals)
      if (data.settings) this.saveSettings(data.settings)

      return true
    } catch (error) {
      console.error("Import failed:", error)
      return false
    }
  }

  clearAllData(): void {
    const keys = ["assignments", "subjects", "studySessions", "studyGoals", "settings"]
    keys.forEach((key) => {
      localStorage.removeItem(this.getStorageKey(key))
    })
  }
}

export const storage = new StorageManager()

export function generateId(): string {
  return Math.random().toString(36).substr(2, 9) + Date.now().toString(36)
}
