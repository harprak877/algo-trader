// Pure JavaScript main file
console.log('Main.js loaded');

// Try to create a simple element
const root = document.getElementById('root');
if (root) {
  console.log('Root element found in main.js');
  root.innerHTML = '<h1>🧪 Main.js Test</h1><p>If you see this, main.js is working!</p>';
} else {
  console.log('Root element not found in main.js');
}
