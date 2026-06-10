import { PublicEventShell } from '../components/events/PublicEventShell'
import { DashboardEventDetailsPage } from './dashboard/DashboardEventDetailsPage'

export function PublicEventPage() {
  return (
    <PublicEventShell>
      <DashboardEventDetailsPage />
    </PublicEventShell>
  )
}
