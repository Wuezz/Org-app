import React from "react";
import "./App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import OwnershipCanvas from "./components/OwnershipCanvas";
import FAQ from "./pages/FAQ";
import { Toaster } from "./components/ui/toaster";
import { Analytics } from "@vercel/analytics/react";

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<OwnershipCanvas />} />
          <Route path="/faq" element={<FAQ />} />
        </Routes>
        <footer className="text-sm text-gray-500 text-center py-6 border-t mt-10">
          <p>
            © 2025 Ownero.app. All rights reserved. • 
            <a href="/privacy" className="underline ml-1">Privacy Policy</a>
          </p>
        </footer>
      </BrowserRouter>
      <Toaster />
      <Analytics />
    </div>
  );
}

export default App;