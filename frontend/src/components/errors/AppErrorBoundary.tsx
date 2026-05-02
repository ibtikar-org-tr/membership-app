import { Component, type ErrorInfo, type ReactNode } from 'react'

type AppErrorBoundaryProps = {
  children: ReactNode
}

type AppErrorBoundaryState = {
  hasError: boolean
  message: string
}

export class AppErrorBoundary extends Component<AppErrorBoundaryProps, AppErrorBoundaryState> {
  state: AppErrorBoundaryState = {
    hasError: false,
    message: '',
  }

  static getDerivedStateFromError(error: Error): AppErrorBoundaryState {
    return {
      hasError: true,
      message: error.message || 'حدث خطأ غير متوقع.',
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('AppErrorBoundary caught an error:', error, errorInfo)
  }

  private resetBoundary = () => {
    this.setState({ hasError: false, message: '' })
    window.location.reload()
  }

  render() {
    if (!this.state.hasError) {
      return this.props.children
    }

    return (
      <div className="min-h-screen bg-slate-100 px-6 py-10">
        <div className="mx-auto flex min-h-[70vh] max-w-2xl items-center justify-center">
          <div className="w-full rounded-3xl border border-slate-200 bg-white p-6 text-right shadow-xl md:p-8">
            <h1 className="text-2xl font-bold text-slate-900 md:text-3xl">حدث خطأ غير متوقع</h1>
            <p className="mt-3 text-sm leading-7 text-slate-600 md:text-base">
              واجه التطبيق مشكلة أثناء العرض. يمكنك إعادة تحميل الصفحة والمحاولة مرة أخرى.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={this.resetBoundary}
                className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700"
              >
                إعادة تحميل الصفحة
              </button>
              <a
                href="/"
                className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
              >
                العودة إلى الرئيسية
              </a>
            </div>
            {import.meta.env.DEV && (
              <pre className="mt-6 overflow-auto rounded-xl bg-slate-900 p-3 text-left text-xs leading-5 text-slate-100">
                {this.state.message}
              </pre>
            )}
          </div>
        </div>
      </div>
    )
  }
}
