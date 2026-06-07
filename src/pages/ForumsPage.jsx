import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import Navbar from '../components/Navbar'
import toast from 'react-hot-toast'
import '../styles/forums.css'

const FORUM_COLORS = [
  '#6366f1','#a855f7','#ec4899','#ef4444',
  '#f97316','#eab308','#22c55e','#14b8a6',
  '#3b82f6','#06b6d4','#8b5cf6','#d946ef'
]

function getUniqueColor(usedColors) {
  const available = FORUM_COLORS.filter(c => !usedColors.includes(c))
  if (available.length > 0) return available[Math.floor(Math.random() * available.length)]
  return FORUM_COLORS[Math.floor(Math.random() * FORUM_COLORS.length)]
}

export default function ForumsPage() {
  const { user } = useAuth()
  const [forums, setForums] = useState([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')

  useEffect(() => { fetchForums() }, [])

  async function fetchForums() {
    const { data, error } = await supabase
      .from('forums')
      .select(`*, subforums(id, name)`)
      .order('created_at', { ascending: false })
    if (error) toast.error('Failed to load forums')
    else setForums(data || [])
    setLoading(false)
  }

  async function handleCreate(e) {
    e.preventDefault()
    setCreating(true)
    const usedColors = forums.map(f => f.color)
    const color = getUniqueColor(usedColors)
    const { error } = await supabase
      .from('forums')
      .insert({ name, description, color, created_by: user.id })
    if (error) {
      toast.error(error.message)
    } else {
      toast.success('Forum created!')
      setName('')
      setDescription('')
      setShowForm(false)
      fetchForums()
    }
    setCreating(false)
  }

  if (loading) return (
    <div><Navbar /><div className="loading">Loading forums...</div></div>
  )

  return (
    <div>
      <Navbar />
      <div className="forums-container">
        <div className="forums-header">
          <h1>Forums</h1>
          {user && (
            <button className="create-btn" onClick={() => setShowForm(!showForm)}>
              {showForm ? 'Cancel' : '+ New Forum'}
            </button>
          )}
        </div>

        {showForm && (
          <form onSubmit={handleCreate} className="forum-form">
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Forum name"
              required maxLength={50}
            />
            <input
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Short description (optional)"
              maxLength={200}
            />
            <button type="submit" disabled={creating}>
              {creating ? 'Creating...' : 'Create Forum'}
            </button>
          </form>
        )}

        {forums.length === 0 ? (
          <div className="forums-empty">
            <p>No forums yet.</p>
            {user && <p>Be the first to create one!</p>}
            {!user && <p><Link to="/signup">Sign up</Link> to create the first forum.</p>}
          </div>
        ) : (
          <div className="forums-grid">
            {forums.map(forum => (
              <Link to={`/forums/${forum.id}`} key={forum.id} className="forum-card"
                style={{ borderTopColor: forum.color }}>
                <div className="forum-card-header">
                  <div className="forum-color-dot" style={{ background: forum.color }} />
                  <h2 className="forum-name">{forum.name}</h2>
                </div>
                {forum.description && (
                  <p className="forum-desc">{forum.description}</p>
                )}
                <div className="forum-meta">
                  <span>{forum.subforums?.length || 0} sub-forums</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
