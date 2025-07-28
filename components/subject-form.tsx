"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { X, Plus, BookOpen, Clock, Target } from "lucide-react"
import { type Subject, type ClassSchedule, generateId } from "@/lib/storage"
import { cn } from "@/lib/utils"

interface SubjectFormProps {
  subject?: Subject
  onSave: (subject: Subject) => void
  onCancel: () => void
  isDarkMode: boolean
}

const PRESET_COLORS = [
  "#3b82f6",
  "#ef4444",
  "#10b981",
  "#f59e0b",
  "#8b5cf6",
  "#ec4899",
  "#06b6d4",
  "#84cc16",
  "#f97316",
  "#6366f1",
]

const DAYS_OF_WEEK = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]

export function SubjectForm({ subject, onSave, onCancel, isDarkMode }: SubjectFormProps) {
  const [formData, setFormData] = useState<Partial<Subject>>({
    name: subject?.name || "",
    color: subject?.color || PRESET_COLORS[0],
    teacher: subject?.teacher || "",
    credits: subject?.credits || 3,
    currentGrade: subject?.currentGrade,
    targetGrade: subject?.targetGrade,
    room: subject?.room || "",
    schedule: subject?.schedule || [],
    syllabus: subject?.syllabus || "",
  })

  const [newSchedule, setNewSchedule] = useState<ClassSchedule>({
    day: "Monday",
    startTime: "",
    endTime: "",
    location: "",
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.name?.trim()) {
      newErrors.name = "Subject name is required"
    }

    if (!formData.teacher?.trim()) {
      newErrors.teacher = "Teacher name is required"
    }

    if (!formData.credits || formData.credits < 1 || formData.credits > 6) {
      newErrors.credits = "Credits must be between 1 and 6"
    }

    if (formData.currentGrade && (formData.currentGrade < 0 || formData.currentGrade > 100)) {
      newErrors.currentGrade = "Current grade must be between 0 and 100"
    }

    if (formData.targetGrade && (formData.targetGrade < 0 || formData.targetGrade > 100)) {
      newErrors.targetGrade = "Target grade must be between 0 and 100"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    const subjectData: Subject = {
      id: subject?.id || generateId(),
      name: formData.name!,
      color: formData.color!,
      teacher: formData.teacher!,
      credits: formData.credits!,
      currentGrade: formData.currentGrade,
      targetGrade: formData.targetGrade,
      room: formData.room,
      schedule: formData.schedule || [],
      syllabus: formData.syllabus,
      createdAt: subject?.createdAt || new Date().toISOString(),
    }

    onSave(subjectData)
  }

  const addSchedule = () => {
    if (newSchedule.startTime && newSchedule.endTime) {
      setFormData((prev) => ({
        ...prev,
        schedule: [...(prev.schedule || []), { ...newSchedule }],
      }))
      setNewSchedule({
        day: "Monday",
        startTime: "",
        endTime: "",
        location: "",
      })
    }
  }

  const removeSchedule = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      schedule: prev.schedule?.filter((_, i) => i !== index) || [],
    }))
  }

  return (
    <div className={cn("space-y-6", isDarkMode ? "text-white" : "text-gray-900")}>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold flex items-center">
            <BookOpen className="h-5 w-5 mr-2" />
            Basic Information
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Subject Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Advanced Mathematics"
                className={errors.name ? "border-red-500" : ""}
              />
              {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="teacher">Teacher *</Label>
              <Input
                id="teacher"
                value={formData.teacher}
                onChange={(e) => setFormData((prev) => ({ ...prev, teacher: e.target.value }))}
                placeholder="e.g., Dr. Smith"
                className={errors.teacher ? "border-red-500" : ""}
              />
              {errors.teacher && <p className="text-sm text-red-500">{errors.teacher}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="credits">Credits *</Label>
              <Input
                id="credits"
                type="number"
                min="1"
                max="6"
                value={formData.credits}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    credits: Number.parseInt(e.target.value) || 0,
                  }))
                }
                className={errors.credits ? "border-red-500" : ""}
              />
              {errors.credits && <p className="text-sm text-red-500">{errors.credits}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="room">Room/Location</Label>
              <Input
                id="room"
                value={formData.room}
                onChange={(e) => setFormData((prev) => ({ ...prev, room: e.target.value }))}
                placeholder="e.g., Room 101"
              />
            </div>

            <div className="space-y-2">
              <Label>Color</Label>
              <div className="flex flex-wrap gap-2">
                {PRESET_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    className={cn(
                      "w-8 h-8 rounded-full border-2 transition-all",
                      formData.color === color
                        ? "border-gray-900 dark:border-white scale-110"
                        : "border-gray-300 dark:border-gray-600",
                    )}
                    style={{ backgroundColor: color }}
                    onClick={() => setFormData((prev) => ({ ...prev, color }))}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Grades */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold flex items-center">
            <Target className="h-5 w-5 mr-2" />
            Grade Tracking
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="currentGrade">Current Grade (%)</Label>
              <Input
                id="currentGrade"
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={formData.currentGrade || ""}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    currentGrade: e.target.value ? Number.parseFloat(e.target.value) : undefined,
                  }))
                }
                placeholder="e.g., 87.5"
                className={errors.currentGrade ? "border-red-500" : ""}
              />
              {errors.currentGrade && <p className="text-sm text-red-500">{errors.currentGrade}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="targetGrade">Target Grade (%)</Label>
              <Input
                id="targetGrade"
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={formData.targetGrade || ""}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    targetGrade: e.target.value ? Number.parseFloat(e.target.value) : undefined,
                  }))
                }
                placeholder="e.g., 90.0"
                className={errors.targetGrade ? "border-red-500" : ""}
              />
              {errors.targetGrade && <p className="text-sm text-red-500">{errors.targetGrade}</p>}
            </div>
          </div>
        </div>

        {/* Schedule */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold flex items-center">
            <Clock className="h-5 w-5 mr-2" />
            Class Schedule
          </h3>

          {/* Existing Schedule */}
          {formData.schedule && formData.schedule.length > 0 && (
            <div className="space-y-2">
              <Label>Current Schedule</Label>
              <div className="space-y-2">
                {formData.schedule.map((schedule, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 border rounded-lg border-gray-200 dark:border-gray-700"
                  >
                    <div className="flex items-center space-x-4">
                      <Badge variant="outline">{schedule.day}</Badge>
                      <span className="text-sm">
                        {schedule.startTime} - {schedule.endTime}
                      </span>
                      {schedule.location && <span className="text-sm text-gray-500">@ {schedule.location}</span>}
                    </div>
                    <Button type="button" variant="ghost" size="sm" onClick={() => removeSchedule(index)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Add New Schedule */}
          <div className="space-y-2">
            <Label>Add Class Time</Label>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
              <Select
                value={newSchedule.day}
                onValueChange={(value) => setNewSchedule((prev) => ({ ...prev, day: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DAYS_OF_WEEK.map((day) => (
                    <SelectItem key={day} value={day}>
                      {day}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Input
                type="time"
                value={newSchedule.startTime}
                onChange={(e) => setNewSchedule((prev) => ({ ...prev, startTime: e.target.value }))}
                placeholder="Start time"
              />

              <Input
                type="time"
                value={newSchedule.endTime}
                onChange={(e) => setNewSchedule((prev) => ({ ...prev, endTime: e.target.value }))}
                placeholder="End time"
              />

              <Input
                value={newSchedule.location}
                onChange={(e) => setNewSchedule((prev) => ({ ...prev, location: e.target.value }))}
                placeholder="Location (optional)"
              />

              <Button type="button" onClick={addSchedule} variant="outline">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Syllabus */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Syllabus & Notes</h3>
          <Textarea
            value={formData.syllabus}
            onChange={(e) => setFormData((prev) => ({ ...prev, syllabus: e.target.value }))}
            placeholder="Add syllabus details, course description, or any additional notes..."
            rows={4}
          />
        </div>

        {/* Form Actions */}
        <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200 dark:border-gray-700">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit">{subject ? "Update Subject" : "Create Subject"}</Button>
        </div>
      </form>
    </div>
  )
}
