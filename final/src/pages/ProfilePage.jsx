import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getUser, updateUser } from '../api/users'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { PageLoader } from '../components/LoadingSpinner'
import LoadingSpinner from '../components/LoadingSpinner'

export default function ProfilePage() {
  const { userId } = useParams()
  const { user: me, isAdmin } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()

  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [saving,  setSaving]  = useState(false)
  const [form, setForm]       = useState({ name: '', email: '' })
  const [errors, setErrors]   = useState({})

  const canEdit = me?.userId === userId || isAdmin

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const res = await getUser(userId)
        const data = res.data.data
        setProfile(data)
        setForm({ name: data.name || '', email: data.email || '' })
      } catch (err) {
        toast.error('Could not load profile')
        navigate('/')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [userId])

  const validate = () => {
    const e = {}
    if (!form.name.trim()) e.name = 'Name is required'
    if (!form.email)       e.email = 'Email is required'
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Invalid email'
    return e
  }

  const handleSave = async () => {
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    setSaving(true)
    try {
      const res = await updateUser(userId, { name: form.name.trim(), email: form.email })
      setProfile(res.data.data)
      setEditing(false)
      toast.success('Profile updated successfully')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <PageLoader />
  if (!profile) return null

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="section-title mb-6">Profile</h1>

      <div className="card p-6 sm:p-8">
        {/* Avatar */}
        <div className="flex items-center gap-5 mb-8">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary-400 to-purple-500 flex items-center justify-center text-white text-3xl font-bold shadow-md">
            {profile.name?.[0]?.toUpperCase() || 'U'}
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">{profile.name}</h2>
            <p className="text-gray-500 text-sm">{profile.email}</p>
            <span className={`mt-1.5 badge ${profile.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'}`}>
              {profile.role}
            </span>
          </div>
        </div>

        {/* Meta */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="bg-gray-50 rounded-xl p-4">
            <p className="text-xs text-gray-400 mb-1">Member since</p>
            <p className="font-medium text-gray-700 text-sm">
              {new Date(profile.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
          <div className="bg-gray-50 rounded-xl p-4">
            <p className="text-xs text-gray-400 mb-1">Last updated</p>
            <p className="font-medium text-gray-700 text-sm">
              {new Date(profile.updatedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
        </div>

        {/* Edit form */}
        {canEdit && (
          <>
            {!editing ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-gray-800">Account Details</h3>
                  <button onClick={() => setEditing(true)} className="btn-secondary text-sm">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Edit
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <p className="label">Full Name</p>
                    <p className="text-gray-800 font-medium">{profile.name}</p>
                  </div>
                  <div>
                    <p className="label">Email</p>
                    <p className="text-gray-800 font-medium">{profile.email}</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-800">Edit Account Details</h3>
                <div>
                  <label className="label">Full Name</label>
                  <input
                    className={`input ${errors.name ? 'border-red-300' : ''}`}
                    value={form.name}
                    onChange={(e) => { setForm({ ...form, name: e.target.value }); setErrors({ ...errors, name: undefined }) }}
                  />
                  {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
                </div>
                <div>
                  <label className="label">Email Address</label>
                  <input
                    type="email"
                    className={`input ${errors.email ? 'border-red-300' : ''}`}
                    value={form.email}
                    onChange={(e) => { setForm({ ...form, email: e.target.value }); setErrors({ ...errors, email: undefined }) }}
                  />
                  {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                </div>
                <div className="flex gap-3">
                  <button onClick={handleSave} disabled={saving} className="btn-primary">
                    {saving ? <><LoadingSpinner size="sm" />Saving…</> : 'Save Changes'}
                  </button>
                  <button
                    onClick={() => {
                      setEditing(false)
                      setForm({ name: profile.name, email: profile.email })
                      setErrors({})
                    }}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
