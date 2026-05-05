import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Navbar() {
  const { logout } = useAuth()
  const navigate = useNavigate()
  const email = localStorage.getItem('user_email') || 'user@example.com'

  function handleLogout() {
    logout()
    navigate('/login')
  }

  return (
    <nav className="bg-[#1E293B] border-b border-[#334155] px-6 py-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
          <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <span className="text-white font-semibold text-lg">DocuMind</span>
      </div>
      <div className="flex items-center gap-4">
        <span className="text-slate-400 text-sm">{email}</span>
        <button
          onClick={handleLogout}
          className="text-slate-400 hover:text-white text-sm transition-colors"
        >
          Logout
        </button>
      </div>
    </nav>
  )
}
