import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { AUTH_URL } from '../config/api';

function Login({ onLoginSuccess }) {
    const [username, setUsername]           = useState('');
    const [password, setPassword]           = useState('');
    const [email, setEmail]                 = useState('');
    const [phone, setPhone]                 = useState('');
    const [error, setError]                 = useState('');
    const [success, setSuccess]             = useState('');
    const [isRegistering, setIsRegistering] = useState(false);
    const [loading, setLoading]             = useState(false);
    const [showPassword, setShowPassword]   = useState(false);
    const navigate = useNavigate();

    // Inject spinner animation once
    useEffect(() => {
        const style = document.createElement('style');
        style.textContent = `@keyframes vc-spin { to { transform: rotate(360deg); } }`;
        document.head.appendChild(style);
        return () => document.head.removeChild(style);
    }, []);

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const response = await axios.post(`${AUTH_URL}/login`, { username, password });
            localStorage.setItem('token',        response.data.token);
            localStorage.setItem('refreshToken', response.data.refreshToken);
            localStorage.setItem('username',     response.data.username);
            localStorage.setItem('userId',       response.data.userId);
            localStorage.setItem('role',         response.data.role);
            if (onLoginSuccess) onLoginSuccess(response.data.token);
            setSuccess('Login successful! Redirecting...');
            setTimeout(() => navigate('/dashboard'), 1000);
        } catch (err) {
            const msg = err.response?.data?.message;
            if (err.response?.status === 401) setError('Invalid username or password.');
            else if (err.code === 'ERR_NETWORK') setError('Cannot connect to server. Is the backend running on port 8081?');
            else setError(msg || 'Login failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(''); setSuccess('');
        if (password.length < 6) { setError('Password must be at least 6 characters.'); setLoading(false); return; }
        try {
            const response = await axios.post(`${AUTH_URL}/register`, { username, password, email, phone: phone || null });
            setSuccess(response.data?.message || 'Registration successful! You can now login.');
            setTimeout(() => { setIsRegistering(false); setUsername(''); setPassword(''); setEmail(''); setPhone(''); setSuccess(''); }, 2500);
        } catch (err) {
            const msg = err.response?.data?.message;
            if (err.code === 'ERR_NETWORK') setError('Cannot connect to server. Is the backend running on port 8081?');
            else setError(msg || 'Registration failed. Please try again.');
        } finally { setLoading(false); }
    };

    const switchMode = () => { setIsRegistering(!isRegistering); setError(''); setSuccess(''); setUsername(''); setPassword(''); setEmail(''); setPhone(''); };

    const S = {
        page:        { display:'flex', minHeight:'100vh', fontFamily:"'Segoe UI',system-ui,sans-serif", margin:'-24px' },
        left:        { flex:'0 0 42%', background:'linear-gradient(145deg,#1e3a8a 0%,#1d4ed8 55%,#2563eb 100%)', display:'flex', flexDirection:'column', padding:'40px', color:'white', overflow:'hidden' },
        brand:       { display:'flex', alignItems:'center', gap:'12px', marginBottom:'64px' },
        brandName:   { fontSize:'22px', fontWeight:'700', letterSpacing:'-0.5px' },
        hero:        { fontSize:'42px', fontWeight:'800', lineHeight:1.15, margin:'0 0 20px', letterSpacing:'-1px' },
        sub:         { fontSize:'16px', opacity:0.8, lineHeight:1.6, margin:'0 0 36px', maxWidth:'340px' },
        features:    { display:'flex', flexDirection:'column', gap:'10px' },
        feat:        { fontSize:'14px', opacity:0.9, background:'rgba(255,255,255,0.1)', borderRadius:'8px', padding:'10px 16px', backdropFilter:'blur(4px)' },
        right:       { flex:1, background:'#f8fafc', display:'flex', alignItems:'center', justifyContent:'center', padding:'40px 32px' },
        card:        { background:'white', borderRadius:'20px', boxShadow:'0 4px 40px rgba(0,0,0,0.08)', width:'100%', maxWidth:'440px', overflow:'hidden' },
        tabs:        { display:'flex', borderBottom:'1px solid #e2e8f0' },
        tab:         { flex:1, padding:'16px', border:'none', background:'transparent', fontSize:'14px', fontWeight:'500', color:'#94a3b8', cursor:'pointer' },
        tabOn:       { color:'#2563eb', borderBottom:'2.5px solid #2563eb', fontWeight:'600' },
        body:        { padding:'32px' },
        title:       { fontSize:'24px', fontWeight:'700', color:'#0f172a', margin:'0 0 6px' },
        subtitle:    { fontSize:'14px', color:'#64748b', margin:'0 0 24px', lineHeight:1.5 },
        err:         { background:'#fef2f2', border:'1px solid #fecaca', color:'#dc2626', borderRadius:'10px', padding:'12px 16px', marginBottom:'20px', fontSize:'14px' },
        ok:          { background:'#f0fdf4', border:'1px solid #bbf7d0', color:'#16a34a', borderRadius:'10px', padding:'12px 16px', marginBottom:'20px', fontSize:'14px' },
        fg:          { marginBottom:'18px' },
        lbl:         { display:'block', fontSize:'13px', fontWeight:'600', color:'#374151', marginBottom:'6px' },
        opt:         { fontWeight:'400', color:'#9ca3af', fontSize:'12px' },
        inp:         { width:'100%', padding:'11px 14px', border:'1.5px solid #e2e8f0', borderRadius:'10px', fontSize:'14px', color:'#0f172a', outline:'none', boxSizing:'border-box', background:'#fafafa' },
        pwrap:       { position:'relative' },
        eyeBtn:      { position:'absolute', right:'12px', top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', fontSize:'16px', padding:0 },
        btn:         { width:'100%', padding:'13px', background:'linear-gradient(135deg,#1d4ed8,#2563eb)', color:'white', border:'none', borderRadius:'10px', fontSize:'15px', fontWeight:'600', cursor:'pointer', marginTop:'8px' },
        btnOff:      { opacity:0.7, cursor:'not-allowed' },
        spinRow:     { display:'flex', alignItems:'center', justifyContent:'center', gap:'8px' },
        spin:        { width:'15px', height:'15px', border:'2px solid rgba(255,255,255,0.3)', borderTop:'2px solid white', borderRadius:'50%', animation:'vc-spin 0.8s linear infinite', display:'inline-block' },
        switchRow:   { display:'flex', alignItems:'center', justifyContent:'center', gap:'6px', marginTop:'20px' },
        switchTxt:   { fontSize:'14px', color:'#64748b' },
        switchLink:  { background:'none', border:'none', color:'#2563eb', fontWeight:'600', fontSize:'14px', cursor:'pointer', padding:0, textDecoration:'underline' },
        info:        { marginTop:'20px', padding:'14px 16px', background:'#eff6ff', border:'1px solid #bfdbfe', borderRadius:'10px', fontSize:'13px', color:'#1e40af', lineHeight:1.6 },
    };

    return (
        <div style={S.page}>
            {/* LEFT */}
            <div style={S.left}>
                <div style={S.brand}>
                    <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
                        <rect width="36" height="36" rx="10" fill="white" fillOpacity="0.15"/>
                        <path d="M8 18L18 8L28 18L18 28L8 18Z" fill="white" opacity="0.9"/>
                        <path d="M13 18L18 13L23 18L18 23L13 18Z" fill="white"/>
                    </svg>
                    <span style={S.brandName}>VaultCore</span>
                </div>
                <div style={{flex:1, display:'flex', flexDirection:'column', justifyContent:'center'}}>
                    <h1 style={S.hero}>Your money,<br/>under control.</h1>
                    <p style={S.sub}>Secure banking. Real-time transfers. Live portfolio tracking. All in one place.</p>
                    <div style={S.features}>
                        {['🔐 Bank-grade JWT security','⚡ Instant transfers','📈 Live stock portfolio','🔍 Full audit trail'].map(f => (
                            <div key={f} style={S.feat}>{f}</div>
                        ))}
                    </div>
                </div>
            </div>

            {/* RIGHT */}
            <div style={S.right}>
                <div style={S.card}>
                    {/* Tabs */}
                    <div style={S.tabs}>
                        <button style={{...S.tab, ...(!isRegistering ? S.tabOn : {})}} onClick={() => isRegistering && switchMode()}>Sign In</button>
                        <button style={{...S.tab, ...(isRegistering ? S.tabOn : {})}} onClick={() => !isRegistering && switchMode()}>Create Account</button>
                    </div>

                    <div style={S.body}>
                        <h2 style={S.title}>{isRegistering ? 'Create your account' : 'Welcome back'}</h2>
                        <p style={S.subtitle}>{isRegistering ? 'Join VaultCore — your accounts will be ready instantly.' : 'Sign in to access your dashboard and accounts.'}</p>

                        {error   && <div style={S.err}><strong>⚠</strong> {error}</div>}
                        {success && <div style={S.ok}><strong>✓</strong> {success}</div>}

                        <form onSubmit={isRegistering ? handleRegister : handleLogin}>
                            <div style={S.fg}>
                                <label style={S.lbl}>Username</label>
                                <input style={S.inp} type="text" value={username} onChange={e=>setUsername(e.target.value)} placeholder="Enter your username" required disabled={loading}/>
                            </div>

                            {isRegistering && (
                                <>
                                    <div style={S.fg}>
                                        <label style={S.lbl}>Email Address</label>
                                        <input style={S.inp} type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com" required disabled={loading}/>
                                    </div>
                                    <div style={S.fg}>
                                        <label style={S.lbl}>Phone <span style={S.opt}>(optional)</span></label>
                                        <input style={S.inp} type="tel" value={phone} onChange={e=>setPhone(e.target.value)} placeholder="+91 9876543210" disabled={loading}/>
                                    </div>
                                </>
                            )}

                            <div style={S.fg}>
                                <label style={S.lbl}>Password</label>
                                <div style={S.pwrap}>
                                    <input style={{...S.inp, paddingRight:'48px'}} type={showPassword?'text':'password'} value={password} onChange={e=>setPassword(e.target.value)} placeholder={isRegistering?'Min. 6 characters':'Enter your password'} required disabled={loading}/>
                                    <button type="button" style={S.eyeBtn} onClick={()=>setShowPassword(!showPassword)} tabIndex={-1}>{showPassword?'🙈':'👁'}</button>
                                </div>
                            </div>

                            <button type="submit" style={{...S.btn,...(loading?S.btnOff:{})}} disabled={loading}>
                                {loading
                                    ? <span style={S.spinRow}><span style={S.spin}></span>{isRegistering?'Creating Account...':'Signing In...'}</span>
                                    : isRegistering ? 'Create Account' : 'Sign In'}
                            </button>
                        </form>

                        <div style={S.switchRow}>
                            <span style={S.switchTxt}>{isRegistering ? 'Already have an account?' : "Don't have an account?"}</span>
                            <button style={S.switchLink} onClick={switchMode} disabled={loading}>{isRegistering ? 'Sign In' : 'Create one'}</button>
                        </div>

                        {isRegistering && (
                            <div style={S.info}>
                                ✅ <strong>Accounts auto-created on registration:</strong> You'll get a <strong>Savings</strong> account (₹1,000) and a <strong>Checking</strong> account (₹500) ready to use immediately.
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Login;