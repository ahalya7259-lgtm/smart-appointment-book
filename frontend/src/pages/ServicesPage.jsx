import { useEffect, useState } from 'react'
import { api } from '../api/client'

export default function ServicesPage() {
  const [services, setServices] = useState([])
  const [name, setName] = useState('')
  const [duration, setDuration] = useState(30)
  const [price, setPrice] = useState(0)
  const [loading, setLoading] = useState(true)

  async function load() {
    setLoading(true)
    try {
      setServices(await api.getServices())
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  async function handleAdd(e) {
    e.preventDefault()
    await api.createService({
      name,
      durationMinutes: Number(duration),
      price: Number(price),
    })
    setName('')
    setDuration(30)
    setPrice(0)
    load()
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Services</h1>

      <form onSubmit={handleAdd} className="bg-white border rounded-xl p-4 flex flex-wrap gap-3 items-end">
        <div>
          <label className="text-xs text-slate-500">Name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="block border rounded-lg px-3 py-2 text-sm mt-1"
            required
          />
        </div>
        <div>
          <label className="text-xs text-slate-500">Duration (min)</label>
          <input
            type="number"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            className="block border rounded-lg px-3 py-2 text-sm mt-1 w-24"
            min={5}
            required
          />
        </div>
        <div>
          <label className="text-xs text-slate-500">Price</label>
          <input
            type="number"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="block border rounded-lg px-3 py-2 text-sm mt-1 w-24"
            min={0}
            step={0.01}
          />
        </div>
        <button type="submit" className="bg-brand-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-brand-700">
          Add service
        </button>
      </form>

      {loading ? (
        <p className="text-slate-500">Loading…</p>
      ) : (
        <div className="bg-white border rounded-xl divide-y">
          {services.map((s) => (
            <div key={s.id} className="p-4 flex justify-between items-center">
              <div>
                <p className="font-medium">{s.name}</p>
                <p className="text-sm text-slate-500">
                  {s.duration_minutes} min · ${Number(s.price).toFixed(2)}
                  {!s.active && ' · inactive'}
                </p>
              </div>
            </div>
          ))}
          {services.length === 0 && (
            <p className="p-6 text-center text-slate-500">No services yet. Add one above.</p>
          )}
        </div>
      )}
    </div>
  )
}
