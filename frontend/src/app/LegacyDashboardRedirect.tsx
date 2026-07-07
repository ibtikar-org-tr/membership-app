import { Navigate, useLocation } from 'react-router-dom'

export function LegacyDashboardRedirect() {
  const location = useLocation()
  const remainder = location.pathname.replace(/^\/dashboard\/?/, '')
  const target = remainder ? `/${remainder}` : '/'

  return <Navigate to={`${target}${location.search}${location.hash}`} replace />
}
