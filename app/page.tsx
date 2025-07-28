"use client"

import type React from "react"

import { useState, useEffect } from "react"
import {
  Calendar,
  Clock,
  BookOpen,
  Target,
  TrendingUp,
  Plus,
  Search,
  Bell,
  Moon,
  Sun,
  BarChart3,
  Timer,
  GraduationCap,
  CheckCircle2,
  AlertCircle,
  CalendarIcon,
  List,
  Settings,
  Download,
  Upload,
  SortAsc,
  MoreHorizontal,
  Edit,
  Trash2,
  Play,
  Pause,
  RotateCcw,
  Award,
  User,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { Separator } from "@/components/ui/separator"
import { Label } from "@/components/ui/label"
import { cn, formatTime, formatDuration, getTimeUntilDue, calculateGPA, exportToCSV } from "@/lib/utils"
import {
  storage,
  type Assignment,
  type Subject,
  type StudySession,
  type StudyGoal,
  type UserSettings,
} from "@/lib/storage"
import { useNotifications } from "@/hooks/useNotifications"
import { AssignmentForm } from "@/components/assignment-form"
import { SubjectForm } from "@/components/subject-form"

export default function HomeworkPlannerApp() {
  // Core state
  const [isDarkMode, setIsDarkMode] = useState(true)
  const [activeTab, setActiveTab] = useState("dashboard")
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [studySessions, setStudySessions] = useState<StudySession[]>([])
  const [studyGoals, setStudyGoals] = useState<StudyGoal[]>([])
  const [settings, setSettings] = useState<UserSettings>()

  // UI state
  const [searchQuery, setSearchQuery] = useState("")
  const [filterSubject, setFilterSubject] = useState("all")
  const [filterStatus, setFilterStatus] = useState("all")
  const [filterPriority, setFilterPriority] = useState("all")
  const [sortBy, setSortBy] = useState("dueDate")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc")

  // Dialog states
  const [isAddingAssignment, setIsAddingAssignment] = useState(false)
  const [isAddingSubject, setIsAddingSubject] = useState(false)
  const [isAddingGoal, setIsAddingGoal] = useState(false)
  const [editingAssignment, setEditingAssignment] = useState<Assignment | null>(null)
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null)
  const [showSettings, setShowSettings] = useState(false)

  // Study timer state
  const [studyTimer, setStudyTimer] = useState(0)
  const [isTimerRunning, setIsTimerRunning] = useState(false)
  const [selectedAssignmentForTimer, setSelectedAssignmentForTimer] = useState<string>("")
  const [currentStudySession, setCurrentStudySession] = useState<StudySession | null>(null)

  // Notifications
  const { permission, requestPermission, showNotification, scheduleAssignmentReminder } = useNotifications()

  // Load data on mount
  useEffect(() => {
    loadData()
  }, [])

  // Theme effect
  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDarkMode)
  }, [isDarkMode])

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout
    if (isTimerRunning) {
      interval = setInterval(() => {
        setStudyTimer((prev) => prev + 1)
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [isTimerRunning])

  const loadData = () => {
    setAssignments(storage.getAssignments())
    setSubjects(storage.getSubjects())
    setStudySessions(storage.getStudySessions())
    setStudyGoals(storage.getStudyGoals())
    setSettings(storage.getSettings())
  }

  // Assignment operations
  const saveAssignment = (assignment: Assignment) => {
    storage.saveAssignment(assignment)
    setAssignments(storage.getAssignments())
    setIsAddingAssignment(false)
    setEditingAssignment(null)

    if (assignment.reminderSet && permission === "granted") {
      scheduleAssignmentReminder(assignment)
    }

    showNotification("Assignment saved successfully!")
  }

  const deleteAssignment = (id: string) => {
    storage.deleteAssignment(id)
    setAssignments(storage.getAssignments())
    showNotification("Assignment deleted")
  }

  const toggleAssignmentStatus = (assignment: Assignment) => {
    const newStatus = assignment.status === "completed" ? "pending" : "completed"
    const updatedAssignment = {
      ...assignment,
      status: newStatus as Assignment["status"],
      completedAt: newStatus === "completed" ? new Date().toISOString() : undefined,
    }
    saveAssignment(updatedAssignment)
  }

  // Subject operations
  const saveSubject = (subject: Subject) => {
    storage.saveSubject(subject)
    setSubjects(storage.getSubjects())
    setIsAddingSubject(false)
    setEditingSubject(null)
    showNotification("Subject saved successfully!")
  }

  const deleteSubject = (id: string) => {
    storage.deleteSubject(id)
    setSubjects(storage.getSubjects())
    showNotification("Subject deleted")
  }

  // Study timer operations
  const startTimer = () => {
    setIsTimerRunning(true)
    if (!currentStudySession) {
      const session: StudySession = {
        id: Math.random().toString(36).substr(2, 9),
        assignmentId: selectedAssignmentForTimer || undefined,
        duration: 0,
        date: new Date().toISOString(),
        notes: "",
        type: "focused",
        productivity: 5,
        distractions: 0,
      }
      setCurrentStudySession(session)
    }
  }

  const pauseTimer = () => {
    setIsTimerRunning(false)
  }

  const resetTimer = () => {
    setStudyTimer(0)
    setIsTimerRunning(false)
    if (currentStudySession) {
      const finalSession = {
        ...currentStudySession,
        duration: studyTimer,
      }
      storage.saveStudySession(finalSession)
      setStudySessions(storage.getStudySessions())
      setCurrentStudySession(null)
    }
  }

  // Filtering and sorting
  const filteredAndSortedAssignments = assignments
    .filter((assignment) => {
      const matchesSearch =
        assignment.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        assignment.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
        assignment.description.toLowerCase().includes(searchQuery.toLowerCase())

      const matchesSubject = filterSubject === "all" || assignment.subject === filterSubject
      const matchesStatus = filterStatus === "all" || assignment.status === filterStatus
      const matchesPriority = filterPriority === "all" || assignment.priority === filterPriority

      return matchesSearch && matchesSubject && matchesStatus && matchesPriority
    })
    .sort((a, b) => {
      let aValue: any, bValue: any

      switch (sortBy) {
        case "title":
          aValue = a.title.toLowerCase()
          bValue = b.title.toLowerCase()
          break
        case "dueDate":
          aValue = new Date(a.dueDate).getTime()
          bValue = new Date(b.dueDate).getTime()
          break
        case "priority":
          const priorityOrder = { high: 3, medium: 2, low: 1 }
          aValue = priorityOrder[a.priority]
          bValue = priorityOrder[b.priority]
          break
        case "subject":
          aValue = a.subject.toLowerCase()
          bValue = b.subject.toLowerCase()
          break
        default:
          return 0
      }

      if (sortOrder === "asc") {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0
      }
    })

  // Analytics calculations
  const completionRate =
    assignments.length > 0
      ? Math.round((assignments.filter((a) => a.status === "completed").length / assignments.length) * 100)
      : 0

  const averageGrade =
    assignments.filter((a) => a.grade).length > 0
      ? assignments.filter((a) => a.grade).reduce((sum, a) => sum + (a.grade || 0), 0) /
        assignments.filter((a) => a.grade).length
      : 0

  const upcomingAssignments = assignments
    .filter((a) => a.status !== "completed")
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
    .slice(0, 5)

  const overdue = assignments.filter((a) => a.status !== "completed" && new Date(a.dueDate) < new Date()).length

  const todaysSessions = studySessions.filter((session) => {
    const today = new Date().toDateString()
    return new Date(session.date).toDateString() === today
  })

  const todaysStudyTime = todaysSessions.reduce((total, session) => total + session.duration, 0)

  const gpa = calculateGPA(subjects)

  // Export functions
  const exportAssignments = () => {
    exportToCSV(assignments, "assignments")
  }

  const exportSubjects = () => {
    exportToCSV(subjects, "subjects")
  }

  const exportAllData = () => {
    const dataStr = storage.exportData()
    const dataBlob = new Blob([dataStr], { type: "application/json" })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement("a")
    link.href = url
    link.download = `studyplanner-backup-${new Date().toISOString().split("T")[0]}.json`
    link.click()
    URL.revokeObjectURL(url)
  }

  const importData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const content = e.target?.result as string
        if (storage.importData(content)) {
          loadData()
          showNotification("Data imported successfully!")
        } else {
          showNotification("Failed to import data. Please check the file format.")
        }
      }
      reader.readAsText(file)
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "text-red-400"
      case "medium":
        return "text-yellow-400"
      case "low":
        return "text-green-400"
      default:
        return "text-gray-400"
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "text-green-400"
      case "in-progress":
        return "text-blue-400"
      case "pending":
        return "text-gray-400"
      default:
        return "text-gray-400"
    }
  }

  return (
    <div
      className={cn(
        "min-h-screen transition-colors duration-300",
        isDarkMode ? "bg-black text-white" : "bg-white text-gray-900",
      )}
    >
      {/* Header */}
      <header
        className={cn(
          "sticky top-0 z-50 border-b backdrop-blur-sm",
          isDarkMode ? "bg-black/80 border-gray-800" : "bg-white/80 border-gray-200",
        )}
      >
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600">
                <GraduationCap className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold">StudyPlanner Pro</h1>
                <p className="text-sm text-gray-500">Your academic success companion</p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {overdue > 0 && (
                <Badge variant="destructive" className="animate-pulse">
                  {overdue} Overdue
                </Badge>
              )}

              <Button variant="ghost" size="icon" onClick={() => permission !== "granted" && requestPermission()}>
                <Bell className={cn("h-5 w-5", permission === "granted" ? "text-green-500" : "")} />
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <Settings className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={() => setShowSettings(true)}>
                    <Settings className="h-4 w-4 mr-2" />
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={exportAllData}>
                    <Download className="h-4 w-4 mr-2" />
                    Export Data
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Upload className="h-4 w-4 mr-2" />
                    <label htmlFor="import-data" className="cursor-pointer">
                      Import Data
                    </label>
                    <input id="import-data" type="file" accept=".json" onChange={importData} className="hidden" />
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <div className="flex items-center space-x-2">
                <Sun className="h-4 w-4" />
                <Switch checked={isDarkMode} onCheckedChange={setIsDarkMode} />
                <Moon className="h-4 w-4" />
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav
        className={cn(
          "sticky top-[73px] z-40 border-b",
          isDarkMode ? "bg-black border-gray-800" : "bg-white border-gray-200",
        )}
      >
        <div className="container mx-auto px-4">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className={cn("grid w-full grid-cols-6 h-12", isDarkMode ? "bg-gray-900" : "bg-gray-100")}>
              <TabsTrigger value="dashboard" className="flex items-center space-x-2">
                <BarChart3 className="h-4 w-4" />
                <span className="hidden sm:inline">Dashboard</span>
              </TabsTrigger>
              <TabsTrigger value="assignments" className="flex items-center space-x-2">
                <List className="h-4 w-4" />
                <span className="hidden sm:inline">Assignments</span>
              </TabsTrigger>

              <TabsTrigger value="calendar" className="flex items-center space-x-2">
                <CalendarIcon className="h-4 w-4" />
                <span className="hidden sm:inline">Calendar</span>
              </TabsTrigger>
              <TabsTrigger value="subjects" className="flex items-center space-x-2">
                <BookOpen className="h-4 w-4" />
                <span className="hidden sm:inline">Subjects</span>
              </TabsTrigger>
              <TabsTrigger value="timer" className="flex items-center space-x-2">
                <Timer className="h-4 w-4" />
                <span className="hidden sm:inline">Study Timer</span>
              </TabsTrigger>
              <TabsTrigger value="analytics" className="flex items-center space-x-2">
                <TrendingUp className="h-4 w-4" />
                <span className="hidden sm:inline">Analytics</span>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </nav>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          {/* Dashboard */}
          <TabsContent value="dashboard" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className={isDarkMode ? "bg-gray-900 border-gray-800" : ""}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Assignments</CardTitle>
                  <BookOpen className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{assignments.length}</div>
                  <p className="text-xs text-muted-foreground">
                    {assignments.filter((a) => a.status === "pending").length} pending
                  </p>
                </CardContent>
              </Card>

              <Card className={isDarkMode ? "bg-gray-900 border-gray-800" : ""}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
                  <Target className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{completionRate}%</div>
                  <Progress value={completionRate} className="mt-2" />
                </CardContent>
              </Card>

              <Card className={isDarkMode ? "bg-gray-900 border-gray-800" : ""}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Average Grade</CardTitle>
                  <Award className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{averageGrade > 0 ? `${averageGrade.toFixed(1)}%` : "N/A"}</div>
                  <p className="text-xs text-muted-foreground">GPA: {gpa > 0 ? gpa.toFixed(2) : "N/A"}</p>
                </CardContent>
              </Card>

              <Card className={isDarkMode ? "bg-gray-900 border-gray-800" : ""}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Study Time Today</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatDuration(Math.floor(todaysStudyTime / 60))}</div>
                  <p className="text-xs text-muted-foreground">
                    {todaysSessions.length} session{todaysSessions.length !== 1 ? "s" : ""}
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className={isDarkMode ? "bg-gray-900 border-gray-800" : ""}>
                <CardHeader>
                  <CardTitle>Upcoming Assignments</CardTitle>
                  <CardDescription>Your next assignments due</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {upcomingAssignments.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <CheckCircle2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No upcoming assignments!</p>
                      <p className="text-sm">Great job staying on top of your work.</p>
                    </div>
                  ) : (
                    upcomingAssignments.map((assignment) => (
                      <div
                        key={assignment.id}
                        className="flex items-center justify-between p-3 rounded-lg border border-gray-200 dark:border-gray-700"
                      >
                        <div className="flex-1">
                          <h4 className="font-medium">{assignment.title}</h4>
                          <p className="text-sm text-muted-foreground">{assignment.subject}</p>
                        </div>
                        <div className="text-right">
                          <Badge
                            variant={
                              assignment.priority === "high"
                                ? "destructive"
                                : assignment.priority === "medium"
                                  ? "default"
                                  : "secondary"
                            }
                          >
                            {assignment.priority}
                          </Badge>
                          <p className="text-xs text-muted-foreground mt-1">
                            Due {getTimeUntilDue(assignment.dueDate)}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>

              <Card className={isDarkMode ? "bg-gray-900 border-gray-800" : ""}>
                <CardHeader>
                  <CardTitle>Subject Performance</CardTitle>
                  <CardDescription>Current grades by subject</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {subjects.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No subjects added yet</p>
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-2 bg-transparent"
                        onClick={() => setIsAddingSubject(true)}
                      >
                        Add Your First Subject
                      </Button>
                    </div>
                  ) : (
                    subjects.map((subject) => (
                      <div key={subject.id} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: subject.color }} />
                            <span className="font-medium">{subject.name}</span>
                          </div>
                          <span className="font-bold">{subject.currentGrade ? `${subject.currentGrade}%` : "N/A"}</span>
                        </div>
                        {subject.currentGrade && <Progress value={subject.currentGrade} className="h-2" />}
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <Card className={isDarkMode ? "bg-gray-900 border-gray-800" : ""}>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Common tasks to get you started</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Button onClick={() => setIsAddingAssignment(true)} className="h-20 flex-col space-y-2">
                    <Plus className="h-6 w-6" />
                    <span>Add Assignment</span>
                  </Button>
                  <Button
                    onClick={() => setIsAddingSubject(true)}
                    variant="outline"
                    className="h-20 flex-col space-y-2"
                  >
                    <BookOpen className="h-6 w-6" />
                    <span>Add Subject</span>
                  </Button>
                  <Button onClick={() => setActiveTab("timer")} variant="outline" className="h-20 flex-col space-y-2">
                    <Timer className="h-6 w-6" />
                    <span>Start Study Timer</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Assignments */}
          <TabsContent value="assignments" className="space-y-6">
            <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
              <div className="flex flex-col sm:flex-row gap-4 flex-1">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search assignments..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>

                <div className="flex gap-2">
                  <Select value={filterSubject} onValueChange={setFilterSubject}>
                    <SelectTrigger className="w-[140px]">
                      <SelectValue placeholder="Subject" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Subjects</SelectItem>
                      {subjects.map((subject) => (
                        <SelectItem key={subject.id} value={subject.name}>
                          {subject.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-[120px]">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="in-progress">In Progress</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={filterPriority} onValueChange={setFilterPriority}>
                    <SelectTrigger className="w-[120px]">
                      <SelectValue placeholder="Priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Priority</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="w-[120px]">
                      <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="dueDate">Due Date</SelectItem>
                      <SelectItem value="title">Title</SelectItem>
                      <SelectItem value="priority">Priority</SelectItem>
                      <SelectItem value="subject">Subject</SelectItem>
                    </SelectContent>
                  </Select>

                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
                  >
                    <SortAsc className={cn("h-4 w-4", sortOrder === "desc" && "rotate-180")} />
                  </Button>
                </div>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" onClick={exportAssignments}>
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
                <Button onClick={() => setIsAddingAssignment(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Assignment
                </Button>
              </div>
            </div>

            <div className="grid gap-4">
              {filteredAndSortedAssignments.length === 0 ? (
                <Card className={isDarkMode ? "bg-gray-900 border-gray-800" : ""}>
                  <CardContent className="text-center py-12">
                    <List className="h-16 w-16 mx-auto mb-4 opacity-50" />
                    <h3 className="text-lg font-semibold mb-2">No assignments found</h3>
                    <p className="text-muted-foreground mb-4">
                      {assignments.length === 0
                        ? "Get started by adding your first assignment"
                        : "Try adjusting your filters or search terms"}
                    </p>
                    <Button onClick={() => setIsAddingAssignment(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Assignment
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                filteredAndSortedAssignments.map((assignment) => (
                  <Card
                    key={assignment.id}
                    className={cn(
                      "transition-all hover:shadow-lg",
                      isDarkMode ? "bg-gray-900 border-gray-800 hover:bg-gray-800" : "hover:shadow-md",
                      assignment.status === "completed" && "opacity-75",
                    )}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <button onClick={() => toggleAssignmentStatus(assignment)} className="flex-shrink-0">
                              <CheckCircle2
                                className={cn(
                                  "h-5 w-5 transition-colors",
                                  assignment.status === "completed"
                                    ? "text-green-500"
                                    : "text-gray-400 hover:text-green-500",
                                )}
                              />
                            </button>
                            <h3
                              className={cn(
                                "text-lg font-semibold",
                                assignment.status === "completed" && "line-through",
                              )}
                            >
                              {assignment.title}
                            </h3>
                            <Badge
                              variant={
                                assignment.priority === "high"
                                  ? "destructive"
                                  : assignment.priority === "medium"
                                    ? "default"
                                    : "secondary"
                              }
                            >
                              {assignment.priority}
                            </Badge>
                            <Badge variant="outline" className={getStatusColor(assignment.status)}>
                              {assignment.status}
                            </Badge>
                          </div>

                          {assignment.description && (
                            <p className="text-muted-foreground mb-3">{assignment.description}</p>
                          )}

                          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center space-x-1">
                              <BookOpen className="h-4 w-4" />
                              <span>{assignment.subject}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Calendar className="h-4 w-4" />
                              <span>Due {getTimeUntilDue(assignment.dueDate)}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Clock className="h-4 w-4" />
                              <span>{formatDuration(assignment.estimatedTime)}</span>
                            </div>
                            {assignment.grade && (
                              <div className="flex items-center space-x-1">
                                <Award className="h-4 w-4" />
                                <span>Grade: {assignment.grade}%</span>
                              </div>
                            )}
                            {assignment.tags.length > 0 && (
                              <div className="flex items-center space-x-1">
                                <div className="flex flex-wrap gap-1">
                                  {assignment.tags.map((tag) => (
                                    <Badge key={tag} variant="outline" className="text-xs">
                                      {tag}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center space-x-2">
                          {new Date(assignment.dueDate) < new Date() && assignment.status !== "completed" ? (
                            <AlertCircle className="h-5 w-5 text-red-500" />
                          ) : assignment.status === "completed" ? (
                            <CheckCircle2 className="h-5 w-5 text-green-500" />
                          ) : (
                            <Clock className="h-5 w-5 text-yellow-500" />
                          )}

                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => setEditingAssignment(assignment)}>
                                <Edit className="h-4 w-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedAssignmentForTimer(assignment.id)
                                  setActiveTab("timer")
                                }}
                              >
                                <Timer className="h-4 w-4 mr-2" />
                                Start Timer
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => deleteAssignment(assignment.id)}
                                className="text-red-600"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          {/* Calendar */}
          <TabsContent value="calendar" className="space-y-6">
            <Card className={isDarkMode ? "bg-gray-900 border-gray-800" : ""}>
              <CardHeader>
                <CardTitle>Assignment Calendar</CardTitle>
                <CardDescription>View your assignments and deadlines in calendar format</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-7 gap-2 mb-4">
                  {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                    <div key={day} className="p-2 text-center font-medium text-muted-foreground">
                      {day}
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-2">
                  {Array.from({ length: 35 }, (_, i) => {
                    const date = new Date()
                    date.setDate(date.getDate() - date.getDay() + i)

                    const dayAssignments = assignments.filter(
                      (a) => new Date(a.dueDate).toDateString() === date.toDateString(),
                    )

                    const isToday = date.toDateString() === new Date().toDateString()
                    const isCurrentMonth = date.getMonth() === new Date().getMonth()

                    return (
                      <div
                        key={i}
                        className={cn(
                          "min-h-[100px] p-2 border rounded-lg",
                          isDarkMode ? "border-gray-700" : "border-gray-200",
                          !isCurrentMonth && "opacity-50",
                          isToday && "bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800",
                          dayAssignments.length > 0 && !isToday && "bg-gray-50 dark:bg-gray-800",
                        )}
                      >
                        <div className={cn("text-sm font-medium mb-1", isToday && "text-blue-600 dark:text-blue-400")}>
                          {date.getDate()}
                        </div>
                        <div className="space-y-1">
                          {dayAssignments.slice(0, 3).map((assignment) => (
                            <div
                              key={assignment.id}
                              className={cn(
                                "text-xs p-1 rounded truncate",
                                assignment.priority === "high"
                                  ? "bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200"
                                  : assignment.priority === "medium"
                                    ? "bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200"
                                    : "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200",
                              )}
                              title={assignment.title}
                            >
                              {assignment.title}
                            </div>
                          ))}
                          {dayAssignments.length > 3 && (
                            <div className="text-xs text-muted-foreground">+{dayAssignments.length - 3} more</div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Subjects */}
          <TabsContent value="subjects" className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold">Subjects</h2>
                <p className="text-muted-foreground">Manage your courses and track performance</p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={exportSubjects}>
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
                <Button onClick={() => setIsAddingSubject(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Subject
                </Button>
              </div>
            </div>

            {subjects.length === 0 ? (
              <Card className={isDarkMode ? "bg-gray-900 border-gray-800" : ""}>
                <CardContent className="text-center py-12">
                  <BookOpen className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-semibold mb-2">No subjects added yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Add your first subject to start tracking your academic progress
                  </p>
                  <Button onClick={() => setIsAddingSubject(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Your First Subject
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {subjects.map((subject) => {
                  const subjectAssignments = assignments.filter((a) => a.subject === subject.name)
                  const completedAssignments = subjectAssignments.filter((a) => a.status === "completed")
                  const subjectCompletionRate =
                    subjectAssignments.length > 0
                      ? Math.round((completedAssignments.length / subjectAssignments.length) * 100)
                      : 0

                  return (
                    <Card key={subject.id} className={isDarkMode ? "bg-gray-900 border-gray-800" : ""}>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="w-4 h-4 rounded-full" style={{ backgroundColor: subject.color }} />
                            <CardTitle className="text-lg">{subject.name}</CardTitle>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge variant="outline">{subject.credits} credits</Badge>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => setEditingSubject(subject)}>
                                  <Edit className="h-4 w-4 mr-2" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => deleteSubject(subject.id)} className="text-red-600">
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                        <CardDescription>
                          <div className="flex items-center space-x-2">
                            <User className="h-4 w-4" />
                            <span>{subject.teacher}</span>
                          </div>
                          {subject.room && (
                            <div className="flex items-center space-x-2 mt-1">
                              <span className="text-xs">Room: {subject.room}</span>
                            </div>
                          )}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {subject.currentGrade && (
                            <div>
                              <div className="flex justify-between items-center mb-2">
                                <span className="text-sm font-medium">Current Grade</span>
                                <span className="text-lg font-bold">{subject.currentGrade}%</span>
                              </div>
                              <Progress value={subject.currentGrade} className="h-2" />
                              {subject.targetGrade && (
                                <div className="flex justify-between items-center mt-1 text-xs text-muted-foreground">
                                  <span>Target: {subject.targetGrade}%</span>
                                  <span>
                                    {subject.currentGrade >= subject.targetGrade ? (
                                      <span className="text-green-500">✓ Target reached</span>
                                    ) : (
                                      <span>{(subject.targetGrade - subject.currentGrade).toFixed(1)}% to go</span>
                                    )}
                                  </span>
                                </div>
                              )}
                            </div>
                          )}

                          <Separator />

                          <div className="space-y-2">
                            <div className="flex justify-between items-center">
                              <span className="text-sm font-medium">Assignment Progress</span>
                              <span className="text-sm">
                                {completedAssignments.length}/{subjectAssignments.length}
                              </span>
                            </div>
                            <Progress value={subjectCompletionRate} className="h-2" />
                          </div>

                          {subject.schedule && subject.schedule.length > 0 && (
                            <>
                              <Separator />
                              <div className="space-y-2">
                                <h4 className="font-medium text-sm">Schedule</h4>
                                {subject.schedule.slice(0, 2).map((schedule, index) => (
                                  <div key={index} className="flex justify-between items-center text-sm">
                                    <span>{schedule.day}</span>
                                    <span className="text-muted-foreground">
                                      {schedule.startTime} - {schedule.endTime}
                                    </span>
                                  </div>
                                ))}
                                {subject.schedule.length > 2 && (
                                  <div className="text-xs text-muted-foreground">
                                    +{subject.schedule.length - 2} more
                                  </div>
                                )}
                              </div>
                            </>
                          )}

                          <Separator />

                          <div className="space-y-2">
                            <h4 className="font-medium text-sm">Recent Assignments</h4>
                            {subjectAssignments.length === 0 ? (
                              <p className="text-xs text-muted-foreground">No assignments yet</p>
                            ) : (
                              subjectAssignments.slice(0, 3).map((assignment) => (
                                <div key={assignment.id} className="flex justify-between items-center text-sm">
                                  <span className="truncate flex-1">{assignment.title}</span>
                                  <Badge variant="outline" className={getStatusColor(assignment.status)}>
                                    {assignment.status}
                                  </Badge>
                                </div>
                              ))
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}
          </TabsContent>

          {/* Study Timer */}
          <TabsContent value="timer" className="space-y-6">
            <div className="max-w-4xl mx-auto">
              <Card className={isDarkMode ? "bg-gray-900 border-gray-800" : ""}>
                <CardHeader className="text-center">
                  <CardTitle className="text-2xl">Study Timer</CardTitle>
                  <CardDescription>Focus on your assignments with the Pomodoro technique</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="text-center">
                    <div className="text-8xl font-mono font-bold mb-6">{formatTime(studyTimer)}</div>
                    <div className="flex justify-center space-x-4 mb-6">
                      <Button onClick={isTimerRunning ? pauseTimer : startTimer} size="lg" className="px-8">
                        {isTimerRunning ? (
                          <>
                            <Pause className="h-5 w-5 mr-2" />
                            Pause
                          </>
                        ) : (
                          <>
                            <Play className="h-5 w-5 mr-2" />
                            Start
                          </>
                        )}
                      </Button>
                      <Button onClick={resetTimer} variant="outline" size="lg">
                        <RotateCcw className="h-5 w-5 mr-2" />
                        Reset
                      </Button>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <Label htmlFor="assignment-select">Select Assignment (Optional)</Label>
                    <Select value={selectedAssignmentForTimer} onValueChange={setSelectedAssignmentForTimer}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose an assignment to focus on" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">No specific assignment</SelectItem>
                        {assignments
                          .filter((a) => a.status !== "completed")
                          .map((assignment) => (
                            <SelectItem key={assignment.id} value={assignment.id}>
                              {assignment.title} - {assignment.subject}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Button
                      variant="outline"
                      onClick={() => setStudyTimer(25 * 60)}
                      className="p-6 h-auto flex-col space-y-2"
                    >
                      <Timer className="h-8 w-8" />
                      <span className="font-semibold">25 min</span>
                      <span className="text-xs text-muted-foreground">Focus Session</span>
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setStudyTimer(5 * 60)}
                      className="p-6 h-auto flex-col space-y-2"
                    >
                      <Timer className="h-8 w-8" />
                      <span className="font-semibold">5 min</span>
                      <span className="text-xs text-muted-foreground">Short Break</span>
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setStudyTimer(15 * 60)}
                      className="p-6 h-auto flex-col space-y-2"
                    >
                      <Timer className="h-8 w-8" />
                      <span className="font-semibold">15 min</span>
                      <span className="text-xs text-muted-foreground">Long Break</span>
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setStudyTimer(50 * 60)}
                      className="p-6 h-auto flex-col space-y-2"
                    >
                      <Timer className="h-8 w-8" />
                      <span className="font-semibold">50 min</span>
                      <span className="text-xs text-muted-foreground">Deep Work</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className={isDarkMode ? "bg-gray-900 border-gray-800" : ""}>
                  <CardHeader>
                    <CardTitle>Today's Study Sessions</CardTitle>
                    <CardDescription>Your focus sessions for today</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {todaysSessions.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>No study sessions today</p>
                        <p className="text-sm">Start your first session above!</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {todaysSessions.map((session) => {
                          const assignment = assignments.find((a) => a.id === session.assignmentId)
                          return (
                            <div
                              key={session.id}
                              className="flex justify-between items-center p-3 rounded-lg border border-gray-200 dark:border-gray-700"
                            >
                              <div>
                                <p className="font-medium">{assignment ? assignment.title : "General Study"}</p>
                                {assignment && <p className="text-sm text-muted-foreground">{assignment.subject}</p>}
                              </div>
                              <div className="text-right">
                                <p className="font-medium">{formatDuration(Math.floor(session.duration / 60))}</p>
                                <p className="text-xs text-muted-foreground">
                                  {new Date(session.date).toLocaleTimeString()}
                                </p>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card className={isDarkMode ? "bg-gray-900 border-gray-800" : ""}>
                  <CardHeader>
                    <CardTitle>Study Statistics</CardTitle>
                    <CardDescription>Your study patterns and achievements</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Total Study Time Today</span>
                      <span className="font-bold">{formatDuration(Math.floor(todaysStudyTime / 60))}</span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Sessions Completed</span>
                      <span className="font-bold">{todaysSessions.length}</span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Average Session</span>
                      <span className="font-bold">
                        {todaysSessions.length > 0
                          ? formatDuration(Math.floor(todaysStudyTime / todaysSessions.length / 60))
                          : "0m"}
                      </span>
                    </div>

                    <Separator />

                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Daily Goal Progress</span>
                        <span className="text-sm">4h target</span>
                      </div>
                      <Progress value={Math.min((todaysStudyTime / (4 * 60 * 60)) * 100, 100)} className="h-2" />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Analytics */}
          <TabsContent value="analytics" className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-2">Analytics & Insights</h2>
              <p className="text-muted-foreground">Track your academic progress and study patterns</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className={isDarkMode ? "bg-gray-900 border-gray-800" : ""}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Weekly Study Time</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {formatDuration(
                      Math.floor(studySessions.reduce((total, session) => total + session.duration, 0) / 60),
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">{studySessions.length} total sessions</p>
                </CardContent>
              </Card>

              <Card className={isDarkMode ? "bg-gray-900 border-gray-800" : ""}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Assignments Completed</CardTitle>
                  <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{assignments.filter((a) => a.status === "completed").length}</div>
                  <p className="text-xs text-muted-foreground">{completionRate}% completion rate</p>
                </CardContent>
              </Card>

              <Card className={isDarkMode ? "bg-gray-900 border-gray-800" : ""}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Average Score</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{averageGrade > 0 ? `${averageGrade.toFixed(1)}%` : "N/A"}</div>
                  <p className="text-xs text-muted-foreground">GPA: {gpa > 0 ? gpa.toFixed(2) : "N/A"}</p>
                </CardContent>
              </Card>

              <Card className={isDarkMode ? "bg-gray-900 border-gray-800" : ""}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Study Streak</CardTitle>
                  <Target className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{studySessions.length > 0 ? "7 days" : "0 days"}</div>
                  <p className="text-xs text-muted-foreground">
                    {studySessions.length > 0 ? "Keep it up!" : "Start studying to build a streak"}
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className={isDarkMode ? "bg-gray-900 border-gray-800" : ""}>
                <CardHeader>
                  <CardTitle>Study Time by Subject</CardTitle>
                  <CardDescription>Hours spent studying each subject</CardDescription>
                </CardHeader>
                <CardContent>
                  {subjects.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No subjects to analyze</p>
                      <p className="text-sm">Add subjects to see study time breakdown</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {subjects.map((subject) => {
                        const subjectSessions = studySessions.filter((session) => {
                          const assignment = assignments.find((a) => a.id === session.assignmentId)
                          return assignment?.subject === subject.name
                        })
                        const totalTime = subjectSessions.reduce((total, session) => total + session.duration, 0)
                        const hours = Math.floor(totalTime / 3600)
                        const maxHours = Math.max(
                          ...subjects.map((s) => {
                            const sessions = studySessions.filter((session) => {
                              const assignment = assignments.find((a) => a.id === session.assignmentId)
                              return assignment?.subject === s.name
                            })
                            return Math.floor(sessions.reduce((total, session) => total + session.duration, 0) / 3600)
                          }),
                          1,
                        )

                        return (
                          <div key={subject.id} className="space-y-2">
                            <div className="flex justify-between items-center">
                              <div className="flex items-center space-x-2">
                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: subject.color }} />
                                <span className="font-medium">{subject.name}</span>
                              </div>
                              <span className="text-sm font-medium">{hours}h</span>
                            </div>
                            <Progress value={(hours / maxHours) * 100} className="h-2" />
                          </div>
                        )
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className={isDarkMode ? "bg-gray-900 border-gray-800" : ""}>
                <CardHeader>
                  <CardTitle>Productivity Insights</CardTitle>
                  <CardDescription>Your study patterns and recommendations</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {assignments.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No data to analyze yet</p>
                      <p className="text-sm">Complete some assignments to see insights</p>
                    </div>
                  ) : (
                    <>
                      <div className="p-4 rounded-lg bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800">
                        <div className="flex items-center space-x-2 mb-2">
                          <CheckCircle2 className="h-5 w-5 text-green-600" />
                          <span className="font-medium text-green-800 dark:text-green-200">Great Progress!</span>
                        </div>
                        <p className="text-sm text-green-700 dark:text-green-300">
                          You've completed {completionRate}% of your assignments.
                          {completionRate >= 80 ? " Excellent work!" : " Keep pushing forward!"}
                        </p>
                      </div>

                      {studySessions.length > 0 && (
                        <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800">
                          <div className="flex items-center space-x-2 mb-2">
                            <Clock className="h-5 w-5 text-blue-600" />
                            <span className="font-medium text-blue-800 dark:text-blue-200">Study Pattern</span>
                          </div>
                          <p className="text-sm text-blue-700 dark:text-blue-300">
                            Your average study session is{" "}
                            {formatDuration(
                              Math.floor(
                                studySessions.reduce((total, session) => total + session.duration, 0) /
                                  studySessions.length /
                                  60,
                              ),
                            )}
                            .
                            {studySessions.reduce((total, session) => total + session.duration, 0) /
                              studySessions.length >
                            1500
                              ? " Great focus duration!"
                              : " Consider longer focus sessions for better productivity."}
                          </p>
                        </div>
                      )}

                      {overdue > 0 && (
                        <div className="p-4 rounded-lg bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800">
                          <div className="flex items-center space-x-2 mb-2">
                            <AlertCircle className="h-5 w-5 text-red-600" />
                            <span className="font-medium text-red-800 dark:text-red-200">Attention Needed</span>
                          </div>
                          <p className="text-sm text-red-700 dark:text-red-300">
                            You have {overdue} overdue assignment{overdue > 1 ? "s" : ""}. Consider prioritizing these
                            to stay on track.
                          </p>
                        </div>
                      )}

                      <div className="p-4 rounded-lg bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800">
                        <div className="flex items-center space-x-2 mb-2">
                          <Target className="h-5 w-5 text-yellow-600" />
                          <span className="font-medium text-yellow-800 dark:text-yellow-200">Recommendation</span>
                        </div>
                        <p className="text-sm text-yellow-700 dark:text-yellow-300">
                          {assignments.filter((a) => a.estimatedTime > 120).length > 0
                            ? "Break down large assignments into smaller tasks for better time management."
                            : "Consider setting more specific time estimates for your assignments."}
                        </p>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </main>

      {/* Dialogs */}
      <Dialog open={isAddingAssignment} onOpenChange={() => setIsAddingAssignment(false)}>
        <DialogContent
          className={cn("max-w-4xl max-h-[90vh] overflow-y-auto", isDarkMode ? "bg-gray-900 border-gray-800" : "")}
        >
          <DialogHeader>
            <DialogTitle>Add New Assignment</DialogTitle>
            <DialogDescription>Create a new assignment to track your homework and projects.</DialogDescription>
          </DialogHeader>
          <AssignmentForm
            subjects={subjects}
            onSave={saveAssignment}
            onCancel={() => setIsAddingAssignment(false)}
            isDarkMode={isDarkMode}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={!!editingAssignment} onOpenChange={() => setEditingAssignment(null)}>
        <DialogContent
          className={cn("max-w-4xl max-h-[90vh] overflow-y-auto", isDarkMode ? "bg-gray-900 border-gray-800" : "")}
        >
          <DialogHeader>
            <DialogTitle>Edit Assignment</DialogTitle>
            <DialogDescription>Update your assignment details.</DialogDescription>
          </DialogHeader>
          {editingAssignment && (
            <AssignmentForm
              assignment={editingAssignment}
              subjects={subjects}
              onSave={saveAssignment}
              onCancel={() => setEditingAssignment(null)}
              isDarkMode={isDarkMode}
            />
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={isAddingSubject} onOpenChange={setIsAddingSubject}>
        <DialogContent
          className={cn("max-w-2xl max-h-[90vh] overflow-y-auto", isDarkMode ? "bg-gray-900 border-gray-800" : "")}
        >
          <DialogHeader>
            <DialogTitle>Add New Subject</DialogTitle>
            <DialogDescription>Create a new subject to organize your assignments.</DialogDescription>
          </DialogHeader>
          <SubjectForm onSave={saveSubject} onCancel={() => setIsAddingSubject(false)} isDarkMode={isDarkMode} />
        </DialogContent>
      </Dialog>

      <Dialog open={!!editingSubject} onOpenChange={() => setEditingSubject(null)}>
        <DialogContent
          className={cn("max-w-2xl max-h-[90vh] overflow-y-auto", isDarkMode ? "bg-gray-900 border-gray-800" : "")}
        >
          <DialogHeader>
            <DialogTitle>Edit Subject</DialogTitle>
            <DialogDescription>Update your subject details.</DialogDescription>
          </DialogHeader>
          {editingSubject && (
            <SubjectForm
              subject={editingSubject}
              onSave={saveSubject}
              onCancel={() => setEditingSubject(null)}
              isDarkMode={isDarkMode}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
