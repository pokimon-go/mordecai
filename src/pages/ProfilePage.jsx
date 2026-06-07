import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import Navbar from '../components/Navbar'
import toast from 'react-hot-toast'
import '../styles/profile.css'

export default function ProfilePage() {
  const { userId } = useParams()
  const { user, profile: myProfile } = useAuth()
  const [profile, setProfile] = useState(null)
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [isFollowing, setIsFollowing] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [bio, setBio] = useState('')

  const isOwnProfile = user?.id === userId

  useEffect(() => { fetchProfile() }, [userId])

  async function fetchProfile() {
    const [{ data: profileData }, { data: postData }, { data: followData }] =
      await Promise.all([
        supabase.from('profiles').select('*').eq('id', userId).single(),
        supabase.from('posts').select('*, likes(id)')
          .eq('author_id', userId).order('created_at', { ascending: false }),
        user ? supabase.from('follows')
          .select('*').eq('follower_id', user.id).eq('following_id', userId) : { data: [] }
      ])
    setProfile(profileData)
    setPosts(postData || [])
    setIsFollowing((followData || []).length > 0)
    setBio(profileData?.bio || '')
    setLoading(false)
  }

  async function handleFollow() {
    if (!user) { toast.error('Sign in to follow users'); return }
    if (isFollowing) {
      await supabase.from('follows').delete()
        .eq('follower_id', user.id).eq('following_id', userId)
      setIsFollowing(false)
    } else {
      await supabase.from('follows')
        .insert({ follower_id: user.id, following_id: userId })
      setIsFollowing(true)
    }
  }

  async function handleSaveBio() {
    const { error } = await supabase
      .from('profiles').update({ bio }).eq('id', user.id)
    if (error) toast.error(error.message)
    else { toast.success('Profile updated!'); setEditMode(false); fetchProfile() }
  }

  if (loading) return <div><Navbar /><div className="loading">Loading...</div></div>
  if (!profile) return <div><Navbar /><div className="loading">User not found</div></div>

  return (
    <div>
      <Navbar />
      <div className="profile-container">
        <div className="profile-card">
          <div className="profile-avatar">
            {profile.username?.[0]?.toUpperCase()}
          </div>
          <div className="profile-info">
            <h1 className="profile-username">{profile.username}</h1>
            {editMode ? (
              <div className="profile-edit">
                <textarea
                  value={bio}
                  onChange={e => setBio(e.target.value)}
                  placeholder="Write a short bio..."
                  maxLength={200}
                  rows={3}
                />
                <div className="profile-edit-actions">
                  <button onClick={handleSaveBio} className="btn-save">Save</button>
                  <button onClick={() => setEditMode(false)} className="btn-cancel">Cancel</button>
                </div>
              </div>
            ) : (
              <p className="profile-bio">
                {profile.bio || (isOwnProfile ? 'No bio yet.' : '')}
              </p>
            )}
            <div className="profile-actions">
              {isOwnProfile ? (
                <button className="btn-edit" onClick={() => setEditMode(!editMode)}>
                  {editMode ? 'Cancel' : 'Edit Profile'}
                </button>
              ) : (
                <button
                  className={`btn-follow ${isFollowing ? 'following' : ''}`}
                  onClick={handleFollow}
                >
                  {isFollowing ? 'Unfollow' : 'Follow'}
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="profile-posts">
          <h2>{posts.length} Posts</h2>
          {posts.length === 0 ? (
            <div className="profile-empty">No posts yet.</div>
          ) : (
            posts.map(post => (
              <div key={post.id} className="profile-post-card">
                <h3>{post.title}</h3>
                <p>{post.content}</p>
                <span className="profile-post-meta">
                  ♥ {post.likes?.length || 0} · {new Date(post.created_at).toLocaleDateString()}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
