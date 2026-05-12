'use client';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function Sidebar({ activeTab, setActiveTab }) {
  const router = useRouter();
  const [role, setRole] = useState('');

  useEffect(() => {
    setRole(localStorage.getItem('role') || '');
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('role');
    router.push('/');
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-logo">E</div>
        <div>
          <h2 style={{ fontSize: '16px', fontWeight: 'bold' }}>EduTrack</h2>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Tuition Portal</span>
        </div>
      </div>
      <nav className="sidebar-nav">
        <a href="#" onClick={(e) => { e.preventDefault(); if(setActiveTab) setActiveTab('dashboard'); }} className={`nav-item ${activeTab === 'dashboard' || !activeTab ? 'active' : ''}`} style={{textDecoration: 'none', display: 'block', color: 'inherit'}}>
          Dashboard
        </a>
        {role === 'TEACHER' ? (
          <>
            <a href="#" onClick={(e) => { e.preventDefault(); if(setActiveTab) setActiveTab('update-syllabus'); }} className={`nav-item ${activeTab === 'update-syllabus' ? 'active' : ''}`} style={{textDecoration: 'none', display: 'block', color: 'inherit'}}>Update Syllabus</a>
            <a href="#" onClick={(e) => { e.preventDefault(); if(setActiveTab) setActiveTab('weekly-tests'); }} className={`nav-item ${activeTab === 'weekly-tests' ? 'active' : ''}`} style={{textDecoration: 'none', display: 'block', color: 'inherit'}}>Weekly Tests</a>
            <a href="#" onClick={(e) => { e.preventDefault(); if(setActiveTab) setActiveTab('test-reports'); }} className={`nav-item ${activeTab === 'test-reports' ? 'active' : ''}`} style={{textDecoration: 'none', display: 'block', color: 'inherit'}}>Test Reports</a>
            <a href="#" onClick={(e) => { e.preventDefault(); if(setActiveTab) setActiveTab('teacher-remarks'); }} className={`nav-item ${activeTab === 'teacher-remarks' ? 'active' : ''}`} style={{textDecoration: 'none', display: 'block', color: 'inherit'}}>Teacher Remarks</a>
          </>
        ) : (
          <>
            <a href="#" onClick={(e) => { e.preventDefault(); if(setActiveTab) setActiveTab('activity-feed'); }} className={`nav-item ${activeTab === 'activity-feed' ? 'active' : ''}`} style={{textDecoration: 'none', display: 'flex', alignItems: 'center', color: 'inherit'}}>
              Activity Feed <span style={{ marginLeft: 'auto', background: 'var(--primary-color)', color: 'white', padding: '2px 8px', borderRadius: '12px', fontSize: '12px'}}>3</span>
            </a>
            <a href="#" onClick={(e) => { e.preventDefault(); if(setActiveTab) setActiveTab('syllabus-progress'); }} className={`nav-item ${activeTab === 'syllabus-progress' ? 'active' : ''}`} style={{textDecoration: 'none', display: 'block', color: 'inherit'}}>Syllabus Tracker</a>
            <a href="#" onClick={(e) => { e.preventDefault(); if(setActiveTab) setActiveTab('weekly-tests'); }} className={`nav-item ${activeTab === 'weekly-tests' ? 'active' : ''}`} style={{textDecoration: 'none', display: 'block', color: 'inherit'}}>Weekly Tests</a>
            <a href="#" onClick={(e) => { e.preventDefault(); if(setActiveTab) setActiveTab('test-reports'); }} className={`nav-item ${activeTab === 'test-reports' ? 'active' : ''}`} style={{textDecoration: 'none', display: 'block', color: 'inherit'}}>Test Reports</a>
            <a href="#" onClick={(e) => { e.preventDefault(); if(setActiveTab) setActiveTab('teacher-remarks'); }} className={`nav-item ${activeTab === 'teacher-remarks' ? 'active' : ''}`} style={{textDecoration: 'none', display: 'block', color: 'inherit'}}>Teacher Remarks</a>
          </>
        )}
      </nav>
      <div style={{ marginTop: 'auto', padding: '16px' }}>
        <button onClick={handleLogout} className="btn btn-secondary">Logout</button>
      </div>
    </aside>
  );
}
