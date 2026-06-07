import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ACCOUNTS_URL } from '../config/api';

const formatINR = (amount) =>
    new Intl.NumberFormat('en-IN', {
        style: 'currency', currency: 'INR', minimumFractionDigits: 2
    }).format(amount);

const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleString('en-IN', {
        day:    '2-digit',
        month:  'short',
        year:   'numeric',
        hour:   '2-digit',
        minute: '2-digit',
        hour12: true
    });
};

function TransactionHistory() {
    const [accounts,     setAccounts]     = useState([]);
    const [selectedAcc,  setSelectedAcc]  = useState('');
    const [transactions, setTransactions] = useState([]);
    const [filtered,     setFiltered]     = useState([]);
    const [loading,      setLoading]      = useState(true);
    const [txnLoading,   setTxnLoading]   = useState(false);
    const [error,        setError]        = useState('');
    const [filterType,   setFilterType]   = useState('ALL');   // ALL / DEBIT / CREDIT
    const [searchTerm,   setSearchTerm]   = useState('');
    const [sortOrder,    setSortOrder]    = useState('DESC');   // DESC = newest first

    const userId  = localStorage.getItem('userId');
    const headers = { Authorization: `Bearer ${localStorage.getItem('token')}` };

    // Load user's accounts on mount
    useEffect(() => {
        const fetchAccounts = async () => {
            try {
                const res = await axios.get(`${ACCOUNTS_URL}/user/${userId}`, { headers });
                setAccounts(res.data);
                if (res.data.length > 0) {
                    setSelectedAcc(res.data[0].accountNumber);
                }
            } catch {
                setError('Failed to load accounts.');
            } finally {
                setLoading(false);
            }
        };
        fetchAccounts();
    }, []);

    // Load transactions when account changes
    useEffect(() => {
        if (!selectedAcc) return;
        fetchTransactions(selectedAcc);
    }, [selectedAcc]);

    // Apply filters whenever transactions / filter / search / sort changes
    useEffect(() => {
        let result = [...transactions];

        // Filter by type
        if (filterType !== 'ALL') {
            result = result.filter(t => t.entryType === filterType);
        }

        // Search by description or transaction ID
        if (searchTerm.trim()) {
            const term = searchTerm.toLowerCase();
            result = result.filter(t =>
                (t.description || '').toLowerCase().includes(term) ||
                (t.transactionId || '').toLowerCase().includes(term) ||
                (t.counterpartAccount || '').toLowerCase().includes(term)
            );
        }

        // Sort
        result.sort((a, b) => {
            const da = new Date(a.createdAt);
            const db = new Date(b.createdAt);
            return sortOrder === 'DESC' ? db - da : da - db;
        });

        setFiltered(result);
    }, [transactions, filterType, searchTerm, sortOrder]);

    const fetchTransactions = async (accountNumber) => {
        setTxnLoading(true);
        setError('');
        try {
            const res = await axios.get(`${ACCOUNTS_URL}/${accountNumber}/history`, { headers });
            setTransactions(res.data);
        } catch {
            setError('Failed to load transactions.');
            setTransactions([]);
        } finally {
            setTxnLoading(false);
        }
    };

    // Summary stats
    const totalCredit = transactions
        .filter(t => t.entryType === 'CREDIT')
        .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);

    const totalDebit = transactions
        .filter(t => t.entryType === 'DEBIT')
        .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);

    const selectedAccount = accounts.find(a => a.accountNumber === selectedAcc);

    if (loading) return (
        <div className="text-center mt-5">
            <div className="spinner-border text-primary" role="status"></div>
            <p className="mt-2 text-muted">Loading accounts...</p>
        </div>
    );

    return (
        <div>
            <h2 className="mb-1">📋 Transaction History</h2>
            <p className="text-muted mb-4">View all your past transactions and ledger entries.</p>

            {error && (
                <div className="alert alert-danger alert-dismissible fade show">
                    {error}
                    <button type="button" className="btn-close" onClick={() => setError('')}></button>
                </div>
            )}

            {/* Account Selector */}
            <div className="card shadow-sm mb-4">
                <div className="card-body">
                    <div className="row align-items-center g-3">
                        <div className="col-md-5">
                            <label className="form-label fw-semibold mb-1">Select Account</label>
                            <select
                                className="form-select"
                                value={selectedAcc}
                                onChange={e => setSelectedAcc(e.target.value)}
                            >
                                {accounts.map(a => (
                                    <option key={a.id} value={a.accountNumber}>
                                        {a.accountType} — {a.accountNumber} | {formatINR(a.balance)}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Summary Stats */}
                        {selectedAccount && (
                            <>
                                <div className="col-md-2 text-center">
                                    <div className="text-muted small">Current Balance</div>
                                    <div className="fw-bold text-primary">{formatINR(selectedAccount.balance)}</div>
                                </div>
                                <div className="col-md-2 text-center">
                                    <div className="text-muted small">Total Received</div>
                                    <div className="fw-bold text-success">+{formatINR(totalCredit)}</div>
                                </div>
                                <div className="col-md-2 text-center">
                                    <div className="text-muted small">Total Sent</div>
                                    <div className="fw-bold text-danger">-{formatINR(totalDebit)}</div>
                                </div>
                                <div className="col-md-1 text-center">
                                    <div className="text-muted small">Txns</div>
                                    <div className="fw-bold">{transactions.length}</div>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Filters Row */}
            <div className="card shadow-sm mb-3">
                <div className="card-body py-2">
                    <div className="row align-items-center g-2">

                        {/* Search */}
                        <div className="col-md-5">
                            <div className="input-group input-group-sm">
                                <span className="input-group-text">🔍</span>
                                <input
                                    type="text"
                                    className="form-control"
                                    placeholder="Search by description, transaction ID..."
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                />
                                {searchTerm && (
                                    <button className="btn btn-outline-secondary" onClick={() => setSearchTerm('')}>✕</button>
                                )}
                            </div>
                        </div>

                        {/* Type Filter */}
                        <div className="col-md-3">
                            <div className="btn-group btn-group-sm w-100" role="group">
                                {['ALL', 'CREDIT', 'DEBIT'].map(type => (
                                    <button
                                        key={type}
                                        className={`btn ${filterType === type
                                            ? type === 'CREDIT' ? 'btn-success'
                                            : type === 'DEBIT'  ? 'btn-danger'
                                            : 'btn-primary'
                                            : 'btn-outline-secondary'}`}
                                        onClick={() => setFilterType(type)}
                                    >
                                        {type === 'ALL' ? 'All' : type === 'CREDIT' ? '↓ Received' : '↑ Sent'}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Sort */}
                        <div className="col-md-2">
                            <select
                                className="form-select form-select-sm"
                                value={sortOrder}
                                onChange={e => setSortOrder(e.target.value)}
                            >
                                <option value="DESC">Newest First</option>
                                <option value="ASC">Oldest First</option>
                            </select>
                        </div>

                        {/* Result count */}
                        <div className="col-md-2 text-end">
                            <small className="text-muted">
                                {filtered.length} of {transactions.length} transactions
                            </small>
                        </div>
                    </div>
                </div>
            </div>

            {/* Transaction List */}
            {txnLoading ? (
                <div className="text-center py-5">
                    <div className="spinner-border text-primary" role="status"></div>
                    <p className="mt-2 text-muted">Loading transactions...</p>
                </div>
            ) : filtered.length === 0 ? (
                <div className="card border-0 shadow-sm">
                    <div className="card-body text-center py-5">
                        <div style={{fontSize:'48px'}}>📭</div>
                        <h5 className="mt-3">No transactions found</h5>
                        <p className="text-muted">
                            {transactions.length === 0
                                ? 'No transactions have been made from this account yet.'
                                : 'No transactions match your current filters.'}
                        </p>
                        {transactions.length > 0 && (
                            <button className="btn btn-outline-primary btn-sm"
                                onClick={() => { setFilterType('ALL'); setSearchTerm(''); }}>
                                Clear Filters
                            </button>
                        )}
                    </div>
                </div>
            ) : (
                <div className="card shadow-sm">
                    <div className="card-body p-0">
                        <div className="table-responsive">
                            <table className="table table-hover mb-0">
                                <thead className="table-light">
                                    <tr>
                                        <th style={{width:'40px'}}></th>
                                        <th>Transaction ID</th>
                                        <th>Description</th>
                                        <th>{filterType === 'DEBIT' ? 'Sent To' : filterType === 'CREDIT' ? 'Received From' : 'Counterpart'}</th>
                                        <th className="text-end">Amount</th>
                                        <th className="text-end">Balance After</th>
                                        <th>Date & Time</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filtered.map((txn, idx) => {
                                        const isCredit = txn.entryType === 'CREDIT';
                                        return (
                                            <tr key={idx}>
                                                {/* Icon */}
                                                <td className="text-center align-middle">
                                                    <span style={{fontSize:'20px'}}>
                                                        {isCredit ? '📥' : '📤'}
                                                    </span>
                                                </td>

                                                {/* Transaction ID */}
                                                <td className="align-middle">
                                                    <span className="badge bg-light text-dark border"
                                                        style={{fontSize:'10px', fontFamily:'monospace'}}>
                                                        {txn.transactionId
                                                            ? txn.transactionId.substring(0, 16) + '...'
                                                            : '—'}
                                                    </span>
                                                </td>

                                                {/* Description */}
                                                <td className="align-middle">
                                                    <span className="fw-semibold">
                                                        {txn.description || 'Transfer'}
                                                    </span>
                                                </td>

                                                {/* Counterpart account */}
                                                <td className="align-middle">
                                                    <small className="text-muted" style={{fontFamily:'monospace'}}>
                                                        {txn.counterpartAccount || '—'}
                                                    </small>
                                                </td>

                                                {/* Amount in INR */}
                                                <td className="text-end align-middle">
                                                    <span className={`fw-bold ${isCredit ? 'text-success' : 'text-danger'}`}>
                                                        {isCredit ? '+' : '-'}{formatINR(txn.amount)}
                                                    </span>
                                                    <div>
                                                        <span className={`badge ${isCredit ? 'bg-success' : 'bg-danger'} bg-opacity-10
                                                            ${isCredit ? 'text-success' : 'text-danger'}`}
                                                            style={{fontSize:'10px'}}>
                                                            {isCredit ? '↓ RECEIVED' : '↑ SENT'}
                                                        </span>
                                                    </div>
                                                </td>

                                                {/* Balance After in INR */}
                                                <td className="text-end align-middle">
                                                    <small className="text-muted">
                                                        {txn.balanceAfter != null ? formatINR(txn.balanceAfter) : '—'}
                                                    </small>
                                                </td>

                                                {/* Date */}
                                                <td className="align-middle">
                                                    <small>{formatDate(txn.createdAt)}</small>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default TransactionHistory;
