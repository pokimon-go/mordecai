import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'
import './Navbar.css'

export default function Navbar() {
  const { user, profile } = useAuth()
  const navigate = useNavigate()

  async function handleLogout() {
    await supabase.auth.signOut()
    toast.success('Logged out')
    navigate('/login')
  }

  return (
    <nav className="navbar">
      <Link to="/" className="nav-logo">Mordecai</Link>
      <div className="nav-links">
        <Link to="/forums" className="nav-link">Forums</Link>
        {user ? (
          <>
            <Link to={`/profile/${user.id}`} className="nav-link">
              {profile?.username || 'Profile'}
            </Link>
            <button onClick={handleLogout} className="nav-btn-logout">
              Logout
            </button>
          </>
        ) : (
          <>
            <Link to="/login" className="nav-btn">Sign In</Link>
          </>
        )}
      </div>
    </nav>
  )
}
