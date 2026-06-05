import React, { useState, useEffect } from 'react';
import axios from 'axios';
import API_BASE_URL from '../config/api';

const AUDIT_URL = `${API_BASE_URL}/audit`;

const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    return d.toLocaleString('en-IN', {
        day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true
    });
};

function AuditLog() {
    const [logs,       setLogs]       = useState([]);
    const [loading,    setLoading]    = useState(true);
    const [error,      setError]      = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [filterAction, setFilterAction] = useState('ALL');
    const [page,       setPage]       = useState(0);
    const PAGE_SIZE = 20;

    const role    = localStorage.getItem('role');
    const headers = { Authorization: `Bearer ${localStorage.getItem('token')}` };

    useEffect(() => { fetchLogs(); }, []);

    const fetchLogs = async () => {
        setLoading(true);
        setError('');
        try {
            const res = await axios.get(AUDIT_URL, { headers });
            setLogs(res.data);
        } catch (err) {
            if (err.response?.status === 403) {
                setError('Access denied. Admin role required to view audit logs.');
            } else {
                setError('Failed to load audit logs.');
            }
        } finally {
            setLoading(false);
        }
    };

    const filtered = logs.filter(log => {
        const matchSearch = !searchTerm ||
            (log.username  && log.username.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (log.action    && log.action.toLowerCase().includes(searchTerm.toLowerCase()))   ||
            (log.method    && log.method.toLowerCase().includes(searchTerm.toLowerCase()))   ||
            (log.ipAddress && log.ipAddress.includes(searchTerm));

        const matchFilter = filterAction === 'ALL' ||
            (log.action && log.action.toUpperCase().includes(filterAction));

        return matchSearch && matchFilter;
    });

    const paginated  = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
    const totalPages = Math.ceil(filtered.length / PAGE_SIZE);

    if (loading) return (
        <div className="text-center mt-5">
            <div className="spinner-border text-primary" role="status"></div>
            <p className="mt-2 text-muted">Loading audit logs...</p>
        </div>
    );

    return (
        <div>
            <div className="d-flex align-items-center mb-1">
                <h2 className="mb-0">🔍 Audit Log</h2>
                <span className="badge bg-warning text-dark ms-2">Admin</span>
            </div>
            <p className="text-muted small mb-3">
                All controller method calls are logged by AspectJ AuditAspect (Week 4)
            </p>

            {error && (
                <div className="alert alert-danger">
                    {error}
                    {role !== 'ADMIN' && (
                        <div className="mt-2 small">You are logged in as: <strong>{role}</strong></div>
                    )}
                </div>
            )}

            {!error && (
                <>
                    {/* Filters */}
                    <div className="card shadow-sm mb-3">
                        <div className="card-body py-2">
                            <div className="row g-2 align-items-center">
                                <div className="col-md-5">
                                    <input
                                        type="text"
                                        className="form-control form-control-sm"
                                        placeholder="Search by username, action, method, IP..."
                                        value={searchTerm}
                                        onChange={e => { setSearchTerm(e.target.value); setPage(0); }}
                                    />
                                </div>
                                <div className="col-md-3">
                                    <select
                                        className="form-select form-select-sm"
                                        value={filterAction}
                                        onChange={e => { setFilterAction(e.target.value); setPage(0); }}
                                    >
                                        <option value="ALL">All Actions</option>
                                        <option value="GET">GET requests</option>
                                        <option value="POST">POST requests</option>
                                        <option value="PUT">PUT requests</option>
                                        <option value="DELETE">DELETE requests</option>
                                    </select>
                                </div>
                                <div className="col-md-2 text-muted small">
                                    {filtered.length} / {logs.length} entries
                                </div>
                                <div className="col-md-2 text-end">
                                    <button className="btn btn-outline-secondary btn-sm" onClick={fetchLogs}>
                                        🔄 Refresh
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="card shadow-sm">
                        <div className="table-responsive">
                            <table className="table table-hover table-sm mb-0">
                                <thead className="table-dark">
                                    <tr>
                                        <th style={{ width: '50px' }}>#</th>
                                        <th>Timestamp</th>
                                        <th>Username</th>
                                        <th>Action</th>
                                        <th>Method</th>
                                        <th>IP Address</th>
                                        <th>Result</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {paginated.length === 0 ? (
                                        <tr>
                                            <td colSpan={7} className="text-center text-muted py-4">
                                                No audit logs found.
                                            </td>
                                        </tr>
                                    ) : (
                                        paginated.map((log, idx) => (
                                            <tr key={log.id}>
                                                <td className="text-muted small">{page * PAGE_SIZE + idx + 1}</td>
                                                <td className="small text-nowrap">{formatDate(log.createdAt)}</td>
                                                <td>
                                                    <span className="badge bg-secondary">{log.username || 'anonymous'}</span>
                                                </td>
                                                <td>
                                                    <ActionBadge action={log.action} />
                                                </td>
                                                <td className="small text-muted font-monospace" style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                    {log.method}
                                                </td>
                                                <td className="small font-monospace">{log.ipAddress}</td>
                                                <td style={{ maxWidth: '200px' }}>
                                                    <ResultCell result={log.result} />
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="card-footer d-flex justify-content-between align-items-center py-2">
                                <button
                                    className="btn btn-outline-secondary btn-sm"
                                    disabled={page === 0}
                                    onClick={() => setPage(p => p - 1)}
                                >← Prev</button>
                                <span className="text-muted small">Page {page + 1} of {totalPages}</span>
                                <button
                                    className="btn btn-outline-secondary btn-sm"
                                    disabled={page >= totalPages - 1}
                                    onClick={() => setPage(p => p + 1)}
                                >Next →</button>
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}

function ActionBadge({ action }) {
    if (!action) return <span className="text-muted">-</span>;
    const method = action.split(' ')[0];
    const color  = method === 'GET' ? 'info' : method === 'POST' ? 'success' : method === 'PUT' ? 'warning' : method === 'DELETE' ? 'danger' : 'secondary';
    return (
        <span>
            <span className={`badge bg-${color} me-1`}>{method}</span>
            <small className="text-muted">{action.split(' ').slice(1).join(' ')}</small>
        </span>
    );
}

function ResultCell({ result }) {
    const [expanded, setExpanded] = useState(false);
    if (!result) return <span className="text-muted">-</span>;
    const isError   = result.startsWith('ERROR');
    const short     = result.length > 60 ? result.substring(0, 60) + '...' : result;

    return (
        <span>
            <span className={isError ? 'text-danger small' : 'text-success small'}>
                {isError ? '✗' : '✓'} {expanded ? result : short}
            </span>
            {result.length > 60 && (
                <button
                    className="btn btn-link btn-sm p-0 ms-1"
                    style={{ fontSize: '10px' }}
                    onClick={() => setExpanded(e => !e)}
                >
                    {expanded ? 'less' : 'more'}
                </button>
            )}
        </span>
    );
}

export default AuditLog;
