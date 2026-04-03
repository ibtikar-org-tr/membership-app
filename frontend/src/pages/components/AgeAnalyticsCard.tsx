import { useEffect, useRef } from 'react'
import {
  CategoryScale,
  Chart,
  Filler,
  LineElement,
  LinearScale,
  PointElement,
  Tooltip,
  type ChartConfiguration,
  type TooltipItem,
} from 'chart.js'

Chart.register(CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip)

export function AgeAnalyticsCard() {
  const ageChartRef = useRef<HTMLCanvasElement | null>(null)
  const ageChartInstanceRef = useRef<Chart<'line'> | null>(null)

  useEffect(() => {
    const canvas = ageChartRef.current
    if (!canvas) {
      return
    }

    const context = canvas.getContext('2d')
    if (!context) {
      return
    }

    if (ageChartInstanceRef.current) {
      ageChartInstanceRef.current.destroy()
    }

    const config: ChartConfiguration<'line'> = {
      type: 'line',
      data: {
        labels: ['15', '20', '23', '30', '35'],
        datasets: [
          {
            label: 'العمر',
            data: [8, 22, 34, 18, 6],
            borderColor: '#0f766e',
            backgroundColor: 'rgba(15, 118, 110, 0.14)',
            pointBackgroundColor: ['#0f766e', '#06b6d4', '#06b6d4', '#f59e0b', '#f59e0b'],
            pointBorderColor: '#ffffff',
            pointBorderWidth: 2,
            pointRadius: 5,
            pointHoverRadius: 6,
            tension: 0.42,
            fill: true,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false,
          },
          tooltip: {
            rtl: true,
            callbacks: {
              label: (tooltipItem: TooltipItem<'line'>) => ` ${tooltipItem.formattedValue}`,
            },
          },
        },
        scales: {
          x: {
            grid: {
              display: false,
            },
            ticks: {
              color: '#64748b',
              font: {
                size: 12,
                weight: 600,
              },
            },
          },
          y: {
            beginAtZero: true,
            grid: {
              color: '#e2e8f0',
            },
            ticks: {
              color: '#64748b',
              font: {
                size: 12,
                weight: 600,
              },
            },
          },
        },
      },
    }

    ageChartInstanceRef.current = new Chart(context, config)

    return () => {
      ageChartInstanceRef.current?.destroy()
      ageChartInstanceRef.current = null
    }
  }, [])

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-lg">
      <p className="text-sm font-semibold text-slate-500">العمر</p>
      <div className="mt-4 h-48 rounded-2xl bg-slate-50 p-4">
        <canvas ref={ageChartRef} aria-label="منحنى توزيع الأعمار" role="img" />
      </div>
    </div>
  )
}