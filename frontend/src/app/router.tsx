import { Navigate, RouterProvider, createBrowserRouter } from 'react-router-dom'
import { RouteErrorBoundary } from '../components/errors/RouteErrorBoundary'

const router = createBrowserRouter([
  {
    path: '/',
    errorElement: <RouteErrorBoundary />,
    hydrateFallbackElement: <div />,
    lazy: async () => {
      const { HomePage } = await import('../pages/HomePage')
      return { Component: HomePage }
    },
  },
  {
    path: '/registration',
    errorElement: <RouteErrorBoundary />,
    hydrateFallbackElement: <div />,
    lazy: async () => {
      const { RegistrationPage } = await import('../pages/RegistrationPage')
      return { Component: RegistrationPage }
    },
  },
  {
    path: '/login',
    errorElement: <RouteErrorBoundary />,
    hydrateFallbackElement: <div />,
    lazy: async () => {
      const { LoginPage } = await import('../pages/LoginPage')
      return { Component: LoginPage }
    },
  },
  {
    path: '/iforgot',
    errorElement: <RouteErrorBoundary />,
    hydrateFallbackElement: <div />,
    lazy: async () => {
      const { IForgotPage } = await import('../pages/IForgotPage')
      return { Component: IForgotPage }
    },
  },
  {
    path: '/dashboard',
    errorElement: <RouteErrorBoundary />,
    hydrateFallbackElement: <div />,
    lazy: async () => {
      const { DashboardPage } = await import('../pages/DashboardPage')
      return { Component: DashboardPage }
    },
    children: [
      {
        index: true,
        hydrateFallbackElement: <div />,
        lazy: async () => {
          const { DashboardMainPage } = await import('../pages/dashboard/DashboardMainPage')
          return { Component: DashboardMainPage }
        },
      },
      {
        path: 'profile',
        hydrateFallbackElement: <div />,
        lazy: async () => {
          const { DashboardProfilePage } = await import('../pages/dashboard/DashboardProfilePage')
          return { Component: DashboardProfilePage }
        },
      },
      {
        path: 'community',
        hydrateFallbackElement: <div />,
        lazy: async () => {
          const { DashboardCommunityPage } = await import('../pages/dashboard/DashboardCommunityPage')
          return { Component: DashboardCommunityPage }
        },
      },
      {
        path: 'projects',
        hydrateFallbackElement: <div />,
        lazy: async () => {
          const { DashboardProjectsPage } = await import('../pages/dashboard/DashboardProjectsPage')
          return { Component: DashboardProjectsPage }
        },
      },
      {
        path: 'projects/:projectID',
        hydrateFallbackElement: <div />,
        lazy: async () => {
          const { DashboardProjectDetailsPage } = await import('../pages/dashboard/DashboardProjectDetailsPage')
          return { Component: DashboardProjectDetailsPage }
        },
      },
      {
        path: 'events',
        hydrateFallbackElement: <div />,
        lazy: async () => {
          const { DashboardEventsPage } = await import('../pages/dashboard/DashboardEventsPage')
          return { Component: DashboardEventsPage }
        },
      },
      {
        path: 'settings',
        hydrateFallbackElement: <div />,
        lazy: async () => {
          const { DashboardSettingsPage } = await import('../pages/dashboard/DashboardSettingsPage')
          return { Component: DashboardSettingsPage }
        },
      },
    ],
  },
  {
    path: '*',
    hydrateFallbackElement: <div />,
    element: <Navigate to="/" replace />,
  },
], {
  basename: import.meta.env.VITE_BASE_PATH === '/.' ? '/' : import.meta.env.VITE_BASE_PATH || '/mf/membership-app/',
})

export function AppRouter() {
  return <RouterProvider router={router} />
}
