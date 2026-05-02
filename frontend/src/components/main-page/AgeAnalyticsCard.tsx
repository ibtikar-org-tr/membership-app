import { useEffect, useMemo, useRef } from 'react'
import {
  CategoryScale,
  Chart,
  Filler,
  LineController,
  LineElement,
  LinearScale,
  PointElement,
  Tooltip,
  type ChartConfiguration,
  type TooltipItem,
} from 'chart.js'
import type { HomeStatsAgeDistributionItem } from '../../types/home-stats'

Chart.register(CategoryScale, LinearScale, PointElement, LineController, LineElement, Filler, Tooltip)

interface AgeAnalyticsCardProps {
  ageDistribution?: HomeStatsAgeDistributionItem[]
}

export function AgeAnalyticsCard({ ageDistribution }: AgeAnalyticsCardProps) {
  const ageChartRef = useRef<HTMLCanvasElement | null>(null)
  const ageChartInstanceRef = useRef<Chart<'line'> | null>(null)
  const chartData = useMemo(() => {
    const grouped = [...(ageDistribution ?? [])].filter(
      (item) => typeof item.group === 'string' && item.group.trim().length > 0 && Number.isFinite(item.count),
    )

    if (grouped.length === 0) {
      return {
        labels: ['15-18'],
        values: [0],
      }
    }

    return {
      labels: grouped.map((item) => item.group),
      values: grouped.map((item) => item.count),
    }
  }, [ageDistribution])

  useEffect(() => {
    const canvas = ageChartRef.current
    if (!canvas) {
      return
    }

    const context = canvas.getContext('2d')
    if (!context) {
      return
    }

    const existingChart = Chart.getChart(canvas)
    if (existingChart) {
      existingChart.destroy()
    }

    const config: ChartConfiguration<'line'> = {
      type: 'line',
      data: {
        labels: chartData.labels,
        datasets: [
          {
            label: 'عدد الأعضاء',
            data: chartData.values,
            borderColor: '#0f766e',
            backgroundColor: 'rgba(15, 118, 110, 0.14)',
            pointBackgroundColor: chartData.values.map((_, index) => {
              if (index === 0) {
                return '#0f766e'
              }

              return index % 2 === 0 ? '#06b6d4' : '#f59e0b'
            }),
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
              label: (tooltipItem: TooltipItem<'line'>) => ` ${tooltipItem.formattedValue} عضو`,
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
      const chart = ageChartInstanceRef.current ?? Chart.getChart(canvas)
      chart?.destroy()
      ageChartInstanceRef.current = null
    }
  }, [chartData.labels, chartData.values])

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-lg sm:p-5">
      <p className="text-xs font-semibold text-slate-500 sm:text-sm">توزيع الأعضاء حسب العمر</p>
      <div className="mt-3 h-36 rounded-2xl bg-slate-50 p-2.5 sm:mt-4 sm:h-48 sm:p-4">
        <canvas ref={ageChartRef} aria-label="منحنى توزيع الأعمار" role="img" />
      </div>
    </div>
  )
}