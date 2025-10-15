import axios from 'axios'
import { useAuth, useUser } from '@clerk/vue'

export function useAuthSync() {
  const { getToken } = useAuth()
  const { user } = useUser()

  const syncUser = async () => {
    try {
      console.log('Getting token')
      const token = await getToken({ template: 'default' })

      console.log('Preparing payload')
      const payload = {
        email: user.value?.primaryEmailAddress?.emailAddress,
        name: user.value?.fullName,
        imageUrl: user.value?.imageUrl,
        phone: user.value?.phoneNumbers?.[0]?.phoneNumber || '',
      }

      console.log('Prepare to sync')
      const res = await axios.post(
        '/api/auth/sync',
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      )

      console.log('✅ Synced successfully:', res.data)
      return res.data.customer
    } catch (error) {
      console.error('❌ Sync failed:', error.response?.data || error.message)
      throw error
    }
  }

  // Fetch current authenticated user's data from backend
  const fetchProfile = async () => {
    try {
      const token = await getToken({ template: 'default' })
      const res = await axios.get('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` },
      })
      console.log('👤 Profile:', res.data.customer)
      return res.data.customer
    } catch (error) {
      console.error('❌ Fetch profile failed:', error.response?.data || error.message)
      throw error
    }
  }

  return { syncUser, fetchProfile }
}
