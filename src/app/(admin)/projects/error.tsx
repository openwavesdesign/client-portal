"use client"

export default function ProjectsError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Projects</h1>
      </div>
      <div className="rounded-md border border-[hsl(var(--destructive))]/30 bg-[hsl(var(--destructive))]/5 p-6 space-y-3">
        <p className="font-medium text-[hsl(var(--destructive))]">Failed to load projects</p>
        <p className="text-sm text-[hsl(var(--muted-foreground))]">{error.message}</p>
        <button
          onClick={reset}
          className="text-sm underline text-[hsl(var(--foreground))] hover:no-underline"
        >
          Try again
        </button>
      </div>
    </div>
  )
}
