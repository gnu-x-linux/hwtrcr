"use client"

import { useEffect, useState } from "react"
import type { Assignment } from "@/lib/storage"

export function useNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>("default")

  useEffect(() => {
    if ("Notification" in window) {
      setPermission(Notification.permission)
    }
  }, [])

  const requestPermission = async (): Promise<boolean> => {
    if (!("Notification" in window)) {
      console.log("This browser does not support notifications")
      return false
    }

    const result = await Notification.requestPermission()
    setPermission(result)
    return result === "granted"
  }

  const showNotification = (title: string, options?: NotificationOptions) => {
    if (permission === "granted") {
      new Notification(title, {
        icon: "/favicon.ico",
        badge: "/favicon.ico",
        ...options,
      })
    }
  }

  const scheduleAssignmentReminder = (assignment: Assignment) => {
    if (permission !== "granted") return

    const dueDate = new Date(assignment.dueDate)
    const reminderTime = new Date(dueDate.getTime() - 24 * 60 * 60 * 1000) // 24 hours before
    const now = new Date()

    if (reminderTime > now) {
      const timeoutMs = reminderTime.getTime() - now.getTime()

      setTimeout(() => {
        showNotification(`Assignment Due Tomorrow`, {
          body: `${assignment.title} is due tomorrow in ${assignment.subject}`,
          tag: `assignment-${assignment.id}`,
        })
      }, timeoutMs)
    }
  }

  return {
    permission,
    requestPermission,
    showNotification,
    scheduleAssignmentReminder,
  }
}
