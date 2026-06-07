import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import Navbar from '../components/Navbar'
import toast from 'react-hot-toast'
import '../styles/forumdetail.css'

export default function ForumDetailPage() {
  const { forumId } = useParams()
  const { user } = useAuth()
  const [forum, setForum] = useState(null)
  const [subforums, setSubforums] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [creating, setCreating] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')

  useEffect(() => { fetchForum() }, [forumId])

  async function fetchForum() {
    const { data: forumData, error: forumError } = await supabase
      .from('forums')
      .select('*')
      .eq('id', forumId)
      .single()

    if (forumError) { toast.error('Forum not found'); setLoading(false); return }
    setForum(forumData)

    const { data: subData } = await supabase
      .from('subforums')
      .select('*')
      .eq('forum_id', forumId)
      .order('created_at', { ascending: true })

    setSubforums(subData || [])
    setLoading(false)
  }

  async function handleCreateSubforum(e) {
    e.preventDefault()
    setCreating(true)
    const { error } = await supabase
      .from('subforums')
      .insert({ name, description, forum_id: forumId, created_by: user.id })
    if (error) {
      toast.error(error.message)
    } else {
      toast.success('Sub-forum created!')
      setName('')
      setDescription('')
      setShowForm(false)
      fetchForum()
    }
    setCreating(false)
  }

  if (loading) return <div><Navbar /><div className="loading">Loading...</div></div>
  if (!forum) return <div><Navbar /><div className="loading">Forum not found</div></div>

  return (
    <div>
      <Navbar />
      <div className="forumdetail-container">

        <div className="forum-breadcrumb">
          <Link to="/forums">Forums</Link>
          <span>/</span>
          <span>{forum.name}</span>
        </div>

        <div className="forum-banner" style={{ borderLeftColor: forum.color }}>
          <div className="forum-banner-dot" style={{ background: forum.color }} />
          <div>
            <h1 className="forum-banner-name">{forum.name}</h1>
            {forum.description && (
              <p className="forum-banner-desc">{forum.description}</p>
            )}
          </div>
        </div>

        <div className="catalog-section">
          <div className="catalog-header">
            <h2>
              <span className="catalog-tree-icon">📋</span>
              Forum Catalog
            </h2>
            {user && (
              <button className="create-btn" onClick={() => setShowForm(!showForm)}>
                {showForm ? 'Cancel' : '+ New Sub-forum'}
              </button>
            )}
          </div>

          {showForm && (
            <form onSubmit={handleCreateSubforum} className="subforum-form">
              <input
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Sub-forum name"
                required maxLength={50}
              />
              <input
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Description (optional)"
                maxLength={200}
              />
              <button type="submit" disabled={creating}>
                {creating ? 'Creating...' : 'Create Sub-forum'}
              </button>
            </form>
          )}

          <div className="catalog-tree">
            <div className="catalog-root">
              <div className="catalog-root-dot" style={{ background: forum.color }} />
              <span className="catalog-root-name">{forum.name}</span>
              <span className="catalog-root-badge">
                {subforums.length} sub-forums
              </span>
            </div>

            {subforums.length === 0 ? (
              <div className="catalog-empty">
                No sub-forums yet.
                {user && ' Create one to get started!'}
              </div>
            ) : (
              <div className="catalog-branches">
                {subforums.map((sub, index) => (
                  <Link
                    to={`/forums/${forumId}/${sub.id}`}
                    key={sub.id}
                    className="catalog-branch"
                  >
                    <div className="branch-connector">
                      <div className="branch-line" style={{
                        borderColor: forum.color,
                        opacity: index === subforums.length - 1 ? 0 : 1
                      }} />
                      <div className="branch-dot" style={{ background: forum.color }} />
                    </div>
                    <div className="branch-content">
                      <span className="branch-name">{sub.name}</span>
                      {sub.description && (
                        <span className="branch-desc">{sub.description}</span>
                      )}
                    </div>
                    <span className="branch-arrow">→</span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
