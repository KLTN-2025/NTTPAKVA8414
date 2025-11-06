import axios from 'axios'
import { useAuth, useUser } from '@clerk/vue'

export function useAuthSync() {
  const { getToken } = useAuth()


  // Fetch current authenticated user's data from backend
  const fetchProfile = async () => {
    try {
      const token = await getToken.value()
      const res = await axios.get('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` },
      })
      return res.data.customer
    } catch (error) {
      console.error('❌ Fetch profile failed:', error.response?.data || error.message)
      throw error
    }
  }

  return { /*syncUser,*/ fetchProfile }
}
