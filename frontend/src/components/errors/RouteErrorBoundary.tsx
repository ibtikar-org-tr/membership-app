import { isRouteErrorResponse, useRouteError } from 'react-router-dom'

function getErrorDetails(error: unknown): { title: string; message: string; status?: number } {
  if (isRouteErrorResponse(error)) {
    return {
      title: error.status === 404 ? 'الصفحة غير موجودة' : 'حدث خطأ أثناء تحميل الصفحة',
      message:
        typeof error.data === 'string'
          ? error.data
          : error.statusText || 'تعذر عرض هذه الصفحة حالياً. يرجى المحاولة مرة أخرى.',
      status: error.status,
    }
  }

  if (error instanceof Error) {
    return {
      title: 'حدث خطأ غير متوقع',
      message: error.message || 'تعذر عرض هذه الصفحة حالياً. يرجى المحاولة مرة أخرى.',
    }
  }

  return {
    title: 'حدث خطأ غير متوقع',
    message: 'تعذر عرض هذه الصفحة حالياً. يرجى المحاولة مرة أخرى.',
  }
}

export function RouteErrorBoundary() {
  const routeError = useRouteError()
  const details = getErrorDetails(routeError)

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 px-6 py-10">
      <div className="mx-auto flex min-h-[70vh] max-w-2xl items-center justify-center">
        <div className="w-full rounded-3xl border border-slate-200 bg-white p-6 text-right shadow-xl md:p-8">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">membership app</p>
          <h1 className="text-2xl font-bold text-slate-900 md:text-3xl">{details.title}</h1>
          <p className="mt-3 text-sm leading-7 text-slate-600 md:text-base">{details.message}</p>

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => window.location.reload()}
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

          {import.meta.env.DEV && routeError instanceof Error && (
            <pre className="mt-6 overflow-auto rounded-xl bg-slate-900 p-3 text-left text-xs leading-5 text-slate-100">
              {routeError.stack ?? routeError.message}
            </pre>
          )}

          {typeof details.status === 'number' && (
            <p className="mt-4 text-xs text-slate-500">Error code: {details.status}</p>
          )}
        </div>
      </div>
    </div>
  )
}
