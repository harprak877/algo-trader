import React from 'react'

const SimpleTest: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">🧪 Simple Test Component</h1>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <p className="text-gray-600">If you can see this, React is working!</p>
          <p className="text-gray-600 mt-2">Current time: {new Date().toLocaleString()}</p>
        </div>
      </div>
    </div>
  )
}

export default SimpleTest
