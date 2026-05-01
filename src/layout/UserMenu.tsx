'use client'

type UserMenuProps = {
  avatarUrl: string | null
  initial: string
  displayName: string
}

export function UserMenu({ avatarUrl, initial, displayName }: UserMenuProps) {
  return (
    <div className="dropdown dropdown-end">
      <button
        type="button"
        tabIndex={0}
        aria-label={`Account menu for ${displayName}`}
        className="btn btn-ghost btn-circle avatar p-0 overflow-hidden"
      >
        {avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={avatarUrl}
            alt={displayName}
            referrerPolicy="no-referrer"
            className="w-10 h-10 rounded-full object-cover"
          />
        ) : (
          <span className="w-10 h-10 rounded-full bg-primary text-primary-content flex items-center justify-center font-semibold">
            {initial}
          </span>
        )}
      </button>
      <div
        tabIndex={0}
        className="dropdown-content menu bg-base-200 border border-base-300 rounded-box z-10 w-64 p-3 shadow-lg mt-2"
      >
        <form action="/auth/signout" method="post" className="contents">
          <button
            type="submit"
            className="btn btn-block btn-sm justify-center bg-transparent border-error text-error hover:bg-error hover:text-error-content transition-colors duration-200"
          >
            Logout
          </button>
        </form>
      </div>
    </div>
  )
}
