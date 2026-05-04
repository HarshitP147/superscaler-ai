export function AppSettingsPanel() {
  return (
    <div className="flex flex-col gap-8">
      <div className="space-y-2">
        <h2 className="text-3xl font-semibold tracking-tight">App</h2>
        <p className="max-w-2xl text-sm text-base-content/60">
          This view will hold platform-level app settings once we define them.
        </p>
      </div>

      <div className="space-y-3 border-t border-base-300 pt-6">
        <h3 className="text-sm font-medium text-base-content/80">Overview</h3>
        <p className="max-w-2xl text-sm leading-6 text-base-content/55">
          App settings are not defined yet. This default tab is ready for the upcoming settings you want
          to add here.
        </p>
      </div>
    </div>
  )
}
