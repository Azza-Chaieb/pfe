import React from 'react';

export class WebGLErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, errorType: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        console.error("WebGL/Three.js Error caught by boundary:", error, errorInfo);
        if (error.message?.includes('WebGL') || error.message?.includes('context lost')) {
            this.setState({ errorType: 'webgl' });
        }
    }

    render() {
        if (this.state.hasError) {
            return (
                <div style={{
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: '#0a0a1a',
                    color: '#fff',
                    padding: '20px',
                    textAlign: 'center',
                    borderRadius: '20px',
                    border: '1px solid rgba(255,255,255,0.1)'
                }}>
                    <div style={{ fontSize: '40px', marginBottom: '20px' }}>⚠️</div>
                    <h3 style={{ margin: '0 0 10px 0', fontSize: '18px', fontWeight: '900' }}>
                        Erreur d'affichage 3D
                    </h3>
                    <p style={{ margin: '0 0 20px 0', fontSize: '12px', opacity: 0.7, maxWidth: '300px' }}>
                        {this.state.errorType === 'webgl'
                            ? "Le contexte WebGL a été perdu. Cela arrive souvent si trop d'onglets 3D sont ouverts."
                            : "Une erreur est survenue lors du rendu de la scène."}
                    </p>
                    <button
                        onClick={() => window.location.reload()}
                        style={{
                            padding: '12px 24px',
                            background: '#4f46e5',
                            border: 'none',
                            borderRadius: '12px',
                            color: 'white',
                            fontWeight: 'bold',
                            cursor: 'pointer',
                            fontSize: '12px'
                        }}
                    >
                        Actualiser la page
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}

export default WebGLErrorBoundary;
