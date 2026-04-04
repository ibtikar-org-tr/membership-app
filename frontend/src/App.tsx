import { AppRouter } from './app/router'
import { AppErrorBoundary } from './components/errors/AppErrorBoundary'

function App() {
  return (
    <AppErrorBoundary>
      <AppRouter />
    </AppErrorBoundary>
  )
}

export default App
