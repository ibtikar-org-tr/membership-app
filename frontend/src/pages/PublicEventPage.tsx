import { Navigate, useParams } from 'react-router-dom'
import { PublicEventShell } from '../components/events/PublicEventShell'
import { paths } from '../routes/paths'
import { getStoredUser } from '../utils/auth'
import { DashboardEventDetailsPage } from './dashboard/DashboardEventDetailsPage'

export function PublicEventPage() {
  const { eventID } = useParams()
  const user = getStoredUser()

  if (user && eventID) {
    return <Navigate to={paths.event(eventID)} replace />
  }

  return (
    <PublicEventShell>
      <DashboardEventDetailsPage />
    </PublicEventShell>
  )
}
