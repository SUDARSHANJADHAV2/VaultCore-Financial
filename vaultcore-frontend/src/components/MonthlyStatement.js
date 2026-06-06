import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ACCOUNTS_URL } from '../config/api';
import API_BASE_URL from '../config/api';

const STATEMENT_URL = `${API_BASE_URL}/statements`;

const MONTHS = [
    'January','February','March','April','May','June',
    'July','August','September','October','November','December'
];


const formatINR = (amount) =>
    new Intl.NumberFormat('en-IN', {
        style:    'currency',
        currency: 'INR',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(amount);

const formatRupee = (amount) =>
    `₹${new Intl.NumberFormat('en-IN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(amount)}`;

function MonthlyStatement() {
    const [accounts,    setAccounts]    = useState([]);
    const [selectedAcc, setSelectedAcc] = useState('');
    const [month,       setMonth]       = useState(new Date().getMonth() + 1); // 1-12
    const [year,        setYear]        = useState(new Date().getFullYear());
    const [loading,     setLoading]     = useState(false);
    const [fetchingAcc, setFetchingAcc] = useState(true);
    const [error,       setError]       = useState('');
    const [success,     setSuccess]     = useState('');

    const userId  = localStorage.getItem('userId');
    const headers = { Authorization: `Bearer ${localStorage.getItem('token')}` };

    useEffect(() => {
        const fetchAccounts = async () => {
            try {
                const res = await axios.get(`${ACCOUNTS_URL}/user/${userId}`, { headers });
                setAccounts(res.data);
                if (res.data.length > 0) setSelectedAcc(res.data[0].accountNumber);
            } catch {
                setError('Failed to load accounts.');
            } finally {
                setFetchingAcc(false);
            }
        };
        fetchAccounts();
    }, []);

    const handleDownload = async () => {
        if (!selectedAcc) return;
        setLoading(true);
        setError('');
        setSuccess('');
        try {
            const response = await axios.get(`${STATEMENT_URL}/monthly`, {
                params:       { accountNumber: selectedAcc, month, year },
                headers:      { ...headers, Accept: 'application/pdf' },
                responseType: 'blob',
            });

            // Create download link
            const blob = new Blob([response.data], { type: 'application/pdf' });
            const url  = URL.createObjectURL(blob);
            const a    = document.createElement('a');
            a.href     = url;
            a.download = `VaultCore_Statement_${selectedAcc}_${MONTHS[month - 1]}_${year}.pdf`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            setSuccess(`✅ Statement downloaded: ${MONTHS[month - 1]} ${year}`);
        } catch (err) {
            if (err.response?.status === 404) {
                setError('No transactions found for the selected period.');
            } else {
                setError('Failed to generate statement. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    // Generate year options: current year and previous 2
    const years = [year, year - 1, year - 2];

    // Find selected account details
    const selectedAccountDetails = accounts.find(acc => acc.accountNumber === selectedAcc);

    if (fetchingAcc) return (
        <div className="text-center mt-5">
            <div className="spinner-border text-primary" role="status"></div>
        </div>
    );

    return (
        <div>
            <div className="d-flex align-items-center mb-1">
                <h2 className="mb-0">📄 Monthly Statement</h2>
            </div>
            <p className="text-muted small mb-4">
                Generate and download a PDF bank statement for any month &middot; Amounts in Indian Rupees (₹) &middot; Powered by iText (Week 4)
            </p>

            {error && (
                <div className="alert alert-danger alert-dismissible fade show">
                    {error}
                    <button type="button" className="btn-close" onClick={() => setError('')}></button>
                </div>
            )}
            {success && (
                <div className="alert alert-success alert-dismissible fade show">
                    {success}
                    <button type="button" className="btn-close" onClick={() => setSuccess('')}></button>
                </div>
            )}

            <div className="row justify-content-center">
                <div className="col-md-7">
                    <div className="card shadow">
                        <div className="card-header bg-primary text-white">
                            <h5 className="mb-0">📑 Generate PDF Statement</h5>
                        </div>
                        <div className="card-body">

                            {/* Account selector */}
                            <div className="mb-3">
                                <label className="form-label fw-semibold">Account</label>
                                <select
                                    className="form-select"
                                    value={selectedAcc}
                                    onChange={e => setSelectedAcc(e.target.value)}
                                >
                                    {accounts.map(acc => (
                                        <option key={acc.accountNumber} value={acc.accountNumber}>
                                            {acc.accountNumber} — {acc.accountType}
                                            {acc.balance !== undefined
                                                ? ` (Bal: ${formatRupee(acc.balance)})`
                                                : ''}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Show account balance in INR if available */}
                            {selectedAccountDetails?.balance !== undefined && (
                                <div className="mb-3 d-flex align-items-center gap-2">
                                    <span className="badge bg-success fs-6">
                                        ₹ Current Balance: {formatINR(selectedAccountDetails.balance)}
                                    </span>
                                </div>
                            )}

                            {/* Month & Year */}
                            <div className="row mb-3">
                                <div className="col-7">
                                    <label className="form-label fw-semibold">Month</label>
                                    <select
                                        className="form-select"
                                        value={month}
                                        onChange={e => setMonth(Number(e.target.value))}
                                    >
                                        {MONTHS.map((m, i) => (
                                            <option key={i + 1} value={i + 1}>{m}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="col-5">
                                    <label className="form-label fw-semibold">Year</label>
                                    <select
                                        className="form-select"
                                        value={year}
                                        onChange={e => setYear(Number(e.target.value))}
                                    >
                                        {years.map(y => (
                                            <option key={y} value={y}>{y}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Statement preview info */}
                            {selectedAcc && (
                                <div className="alert alert-info py-2 mb-3">
                                    <small>
                                        📄 Will generate statement for account <strong>{selectedAcc}</strong> for{' '}
                                        <strong>{MONTHS[month - 1]} {year}</strong>
                                        {' '}· All amounts displayed in <strong>Indian Rupees (₹ INR)</strong>
                                    </small>
                                </div>
                            )}

                            <button
                                className="btn btn-primary w-100"
                                onClick={handleDownload}
                                disabled={loading || !selectedAcc}
                            >
                                {loading ? (
                                    <><span className="spinner-border spinner-border-sm me-2"></span>Generating PDF...</>
                                ) : (
                                    '⬇ Download PDF Statement (₹ INR)'
                                )}
                            </button>
                        </div>

                        <div className="card-footer text-muted small">
                            <strong>📋 What's included:</strong> Account summary, opening/closing balance (₹),
                            all credits &amp; debits in INR, transaction descriptions, and VaultCore branding.
                        </div>
                    </div>

                    {/* Info card */}
                    <div className="card mt-3 border-0 bg-light">
                        <div className="card-body">
                            <h6>ℹ️ About PDF Statements</h6>
                            <ul className="small text-muted mb-0">
                                <li>Generated server-side using <strong>iText 7</strong> (external library)</li>
                                <li>All amounts shown in <strong>Indian Rupees (₹ INR)</strong> using Indian number format (e.g., ₹1,00,000.00)</li>
                                <li>Includes all ledger entries for the selected month</li>
                                <li>Password-protected PDF with your account number</li>
                                <li>Suitable for official/tax filing purposes under Indian tax law</li>
                            </ul>
                        </div>
                    </div>

                    {/* Currency format reference */}
                    <div className="card mt-3 border-0 border-start border-4 border-warning bg-warning bg-opacity-10">
                        <div className="card-body py-2">
                            <h6 className="mb-1">💱 Indian Rupee Format Reference</h6>
                            <div className="row small text-muted">
                                <div className="col-6">
                                    <div><span className="fw-semibold">₹1,000</span> — One Thousand</div>
                                    <div><span className="fw-semibold">₹1,00,000</span> — One Lakh</div>
                                </div>
                                <div className="col-6">
                                    <div><span className="fw-semibold">₹10,00,000</span> — Ten Lakh</div>
                                    <div><span className="fw-semibold">₹1,00,00,000</span> — One Crore</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export { formatINR, formatRupee };

export default MonthlyStatement;
