import { useEffect, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'

function Cube() {
  return (
    <mesh>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="orange" />
    </mesh>
  )
}

export default function Scene() {
  const [items, setItems] = useState([])
  const [error, setError] = useState(null)

  useEffect(() => {
    fetch('http://localhost:1337/api/tests?populate=*')
      .then(res => res.json())
      .then(data => {
        const list = data?.data || []
        setItems(list)
        console.log('Test entries from Strapi:', list)
      })
      .catch(err => {
        console.error('Fetch error:', err)
        setError(err.message)
      })
  }, [])

  if (error) return <div style={{ color: 'red', padding: 20 }}>Error: {error}</div>

  return (
    <>
      <div style={{ position: 'absolute', zIndex: 1, color: '#fff', padding: 8 }}>
        <h3>Tests: {items.length}</h3>
        {items.map(item => (
          <div key={item.id} style={{ marginTop: 10, padding: 10, backgroundColor: '#333', borderRadius: 5 }}>
            <p><strong>Name:</strong> {item.name}</p>
            <p><strong>Password:</strong> {item.password}</p>
          </div>
        ))}
      </div>
      <Canvas camera={{ position: [3, 3, 3], fov: 60 }} shadows gl={{ antialias: true }}>
        <ambientLight intensity={0.5} />
        <directionalLight position={[2, 5, 2]} intensity={1} />
        <Cube />
        <OrbitControls />
      </Canvas>
    </>
  )
}