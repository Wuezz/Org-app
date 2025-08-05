import React from "react";
import "./App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import OwnershipCanvas from "./components/OwnershipCanvas";
import FAQ from "./pages/FAQ";
import { Toaster } from "./components/ui/toaster";

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<OwnershipCanvas />} />
          <Route path="/faq" element={<FAQ />} />
        </Routes>
      </BrowserRouter>
      <Toaster />
    </div>
  );
}

export default App;