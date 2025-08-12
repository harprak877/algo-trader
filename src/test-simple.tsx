import React from 'react'

const TestSimple: React.FC = () => {
  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>🧪 Simple Test Component</h1>
      <p>If you can see this, React is working!</p>
      <p>Current time: {new Date().toLocaleTimeString()}</p>
      <div style={{ 
        backgroundColor: '#f0f0f0', 
        padding: '10px', 
        borderRadius: '5px',
        margin: '10px 0'
      }}>
        <strong>Status:</strong> React component loaded successfully
      </div>
    </div>
  )
}

export default TestSimple
