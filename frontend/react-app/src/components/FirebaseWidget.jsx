import React, { useState } from "react";
import { getRecentActivity } from "../api";

const FirebaseWidget = ({ userSession, firebaseToken }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showToken, setShowToken] = useState(false);
  const [firebaseData, setFirebaseData] = useState([]);
  const [firebaseStatus, setFirebaseStatus] = useState("Connecté");
  const [firebaseLoading, setFirebaseLoading] = useState(false);

  const fetchFirebaseData = async () => {
    setFirebaseLoading(true);

    if (!userSession.isLoggedIn) {
      setFirebaseStatus("Non connecté");
      setFirebaseLoading(false);
      return;
    }

    try {
      const activity = await getRecentActivity();
      if (activity && activity.data) {
        const mappedData = activity.data.map((item) => ({
          id: item.id,
          name: `Réservation #${item.id}`,
          status: item.attributes?.status || "Info",
          time: new Date(item.attributes?.createdAt).toLocaleTimeString(),
          type: "reservation",
          details: item.attributes?.details || "Détails non disponibles",
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

  const handleClick = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      fetchFirebaseData();
    }
  };

  const copyTokenToClipboard = () => {
    if (firebaseToken) {
      navigator.clipboard
        .writeText(firebaseToken)
        .then(() => alert("Token copié !"))
        .catch((err) => console.error("Erreur copie", err));
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        bottom: "20px",
        left: "20px",
        zIndex: 10000,
      }}
    >
      <button
        onClick={handleClick}
        style={{
          padding: "12px 24px",
          background: "linear-gradient(135deg, #FF8C00 0%, #FFA500 100%)",
          color: "white",
          border: "none",
          borderRadius: "50px",
          cursor: "pointer",
          fontSize: "14px",
          fontWeight: "bold",
          display: "flex",
          alignItems: "center",
          gap: "10px",
          boxShadow: "0 4px 15px rgba(255, 140, 0, 0.3)",
          transition: "all 0.3s ease",
        }}
      >
        🔥 Firebase
        <span
          style={{
            fontSize: "12px",
            background: "rgba(255, 255, 255, 0.2)",
            padding: "2px 8px",
            borderRadius: "10px",
          }}
        >
          {firebaseStatus}
        </span>
      </button>

      {isOpen && (
        <div
          style={{
            position: "absolute",
            bottom: "70px",
            left: "0",
            width: "400px",
            background: "white",
            borderRadius: "15px",
            boxShadow: "0 10px 40px rgba(0, 0, 0, 0.2)",
            overflow: "hidden",
            zIndex: 10001,
          }}
        >
          <div
            style={{
              background: "linear-gradient(135deg, #FF8C00 0%, #FFA500 100%)",
              padding: "20px",
              color: "white",
            }}
          >
            <h3 style={{ margin: 0 }}>🔥 Firebase Session</h3>
            {userSession.isLoggedIn && userSession.user && (
              <div style={{ marginTop: "10px" }}>
                <p style={{ margin: 0, fontSize: "14px", fontWeight: "bold" }}>
                  {userSession.user.username}
                </p>
                <p style={{ margin: 0, fontSize: "11px", opacity: 0.9 }}>
                  {userSession.user.email}
                </p>
              </div>
            )}
          </div>

          <div
            style={{
              padding: "15px 20px",
              background: "#f8f9fa",
              borderBottom: "1px solid #eee",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: "10px",
              }}
            >
              <strong>🔑 Token JWT</strong>
              <div style={{ display: "flex", gap: "5px" }}>
                <button
                  onClick={() => setShowToken(!showToken)}
                  style={{ padding: "3px 8px", fontSize: "11px" }}
                >
                  {showToken ? "Hide" : "Show"}
                </button>
                <button
                  onClick={copyTokenToClipboard}
                  style={{ padding: "3px 8px", fontSize: "11px" }}
                >
                  Copy
                </button>
              </div>
            </div>
            <div
              style={{
                fontSize: "11px",
                wordBreak: "break-all",
                maxHeight: showToken ? "100px" : "20px",
                overflow: "hidden",
              }}
            >
              {firebaseToken || "No token found"}
            </div>
          </div>

          <div
            style={{ padding: "20px", maxHeight: "200px", overflowY: "auto" }}
          >
            <h4 style={{ margin: "0 0 10px 0" }}>📢 Notifications</h4>
            {firebaseData.map((item, idx) => (
              <div
                key={idx}
                style={{
                  padding: "8px",
                  borderBottom: "1px solid #eee",
                  fontSize: "12px",
                }}
              >
                <strong>{item.name}</strong> - {item.time}
              </div>
            ))}
          </div>

          <div style={{ padding: "15px", display: "flex", gap: "5px" }}>
            <button
              onClick={fetchFirebaseData}
              style={{ flex: 1, padding: "8px", fontSize: "12px" }}
              disabled={firebaseLoading}
            >
              {firebaseLoading ? "Chargement..." : "Rafraîchir"}
            </button>
            <button
              onClick={() => {
                localStorage.removeItem("jwt");
                localStorage.removeItem("user");
                window.location.href = "/login";
              }}
              style={{
                flex: 1,
                padding: "8px",
                fontSize: "12px",
                background: "#dc3545",
                color: "white",
                border: "none",
              }}
            >
              Logout
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default FirebaseWidget;
