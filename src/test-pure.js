// Pure JavaScript test - no JSX, no React
console.log('Pure JavaScript test loaded');

function createTestElement() {
  const div = document.createElement('div');
  div.innerHTML = `
    <h1>🧪 Pure JavaScript Test</h1>
    <p>If you can see this, JavaScript is working!</p>
    <p>Current time: ${new Date().toLocaleTimeString()}</p>
    <div style="background-color: #f0f0f0; padding: 10px; border-radius: 5px; margin: 10px 0;">
      <strong>Status:</strong> JavaScript loaded successfully
    </div>
  `;
  return div;
}

// Try to mount to root
const root = document.getElementById('root');
if (root) {
  console.log('Root element found, mounting test');
  root.appendChild(createTestElement());
} else {
  console.log('Root element not found');
  document.body.appendChild(createTestElement());
}
