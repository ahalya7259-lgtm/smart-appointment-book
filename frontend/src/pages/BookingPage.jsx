import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { format, addDays } from 'date-fns'
import { api } from '../api/client'

export default function BookingPage() {
  const { slug } = useParams()
  const [businessName, setBusinessName] = useState('')
  const [services, setServices] = useState([])
  const [step, setStep] = useState(1)
  const [serviceId, setServiceId] = useState('')
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [slots, setSlots] = useState([])
  const [selectedSlot, setSelectedSlot] = useState(null)
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [done, setDone] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.getPublicServices(slug)
      .then((data) => {
        setBusinessName(data.businessName)
        setServices(data.services)
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [slug])

  useEffect(() => {
    if (!serviceId || !date) return
    api.getAvailability(slug, serviceId, date)
      .then((data) => setSlots(data.slots))
      .catch(() => setSlots([]))
  }, [slug, serviceId, date])

  async function handleBook(e) {
    e.preventDefault()
    setError('')
    try {
      const result = await api.book({
        slug,
        serviceId,
        customerName: name,
        customerPhone: phone,
        startAt: selectedSlot.start,
      })
      setDone(result)
      setStep(4)
    } catch (err) {
      setError(err.message)
    }
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-slate-500">Loading…</div>
  }

  if (error && !businessName) {
    return (
      <div className="min-h-screen flex items-center justify-center text-red-600">{error}</div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4">
      <div className="max-w-md mx-auto bg-white rounded-2xl shadow-sm border p-6 space-y-6">
        <div className="text-center">
          <h1 className="text-xl font-bold">{businessName}</h1>
          <p className="text-sm text-slate-500">Book an appointment</p>
        </div>

        {/* Step indicator */}
        <div className="flex justify-center gap-2">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`w-2.5 h-2.5 rounded-full ${step >= s ? 'bg-brand-600' : 'bg-slate-200'}`}
            />
          ))}
        </div>

        {step === 1 && (
          <div className="space-y-3">
            <h2 className="font-medium">Choose a service</h2>
            {services.map((s) => (
              <button
                key={s.id}
                onClick={() => {
                  setServiceId(s.id)
                  setStep(2)
                }}
                className="w-full text-left border rounded-xl p-4 hover:border-brand-500 hover:bg-brand-50 transition"
              >
                <p className="font-medium">{s.name}</p>
                <p className="text-sm text-slate-500">
                  {s.duration_minutes} min · ${Number(s.price).toFixed(2)}
                </p>
              </button>
            ))}
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <button onClick={() => setStep(1)} className="text-sm text-slate-500 hover:underline">
              ← Back
            </button>
            <h2 className="font-medium">Pick date & time</h2>
            <input
              type="date"
              value={date}
              min={format(new Date(), 'yyyy-MM-dd')}
              max={format(addDays(new Date(), 60), 'yyyy-MM-dd')}
              onChange={(e) => {
                setDate(e.target.value)
                setSelectedSlot(null)
              }}
              className="w-full border rounded-lg px-3 py-2 text-sm"
            />
            <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto">
              {slots.length === 0 && (
                <p className="col-span-3 text-sm text-slate-500">No slots available</p>
              )}
              {slots.map((slot) => (
                <button
                  key={slot.start}
                  onClick={() => setSelectedSlot(slot)}
                  className={`py-2 rounded-lg text-sm border ${
                    selectedSlot?.start === slot.start
                      ? 'bg-brand-600 text-white border-brand-600'
                      : 'hover:border-brand-400'
                  }`}
                >
                  {slot.label}
                </button>
              ))}
            </div>
            <button
              disabled={!selectedSlot}
              onClick={() => setStep(3)}
              className="w-full bg-brand-600 text-white py-2 rounded-lg text-sm font-medium disabled:opacity-40"
            >
              Continue
            </button>
          </div>
        )}

        {step === 3 && (
          <form onSubmit={handleBook} className="space-y-4">
            <button type="button" onClick={() => setStep(2)} className="text-sm text-slate-500 hover:underline">
              ← Back
            </button>
            <h2 className="font-medium">Your details</h2>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <div>
              <label className="text-xs text-slate-500">Name</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 w-full border rounded-lg px-3 py-2 text-sm"
                required
              />
            </div>
            <div>
              <label className="text-xs text-slate-500">Phone</label>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="mt-1 w-full border rounded-lg px-3 py-2 text-sm"
                required
              />
            </div>
            <p className="text-sm text-slate-500">
              {selectedSlot && format(new Date(selectedSlot.start), 'EEE, MMM d · HH:mm')}
            </p>
            <button type="submit" className="w-full bg-brand-600 text-white py-2 rounded-lg text-sm font-medium">
              Confirm booking
            </button>
          </form>
        )}

        {step === 4 && done && (
          <div className="text-center space-y-3 py-4">
            <div className="text-4xl">✓</div>
            <h2 className="text-lg font-bold text-brand-700">Booked!</h2>
            <p className="text-sm text-slate-600">
              {done.service}<br />
              {format(new Date(done.startAt), 'EEE, MMM d · HH:mm')}<br />
              {done.customerName}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
