import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { forgotPassword } from "../../services/authService";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");
    setLoading(true);

    try {
      await forgotPassword(email);
      setMessage(
        "Si un compte correspond à cet email, vous recevrez un lien de réinitialisation sous peu.",
      );
      setEmail("");
    } catch (err) {
      console.error("Forgot password error:", err);
      setError("Une erreur est survenue. Veuillez réessayer plus tard.");
    } finally {
      setLoading(false);
    }
  };

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
            Mot de passe oublié
          </h2>
          <p style={{ color: "#666", margin: 0 }}>
            Entrez votre email pour réinitialiser votre mot de passe
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
          <div className="form-group" style={{ marginBottom: "1.5rem" }}>
            <label
              style={{
                display: "block",
                marginBottom: "0.5rem",
                fontWeight: 500,
              }}
            >
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="votre-email@exemple.com"
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
            className="login-btn"
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
            {loading ? "Envoi..." : "Envoyer le lien"}
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
              Retour à la connexion
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ForgotPassword;
