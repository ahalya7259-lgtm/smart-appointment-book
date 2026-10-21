import { Outlet, Link, useNavigate } from 'react-router-dom'
import { Calendar, Scissors, LogOut } from 'lucide-react'

export default function Layout() {
  const navigate = useNavigate()
  const owner = JSON.parse(localStorage.getItem('owner') || '{}')

  function logout() {
    localStorage.removeItem('token')
    localStorage.removeItem('owner')
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <span className="font-bold text-brand-700">Smart Appointment Book</span>
            <nav className="flex gap-4 text-sm">
              <Link to="/" className="flex items-center gap-1 text-slate-600 hover:text-brand-600">
                <Calendar className="w-4 h-4" /> Dashboard
              </Link>
              <Link to="/services" className="flex items-center gap-1 text-slate-600 hover:text-brand-600">
                <Scissors className="w-4 h-4" /> Services
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <span className="text-slate-500">{owner.businessName || owner.name}</span>
            <button onClick={logout} className="flex items-center gap-1 text-slate-500 hover:text-red-600">
              <LogOut className="w-4 h-4" /> Logout
            </button>
          </div>
        </div>
      </header>
      <main className="max-w-5xl mx-auto px-4 py-6">
        <Outlet />
      </main>
    </div>
  )
}
