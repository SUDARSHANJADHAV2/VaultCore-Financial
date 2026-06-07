import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';

function Navbar({ onLogout }) {
    const navigate = useNavigate();
    const location = useLocation();
    const token    = localStorage.getItem('token');
    const username = localStorage.getItem('username');
    const role     = localStorage.getItem('role');

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('username');
        localStorage.removeItem('userId');
        localStorage.removeItem('role');
        if (onLogout) onLogout();
        navigate('/login');
    };

    if (!token) return null;

    const isActive = (path) => location.pathname === path ? 'nav-link active' : 'nav-link';

    return (
        <nav className="navbar navbar-expand-lg navbar-dark bg-primary">
            <div className="container">
                <Link className="navbar-brand fw-bold" to="/dashboard">
                    💎 VaultCore Financial
                </Link>

                <button className="navbar-toggler" type="button"
                    data-bs-toggle="collapse" data-bs-target="#navbarNav">
                    <span className="navbar-toggler-icon"></span>
                </button>

                <div className="collapse navbar-collapse" id="navbarNav">
                    <ul className="navbar-nav me-auto">
                        <li className="nav-item">
                            <Link className={isActive('/dashboard')} to="/dashboard">
                                🏠 Dashboard
                            </Link>
                        </li>
                        <li className="nav-item">
                            <Link className={isActive('/transfer')} to="/transfer">
                                💸 Transfer
                            </Link>
                        </li>
                        <li className="nav-item">
                            <Link className={isActive('/history')} to="/history">
                                📋 History
                            </Link>
                        </li>
                        <li className="nav-item">
                            <Link className={isActive('/portfolio')} to="/portfolio">
                                📈 Portfolio
                            </Link>
                        </li>
                       
                        <li className="nav-item">
                            <Link className={isActive('/statement')} to="/statement">
                                📄 Statement
                            </Link>
                        </li>
                       
                        {role === 'ADMIN' && (
                            <li className="nav-item">
                                <Link className={isActive('/audit')} to="/audit">
                                    🔍 Audit
                                </Link>
                            </li>
                        )}
                    </ul>
                    <span className="navbar-text me-3">
                        Welcome, {username}!
                        {role === 'ADMIN' && <span className="badge bg-warning text-dark ms-1">Admin</span>}
                    </span>
                    <button className="btn btn-light" onClick={handleLogout}>Logout</button>
                </div>
            </div>
        </nav>
    );
}

export default Navbar;
