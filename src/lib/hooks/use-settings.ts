"use client"

import { useState, useEffect, useCallback } from "react"

const STORAGE_KEY = "client-portal-settings"

export interface PortalSettings {
  clientList: {
    filterActive: boolean
    columns: {
      status: boolean
      started: boolean
      rate: boolean
      projects: boolean
      ytdHours: boolean
      ytdRevenue: boolean
      outstanding: boolean
    }
  }
  display: {
    theme: "light" | "dark"
  }
}

export const DEFAULT_SETTINGS: PortalSettings = {
  clientList: {
    filterActive: true,
    columns: {
      status: false,
      started: false,
      rate: false,
      projects: false,
      ytdHours: true,
      ytdRevenue: true,
      outstanding: true,
    },
  },
  display: {
    theme: "light",
  },
}

function loadSettings(): PortalSettings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULT_SETTINGS
    const parsed = JSON.parse(raw)
    return {
      clientList: {
        filterActive: parsed.clientList?.filterActive ?? DEFAULT_SETTINGS.clientList.filterActive,
        columns: {
          ...DEFAULT_SETTINGS.clientList.columns,
          ...parsed.clientList?.columns,
        },
      },
      display: {
        theme: parsed.display?.theme ?? DEFAULT_SETTINGS.display.theme,
      },
    }
  } catch {
    return DEFAULT_SETTINGS
  }
}

export function useSettings() {
  const [settings, setSettingsState] = useState<PortalSettings>(DEFAULT_SETTINGS)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setSettingsState(loadSettings())
    setMounted(true)
  }, [])

  const updateSettings = useCallback(
    (updater: (prev: PortalSettings) => PortalSettings) => {
      setSettingsState((prev) => {
        const next = updater(prev)
        if (typeof window !== "undefined") {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
        }
        return next
      })
    },
    []
  )

  return { settings, updateSettings, mounted }
}
