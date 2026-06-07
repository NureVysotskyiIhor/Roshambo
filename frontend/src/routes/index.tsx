import { createRouter, createRootRoute, createRoute, redirect } from '@tanstack/react-router'
import { RootLayout } from '../components/shared/root-layout.component'
import { LoginPage } from '../pages/login.page'
import { RegisterPage } from '../pages/register.page'
import { RoomsNewPage } from '../pages/rooms-new.page'
import { authStore } from '../store/auth.store'
import { PATHS } from './paths'

const rootRoute = createRootRoute({
  component: RootLayout,
})

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  beforeLoad: () => {
    throw redirect({ to: authStore.getState().user ? PATHS.ROOMS_NEW : PATHS.LOGIN })
  },
})

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: PATHS.LOGIN,
  beforeLoad: () => {
    if (authStore.getState().user) throw redirect({ to: PATHS.ROOMS_NEW })
  },
  component: LoginPage,
})

const registerRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: PATHS.REGISTER,
  beforeLoad: () => {
    if (authStore.getState().user) throw redirect({ to: PATHS.ROOMS_NEW })
  },
  component: RegisterPage,
})

const roomsNewRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: PATHS.ROOMS_NEW,
  beforeLoad: () => {
    if (!authStore.getState().user) throw redirect({ to: PATHS.LOGIN })
  },
  component: RoomsNewPage,
})

const profileRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: PATHS.PROFILE,
  beforeLoad: () => {
    if (!authStore.getState().user) throw redirect({ to: PATHS.LOGIN })
  },
  component: () => null,
})

// Stub — real implementation in TASK_12
const roomRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/rooms/$code',
  beforeLoad: () => {
    if (!authStore.getState().user) throw redirect({ to: PATHS.LOGIN })
  },
  component: () => null,
})

export const routeTree = rootRoute.addChildren([
  indexRoute,
  loginRoute,
  registerRoute,
  roomsNewRoute,
  profileRoute,
  roomRoute,
])

export const router = createRouter({ routeTree })

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
