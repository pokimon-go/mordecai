import { useAuth } from '../context/AuthContext'
import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import '../styles/home.css'

export default function HomePage() {
  const { user, loading } = useAuth()

  if (loading) return <div className="loading">Loading...</div>

  if (!user) return (
    <div className="landing">
      <div className="landing-content">
        <h1 className="landing-title">Welcome to <span>Mordecai</span></h1>
        <p className="landing-subtitle">
          A community built on real conversations. Join forums, share ideas,
          and connect with people who care about the same things you do.
        </p>
        <div className="landing-actions">
          <Link to="/signup" className="landing-btn-primary">Get Started</Link>
          <Link to="/login" className="landing-btn-secondary">Sign In</Link>
        </div>
      </div>
    </div>
  )

  return (
    <div>
      <Navbar />
      <div className="home-container">
        <div className="home-feed">
          <h2 className="feed-title">Community Feed</h2>
          <p className="feed-empty">
            No posts yet. <Link to="/forums">Browse forums</Link> to get started.
          </p>
        </div>
        <div className="home-sidebar">
          <div className="sidebar-card">
            <h3>Quick Links</h3>
            <Link to="/forums" className="sidebar-link">📋 All Forums</Link>
            <Link to={`/profile/${user.id}`} className="sidebar-link">👤 My Profile</Link>
          </div>
        </div>
      </div>
    </div>
  )
}
