import { useMemo } from 'react'
import { Navigate, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { LoginPanel } from '../components/auth/LoginPanel'
import { Seo } from '../components/Seo'
import { getSafeRedirectPath, getStoredUser } from '../utils/auth'

export function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()

  const redirectTo = useMemo(() => {
    const fromQuery = searchParams.get('redirect')
    const fromState = (location.state as { from?: string } | null)?.from
    return getSafeRedirectPath(fromQuery ?? fromState) ?? '/dashboard'
  }, [location.state, searchParams])

  const user = getStoredUser()
  if (user) {
    return <Navigate to={redirectTo} replace />
  }

  return (
    <>
      <Seo
        title="تسجيل الدخول"
        description="سجّل الدخول إلى حسابك في منصة أعضاء إبتكار للوصول إلى لوحة التحكم والملف الشخصي والمشاريع والفعاليات."
        noIndex
      />
      <LoginPanel
        onSuccess={() => {
          navigate(redirectTo, { replace: true })
        }}
      />
    </>
  )
}
