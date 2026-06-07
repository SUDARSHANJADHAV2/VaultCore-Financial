import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
    Legend, ResponsiveContainer, AreaChart, Area
} from 'recharts';
import { STOCKS_URL } from '../config/api';

const formatINR = (amount) =>
    new Intl.NumberFormat('en-IN', {
        style: 'currency', currency: 'INR', minimumFractionDigits: 2
    }).format(amount);

const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white border rounded p-2 shadow-sm">
                <p className="mb-0 small text-muted">{label}</p>
                <p className="mb-0 fw-bold text-primary">{formatINR(payload[0].value)}</p>
            </div>
        );
    }
    return null;
};

// ✅ Week 3: Latency badge — green <100ms, yellow 100-300ms, red >300ms
const LatencyBadge = ({ ms }) => {
    if (ms === null) return null;
    const color  = ms < 100 ? 'success' : ms < 300 ? 'warning' : 'danger';
    const label  = ms < 300 ? `${ms}ms ✓` : `${ms}ms ⚠ >300ms`;
    return (
        <span className={`badge bg-${color} ms-2`} title="Round-trip latency">
            ⏱ {label}
        </span>
    );
};

function Portfolio() {
    const [stocks,        setStocks]        = useState([]);
    const [selectedStock, setSelectedStock] = useState('AAPL');
    const [stockData,     setStockData]     = useState([]);
    const [loading,       setLoading]       = useState(true);
    const [error,         setError]         = useState('');
    const [latencyMs,     setLatencyMs]     = useState(null);
    const [latencyViolations, setLatencyViolations] = useState(0);

    useEffect(() => { fetchStocks(); }, []);

    useEffect(() => {
        if (!selectedStock) return;
        setStockData([]);
        fetchStockPrice(selectedStock);
        const interval = setInterval(() => fetchStockPrice(selectedStock), 5000);
        return () => clearInterval(interval);
    }, [selectedStock]);

    const fetchStocks = async () => {
        try {
            const response = await axios.get(STOCKS_URL, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            const stocksList = Object.entries(response.data).map(([symbol, price]) => ({ symbol, price }));
            setStocks(stocksList);
            if (stocksList.length > 0) setSelectedStock(stocksList[0].symbol);
        } catch (err) {
            setError('Failed to load stocks. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const fetchStockPrice = async (symbol) => {
        const t0 = performance.now();
        try {
            const response = await axios.get(`${STOCKS_URL}/${symbol}`, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            const t1       = performance.now();
            const clientMs = Math.round(t1 - t0);
            // Use server-reported responseTime if available, else client round-trip
            const serverMs = response.data.responseTime ?? clientMs;
            setLatencyMs(clientMs);
            if (clientMs > 300) {
                setLatencyViolations(v => v + 1);
            }

            setStockData(prev => {
                const newPoint = {
                    time:    new Date().toLocaleTimeString('en-IN'),
                    price:   response.data.price,
                    latency: clientMs
                };
                const newData = [...prev, newPoint];
                return newData.length > 20 ? newData.slice(newData.length - 20) : newData;
            });

            // Update stock list price live
            setStocks(prev => prev.map(s =>
                s.symbol === symbol ? { ...s, price: response.data.price } : s
            ));
        } catch (err) {
            console.error('Error fetching stock price:', err);
        }
    };

    if (loading) return (
        <div className="text-center mt-5">
            <div className="spinner-border text-primary" role="status"></div>
            <p className="mt-2 text-muted">Loading stocks...</p>
        </div>
    );

    const latestPrice = stockData.length > 0 ? stockData[stockData.length - 1].price : null;
    const prevPrice   = stockData.length > 1 ? stockData[stockData.length - 2].price : null;
    const priceChange = latestPrice && prevPrice ? latestPrice - prevPrice : 0;
    const isUp        = priceChange >= 0;

    // Latency stats
    const latencies      = stockData.map(d => d.latency).filter(Boolean);
    const avgLatency     = latencies.length > 0 ? Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length) : null;
    const maxLatency     = latencies.length > 0 ? Math.max(...latencies) : null;

    return (
        <div>
            <div className="d-flex align-items-center mb-1">
                <h2 className="mb-0">📈 Stock Portfolio</h2>
                {latencyMs !== null && <LatencyBadge ms={latencyMs} />}
            </div>
            <p className="text-muted small mb-3">
                Live prices via mock REST API · Updates every 5s · Prices in ₹ (INR)
            </p>

            {error && (
                <div className="alert alert-danger alert-dismissible fade show">
                    {error}
                    <button type="button" className="btn-close" onClick={() => setError('')}></button>
                </div>
            )}

            {/* ✅ Week 3 Latency Stats Bar */}
            {latencies.length > 0 && (
                <div className={`alert ${latencyViolations > 0 ? 'alert-warning' : 'alert-success'} py-2 mb-3`}>
                    <strong>⏱ Latency Monitor</strong>
                    <span className="ms-3">Last: <strong>{latencyMs}ms</strong></span>
                    <span className="ms-3">Avg: <strong>{avgLatency}ms</strong></span>
                    <span className="ms-3">Max: <strong>{maxLatency}ms</strong></span>
                    <span className="ms-3">Target: <strong>&lt;300ms</strong></span>
                    {latencyViolations > 0 && (
                        <span className="ms-3 text-danger">
                            ⚠ {latencyViolations} violation{latencyViolations > 1 ? 's' : ''}
                        </span>
                    )}
                    {latencyViolations === 0 && latencies.length > 0 && (
                        <span className="ms-3 text-success">✓ All within 300ms SLA</span>
                    )}
                </div>
            )}

            <div className="row mt-2">
                {/* Stock List */}
                <div className="col-md-4">
                    <div className="card shadow-sm h-100">
                        <div className="card-header">
                            <h5 className="mb-0">Available Stocks</h5>
                            <small className="text-muted">Click to view live chart</small>
                        </div>
                        <div className="card-body p-0">
                            <div className="list-group list-group-flush">
                                {stocks.map(stock => (
                                    <button
                                        key={stock.symbol}
                                        className={`list-group-item list-group-item-action d-flex justify-content-between align-items-center
                                            ${selectedStock === stock.symbol ? 'active' : ''}`}
                                        onClick={() => setSelectedStock(stock.symbol)}
                                    >
                                        <div>
                                            <div className="fw-bold">{stock.symbol}</div>
                                            <small className={selectedStock === stock.symbol ? 'text-white-50' : 'text-muted'}>
                                                {stock.symbol === 'AAPL' ? 'Apple Inc.' :
                                                 stock.symbol === 'GOOGL' ? 'Alphabet Inc.' :
                                                 stock.symbol === 'MSFT' ? 'Microsoft Corp.' :
                                                 stock.symbol === 'AMZN' ? 'Amazon.com Inc.' : stock.symbol}
                                            </small>
                                        </div>
                                        <span className={`badge rounded-pill ${selectedStock === stock.symbol ? 'bg-white text-primary' : 'bg-primary'}`}>
                                            {formatINR(stock.price)}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Chart Area */}
                <div className="col-md-8">
                    {/* Price chart */}
                    <div className="card shadow-sm mb-3">
                        <div className="card-header d-flex justify-content-between align-items-center">
                            <div>
                                <h5 className="mb-0">{selectedStock} — Live Price</h5>
                                <small className="text-muted">Last 20 data points · ₹ INR</small>
                            </div>
                            {latestPrice && (
                                <div className="text-end">
                                    <div className="fw-bold fs-5">{formatINR(latestPrice)}</div>
                                    <small className={isUp ? 'text-success' : 'text-danger'}>
                                        {isUp ? '▲' : '▼'} {formatINR(Math.abs(priceChange))}
                                    </small>
                                </div>
                            )}
                        </div>
                        <div className="card-body">
                            {stockData.length === 0 ? (
                                <div className="text-center py-5 text-muted">
                                    <div className="spinner-border spinner-border-sm me-2"></div>
                                    Fetching live price data...
                                </div>
                            ) : (
                                <ResponsiveContainer width="100%" height={240}>
                                    <AreaChart data={stockData}>
                                        <defs>
                                            <linearGradient id="priceGrad" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%"  stopColor="#6366f1" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="#6366f1" stopOpacity={0}   />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="time" tick={{ fontSize: 10 }} />
                                        <YAxis
                                            tickFormatter={(v) => `₹${v.toFixed(0)}`}
                                            domain={['auto', 'auto']}
                                            tick={{ fontSize: 10 }}
                                        />
                                        <Tooltip content={<CustomTooltip />} />
                                        <Legend />
                                        <Area
                                            type="monotone"
                                            dataKey="price"
                                            stroke="#6366f1"
                                            strokeWidth={2}
                                            fill="url(#priceGrad)"
                                            name={`${selectedStock} (₹)`}
                                            dot={false}
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            )}
                        </div>
                    </div>

                    {/* ✅ Week 3: Latency chart */}
                    {stockData.length > 1 && (
                        <div className="card shadow-sm">
                            <div className="card-header">
                                <h6 className="mb-0">⏱ API Latency (ms) — Round-trip per request</h6>
                                <small className="text-muted">Red line = 300ms SLA threshold</small>
                            </div>
                            <div className="card-body pt-2">
                                <ResponsiveContainer width="100%" height={140}>
                                    <LineChart data={stockData}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="time" tick={{ fontSize: 9 }} />
                                        <YAxis domain={[0, Math.max(400, maxLatency + 50)]} tick={{ fontSize: 9 }} />
                                        <Tooltip formatter={(v) => [`${v}ms`, 'Latency']} />
                                        {/* 300ms threshold line via reference */}
                                        <Line type="monotone" dataKey="latency" stroke="#22c55e" strokeWidth={2} dot={false} name="Latency (ms)" />
                                        {/* Constant 300ms line */}
                                        <Line
                                            type="monotone"
                                            data={stockData.map(d => ({ ...d, threshold: 300 }))}
                                            dataKey="threshold"
                                            stroke="#ef4444"
                                            strokeDasharray="4 4"
                                            strokeWidth={1}
                                            dot={false}
                                            name="300ms SLA"
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default Portfolio;
