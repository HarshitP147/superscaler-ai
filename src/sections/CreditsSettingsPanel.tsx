'use client'

export function CreditsSettingsPanel() {
  return (
    <div className="flex flex-col gap-8">
      <div className="space-y-2">
        <h2 className="text-3xl font-semibold tracking-tight">Credits</h2>
        <p className="text-muted-foreground">
          Manage your credits and purchase history.
        </p>
      </div>

      <div className="card bg-base-200 border border-base-300">
        <div className="card-body">
          <p className="text-base-content/70">Credits integration coming soon.</p>
        </div>
      </div>
    </div>
  )
}
