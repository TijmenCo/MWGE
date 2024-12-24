import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Lobby from './pages/Lobby';
import { useState, useEffect } from 'react';
import logo from '../src/images/logo.png'; // Import your image here

function App() {
  const [splashAngle, setSplashAngle] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setSplashAngle((prevAngle) => (prevAngle + 1) % 360);
    }, 30);

    return () => clearInterval(interval);
  }, []);

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900">
        <nav className="bg-black/20 backdrop-blur-sm border-b border-white/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center">
              <a href="/">
                  <img
                    src={logo}
                    alt="Logo"
                    className="w-12 h-12"
                  />
                </a>
                <span className="ml-2 text-xl font-bold text-white">Doozy (beta)</span>
                <span className="text-gray-300 text-sm ml-2">v1.1</span>
                <div className="relative ml-4">
                  <span 
                    className="absolute -top-4 left-0 text-yellow-300 font-bold text-sm transform origin-left"
                    style={{
                      animation: 'splash 2s ease-in-out infinite',
                      transform: `rotate(${Math.sin(splashAngle * Math.PI / 180) * 5}deg) scale(${0.9 + Math.sin(splashAngle * Math.PI / 90) * 0.1})`,
                    }}
                  >
                    Now with minigames!
                  </span>
                </div>
              </div>
            </div>
          </div>
        </nav>
        
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/lobby/:id" element={<Lobby />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
