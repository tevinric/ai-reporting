import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navigation from './components/Navigation';
import Dashboard from './pages/Dashboard';
import Initiatives from './pages/Initiatives';
import InitiativeForm from './pages/InitiativeForm';
import ProjectView from './pages/ProjectView';
import FeaturedSolutions from './pages/FeaturedSolutions';
import Management from './pages/Management';
import ROIAssistant from './pages/ROIAssistant';
import ComplexityAnalyzer from './pages/ComplexityAnalyzer';
import './App.css';

function App() {
  return (
    <Router>
      <div className="app-container">
        <Navigation />
        <div className="main-content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/initiatives" element={<Initiatives />} />
            <Route path="/initiatives/new" element={<InitiativeForm />} />
            <Route path="/initiatives/:id/edit" element={<InitiativeForm />} />
            <Route path="/initiatives/:id" element={<ProjectView />} />
            <Route path="/featured" element={<FeaturedSolutions />} />
            <Route path="/tools/roi-assistant" element={<ROIAssistant />} />
            <Route path="/tools/complexity-analyzer" element={<ComplexityAnalyzer />} />
            <Route path="/management" element={<Management />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;
