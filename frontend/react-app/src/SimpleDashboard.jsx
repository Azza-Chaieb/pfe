// src/SimpleDashboard.jsx
import React from 'react';

const SimpleDashboard = () => {
  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: 'white',
      padding: '50px',
      fontFamily: 'Arial'
    }}>
      <h1 style={{ fontSize: '48px', marginBottom: '30px' }}>🎉 DASHBOARD ADMIN !</h1>
      <p style={{ fontSize: '20px', marginBottom: '20px' }}>Ça marche !</p>
      
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: '20px',
        marginTop: '50px'
      }}>
        <div style={{ background: 'rgba(255,255,255,0.1)', padding: '20px', borderRadius: '10px' }}>
          <h3>👥 Utilisateurs</h3>
          <p style={{ fontSize: '32px', fontWeight: 'bold' }}>1,245</p>
        </div>
        
        <div style={{ background: 'rgba(255,255,255,0.1)', padding: '20px', borderRadius: '10px' }}>
          <h3>💰 Revenus</h3>
          <p style={{ fontSize: '32px', fontWeight: 'bold' }}>€12,450</p>
        </div>
      </div>
      
      <button 
        onClick={() => window.history.back()}
        style={{
          marginTop: '50px',
          padding: '15px 30px',
          background: 'white',
          color: '#667eea',
          border: 'none',
          borderRadius: '10px',
          fontSize: '18px',
          cursor: 'pointer'
        }}
      >
        ← Retour à l'application
      </button>
    </div>
  );
};

export default SimpleDashboard;