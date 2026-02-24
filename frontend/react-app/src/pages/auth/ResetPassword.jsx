import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { resetPassword } from "../../services/authService";

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const token = searchParams.get("token") || searchParams.get("code");

  useEffect(() => {
    if (!token) {
      setError("Jeton de réinitialisation manquant ou invalide.");
    }
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");

    if (password !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }

    if (password.length < 6) {
      setError("Le mot de passe doit contenir au moins 6 caractères.");
      return;
    }

    setLoading(true);

    try {
      await resetPassword(token, password, confirmPassword);
      setMessage("Votre mot de passe a été réinitialisé avec succès !");
      setTimeout(() => {
        navigate("/login");
      }, 3000);
    } catch (err) {
      console.error("Reset password error:", err);
      setError("Échec de la réinitialisation. Le lien a peut-être expiré.");
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div
        className="login-page"
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
          background: "#f0f2f5",
        }}
      >
        <div
          style={{
            background: "white",
            padding: "2rem",
            borderRadius: "8px",
            boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
            textAlign: "center",
          }}
        >
          <h3 style={{ color: "#dc2626" }}>Lien invalide</h3>
          <p>Le lien de réinitialisation est manquant.</p>
          <button
            onClick={() => navigate("/login")}
            style={{
              marginTop: "1rem",
              padding: "0.5rem 1rem",
              background: "#2563eb",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
            }}
          >
            Retour à la connexion
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="login-page"
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
        background: "#f0f2f5",
      }}
    >
      <div
        className="login-container"
        style={{
          background: "white",
          padding: "2rem",
          borderRadius: "8px",
          boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
          width: "100%",
          maxWidth: "400px",
        }}
      >
        <div
          className="login-header"
          style={{ marginBottom: "2rem", textAlign: "center" }}
        >
          <h2 style={{ color: "#1a1a1a", marginBottom: "0.5rem" }}>
            Nouveau mot de passe
          </h2>
          <p style={{ color: "#666", margin: 0 }}>
            Choisissez un nouveau mot de passe sécurisé
          </p>
        </div>

        {message && (
          <div
            style={{
              background: "#dcfce7",
              border: "1px solid #22c55e",
              color: "#15803d",
              padding: "0.75rem",
              borderRadius: "0.375rem",
              marginBottom: "1.5rem",
              fontSize: "0.875rem",
            }}
          >
            {message}
          </div>
        )}

        {error && (
          <div
            style={{
              background: "#fee2e2",
              border: "1px solid #ef4444",
              color: "#b91c1c",
              padding: "0.75rem",
              borderRadius: "0.375rem",
              marginBottom: "1.5rem",
              fontSize: "0.875rem",
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group" style={{ marginBottom: "1rem" }}>
            <label
              style={{
                display: "block",
                marginBottom: "0.5rem",
                fontWeight: 500,
              }}
            >
              Nouveau mot de passe
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Min. 6 caractères"
              required
              style={{
                width: "100%",
                padding: "0.75rem",
                border: "1px solid #d1d5db",
                borderRadius: "0.375rem",
                fontSize: "0.875rem",
              }}
            />
          </div>

          <div className="form-group" style={{ marginBottom: "1.5rem" }}>
            <label
              style={{
                display: "block",
                marginBottom: "0.5rem",
                fontWeight: 500,
              }}
            >
              Confirmer le mot de passe
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Répétez le mot de passe"
              required
              style={{
                width: "100%",
                padding: "0.75rem",
                border: "1px solid #d1d5db",
                borderRadius: "0.375rem",
                fontSize: "0.875rem",
              }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              padding: "0.75rem",
              background: loading ? "#9ca3af" : "#2563eb",
              color: "white",
              border: "none",
              borderRadius: "0.375rem",
              fontWeight: 600,
              cursor: loading ? "not-allowed" : "pointer",
              transition: "background 0.2s",
              marginBottom: "1rem",
            }}
          >
            {loading ? "Modification..." : "Changer le mot de passe"}
          </button>

          <div style={{ textAlign: "center" }}>
            <button
              type="button"
              onClick={() => navigate("/login")}
              style={{
                background: "none",
                border: "none",
                color: "#2563eb",
                cursor: "pointer",
                textDecoration: "underline",
                fontSize: "0.875rem",
              }}
            >
              Annuler
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;
