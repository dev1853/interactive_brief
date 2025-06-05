// frontend/src/App.jsx

import React from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import BriefList from './components/BriefList';
import BriefForm from './components/BriefForm';
import EditBrief from './components/EditBrief';
import BriefBuilder from './components/BriefBuilder';
import ThankYouPage from './components/ThankYouPage';
import ResultsPage from './components/ResultsPage';

function App() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans">
      <header className="bg-white shadow-sm border-b border-slate-200">
      </header>
      <main className="container mx-auto p-6">
        <Routes>
          <Route path="/" element={<BriefList />} />
          <Route path="/brief/:briefId" element={<BriefForm />} />
          <Route path="/briefs/:briefId/edit" element={<EditBrief />} />
          <Route path="/create-brief" element={<BriefBuilder />} /> 
          <Route path="/briefs/:briefId/results" element={<ResultsPage />} /> 
          <Route path="/thank-you" element={<ThankYouPage />} /> 
        </Routes>
      </main>
    </div>
  );
}

export default App;