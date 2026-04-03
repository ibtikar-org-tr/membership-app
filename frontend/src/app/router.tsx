import { Navigate, RouterProvider, createBrowserRouter } from 'react-router-dom'

const router = createBrowserRouter(

[
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
    path: '*',
    element: <Navigate to="/" replace />,
  },
], {
  basename: import.meta.env.VITE_BASE_PATH === '/.' ? '/' : import.meta.env.VITE_BASE_PATH || '/mf/membership-app/',
})

export function AppRouter() {
  return <RouterProvider router={router} />
}
