'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Login() {
  const router = useRouter();
  const [loginRole, setLoginRole] = useState('TEACHER');
  
  // Guardian Fields
  const [username, setUsername] = useState('');
  
  // Teacher Fields
  const [fullName, setFullName] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  
  // Shared
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);

  useEffect(() => {
    const savedRole = localStorage.getItem('savedLoginRole');
    if (savedRole) setLoginRole(savedRole);
    
    if (savedRole === 'TEACHER') {
      setFullName(localStorage.getItem('savedFullName') || '');
      setContactNumber(localStorage.getItem('savedContact') || '');
    } else {
      setUsername(localStorage.getItem('savedUsername') || '');
    }
    setPassword(localStorage.getItem('savedPassword') || '');
    
    if (localStorage.getItem('savedPassword')) {
      setRememberMe(true);
    }
  }, []);
  
  const handleLogin = (e) => {
    e.preventDefault();
    if (rememberMe) {
      localStorage.setItem('savedLoginRole', loginRole);
      localStorage.setItem('savedPassword', password);
      if (loginRole === 'TEACHER') {
        localStorage.setItem('savedFullName', fullName);
        localStorage.setItem('savedContact', contactNumber);
      } else {
        localStorage.setItem('savedUsername', username);
      }
    } else {
      localStorage.removeItem('savedLoginRole');
      localStorage.removeItem('savedPassword');
      localStorage.removeItem('savedFullName');
      localStorage.removeItem('savedContact');
      localStorage.removeItem('savedUsername');
    }

    if (loginRole === 'TEACHER') {
      localStorage.setItem('role', 'TEACHER');
      localStorage.setItem('teacherName', fullName);
      router.push('/teacher');
    } else {
      localStorage.setItem('role', 'GUARDIAN');
      router.push('/guardian');
    }
  };

  return (
    <div className="auth-container" style={{
      background: 'linear-gradient(135deg, #ECFDF5 0%, #D1FAE5 100%)',
      position: 'relative',
      overflow: 'hidden',
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      {/* Decorative Emojis */}
      <div className="jungle-emoji" style={{top: '10%', left: '10%', fontSize: '40px'}}>🌴</div>
      <div className="jungle-emoji" style={{bottom: '20%', right: '15%', fontSize: '50px', animationDelay: '1s'}}>🐯</div>
      <div className="jungle-emoji" style={{top: '20%', right: '20%', fontSize: '30px', animationDelay: '2s'}}>🥥</div>
      <div className="jungle-emoji" style={{bottom: '15%', left: '15%', fontSize: '45px', animationDelay: '0.5s'}}>🐒</div>

      <div className="auth-card" style={{
        position: 'relative', 
        zIndex: 10, 
        border: '2px solid #10B981', 
        boxShadow: '0 20px 25px -5px rgba(16, 185, 129, 0.2)',
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(10px)',
        width: '100%',
        maxWidth: '400px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
          <div className="sidebar-logo" style={{background: '#10B981', width: '48px', height: '48px', fontSize: '24px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(16,185,129,0.3)'}}>🌿</div>
        </div>
        <h1 className="auth-title" style={{color: '#064E3B'}}>EduTrack Portal</h1>
        
        <div style={{display: 'flex', gap: '8px', marginBottom: '24px', background: '#D1FAE5', padding: '4px', borderRadius: '12px'}}>
          <button 
            onClick={() => setLoginRole('TEACHER')}
            style={{flex: 1, padding: '8px', borderRadius: '8px', border: 'none', background: loginRole === 'TEACHER' ? '#10B981' : 'transparent', color: loginRole === 'TEACHER' ? 'white' : '#047857', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.2s'}}
          >Teacher</button>
          <button 
            onClick={() => setLoginRole('GUARDIAN')}
            style={{flex: 1, padding: '8px', borderRadius: '8px', border: 'none', background: loginRole === 'GUARDIAN' ? '#10B981' : 'transparent', color: loginRole === 'GUARDIAN' ? 'white' : '#047857', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.2s'}}
          >Guardian</button>
        </div>
        
        <form onSubmit={handleLogin}>
          {loginRole === 'TEACHER' ? (
            <>
              <div className="input-group">
                <label className="input-label" style={{color: '#064E3B'}}>Full Name</label>
                <input 
                  type="text" 
                  className="input-field" 
                  placeholder="e.g. John Doe"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required 
                  style={{borderColor: '#A7F3D0'}}
                />
              </div>
              <div className="input-group">
                <label className="input-label" style={{color: '#064E3B'}}>Contact Number</label>
                <input 
                  type="tel" 
                  className="input-field" 
                  placeholder="e.g. +91 9876543210"
                  value={contactNumber}
                  onChange={(e) => setContactNumber(e.target.value)}
                  required 
                  style={{borderColor: '#A7F3D0'}}
                />
              </div>
            </>
          ) : (
            <div className="input-group">
              <label className="input-label" style={{color: '#064E3B'}}>Username</label>
              <input 
                type="text" 
                className="input-field" 
                placeholder="Enter guardian username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required 
                style={{borderColor: '#A7F3D0'}}
              />
            </div>
          )}
          
          <div className="input-group" style={{marginBottom: '12px'}}>
            <label className="input-label" style={{color: '#064E3B'}}>Password</label>
            <input 
              type="password" 
              className="input-field" 
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required 
              style={{borderColor: '#A7F3D0'}}
            />
          </div>
          <div style={{display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px'}}>
            <input 
              type="checkbox" 
              id="rememberMe" 
              checked={rememberMe} 
              onChange={(e) => setRememberMe(e.target.checked)}
              style={{width: '16px', height: '16px', accentColor: '#10B981', cursor: 'pointer'}}
            />
            <label htmlFor="rememberMe" style={{fontSize: '14px', color: '#047857', cursor: 'pointer', fontWeight: '500'}}>Remember my password</label>
          </div>
          <button type="submit" className="btn" style={{background: 'linear-gradient(135deg, #10B981, #059669)', fontSize: '16px', padding: '14px'}}>Log In 🚀</button>
        </form>
      </div>
    </div>
  );
}
