// src/App.jsx
import { useState, useEffect } from "react";
import Scene from "./components/Scene";
import { Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";
import Dashboard from "./admin/components/layout/pages/Dashboard";
import Users from "./admin/components/layout/pages/Users";
import Content from "./admin/components/layout/pages/Content";
import Settings from "./admin/components/layout/pages/Settings";
import Login from "./admin/components/layout/pages/Login"; // Ensure this import is correct
import { getRecentActivity } from "./api"; // Import API functions

const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem('jwt');
  return token ? children : <Navigate to="/login" />;
};

function App() {
  const [isFirebaseOpen, setIsFirebaseOpen] = useState(false);
  const [firebaseData, setFirebaseData] = useState([]);
  const [firebaseStatus, setFirebaseStatus] = useState("Déconnecté");
  const [firebaseLoading, setFirebaseLoading] = useState(false);
  const [firebaseToken, setFirebaseToken] = useState("");
  const [showToken, setShowToken] = useState(false);
  const [userSession, setUserSession] = useState({
    isLoggedIn: false,
    user: null,
    token: null
  });

  const navigate = useNavigate();
  const location = useLocation();

  // Check auth on mount and route change
  useEffect(() => {
    const token = localStorage.getItem('jwt');
    const userStr = localStorage.getItem('user');

    if (token && userStr) {
      try {
        const user = JSON.parse(userStr);
        setUserSession({
          isLoggedIn: true,
          user: user,
          token: token
        });
        setFirebaseToken(token);
        setFirebaseStatus("Connecté");
      } catch (e) {
        console.error("Error parsing user data", e);
        localStorage.removeItem('jwt');
        localStorage.removeItem('user');
      }
    } else {
      setUserSession({
        isLoggedIn: false,
        user: null,
        token: null
      });
      setFirebaseToken("");
      setFirebaseStatus("Déconnecté");
    }
  }, [location.pathname]);

  // Fetch real data
  const fetchFirebaseData = async () => {
    setFirebaseLoading(true);

    // If not logged in, we can't fetch real data potentially, or maybe public data?
    // Assuming we need auth to fetch data.
    if (!userSession.isLoggedIn) {
      setFirebaseStatus("Non connecté");
      setFirebaseLoading(false);
      return;
    }

    try {
      const activity = await getRecentActivity();
      // Map Stratpi data to the format expected by the UI if needed
      // Assuming activity is a list of reservations for now
      if (activity && activity.data) {
        const mappedData = activity.data.map(item => ({
          id: item.id,
          name: `Réservation #${item.id}`,
          status: item.attributes?.status || 'Info',
          time: new Date(item.attributes?.createdAt).toLocaleTimeString(),
          type: 'reservation',
          details: item.attributes?.details || 'Détails non disponibles'
        }));
        setFirebaseData(mappedData);
        setFirebaseStatus(`Connecté (${mappedData.length} notifications)`);
      } else {
        setFirebaseData([]);
      }
    } catch (error) {
      console.error("Failed to fetch activity", error);
      setFirebaseStatus("Erreur");
    } finally {
      setFirebaseLoading(false);
    }
  };

  const handleFirebaseClick = () => {
    setIsFirebaseOpen(!isFirebaseOpen);
    if (!isFirebaseOpen) {
      fetchFirebaseData();
    }
  };

  const clearFirebaseData = () => {
    setFirebaseData([]);
    // Do not logout here, just clear the view
  };

  const handleLogout = () => {
    localStorage.removeItem('jwt');
    localStorage.removeItem('user');
    setUserSession({
      isLoggedIn: false,
      user: null,
      token: null
    });
    setFirebaseToken("");
    navigate('/login');
  };

  const copyTokenToClipboard = () => {
    if (firebaseToken) {
      navigator.clipboard.writeText(firebaseToken)
        .then(() => alert("Token copié !"))
        .catch(err => console.error("Erreur copie", err));
    }
  };

  const decodeToken = (token) => {
    if (!token) return null;
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return null;
      const payload = JSON.parse(atob(parts[1]));
      return {
        ...payload,
        issuedAt: new Date(payload.iat * 1000).toLocaleString(),
        expiresAt: new Date(payload.exp * 1000).toLocaleString()
      };
    } catch (e) { return null; }
  };

  const tokenInfo = decodeToken(firebaseToken);

  // Reusable Firebase Widget Component Logic
  const FirebaseWidget = () => (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      left: '20px',
      zIndex: 10000
    }}>
      <button
        onClick={handleFirebaseClick}
        style={{
          padding: '12px 24px',
          background: 'linear-gradient(135deg, #FF8C00 0%, #FFA500 100%)',
          color: 'white',
          border: 'none',
          borderRadius: '50px',
          cursor: 'pointer',
          fontSize: '14px',
          fontWeight: 'bold',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          boxShadow: '0 4px 15px rgba(255, 140, 0, 0.3)',
          transition: 'all 0.3s ease'
        }}
        onMouseEnter={(e) => e.target.style.transform = 'scale(1.05)'}
        onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
      >
        🔥 Firebase
        <span style={{
          fontSize: '12px',
          background: 'rgba(255, 255, 255, 0.2)',
          padding: '2px 8px',
          borderRadius: '10px'
        }}>
          {firebaseStatus}
        </span>
      </button>

      {isFirebaseOpen && (
        <div style={{
          position: 'absolute',
          bottom: '70px',
          left: '0',
          width: '400px',
          background: 'white',
          borderRadius: '15px',
          boxShadow: '0 10px 40px rgba(0, 0, 0, 0.2)',
          overflow: 'hidden',
          zIndex: 10001
        }}>
          <div style={{
            background: 'linear-gradient(135deg, #FF8C00 0%, #FFA500 100%)',
            padding: '20px',
            color: 'white'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
                  🔥 Firebase Session
                </h3>
                {userSession.isLoggedIn && userSession.user && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '8px' }}>
                    <span style={{ fontSize: '20px' }}>👤</span>
                    <div>
                      <p style={{ margin: 0, fontSize: '14px', fontWeight: 'bold' }}>
                        {userSession.user.username}
                      </p>
                      <p style={{ margin: 0, fontSize: '11px', opacity: 0.9 }}>
                        {userSession.user.email}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div style={{
            padding: '15px 20px',
            background: '#f8f9fa',
            borderBottom: '1px solid #eee'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <strong style={{ fontSize: '14px' }}>🔑 Token JWT</strong>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={() => setShowToken(!showToken)} style={{ padding: '5px 10px', background: '#6c757d', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '11px' }}>
                  {showToken ? 'Masquer' : 'Afficher'}
                </button>
                <button onClick={copyTokenToClipboard} style={{ padding: '5px 10px', background: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '11px' }}>
                  Copier
                </button>
              </div>
            </div>

            {firebaseToken ? (
              <div>
                <div style={{
                  background: '#f1f3f4',
                  padding: '10px',
                  borderRadius: '5px',
                  fontSize: '12px',
                  fontFamily: 'monospace',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  maxHeight: showToken ? '200px' : '20px',
                  overflowY: showToken ? 'auto' : 'hidden',
                  transition: 'max-height 0.3s ease'
                }}>
                  {showToken ? firebaseToken : `${firebaseToken.substring(0, 50)}...`}
                </div>
              </div>
            ) : <p style={{ fontSize: '12px', color: '#666', textAlign: 'center' }}>Non connecté.</p>}
          </div>

          <div style={{ padding: '20px', maxHeight: '300px', overflowY: 'auto' }}>
            <h4 style={{ margin: '0 0 15px 0', fontSize: '16px' }}>📢 Notifications Récentes</h4>
            {firebaseLoading ? (
              <p style={{ textAlign: 'center' }}>Chargement...</p>
            ) : firebaseData.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {firebaseData.map((item, idx) => (
                  <div key={idx} style={{ padding: '12px', background: '#f8f9fa', borderRadius: '8px', borderLeft: '4px solid #007bff' }}>
                    <strong>{item.name}</strong>
                    <p style={{ margin: '5px 0', fontSize: '12px', color: '#666' }}>{item.details}</p>
                    <small>{item.time}</small>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ textAlign: 'center', color: '#666' }}>Aucune donnée disponible</p>
            )}
          </div>

          <div style={{
            padding: '15px 20px',
            background: '#f8f9fa',
            borderTop: '1px solid #eee',
            display: 'flex',
            justifyContent: 'space-between',
            gap: '10px'
          }}>
            <button onClick={fetchFirebaseData} style={{ padding: '8px 15px', background: '#FF8C00', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontSize: '12px', flex: 1 }}>
              Actualiser
            </button>
            {!userSession.isLoggedIn ? (
              <button onClick={() => navigate('/login')} style={{ padding: '8px 15px', background: '#17a2b8', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontSize: '12px', flex: 1 }}>
                Se connecter
              </button>
            ) : (
              <button onClick={handleLogout} style={{ padding: '8px 15px', background: '#dc3545', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontSize: '12px', flex: 1 }}>
                Déconnexion
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
      <Routes>
        <Route path="/" element={
          <>
            <Scene />
            <div style={{ position: 'absolute', bottom: '20px', right: '20px', zIndex: 1000 }}>
              <button
                onClick={() => navigate('/login')}
                style={{
                  padding: '15px 25px',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  fontSize: '16px',
                  fontWeight: 'bold'
                }}
              >
                Connexion
              </button>
            </div>
          </>
        } />
        <Route path="/login" element={<Login />} />
        <Route path="/admin/*" element={
          <PrivateRoute>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/users" element={<Users />} />
              <Route path="/content" element={<Content />} />
              <Route path="/settings" element={<Settings />} />
            </Routes>
          </PrivateRoute>
        } />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>

      {/* Global Widgets */}
      <FirebaseWidget />

      <style>
        {`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}
      </style>
    </div>
  );
}

export default App;