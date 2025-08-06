import React from "react";
import "./App.css";
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import OwnershipCanvas from "./components/OwnershipCanvas";
import FAQ from "./pages/FAQ";
import Privacy from "./pages/Privacy";
import { Toaster } from "./components/ui/toaster";
import { Analytics } from "@vercel/analytics/react";

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<OwnershipCanvas />} />
          <Route path="/faq" element={<FAQ />} />
          <Route path="/privacy" element={<Privacy />} />
        </Routes>
        <footer className="text-sm text-gray-500 text-center py-6 border-t mt-10">
          <p>
            © 2025 Ownero.app. All rights reserved. • 
            <Link to="/privacy" className="underline ml-1">Privacy Policy</Link>
          </p>
        </footer>
      </BrowserRouter>
      <Toaster />
      <Analytics />
    </div>
  );
}

export default App;