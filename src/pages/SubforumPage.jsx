import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import Navbar from '../components/Navbar'
import toast from 'react-hot-toast'
import '../styles/subforum.css'

export default function SubforumPage() {
  const { forumId, subforumId } = useParams()
  const { user } = useAuth()
  const [forum, setForum] = useState(null)
  const [subforum, setSubforum] = useState(null)
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [creating, setCreating] = useState(false)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')

  useEffect(() => { fetchData() }, [subforumId])

  async function fetchData() {
    const [{ data: forumData }, { data: subData }, { data: postData }] =
      await Promise.all([
        supabase.from('forums').select('*').eq('id', forumId).single(),
        supabase.from('subforums').select('*').eq('id', subforumId).single(),
        supabase.from('posts')
          .select('*, profiles(username), likes(id)')
          .eq('subforum_id', subforumId)
          .order('created_at', { ascending: false })
      ])
    setForum(forumData)
    setSubforum(subData)
    setPosts(postData || [])
    setLoading(false)
  }

  async function handleCreatePost(e) {
    e.preventDefault()
    setCreating(true)
    const { error } = await supabase
      .from('posts')
      .insert({ title, content, subforum_id: subforumId, author_id: user.id })
    if (error) {
      toast.error(error.message)
    } else {
      toast.success('Post created!')
      setTitle('')
      setContent('')
      setShowForm(false)
      fetchData()
    }
    setCreating(false)
  }

  async function handleLike(postId, alreadyLiked) {
    if (!user) { toast.error('Sign in to like posts'); return }
    if (alreadyLiked) {
      await supabase.from('likes').delete()
        .eq('post_id', postId).eq('user_id', user.id)
    } else {
      await supabase.from('likes').insert({ post_id: postId, user_id: user.id })
    }
    fetchData()
  }

  if (loading) return <div><Navbar /><div className="loading">Loading...</div></div>

  return (
    <div>
      <Navbar />
      <div className="subforum-container">
        <div className="subforum-breadcrumb">
          <Link to="/forums">Forums</Link>
          <span>/</span>
          <Link to={`/forums/${forumId}`}>{forum?.name}</Link>
          <span>/</span>
          <span>{subforum?.name}</span>
        </div>

        <div className="subforum-banner" style={{ borderLeftColor: forum?.color }}>
          <h1>{subforum?.name}</h1>
          {subforum?.description && <p>{subforum.description}</p>}
        </div>

        <div className="posts-header">
          <h2>{posts.length} Posts</h2>
          {user && (
            <button className="create-btn" onClick={() => setShowForm(!showForm)}>
              {showForm ? 'Cancel' : '+ New Post'}
            </button>
          )}
        </div>

        {showForm && (
          <form onSubmit={handleCreatePost} className="post-form">
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Post title"
              required maxLength={100}
            />
            <textarea
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder="What's on your mind?"
              required maxLength={5000}
              rows={5}
            />
            <button type="submit" disabled={creating}>
              {creating ? 'Posting...' : 'Post'}
            </button>
          </form>
        )}

        {posts.length === 0 ? (
          <div className="posts-empty">
            <p>No posts yet.</p>
            {user ? <p>Be the first to post!</p>
              : <p><Link to="/signup">Sign up</Link> to create the first post.</p>}
          </div>
        ) : (
          <div className="posts-list">
            {posts.map(post => {
              const liked = post.likes?.some(l => l.user_id === user?.id)
              return (
                <div key={post.id} className="post-card">
                  <div className="post-header">
                    <Link to={`/profile/${post.author_id}`} className="post-author">
                      {post.profiles?.username}
                    </Link>
                    <span className="post-date">
                      {new Date(post.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <h3 className="post-title">{post.title}</h3>
                  <p className="post-content">{post.content}</p>
                  <div className="post-actions">
                    <button
                      className={`like-btn ${liked ? 'liked' : ''}`}
                      onClick={() => handleLike(post.id, liked)}
                    >
                      ♥ {post.likes?.length || 0}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
