import { useEffect, useState } from 'react'
import { format } from 'date-fns'
import { api } from '../api/client'

const STATUS_COLORS = {
  confirmed: 'bg-blue-100 text-blue-700',
  completed: 'bg-green-100 text-green-700',
  cancelled: 'bg-slate-100 text-slate-500',
  'no-show': 'bg-red-100 text-red-700',
}

export default function DashboardPage() {
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(true)
  const owner = JSON.parse(localStorage.getItem('owner') || '{}')

  async function load() {
    setLoading(true)
    try {
      const data = await api.getAppointments({ date })
      setAppointments(data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [date])

  async function updateStatus(id, status) {
    await api.updateStatus(id, status)
    load()
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-sm text-slate-500">
            Public booking link:{' '}
            <a
              href={`/book/${owner.slug}`}
              target="_blank"
              rel="noreferrer"
              className="text-brand-600 underline"
            >
              /book/{owner.slug}
            </a>
          </p>
        </div>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="border rounded-lg px-3 py-2 text-sm"
        />
      </div>

      {loading ? (
        <p className="text-slate-500">Loading…</p>
      ) : appointments.length === 0 ? (
        <div className="bg-white border rounded-xl p-8 text-center text-slate-500">
          No appointments on this day.
        </div>
      ) : (
        <div className="bg-white border rounded-xl divide-y">
          {appointments.map((a) => (
            <div key={a.id} className="p-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-medium">{a.customer_name}</p>
                <p className="text-sm text-slate-500">
                  {a.service_name} · {format(new Date(a.start_at), 'HH:mm')} –{' '}
                  {format(new Date(a.end_at), 'HH:mm')} · {a.customer_phone}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-xs px-2 py-1 rounded-full ${STATUS_COLORS[a.status] || ''}`}>
                  {a.status}
                </span>
                {a.status === 'confirmed' && (
                  <>
                    <button
                      onClick={() => updateStatus(a.id, 'completed')}
                      className="text-xs px-2 py-1 rounded bg-green-50 text-green-700 hover:bg-green-100"
                    >
                      Complete
                    </button>
                    <button
                      onClick={() => updateStatus(a.id, 'no-show')}
                      className="text-xs px-2 py-1 rounded bg-red-50 text-red-700 hover:bg-red-100"
                    >
                      No-show
                    </button>
                    <button
                      onClick={() => updateStatus(a.id, 'cancelled')}
                      className="text-xs px-2 py-1 rounded bg-slate-50 text-slate-600 hover:bg-slate-100"
                    >
                      Cancel
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
