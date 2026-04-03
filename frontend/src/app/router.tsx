import { Navigate, RouterProvider, createBrowserRouter } from 'react-router-dom'

const router = createBrowserRouter([
  {
    path: '/',
    lazy: async () => {
      const { HomePage } = await import('../pages/HomePage')
      return { Component: HomePage }
    },
  },
  {
    path: '/registration',
    lazy: async () => {
      const { RegistrationPage } = await import('../features/registration/pages/RegistrationPage')
      return { Component: RegistrationPage }
    },
  },
  {
    path: '/login',
    lazy: async () => {
      const { LoginPage } = await import('../pages/LoginPage')
      return { Component: LoginPage }
    },
  },
  {
    path: '/iforgot',
    lazy: async () => {
      const { IForgotPage } = await import('../pages/IForgotPage')
      return { Component: IForgotPage }
    },
  },
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
], {
  basename: import.meta.env.VITE_BASE_PATH === '/.' ? '/' : import.meta.env.VITE_BASE_PATH || '/mf/membership-app/',
})

export function AppRouter() {
  return <RouterProvider router={router} />
}
