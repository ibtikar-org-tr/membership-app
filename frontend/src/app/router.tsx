import { Navigate, RouterProvider, createBrowserRouter } from 'react-router-dom'
import { HomePage } from '../pages/HomePage'
import { RegistrationPage } from '../features/registration/pages/RegistrationPage'

const router = createBrowserRouter([
  {
    path: '/',
    element: <HomePage />,
  },
  {
    path: '/registration',
    element: <RegistrationPage />,
  },
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
])

export function AppRouter() {
  return <RouterProvider router={router} />
}
