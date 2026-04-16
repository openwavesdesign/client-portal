"use client"

import { useSettings } from "@/lib/hooks/use-settings"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"

function SettingRow({
  id,
  label,
  description,
  checked,
  onCheckedChange,
}: {
  id: string
  label: string
  description?: string
  checked: boolean
  onCheckedChange: (v: boolean) => void
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <div className="space-y-0.5">
        <Label htmlFor={id} className="text-sm font-medium cursor-pointer">
          {label}
        </Label>
        {description && (
          <p className="text-xs text-[hsl(var(--muted-foreground))]">{description}</p>
        )}
      </div>
      <Switch id={id} checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  )
}

export default function SettingsPage() {
  const { settings, updateSettings, mounted } = useSettings()

  if (!mounted) {
    return (
      <div className="space-y-6 max-w-xl">
        <div>
          <h1 className="text-2xl font-semibold">Settings</h1>
          <p className="text-sm text-[hsl(var(--muted-foreground))] mt-1">
            Customize how the portal looks and behaves
          </p>
        </div>
      </div>
    )
  }

  function setCol(key: keyof typeof settings.clientList.columns, value: boolean) {
    updateSettings((prev) => ({
      ...prev,
      clientList: {
        ...prev.clientList,
        columns: { ...prev.clientList.columns, [key]: value },
      },
    }))
  }

  function setFilterActive(value: boolean) {
    updateSettings((prev) => ({
      ...prev,
      clientList: { ...prev.clientList, filterActive: value },
    }))
  }

  function setTheme(dark: boolean) {
    const theme = dark ? "dark" : "light"
    updateSettings((prev) => ({ ...prev, display: { theme } }))
    if (dark) {
      document.documentElement.classList.add("dark")
    } else {
      document.documentElement.classList.remove("dark")
    }
  }

  return (
    <div className="space-y-8 max-w-xl">
      <div>
        <h1 className="text-2xl font-semibold">Settings</h1>
        <p className="text-sm text-[hsl(var(--muted-foreground))] mt-1">
          Customize how the portal looks and behaves
        </p>
      </div>

      {/* Client List section */}
      <section className="space-y-1">
        <h2 className="text-base font-semibold">Client List</h2>
        <p className="text-sm text-[hsl(var(--muted-foreground))]">
          Control which data is shown on the dashboard client table.
        </p>
        <div className="mt-3 rounded-lg border border-[hsl(var(--border))] px-4 divide-y divide-[hsl(var(--border))]">
          <SettingRow
            id="filter-active"
            label="Show active clients only"
            description="When on, the dashboard hides inactive/archived clients."
            checked={settings.clientList.filterActive}
            onCheckedChange={setFilterActive}
          />

          <Separator className="hidden" />

          <SettingRow
            id="col-status"
            label="Status column"
            description='Shows the "active" or "inactive" badge.'
            checked={settings.clientList.columns.status}
            onCheckedChange={(v) => setCol("status", v)}
          />
          <SettingRow
            id="col-started"
            label="Started column"
            description="Shows the client start date."
            checked={settings.clientList.columns.started}
            onCheckedChange={(v) => setCol("started", v)}
          />
          <SettingRow
            id="col-rate"
            label="Rate column"
            description="Shows the hourly rate or project-based badge."
            checked={settings.clientList.columns.rate}
            onCheckedChange={(v) => setCol("rate", v)}
          />
          <SettingRow
            id="col-projects"
            label="Projects column"
            description="Shows the total project count."
            checked={settings.clientList.columns.projects}
            onCheckedChange={(v) => setCol("projects", v)}
          />
          <SettingRow
            id="col-ytd-hours"
            label="YTD Hours column"
            description="Shows year-to-date billable hours."
            checked={settings.clientList.columns.ytdHours}
            onCheckedChange={(v) => setCol("ytdHours", v)}
          />
          <SettingRow
            id="col-ytd-revenue"
            label="YTD Revenue column"
            description="Shows year-to-date revenue."
            checked={settings.clientList.columns.ytdRevenue}
            onCheckedChange={(v) => setCol("ytdRevenue", v)}
          />
          <SettingRow
            id="col-outstanding"
            label="Outstanding column"
            description="Shows unpaid balance."
            checked={settings.clientList.columns.outstanding}
            onCheckedChange={(v) => setCol("outstanding", v)}
          />
        </div>
      </section>

      {/* Display section */}
      <section className="space-y-1">
        <h2 className="text-base font-semibold">Display</h2>
        <p className="text-sm text-[hsl(var(--muted-foreground))]">
          Appearance preferences.
        </p>
        <div className="mt-3 rounded-lg border border-[hsl(var(--border))] px-4">
          <SettingRow
            id="dark-mode"
            label="Dark mode"
            description="Switch between light and dark theme."
            checked={settings.display.theme === "dark"}
            onCheckedChange={setTheme}
          />
        </div>
      </section>
    </div>
  )
}
