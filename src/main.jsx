import React from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';

function App() {
  return (
    <main className="boot-screen">
      <div className="boot-mark">B</div>
      <h1>BTrackerNEET</h1>
      <p>Your offline C++ interview practice studio.</p>
    </main>
  );
}

createRoot(document.getElementById('root')).render(<App />);
