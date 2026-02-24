import React, { useState } from "react";

const PaymentSelector = ({ amount, onSelect, onCancel }) => {
  const [method, setMethod] = useState("");
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);

  const bankDetails = {
    bankName: "Banque Centrale de SunSpace",
    accountHolder: "SunSpace Coworking SARL",
    rib: "1234 5678 9012 3456 7890 1234",
    iban: "TN59 1234 5678 9012 3456 7890",
  };

  const handleConfirm = () => {
    if (!method) return;
    if (method === "bank_transfer" && !file) {
      alert("Veuillez uploader votre justificatif de virement.");
      return;
    }
    onSelect({ method, file });
  };

  return (
    <div
      className="payment-selector-overlay"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0,0,0,0.7)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 10000,
      }}
    >
      <div
        className="payment-selector-modal"
        style={{
          background: "white",
          padding: "30px",
          borderRadius: "15px",
          maxWidth: "500px",
          width: "90%",
          boxShadow: "0 10px 40px rgba(0,0,0,0.3)",
        }}
      >
        <h2 style={{ marginBottom: "10px" }}>Finaliser le paiement</h2>
        <p style={{ color: "#666", marginBottom: "20px" }}>
          Montant total à régler : <strong>{amount} TND</strong>
        </p>

        <div
          className="methods"
          style={{ display: "flex", flexDirection: "column", gap: "15px" }}
        >
          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              padding: "15px",
              border:
                method === "bank_transfer"
                  ? "2px solid #4A90E2"
                  : "1px solid #ddd",
              borderRadius: "10px",
              cursor: "pointer",
              transition: "all 0.2s",
            }}
          >
            <input
              type="radio"
              name="paymentMethod"
              value="bank_transfer"
              onChange={(e) => setMethod(e.target.value)}
              checked={method === "bank_transfer"}
            />
            <div>
              <strong>Virement Bancaire</strong>
              <div style={{ fontSize: "12px", color: "#888" }}>
                Validation sous 24h-48h
              </div>
            </div>
          </label>

          {method === "bank_transfer" && (
            <div
              style={{
                padding: "15px",
                background: "#f8f9fa",
                borderRadius: "8px",
                fontSize: "13px",
                borderLeft: "4px solid #4A90E2",
              }}
            >
              <p style={{ margin: "0 0 10px 0" }}>
                Veuillez effectuer le virement vers :
              </p>
              <div style={{ fontFamily: "monospace" }}>
                <strong>{bankDetails.bankName}</strong>
                <br />
                RIB: {bankDetails.rib}
                <br />
                TIT: {bankDetails.accountHolder}
              </div>
              <div style={{ marginTop: "15px" }}>
                <label style={{ display: "block", marginBottom: "5px" }}>
                  Preuve de virement (Capture/PDF) :
                </label>
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(e) => setFile(e.target.files[0])}
                  style={{ fontSize: "12px" }}
                />
              </div>
            </div>
          )}

          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              padding: "15px",
              border:
                method === "on_site" ? "2px solid #4A90E2" : "1px solid #ddd",
              borderRadius: "10px",
              cursor: "pointer",
              transition: "all 0.2s",
            }}
          >
            <input
              type="radio"
              name="paymentMethod"
              value="on_site"
              onChange={(e) => setMethod(e.target.value)}
              checked={method === "on_site"}
            />
            <div>
              <strong>Paiement à l'espace</strong>
              <div style={{ fontSize: "12px", color: "#888" }}>
                Règlement physique à l'accueil
              </div>
            </div>
          </label>
        </div>

        <div style={{ marginTop: "30px", display: "flex", gap: "10px" }}>
          <button
            onClick={onCancel}
            style={{
              flex: 1,
              padding: "12px",
              borderRadius: "8px",
              border: "1px solid #ddd",
              background: "none",
            }}
          >
            Annuler
          </button>
          <button
            onClick={handleConfirm}
            style={{
              flex: 1,
              padding: "12px",
              borderRadius: "8px",
              border: "none",
              background: "#4A90E2",
              color: "white",
              fontWeight: "bold",
              opacity: !method ? 0.5 : 1,
            }}
            disabled={!method}
          >
            Confirmer
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentSelector;
