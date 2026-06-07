// frontend/src/components/Transfer.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ACCOUNTS_URL, TRANSFERS_URL } from '../config/api';

// ✅ Format as Indian Rupees: ₹1,00,000.00
const formatINR = (amount) =>
    new Intl.NumberFormat('en-IN', {
        style: 'currency', currency: 'INR', minimumFractionDigits: 2
    }).format(amount);

function Transfer() {
    const [fromAccount,   setFromAccount]   = useState('');
    const [toAccount,     setToAccount]     = useState('');
    const [amount,        setAmount]        = useState('');
    const [description,   setDescription]   = useState('');
    const [myAccounts,    setMyAccounts]    = useState([]);
    const [otherAccounts, setOtherAccounts] = useState([]);
    const [message,       setMessage]       = useState('');
    const [error,         setError]         = useState('');
    const [loading,       setLoading]       = useState(false);
    const [loadingAccts,  setLoadingAccts]  = useState(true);
    const [provisioning,  setProvisioning]  = useState(false);
    const [requires2FA,   setRequires2FA]   = useState(false);
    const [challengeId,   setChallengeId]   = useState('');
    const [otpCode,       setOtpCode]       = useState('');

    const userId  = localStorage.getItem('userId');
    const headers = { Authorization: `Bearer ${localStorage.getItem('token')}` };

    useEffect(() => { fetchAllAccounts(); }, []);

    const fetchAllAccounts = async () => {
        setLoadingAccts(true);
        try {
            const [myRes, otherRes] = await Promise.all([
                axios.get(`${ACCOUNTS_URL}/user/${userId}`,   { headers }),
                axios.get(`${ACCOUNTS_URL}/others/${userId}`, { headers })
            ]);
            setMyAccounts(myRes.data);
            setOtherAccounts(otherRes.data);
            if (myRes.data.length    > 0) setFromAccount(myRes.data[0].accountNumber);
            if (otherRes.data.length > 0) setToAccount(otherRes.data[0].accountNumber);
        } catch { setError('Failed to load accounts. Please refresh.'); }
        finally  { setLoadingAccts(false); }
    };

    const handleProvision = async () => {
        setProvisioning(true);
        try {
            await axios.post(`${ACCOUNTS_URL}/provision/${userId}`, {}, { headers });
            await fetchAllAccounts();
        } catch { setError('Failed to create accounts.'); }
        finally  { setProvisioning(false); }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!fromAccount || !toAccount) { setError('Please select both accounts.'); return; }
        if (fromAccount === toAccount)  { setError('Cannot transfer to the same account.'); return; }
        const amt = parseFloat(amount);
        if (!amt || amt <= 0)           { setError('Please enter a valid amount.'); return; }
        const src = myAccounts.find(a => a.accountNumber === fromAccount);
        if (src && parseFloat(src.balance) < amt) {
            setError(`Insufficient balance. Available: ${formatINR(src.balance)}`);
            return;
        }
        await submitTransfer({ fromAccount, toAccount, amount: amt, description });
    };

    const handleOtpSubmit = async (e) => {
        e.preventDefault();
        if (!otpCode || otpCode.length !== 6) { setError('Please enter the 6-digit OTP.'); return; }
        await submitTransfer({ fromAccount, toAccount, amount: parseFloat(amount), description, challengeId, otpCode });
    };

    const submitTransfer = async (payload) => {
        setLoading(true); setMessage(''); setError('');
        try {
            const res = await axios.post(TRANSFERS_URL, payload, { headers });
            if (res.status === 202 && res.data.requires2FA) {
                setRequires2FA(true);
                setChallengeId(res.data.challengeId);
                return;
            }
            setMessage(`✅ Transfer successful! Transaction ID: ${res.data.transactionId}`);
            setAmount(''); setDescription(''); setOtpCode('');
            setRequires2FA(false); setChallengeId('');
            fetchAllAccounts();
        } catch (err) {
            const msg = err.response?.data?.message || err.response?.data || 'Transfer failed.';
            setError(typeof msg === 'string' ? msg : JSON.stringify(msg));
            setRequires2FA(false);
        } finally { setLoading(false); }
    };

    if (loadingAccts) return (
        <div className="text-center mt-5">
            <div className="spinner-border text-primary" role="status"></div>
            <p className="mt-2 text-muted">Loading your accounts...</p>
        </div>
    );

    const selectedFrom = myAccounts.find(a => a.accountNumber === fromAccount);
    const selectedTo   = otherAccounts.find(a => a.accountNumber === toAccount);

    return (
        <div className="row justify-content-center">
            <div className="col-md-8 col-lg-7">

                {myAccounts.length === 0 && (
                    <div className="card border-warning mb-3">
                        <div className="card-body text-center py-4">
                            <div style={{fontSize:'36px', marginBottom:'10px'}}>🏦</div>
                            <h5>No accounts found</h5>
                            <p className="text-muted mb-3">Click below to create your Savings &amp; Checking accounts.</p>
                            <button className="btn btn-primary px-4" onClick={handleProvision} disabled={provisioning}>
                                {provisioning ? <><span className="spinner-border spinner-border-sm me-2"></span>Creating...</> : '✅ Create My Accounts'}
                            </button>
                        </div>
                    </div>
                )}

                {/* 2FA Panel */}
                {requires2FA && (
                    <div className="card border-warning mb-3 shadow-sm">
                        <div className="card-header bg-warning text-dark">
                            <h5 className="mb-0">🔐 2FA Verification Required</h5>
                        </div>
                        <div className="card-body">
                            <div className="alert alert-warning">
                                <strong>Large transfer detected!</strong> This transfer exceeds the security threshold.
                                An OTP has been sent to your registered phone/email.
                                <br/><small className="text-muted"><strong>Development mode:</strong> Check your backend console log for the OTP.</small>
                            </div>
                            <form onSubmit={handleOtpSubmit}>
                                <div className="mb-3">
                                    <label className="form-label fw-semibold">Enter 6-digit OTP</label>
                                    <input type="text" className="form-control form-control-lg text-center"
                                        value={otpCode} onChange={e => setOtpCode(e.target.value.replace(/\D/g,'').slice(0,6))}
                                        placeholder="_ _ _ _ _ _" maxLength={6}
                                        style={{letterSpacing:'12px', fontSize:'24px', fontWeight:'bold'}}
                                        required autoFocus />
                                    <small className="text-muted">OTP is valid for 5 minutes</small>
                                </div>
                                {error && <div className="alert alert-danger">{error}</div>}
                                <div className="d-flex gap-2">
                                    <button type="submit" className="btn btn-warning flex-grow-1" disabled={loading}>
                                        {loading ? <><span className="spinner-border spinner-border-sm me-2"></span>Verifying...</> : '🔓 Verify & Complete Transfer'}
                                    </button>
                                    <button type="button" className="btn btn-outline-secondary"
                                        onClick={() => { setRequires2FA(false); setChallengeId(''); setOtpCode(''); setError(''); }}>
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Main Form */}
                {!requires2FA && (
                    <div className="card shadow-sm">
                        <div className="card-header py-3 d-flex justify-content-between align-items-center">
                            <h4 className="mb-0">💸 Send Money</h4>
                            {myAccounts.length > 0 && <small className="text-muted">{myAccounts.length} account{myAccounts.length > 1 ? 's' : ''} available</small>}
                        </div>
                        <div className="card-body p-4">
                            {message && (
                                <div className="alert alert-success alert-dismissible fade show">
                                    {message}
                                    <button type="button" className="btn-close" onClick={() => setMessage('')}></button>
                                </div>
                            )}
                            {error && (
                                <div className="alert alert-danger alert-dismissible fade show">
                                    ⚠ {error}
                                    <button type="button" className="btn-close" onClick={() => setError('')}></button>
                                </div>
                            )}

                            <form onSubmit={handleSubmit}>
                                {/* FROM */}
                                <div className="mb-4">
                                    <label className="form-label fw-semibold">From Account</label>
                                    {myAccounts.length === 0 ? (
                                        <div className="alert alert-warning py-2 mb-0">⚠ No accounts — use button above.</div>
                                    ) : (
                                        <>
                                            <select className="form-select" value={fromAccount} onChange={e => setFromAccount(e.target.value)} required>
                                                {myAccounts.map(a => (
                                                    <option key={a.id} value={a.accountNumber}>
                                                        {a.accountType} — {a.accountNumber} | Balance: {formatINR(a.balance)}
                                                    </option>
                                                ))}
                                            </select>
                                            {selectedFrom && (
                                                <small className="text-muted">
                                                    Available: <strong className="text-success">{formatINR(selectedFrom.balance)}</strong>
                                                </small>
                                            )}
                                        </>
                                    )}
                                </div>

                                {/* TO */}
                                <div className="mb-4">
                                    <label className="form-label fw-semibold">To Account</label>
                                    {otherAccounts.length === 0 ? (
                                        <div className="alert alert-info py-2 mb-0">ℹ No other accounts registered yet.</div>
                                    ) : (
                                        <>
                                            <select className="form-select" value={toAccount} onChange={e => setToAccount(e.target.value)} required>
                                                {otherAccounts.map(a => (
                                                    <option key={a.id} value={a.accountNumber}>
                                                        {a.user?.username ? `${a.user.username} — ` : ''}{a.accountType} — {a.accountNumber}
                                                    </option>
                                                ))}
                                            </select>
                                            {selectedTo && (
                                                <small className="text-muted">
                                                    Recipient: <strong>{selectedTo.user?.username || 'Unknown'}</strong> ({selectedTo.accountType})
                                                </small>
                                            )}
                                        </>
                                    )}
                                </div>

                                {/* AMOUNT in ₹ */}
                                <div className="mb-4">
                                    <label className="form-label fw-semibold">Amount (₹)</label>
                                    <div className="input-group">
                                        <span className="input-group-text">₹</span>
                                        <input type="number" className="form-control"
                                            value={amount} onChange={e => setAmount(e.target.value)}
                                            placeholder="0.00" min="0.01" step="0.01" required />
                                    </div>
                                    {selectedFrom && amount && parseFloat(amount) > parseFloat(selectedFrom.balance) && (
                                        <small className="text-danger">⚠ Amount exceeds available balance of {formatINR(selectedFrom.balance)}</small>
                                    )}
                                    {amount && parseFloat(amount) > 10000 && (
                                        <small className="text-warning d-block">
                                            ⚠ Transfers over ₹10,000 require 2FA verification
                                        </small>
                                    )}
                                </div>

                                {/* DESCRIPTION */}
                                <div className="mb-4">
                                    <label className="form-label fw-semibold">Description <span className="text-muted fw-normal">(optional)</span></label>
                                    <input type="text" className="form-control" value={description}
                                        onChange={e => setDescription(e.target.value)}
                                        placeholder="e.g. Rent, Lunch, etc." maxLength={100} />
                                </div>

                                <button type="submit" className="btn btn-primary w-100 py-2 fw-semibold"
                                    disabled={loading || myAccounts.length === 0 || otherAccounts.length === 0}>
                                    {loading ? <><span className="spinner-border spinner-border-sm me-2"></span>Processing...</> : '💸 Send Money'}
                                </button>
                            </form>
                        </div>
                    </div>
                )}

                {/* Balance Summary in ₹ */}
                {myAccounts.length > 0 && (
                    <div className="mt-3">
                        <small className="text-muted fw-semibold d-block mb-2">YOUR ACCOUNTS</small>
                        <div className="row g-2">
                            {myAccounts.map(a => (
                                <div key={a.id} className="col-6">
                                    <div className="card border-0 bg-light">
                                        <div className="card-body py-2 px-3">
                                            <div className="small text-muted">{a.accountType}</div>
                                            <div className="fw-bold text-success">{formatINR(a.balance)}</div>
                                            <div className="small text-muted" style={{fontSize:'11px'}}>{a.accountNumber}</div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default Transfer;
