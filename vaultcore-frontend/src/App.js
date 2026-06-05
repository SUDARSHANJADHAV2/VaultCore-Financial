import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login              from './components/Login';
import Dashboard          from './components/Dashboard';
import Transfer           from './components/Transfer';
import Portfolio          from './components/Portfolio';
import TransactionHistory from './components/TransactionHistory';
import AuditLog           from './components/AuditLog';          
import MonthlyStatement   from './components/MonthlyStatement';  
import Navbar             from './components/Navbar';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';

function App() {
    const [token, setToken] = useState(localStorage.getItem('token'));

    const isAuthenticated = () => !!localStorage.getItem('token');
    const isAdmin         = () => localStorage.getItem('role') === 'ADMIN';

    return (
        <Router>
            <div className="App">
                <Navbar onLogout={() => setToken(null)} />
                <div className="container mt-4">
                    <Routes>
                        <Route path="/login"
                            element={<Login onLoginSuccess={t => setToken(t)} />} />

                        <Route path="/dashboard"
                            element={isAuthenticated() ? <Dashboard /> : <Navigate to="/login" />} />

                        <Route path="/transfer"
                            element={isAuthenticated() ? <Transfer /> : <Navigate to="/login" />} />

                        <Route path="/portfolio"
                            element={isAuthenticated() ? <Portfolio /> : <Navigate to="/login" />} />

                        <Route path="/history"
                            element={isAuthenticated() ? <TransactionHistory /> : <Navigate to="/login" />} />

                        <Route path="/statement"
                            element={isAuthenticated() ? <MonthlyStatement /> : <Navigate to="/login" />} />

                        <Route path="/audit"
                            element={isAuthenticated() ? <AuditLog /> : <Navigate to="/login" />} />

                        <Route path="/" element={<Navigate to="/dashboard" />} />
                    </Routes>
                </div>
            </div>
        </Router>
    );
}

export default App;
