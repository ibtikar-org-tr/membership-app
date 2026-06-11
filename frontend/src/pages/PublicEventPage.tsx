import { Navigate, useParams } from 'react-router-dom'
import { PublicEventShell } from '../components/events/PublicEventShell'
import { getStoredUser } from '../utils/auth'
import { DashboardEventDetailsPage } from './dashboard/DashboardEventDetailsPage'

export function PublicEventPage() {
  const { eventID } = useParams()
  const user = getStoredUser()

  if (user && eventID) {
    return <Navigate to={`/dashboard/event/${eventID}`} replace />
  }

  return (
    <PublicEventShell>
      <DashboardEventDetailsPage />
    </PublicEventShell>
  )
}
