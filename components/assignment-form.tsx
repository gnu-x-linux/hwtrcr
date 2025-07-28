"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { X, Plus, Upload, Calendar, Tag, AlertCircle } from "lucide-react"
import { type Assignment, type Subject, generateId } from "@/lib/storage"
import { cn } from "@/lib/utils"

interface AssignmentFormProps {
  assignment?: Assignment
  subjects: Subject[]
  onSave: (assignment: Assignment) => void
  onCancel: () => void
  isDarkMode: boolean
}

export function AssignmentForm({ assignment, subjects, onSave, onCancel, isDarkMode }: AssignmentFormProps) {
  const [formData, setFormData] = useState<Partial<Assignment>>({
    title: assignment?.title || "",
    subject: assignment?.subject || "",
    dueDate: assignment?.dueDate || "",
    priority: assignment?.priority || "medium",
    status: assignment?.status || "pending",
    description: assignment?.description || "",
    estimatedTime: assignment?.estimatedTime || 60,
    notes: assignment?.notes || "",
    tags: assignment?.tags || [],
    reminderSet: assignment?.reminderSet || false,
    reminderTime: assignment?.reminderTime || "",
    dependencies: assignment?.dependencies || [],
  })

  const [newTag, setNewTag] = useState("")
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.title?.trim()) {
      newErrors.title = "Title is required"
    }

    if (!formData.subject?.trim()) {
      newErrors.subject = "Subject is required"
    }

    if (!formData.dueDate) {
      newErrors.dueDate = "Due date is required"
    } else {
      const dueDate = new Date(formData.dueDate)
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      if (dueDate < today) {
        newErrors.dueDate = "Due date cannot be in the past"
      }
    }

    if (!formData.estimatedTime || formData.estimatedTime < 1) {
      newErrors.estimatedTime = "Estimated time must be at least 1 minute"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    const now = new Date().toISOString()
    const assignmentData: Assignment = {
      id: assignment?.id || generateId(),
      title: formData.title!,
      subject: formData.subject!,
      dueDate: formData.dueDate!,
      priority: formData.priority!,
      status: formData.status!,
      description: formData.description!,
      estimatedTime: formData.estimatedTime!,
      actualTime: assignment?.actualTime,
      grade: assignment?.grade,
      attachments: assignment?.attachments || [],
      tags: formData.tags!,
      notes: formData.notes!,
      reminderSet: formData.reminderSet!,
      reminderTime: formData.reminderTime,
      dependencies: formData.dependencies,
      createdAt: assignment?.createdAt || now,
      updatedAt: now,
      completedAt: assignment?.completedAt,
    }

    onSave(assignmentData)
  }

  const addTag = () => {
    if (newTag.trim() && !formData.tags?.includes(newTag.trim())) {
      setFormData((prev) => ({
        ...prev,
        tags: [...(prev.tags || []), newTag.trim()],
      }))
      setNewTag("")
    }
  }

  const removeTag = (tagToRemove: string) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags?.filter((tag) => tag !== tagToRemove) || [],
    }))
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files) {
      // In a real app, you'd upload these files to a server
      console.log("Files to upload:", files)
    }
  }

  return (
    <div className={cn("space-y-6", isDarkMode ? "text-white" : "text-gray-900")}>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold flex items-center">
            <AlertCircle className="h-5 w-5 mr-2" />
            Basic Information
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Assignment Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                placeholder="Enter assignment title"
                className={errors.title ? "border-red-500" : ""}
              />
              {errors.title && <p className="text-sm text-red-500">{errors.title}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="subject">Subject *</Label>
              <Select
                value={formData.subject}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, subject: value }))}
              >
                <SelectTrigger className={errors.subject ? "border-red-500" : ""}>
                  <SelectValue placeholder="Select subject" />
                </SelectTrigger>
                <SelectContent>
                  {subjects.map((subject) => (
                    <SelectItem key={subject.id} value={subject.name}>
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: subject.color }} />
                        <span>{subject.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.subject && <p className="text-sm text-red-500">{errors.subject}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
              placeholder="Describe the assignment details..."
              rows={3}
            />
          </div>
        </div>

        {/* Scheduling */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold flex items-center">
            <Calendar className="h-5 w-5 mr-2" />
            Scheduling
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="dueDate">Due Date *</Label>
              <Input
                id="dueDate"
                type="datetime-local"
                value={formData.dueDate}
                onChange={(e) => setFormData((prev) => ({ ...prev, dueDate: e.target.value }))}
                className={errors.dueDate ? "border-red-500" : ""}
              />
              {errors.dueDate && <p className="text-sm text-red-500">{errors.dueDate}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Select
                value={formData.priority}
                onValueChange={(value: "low" | "medium" | "high") =>
                  setFormData((prev) => ({ ...prev, priority: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low Priority</SelectItem>
                  <SelectItem value="medium">Medium Priority</SelectItem>
                  <SelectItem value="high">High Priority</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value: "pending" | "in-progress" | "completed") =>
                  setFormData((prev) => ({ ...prev, status: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="in-progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="estimatedTime">Estimated Time (minutes) *</Label>
              <Input
                id="estimatedTime"
                type="number"
                min="1"
                value={formData.estimatedTime}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    estimatedTime: Number.parseInt(e.target.value) || 0,
                  }))
                }
                className={errors.estimatedTime ? "border-red-500" : ""}
              />
              {errors.estimatedTime && <p className="text-sm text-red-500">{errors.estimatedTime}</p>}
            </div>

            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Switch
                  id="reminderSet"
                  checked={formData.reminderSet}
                  onCheckedChange={(checked) =>
                    setFormData((prev) => ({
                      ...prev,
                      reminderSet: checked,
                    }))
                  }
                />
                <Label htmlFor="reminderSet">Set Reminder</Label>
              </div>
              {formData.reminderSet && (
                <Input
                  type="datetime-local"
                  value={formData.reminderTime}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      reminderTime: e.target.value,
                    }))
                  }
                  placeholder="Reminder time"
                />
              )}
            </div>
          </div>
        </div>

        {/* Tags */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold flex items-center">
            <Tag className="h-5 w-5 mr-2" />
            Tags
          </h3>

          <div className="flex flex-wrap gap-2 mb-2">
            {formData.tags?.map((tag) => (
              <Badge key={tag} variant="secondary" className="flex items-center space-x-1">
                <span>{tag}</span>
                <button type="button" onClick={() => removeTag(tag)} className="ml-1 hover:text-red-500">
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>

          <div className="flex space-x-2">
            <Input
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              placeholder="Add a tag"
              onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
            />
            <Button type="button" onClick={addTag} variant="outline">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* File Attachments */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold flex items-center">
            <Upload className="h-5 w-5 mr-2" />
            Attachments
          </h3>

          <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center">
            <input type="file" multiple onChange={handleFileUpload} className="hidden" id="file-upload" />
            <label htmlFor="file-upload" className="cursor-pointer">
              <Upload className="h-8 w-8 mx-auto mb-2 text-gray-400" />
              <p className="text-sm text-gray-500">Click to upload files or drag and drop</p>
            </label>
          </div>
        </div>

        {/* Notes */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Additional Notes</h3>
          <Textarea
            value={formData.notes}
            onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
            placeholder="Add any additional notes or comments..."
            rows={4}
          />
        </div>

        {/* Form Actions */}
        <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200 dark:border-gray-700">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit">{assignment ? "Update Assignment" : "Create Assignment"}</Button>
        </div>
      </form>
    </div>
  )
}
