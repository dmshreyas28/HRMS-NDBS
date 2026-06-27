import { useAuth0 } from '@auth0/auth0-react'
import { useEffect, useState } from 'react'
import './App.css'

function App() {
  const { isAuthenticated, loginWithRedirect, logout, user, isLoading, getAccessTokenSilently } = useAuth0()
  const [dbUser, setDbUser] = useState<any>(null)

  useEffect(() => {
    const syncUser = async () => {
      if (isAuthenticated) {
        try {
          const token = await getAccessTokenSilently()
          const res = await fetch('http://localhost:5000/api/auth/me', {
            headers: {
              Authorization: `Bearer ${token}`
            }
          })
          const data = await res.json()
          if (data.success) {
            setDbUser(data.data)
          }
        } catch (e) {
          console.error("Error syncing user:", e)
        }
      }
    }
    syncUser()
  }, [isAuthenticated, getAccessTokenSilently])

  if (isLoading) return <div>Loading...</div>

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-4">HRMS Talent Acquisition</h1>
      
      {!isAuthenticated ? (
        <button 
          onClick={() => loginWithRedirect()}
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          Log In
        </button>
      ) : (
        <div>
          <p className="mb-4">Logged in as {user?.email}</p>
          {dbUser && (
            <div className="mb-4 p-4 bg-gray-100 rounded text-sm">
              <p><strong>DB Role:</strong> {dbUser.role}</p>
              <p><strong>DB Auth0Id:</strong> {dbUser.auth0Id}</p>
            </div>
          )}
          <button 
            onClick={() => logout({ logoutParams: { returnTo: window.location.origin } })}
            className="bg-red-500 text-white px-4 py-2 rounded"
          >
            Log Out
          </button>
        </div>
      )}
    </div>
  )
}

export default App
