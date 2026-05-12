import { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import CalendarWidget from '@/components/CalendarWidget';
import { db } from '../../src/firebase';
import { collection, onSnapshot, doc, getDoc, updateDoc, addDoc, serverTimestamp, query, orderBy } from 'firebase/firestore';

export default function TeacherDashboard() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [subjects, setSubjects] = useState([]);
  
  // Expandable Syllabus State
  const [expandedSubject, setExpandedSubject] = useState(null);
  const [newChapterInput, setNewChapterInput] = useState('');
  const [pdfUploadError, setPdfUploadError] = useState('');
  
  // Remarks State
  const [teacherRemarks, setTeacherRemarks] = useState([]);
  const [newRemark, setNewRemark] = useState('');
  
  // Weekly Tests state
  const [weeklyTests, setWeeklyTests] = useState([]);
  const [scheduleSubject, setScheduleSubject] = useState('MATHS');
  const [scheduleTopics, setScheduleTopics] = useState('');
  const [scheduleDate, setScheduleDate] = useState('');
  
  // Inline Upload state
  const [uploadTestId, setUploadTestId] = useState(null);
  const [testMarksObtained, setTestMarksObtained] = useState('');
  const [testTotalMarks, setTestTotalMarks] = useState('100');
  const [answerSheetBase64, setAnswerSheetBase64] = useState(null);

  useEffect(() => {
    // Subjects listener
    const unsubSubjects = onSnapshot(collection(db, 'subjects'), (snapshot) => {
      if (!snapshot.empty) {
        const subs = snapshot.docs.map(doc => doc.data());
        subs.sort((a, b) => a.order - b.order);
        setSubjects(subs);
      }
    });

    // Weekly Tests listener
    const qTests = query(collection(db, 'weekly_tests'), orderBy('timestamp', 'desc'));
    const unsubTests = onSnapshot(qTests, (snapshot) => {
      const tests = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setWeeklyTests(tests);
    });

    // Remarks listener
    const qRemarks = query(collection(db, 'teacher_remarks'), orderBy('timestamp', 'desc'));
    const unsubRemarks = onSnapshot(qRemarks, (snapshot) => {
      const rmks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setTeacherRemarks(rmks);
    });

    return () => {
      unsubSubjects();
      unsubTests();
      unsubRemarks();
    };
  }, []);
  
  const subjectsList = [
    "HINDI 1", "HINDI 2", "ENGLISH 1", "ENGLISH 2", 
    "HISTORY", "CIVICS", "GEOGRAPHY", "PHYSICS", 
    "CHEMISTRY", "BIOLOGY", "MATHS", "MORAL SCIENCE", 
    "GK", "SANSKRIT"
  ];

  const calculateSubjectProgress = (chaptersList) => {
    if (!chaptersList || chaptersList.length === 0) return 0;
    const completedCount = chaptersList.filter(c => c.isCompleted).length;
    return Math.round((completedCount / chaptersList.length) * 100);
  };

  const handleAddChapter = async (subjectName, e) => {
    e.preventDefault();
    if (!newChapterInput.trim()) return;

    const sub = subjects.find(s => s.name === subjectName);
    const updatedList = [...(sub.chapterList || []), { name: newChapterInput, isCompleted: false }];
    const newProgress = calculateSubjectProgress(updatedList);
    
    await updateDoc(doc(db, 'subjects', subjectName), {
      chapterList: updatedList,
      chapters: updatedList.length,
      completed: updatedList.filter(c => c.isCompleted).length,
      progress: newProgress
    });
    
    setNewChapterInput('');
    
    await addDoc(collection(db, 'activities'), {
      message: `Teacher added chapter "${newChapterInput}" to ${subjectName}`,
      time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
      timestamp: serverTimestamp()
    });
  };

  const handleToggleChapter = async (subjectName, chapterIndex) => {
    const sub = subjects.find(s => s.name === subjectName);
    const updatedList = [...(sub.chapterList || [])];
    updatedList[chapterIndex].isCompleted = !updatedList[chapterIndex].isCompleted;
    
    const newProgress = calculateSubjectProgress(updatedList);
    
    await updateDoc(doc(db, 'subjects', subjectName), {
      chapterList: updatedList,
      completed: updatedList.filter(c => c.isCompleted).length,
      progress: newProgress
    });

    if(updatedList[chapterIndex].isCompleted) {
       await addDoc(collection(db, 'activities'), {
         message: `Teacher marked "${updatedList[chapterIndex].name}" as completed in ${subjectName}`,
         time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
         timestamp: serverTimestamp()
       });
    }
  };

  const handleDeleteChapter = async (subjectName, chapterIndex, e) => {
    e.stopPropagation();
    const sub = subjects.find(s => s.name === subjectName);
    const updatedList = [...(sub.chapterList || [])];
    const removedChapter = updatedList[chapterIndex];
    updatedList.splice(chapterIndex, 1);
    
    const newProgress = calculateSubjectProgress(updatedList);
    
    await updateDoc(doc(db, 'subjects', subjectName), {
      chapterList: updatedList,
      chapters: updatedList.length,
      completed: updatedList.filter(c => c.isCompleted).length,
      progress: newProgress
    });

    await addDoc(collection(db, 'activities'), {
      message: `Teacher removed chapter "${removedChapter.name}" from ${subjectName}`,
      time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
      timestamp: serverTimestamp()
    });
  };

  const handleToggleManualMode = async (subjectName, e) => {
    e.stopPropagation();
    const sub = subjects.find(s => s.name === subjectName);
    const newMode = !sub.isManualMode;
    const mTotal = sub.manualTotal || (sub.chapterList?.length || 1);
    const mCompleted = sub.manualCompleted || 0;
    
    await updateDoc(doc(db, 'subjects', subjectName), {
      isManualMode: newMode,
      manualCompleted: mCompleted,
      manualTotal: mTotal,
      progress: newMode ? Math.min(100, Math.round((mCompleted / Math.max(1, mTotal)) * 100)) : calculateSubjectProgress(sub.chapterList)
    });
  };

  const handleManualChange = async (subjectName, field, value) => {
    const sub = subjects.find(s => s.name === subjectName);
    let newCompleted = field === 'completed' ? parseInt(value) || 0 : (sub.manualCompleted || 0);
    let newTotal = field === 'total' ? Math.max(1, parseInt(value) || 1) : (sub.manualTotal || 1);
    
    newCompleted = Math.min(newTotal, newCompleted);
    const newProgress = Math.min(100, Math.round((newCompleted / newTotal) * 100));

    await updateDoc(doc(db, 'subjects', subjectName), {
      manualCompleted: newCompleted,
      manualTotal: newTotal,
      progress: newProgress
    });
  };

  const handlePdfUpload = (subjectName, e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      setPdfUploadError('Please select a valid PDF file.');
      return;
    }

    if (file.size > 1000000) { // 1MB
      setPdfUploadError('File is too large! Please select a PDF under 1MB.');
      return;
    }

    setPdfUploadError('');
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64Data = reader.result;
      await updateDoc(doc(db, 'subjects', subjectName), {
        pdfData: base64Data,
        pdfName: file.name
      });
      await addDoc(collection(db, 'activities'), {
        message: `Teacher uploaded syllabus PDF "${file.name}" for ${subjectName}`,
        time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
        timestamp: serverTimestamp()
      });
    };
    reader.readAsDataURL(file);
  };

  const handlePdfRemove = async (subjectName) => {
    await updateDoc(doc(db, 'subjects', subjectName), {
      pdfData: null,
      pdfName: null
    });
  };

  const getProgressColor = (progress) => {
    if (progress < 40) return { text: '#DC2626', gradient: 'linear-gradient(90deg, #EF4444, #F87171)' };
    if (progress <= 70) return { text: '#2563EB', gradient: 'linear-gradient(90deg, #3B82F6, #60A5FA)' };
    return { text: '#10B981', gradient: 'linear-gradient(90deg, #10B981, #34D399)' };
  };

  const handleScheduleTest = async (e) => {
    e.preventDefault();
    if (!scheduleTopics || !scheduleDate) {
      alert("Please enter topics and select a date.");
      return;
    }
    
    await addDoc(collection(db, 'weekly_tests'), {
      subject: scheduleSubject,
      topics: scheduleTopics,
      testDate: scheduleDate,
      status: 'SCHEDULED',
      timestamp: serverTimestamp()
    });

    // Add activity
    await addDoc(collection(db, 'activities'), {
      message: `${scheduleSubject} Test Scheduled: ${scheduleTopics}`,
      time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
      timestamp: serverTimestamp()
    });

    alert('Test scheduled successfully!');
    setScheduleTopics('');
    setScheduleDate('');
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAnswerSheetBase64(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleInlineUpload = async (e, testId) => {
    e.preventDefault();
    if (!answerSheetBase64) {
      alert("Please attach an image first.");
      return;
    }

    await updateDoc(doc(db, 'weekly_tests', testId), {
      status: 'COMPLETED',
      marksObtained: testMarksObtained,
      totalMarks: testTotalMarks,
      answerSheetBase64: answerSheetBase64
    });

    const testToUpdate = weeklyTests.find(t => t.id === testId);
    if(testToUpdate) {
      await addDoc(collection(db, 'activities'), {
        message: `${testToUpdate.subject} Test Uploaded (${testMarksObtained}/${testTotalMarks})`,
        time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
        timestamp: serverTimestamp()
      });
    }

    alert('Test Results and Answer Sheet Image uploaded successfully!');
    setTestMarksObtained('');
    setUploadTestId(null);
    setAnswerSheetBase64(null);
  };

  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  const hasTestToday = weeklyTests.some(t => t.status === 'SCHEDULED' && t.testDate === todayStr);

  const handleRemarkSubmit = async (e) => {
    e.preventDefault();
    if (!newRemark.trim()) return;

    await addDoc(collection(db, 'teacher_remarks'), {
      message: newRemark,
      date: todayStr,
      time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
      timestamp: serverTimestamp()
    });

    setNewRemark('');
    alert('Remark submitted successfully!');
  };

  const getTestDisplayStatus = (test) => {
    if (test.status === 'COMPLETED') return { label: 'COMPLETED', bg: '#D1FAE5', text: '#059669' };
    if (test.status === 'SCHEDULED' && test.testDate && test.testDate < todayStr) return { label: 'PENDING', bg: '#FEE2E2', text: '#DC2626' };
    return { label: 'SCHEDULED', bg: '#FEF3C7', text: '#D97706' };
  };

  return (
    <div className="layout-container">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      <main className="main-content">
        <div className="topbar">
          <h1 className="page-title">
            {activeTab === 'dashboard' && 'Teacher Dashboard'}
            {activeTab === 'update-syllabus' && 'Update Syllabus'}
            {activeTab === 'weekly-tests' && 'Weekly Tests'}
            {activeTab === 'test-reports' && 'Test Reports Gallery'}
            {activeTab === 'teacher-remarks' && 'Teacher Remarks'}
          </h1>
        </div>

        {hasTestToday && (
          <div style={{background: '#EEF2FF', border: '1px solid #6366F1', borderLeft: '4px solid #6366F1', padding: '16px', borderRadius: '8px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px'}}>
            <span style={{fontSize: '24px'}}>🔔</span>
            <div>
              <h3 style={{color: '#4338CA', fontWeight: 'bold', margin: 0, fontSize: '16px'}}>Test Reminder</h3>
              <p style={{color: '#4F46E5', margin: 0, fontSize: '14px'}}>You have a test scheduled for today. Make sure to grade it!</p>
            </div>
          </div>
        )}

        <div className="grid-2">
          {/* Interactive Syllabus Tracker */}
          {(activeTab === 'dashboard' || activeTab === 'update-syllabus') && (
            <div className="card" id="update-syllabus">
              <div className="progress-header">
                <h2 style={{fontSize: '18px', fontWeight: '600'}}>Syllabus Progress</h2>
              </div>
              <p style={{color: 'var(--text-muted)', fontSize: '14px', marginBottom: '24px'}}>Click on a subject to view and track chapters.</p>
              
              <div style={{display: 'flex', flexDirection: 'column', gap: '20px'}}>
                {subjects.map(sub => {
                  const isExpanded = expandedSubject === sub.name;
                  const displayCompleted = sub.isManualMode ? (sub.manualCompleted || 0) : (sub.chapterList || []).filter(c => c.isCompleted).length;
                  const displayTotal = sub.isManualMode ? (sub.manualTotal || 0) : (sub.chapterList || []).length;
                  
                  return (
                  <div key={sub.name} className="progress-container" style={{
                    cursor: 'pointer', 
                    border: isExpanded ? '2px solid #10B981' : '1px solid transparent',
                    boxShadow: isExpanded ? '0 8px 24px rgba(16, 185, 129, 0.15)' : 'none',
                    transform: isExpanded ? 'translateY(-2px)' : 'none',
                    transition: 'all 0.2s ease'
                  }} onClick={(e) => {
                    if(e.target.tagName !== 'INPUT' && e.target.tagName !== 'BUTTON' && e.target.type !== 'checkbox') {
                      setExpandedSubject(isExpanded ? null : sub.name);
                      setNewChapterInput('');
                    }
                  }}>
                    <div className="progress-header" style={{marginBottom: '6px'}}>
                      <span style={{fontWeight: '700', fontSize: '16px', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: '8px'}}>
                        {sub.name} 
                        <span style={{fontSize: '12px', color: 'var(--text-muted)'}}>{isExpanded ? '▼' : '▶'}</span>
                      </span>
                      <span style={{fontWeight: '800', fontSize: '18px', color: getProgressColor(sub.progress).text}}>{sub.progress}%</span>
                    </div>
                    
                    <div style={{fontSize: '14px', color: '#4B5563', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px'}}>
                      <span style={{color: '#111827', fontSize: '18px', fontWeight: '800'}}>{displayCompleted}</span> 
                      <span style={{fontWeight: '500', color: '#9CA3AF'}}>/</span> 
                      <span style={{color: '#374151', fontSize: '16px', fontWeight: '700'}}>{displayTotal}</span> 
                      <span style={{fontWeight: '500', marginLeft: '4px', color: '#6B7280'}}>Chapters</span>
                    </div>

                    <div className="progress-bar-bg" style={{marginBottom: isExpanded ? '16px' : '0'}}>
                      <div 
                        className="progress-bar-fill" 
                        style={{
                          width: `${sub.progress}%`,
                          backgroundImage: getProgressColor(sub.progress).gradient,
                          backgroundColor: 'transparent'
                        }}
                      ></div>
                    </div>

                    {isExpanded && (
                      <div style={{marginTop: '16px', padding: '16px', background: '#F9FAFB', borderRadius: '8px', border: '1px solid #E5E7EB'}} onClick={e => e.stopPropagation()}>
                        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px'}}>
                          <h4 style={{fontSize: '14px', fontWeight: '800', color: '#10B981', margin: 0}}>
                            {sub.isManualMode ? 'MANUAL NUMBERS' : 'CHAPTER LIST'}
                          </h4>
                          <button 
                            onClick={(e) => handleToggleManualMode(sub.name, e)}
                            style={{fontSize: '12px', padding: '4px 12px', background: '#E0E7FF', color: '#4338CA', border: 'none', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer'}}
                          >
                            {sub.isManualMode ? 'Switch to Detailed List' : 'Switch to Manual Entry'}
                          </button>
                        </div>
                        
                        {sub.isManualMode ? (
                          <div style={{display: 'flex', gap: '16px', alignItems: 'center', background: 'white', padding: '16px', borderRadius: '8px', border: '1px solid #E5E7EB'}}>
                            <div style={{display: 'flex', flexDirection: 'column', gap: '4px'}}>
                              <label style={{fontSize: '12px', fontWeight: 'bold', color: '#6B7280'}}>Total Chapters</label>
                              <input 
                                type="number" 
                                value={sub.manualTotal || 1}
                                onChange={(e) => handleManualChange(sub.name, 'total', e.target.value)}
                                className="input-field"
                                style={{padding: '8px', width: '80px', fontWeight: 'bold'}}
                              />
                            </div>
                            <div style={{display: 'flex', flexDirection: 'column', gap: '4px'}}>
                              <label style={{fontSize: '12px', fontWeight: 'bold', color: '#6B7280'}}>Completed</label>
                              <input 
                                type="number" 
                                value={sub.manualCompleted || 0}
                                onChange={(e) => handleManualChange(sub.name, 'completed', e.target.value)}
                                className="input-field"
                                style={{padding: '8px', width: '80px', fontWeight: 'bold'}}
                              />
                            </div>
                          </div>
                        ) : (
                          <>
                            <div style={{display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px'}}>
                              {(!sub.chapterList || sub.chapterList.length === 0) && (
                                <p style={{fontSize: '13px', color: 'var(--text-muted)', fontStyle: 'italic'}}>No chapters added yet.</p>
                              )}
                              {(sub.chapterList || []).map((chapter, idx) => (
                                <div key={idx} style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                                  <label style={{display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', padding: '12px', borderRadius: '8px', background: chapter.isCompleted ? '#ECFDF5' : 'white', border: '2px solid', borderColor: chapter.isCompleted ? '#10B981' : '#E5E7EB', boxShadow: '0 2px 4px rgba(0,0,0,0.02)', flex: 1}}>
                                    <input 
                                      type="checkbox" 
                                      checked={chapter.isCompleted} 
                                      onChange={() => handleToggleChapter(sub.name, idx)}
                                      style={{width: '20px', height: '20px', accentColor: '#10B981', cursor: 'pointer'}}
                                    />
                                    <span style={{fontSize: '15px', fontWeight: '800', color: chapter.isCompleted ? '#059669' : '#1F2937', textDecoration: chapter.isCompleted ? 'line-through' : 'none', flex: 1}}>
                                      {chapter.name}
                                    </span>
                                  </label>
                                  <button 
                                    onClick={(e) => handleDeleteChapter(sub.name, idx, e)} 
                                    title="Delete Chapter"
                                    style={{background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer', fontSize: '18px', padding: '8px', borderRadius: '8px', backgroundColor: '#FEE2E2', display: 'flex', alignItems: 'center', justifyContent: 'center'}}
                                  >
                                    🗑️
                                  </button>
                                </div>
                              ))}
                            </div>
                            <form onSubmit={(e) => handleAddChapter(sub.name, e)} style={{display: 'flex', gap: '8px'}}>
                              <input 
                                type="text" 
                                className="input-field" 
                                placeholder="+ Add New Chapter (e.g. Algebra)" 
                                value={newChapterInput}
                                onChange={(e) => setNewChapterInput(e.target.value)}
                                style={{flex: 1, padding: '10px 12px', fontSize: '14px', border: '2px solid #E5E7EB', fontWeight: '600'}}
                              />
                              <button type="submit" className="btn" style={{padding: '10px 20px', fontSize: '14px', width: 'auto', fontWeight: 'bold', background: '#10B981'}}>Add</button>
                            </form>
                          </>
                        )}

                        {/* PDF Upload Section */}
                        <div style={{marginTop: '20px', paddingTop: '16px', borderTop: '1px solid #E5E7EB'}}>
                          <h4 style={{fontSize: '13px', fontWeight: '700', color: '#6B7280', marginBottom: '8px'}}>SYLLABUS DOCUMENT (PDF)</h4>
                          {sub.pdfData ? (
                            <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'white', padding: '12px', borderRadius: '8px', border: '1px solid #E5E7EB'}}>
                              <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                                <span style={{fontSize: '24px'}}>📄</span>
                                <span style={{fontSize: '14px', fontWeight: '600', color: '#374151', wordBreak: 'break-all'}}>{sub.pdfName}</span>
                              </div>
                              <div style={{display: 'flex', gap: '8px'}}>
                                <a href={sub.pdfData} target="_blank" rel="noopener noreferrer" style={{background: '#ECFDF5', color: '#059669', padding: '6px 12px', borderRadius: '6px', fontSize: '13px', fontWeight: 'bold', textDecoration: 'none'}}>View</a>
                                <button onClick={() => handlePdfRemove(sub.name)} style={{background: '#FEE2E2', color: '#DC2626', border: 'none', padding: '6px 12px', borderRadius: '6px', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer'}}>Remove</button>
                              </div>
                            </div>
                          ) : (
                            <div>
                              <input 
                                type="file" 
                                accept="application/pdf" 
                                onChange={(e) => handlePdfUpload(sub.name, e)}
                                style={{fontSize: '13px', padding: '8px', background: 'white', borderRadius: '6px', border: '1px dashed #CBD5E1', width: '100%', cursor: 'pointer'}}
                              />
                              {pdfUploadError && <p style={{color: '#EF4444', fontSize: '12px', marginTop: '4px'}}>{pdfUploadError}</p>}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )})}
              </div>
            </div>
          )}

          {/* Schedule Weekly Test Form */}
          {(activeTab === 'dashboard' || activeTab === 'weekly-tests') && (
            <div className="card" id="weekly-tests" style={{gridColumn: '1 / -1'}}>
              <h2 style={{fontSize: '18px', fontWeight: '600', marginBottom: '8px'}}>Schedule Weekly Test</h2>
              <p style={{color: 'var(--text-muted)', fontSize: '14px', marginBottom: '24px'}}>Announce topics for an upcoming test.</p>
              
              <div style={{display: 'flex', gap: '24px', flexWrap: 'wrap', alignItems: 'flex-start'}}>
                <form onSubmit={handleScheduleTest} style={{flex: 1, minWidth: '300px', display: 'flex', flexDirection: 'column', gap: '16px'}}>
                  <div className="input-group">
                    <label className="input-label">Subject</label>
                    <select 
                      className="input-field" 
                      value={scheduleSubject} 
                      onChange={(e) => setScheduleSubject(e.target.value)}
                    >
                      {subjectsList.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div className="input-group">
                    <label className="input-label">Date</label>
                    <input 
                      type="date" 
                      className="input-field" 
                      value={scheduleDate}
                      onChange={(e) => setScheduleDate(e.target.value)}
                      required
                    />
                  </div>
                  <div className="input-group">
                    <label className="input-label">Topics</label>
                    <input 
                      type="text" 
                      className="input-field" 
                      value={scheduleTopics}
                      onChange={(e) => setScheduleTopics(e.target.value)}
                      placeholder="e.g. Algebra and Geometry basics"
                      required
                    />
                  </div>
                  <button type="submit" className="btn" style={{backgroundColor: '#D97706'}}>Schedule Test</button>
                </form>

                <div style={{flex: 1, minWidth: '300px'}}>
                  <CalendarWidget tests={weeklyTests} />
                </div>
              </div>
            </div>
          )}

              <hr style={{borderTop: '1px solid #E5E7EB', margin: '24px 0'}} />
              <h3 style={{fontSize: '16px', fontWeight: '600', marginBottom: '16px'}}>All Tests</h3>
              <div style={{display: 'flex', flexDirection: 'column', gap: '16px', maxHeight: '500px', overflowY: 'auto', paddingRight: '8px'}}>
                {weeklyTests.length === 0 && <p style={{color: 'var(--text-muted)', fontSize: '14px'}}>No tests available.</p>}
                {weeklyTests.map(test => (
                  <div key={test.id} style={{padding: '16px', border: '1px solid #E5E7EB', borderRadius: '8px'}}>
                    <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '8px'}}>
                      <h3 style={{fontWeight: '600'}}>{test.subject}</h3>
                      <span style={{
                        fontSize: '12px', padding: '2px 8px', borderRadius: '12px', fontWeight: 'bold',
                        background: getTestDisplayStatus(test).bg,
                        color: getTestDisplayStatus(test).text
                      }}>
                        {getTestDisplayStatus(test).label}
                      </span>
                    </div>
                    <p style={{fontSize: '14px', color: 'var(--text-muted)', marginBottom: '8px'}}><strong>Date:</strong> {test.testDate || 'N/A'}</p>
                    <p style={{fontSize: '14px', color: 'var(--text-muted)', marginBottom: '8px'}}><strong>Topics:</strong> {test.topics}</p>
                    
                    {test.status === 'SCHEDULED' && (
                      <div style={{marginTop: '16px'}}>
                        {uploadTestId === test.id ? (
                           <form onSubmit={(e) => handleInlineUpload(e, test.id)} style={{display: 'flex', flexDirection: 'column', gap: '8px', padding: '12px', background: '#F9FAFB', borderRadius: '8px', border: '1px dashed #CBD5E1'}}>
                             <div style={{display: 'flex', gap: '8px'}}>
                               <input type="number" className="input-field" placeholder="Marks" value={testMarksObtained} onChange={e => setTestMarksObtained(e.target.value)} required style={{padding: '8px'}} />
                               <input type="number" className="input-field" placeholder="Total" value={testTotalMarks} onChange={e => setTestTotalMarks(e.target.value)} required style={{padding: '8px'}} />
                             </div>
                             <input type="file" className="input-field" accept="image/*" onChange={handleFileChange} required style={{padding: '8px', background: 'white'}} />
                             <div style={{display: 'flex', gap: '8px'}}>
                               <button type="submit" className="btn" style={{padding: '8px', fontSize: '14px'}}>Submit Result</button>
                               <button type="button" className="btn btn-secondary" style={{padding: '8px', fontSize: '14px'}} onClick={() => setUploadTestId(null)}>Cancel</button>
                             </div>
                           </form>
                        ) : (
                           <button onClick={() => setUploadTestId(test.id)} className="btn btn-secondary" style={{padding: '6px 12px', fontSize: '14px', display: 'inline-block', width: 'auto'}}>Upload Answer Sheet</button>
                        )}
                      </div>
                    )}
                    
                    {test.status === 'COMPLETED' && (
                      <>
                        <p style={{fontSize: '14px', color: 'var(--text-muted)', marginBottom: '8px'}}><strong>Marks:</strong> {test.marksObtained} / {test.totalMarks}</p>
                        <p style={{fontSize: '12px', color: 'var(--primary-color)', fontStyle: 'italic', fontWeight: '500'}}>View answer sheet in Test Reports Gallery ➔</p>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Test Reports Gallery */}
          {(activeTab === 'dashboard' || activeTab === 'test-reports') && (
            <div className="card" id="test-reports" style={{gridColumn: '1 / -1'}}>
              <h2 style={{fontSize: '18px', fontWeight: '600', marginBottom: '8px'}}>Test Reports Gallery</h2>
              <p style={{color: 'var(--text-muted)', fontSize: '14px', marginBottom: '24px'}}>All graded answer sheets.</p>
              
              <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '20px'}}>
                {weeklyTests.filter(t => t.status === 'COMPLETED' && t.answerSheetBase64).length === 0 && <p style={{color: 'var(--text-muted)', fontSize: '14px'}}>No reports available yet.</p>}
                {weeklyTests.filter(t => t.status === 'COMPLETED' && t.answerSheetBase64).map(test => (
                  <div key={`report-${test.id}`} style={{border: '1px solid #E5E7EB', borderRadius: '12px', overflow: 'hidden', background: '#F9FAFB', boxShadow: 'var(--shadow-sm)'}}>
                    <img src={test.answerSheetBase64} alt="Answer Sheet" style={{width: '100%', height: '200px', objectFit: 'cover', borderBottom: '1px solid #E5E7EB'}} />
                    <div style={{padding: '16px'}}>
                      <h3 style={{fontWeight: '600', marginBottom: '4px'}}>{test.subject}</h3>
                      <p style={{fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px'}}><strong>Date:</strong> {test.testDate} | <strong>Topics:</strong> {test.topics}</p>
                      <div style={{display: 'inline-block', background: '#ECFDF5', color: '#059669', padding: '4px 12px', borderRadius: '12px', fontSize: '14px', fontWeight: 'bold'}}>
                        Marks: {test.marksObtained} / {test.totalMarks}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Teacher Remarks Form & Timeline */}
          {(activeTab === 'dashboard' || activeTab === 'teacher-remarks') && (
            <div className="card" id="teacher-remarks" style={{gridColumn: '1 / -1'}}>
              <h2 style={{fontSize: '18px', fontWeight: '600', marginBottom: '8px'}}>Teacher Remarks</h2>
              <p style={{color: 'var(--text-muted)', fontSize: '14px', marginBottom: '24px'}}>Log weekly progress updates, complaints, or general comments.</p>
              
              <form onSubmit={handleRemarkSubmit} style={{display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '32px'}}>
                <textarea 
                  className="input-field" 
                  placeholder="e.g. The student is doing excellent in Maths this week. All is good."
                  value={newRemark}
                  onChange={(e) => setNewRemark(e.target.value)}
                  style={{minHeight: '100px', resize: 'vertical'}}
                  required
                />
                <button type="submit" className="btn" style={{alignSelf: 'flex-start'}}>Submit Remark</button>
              </form>

              <h3 style={{fontSize: '16px', fontWeight: '600', marginBottom: '16px'}}>Previous Remarks</h3>
              <div style={{display: 'flex', flexDirection: 'column', gap: '16px', borderLeft: '2px solid #E5E7EB', paddingLeft: '16px', marginLeft: '8px'}}>
                {teacherRemarks.length === 0 && <p style={{color: 'var(--text-muted)', fontSize: '14px'}}>No remarks have been posted yet.</p>}
                {teacherRemarks.map(remark => (
                  <div key={remark.id} style={{position: 'relative'}}>
                    <div style={{position: 'absolute', left: '-25px', top: '0', background: '#3B82F6', width: '16px', height: '16px', borderRadius: '50%', border: '4px solid white'}}></div>
                    <div style={{background: '#F9FAFB', padding: '16px', borderRadius: '8px', border: '1px solid #E5E7EB'}}>
                      <p style={{fontSize: '15px', color: '#1F2937', marginBottom: '8px'}}>{remark.message}</p>
                      <p style={{fontSize: '12px', color: 'var(--text-muted)'}}><strong>{remark.date}</strong> at {remark.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
