import { redirect } from 'next/navigation'

type LegacyCreditsPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export default async function LegacyCreditsPage({ searchParams }: LegacyCreditsPageProps) {
  const resolvedSearchParams = await searchParams
  const query = new URLSearchParams()

  for (const [key, value] of Object.entries(resolvedSearchParams)) {
    if (Array.isArray(value)) {
      value.forEach((entry) => query.append(key, entry))
    } else if (typeof value === 'string') {
      query.set(key, value)
    }
  }

  redirect(`/settings/credits${query.size ? `?${query.toString()}` : ''}`)
}
