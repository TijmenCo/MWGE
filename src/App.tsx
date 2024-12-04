import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Lobby from './pages/Lobby';
import { Users } from 'lucide-react';

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900">
        <nav className="bg-black/20 backdrop-blur-sm border-b border-white/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center">
                <Users className="w-8 h-8 text-white" />
                <span className="ml-2 text-xl font-bold text-white">Doozy (beta)</span>
                <span className="text-gray-300 text-sm">v0.9</span>
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