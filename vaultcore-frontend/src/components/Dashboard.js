import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { ACCOUNTS_URL } from '../config/api';

const formatINR = (amount) => {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 2
    }).format(amount);
};

function Dashboard() {
    const [accounts,     setAccounts]     = useState([]);
    const [loading,      setLoading]      = useState(true);
    const [provisioning, setProvisioning] = useState(false);
    const [error,        setError]        = useState('');

    const username = localStorage.getItem('username');
    const userId   = localStorage.getItem('userId');
    const headers  = { Authorization: `Bearer ${localStorage.getItem('token')}` };

    useEffect(() => { fetchAccounts(); }, []);

    const fetchAccounts = async () => {
        setLoading(true);
        setError('');
        try {
            const response = await axios.get(`${ACCOUNTS_URL}/user/${userId}`, { headers });
            setAccounts(response.data);
        } catch (err) {
            console.error('Error fetching accounts:', err);
            setError('Failed to load accounts. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleProvision = async () => {
        setProvisioning(true);
        setError('');
        try {
            await axios.post(`${ACCOUNTS_URL}/provision/${userId}`, {}, { headers });
            await fetchAccounts();
        } catch (err) {
            setError('Failed to create accounts. Please try again.');
        } finally {
            setProvisioning(false);
        }
    };

    if (loading) {
        return (
            <div className="text-center mt-5">
                <div className="spinner-border text-primary" role="status"></div>
                <p className="mt-2 text-muted">Loading your accounts...</p>
            </div>
        );
    }

    return (
        <div>
            <div className="d-flex align-items-center mb-1">
                <h2 className="mb-0">Welcome, {username}! 👋</h2>
            </div>
            <p className="text-muted mb-4">Here's an overview of your accounts.</p>

            {error && (
                <div className="alert alert-danger alert-dismissible fade show">
                    {error}
                    <button type="button" className="btn-close" onClick={() => setError('')}></button>
                </div>
            )}

            <h5 className="mb-3">Your Accounts</h5>

            {accounts.length === 0 ? (
                <div className="card border-warning mb-4">
                    <div className="card-body text-center py-4">
                        <div style={{fontSize:'40px', marginBottom:'12px'}}>🏦</div>
                        <h5>No accounts found</h5>
                        <p className="text-muted mb-3">
                            Your accounts weren't created during registration.<br/>
                            Click below to create your Savings &amp; Checking accounts instantly.
                        </p>
                        <button
                            className="btn btn-primary px-4"
                            onClick={handleProvision}
                            disabled={provisioning}
                        >
                            {provisioning ? (
                                <><span className="spinner-border spinner-border-sm me-2"></span>Creating accounts...</>
                            ) : '✅ Create My Accounts'}
                        </button>
                    </div>
                </div>
            ) : (
                <div className="row mb-4">
                    {accounts.map(account => (
                        <div key={account.id} className="col-md-6 mb-3">
                            <div className="card h-100 border-0 shadow-sm">
                                <div className="card-body">
                                    <div className="d-flex justify-content-between align-items-start mb-2">
                                        <div>
                                            <span className={`badge ${account.accountType === 'SAVINGS' ? 'bg-success' : 'bg-primary'} mb-2`}>
                                                {account.accountType}
                                            </span>
                                            <h6 className="text-muted mb-0" style={{fontSize:'12px'}}>
                                                {account.accountNumber}
                                            </h6>
                                        </div>
                                        <div style={{fontSize:'28px'}}>
                                            {account.accountType === 'SAVINGS' ? '💰' : '🏧'}
                                        </div>
                                    </div>
                                    <div className="mt-2">
                                        <div className="text-muted small">Available Balance</div>
                                        {/* ✅ INR format: ₹1,00,000.00 */}
                                        <div className="fw-bold" style={{fontSize:'26px', color:'#16a34a'}}>
                                            {formatINR(account.balance)}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <h5 className="mb-3">Quick Actions</h5>
            <div className="d-flex gap-2">
                <a href="/transfer"  className="btn btn-primary">💸 Send Money</a>
                <a href="/portfolio" className="btn btn-success">📈 View Portfolio</a>
            </div>
        </div>
    );
}

export default Dashboard;
