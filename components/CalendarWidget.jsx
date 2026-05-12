'use client';
import { useState } from 'react';

export default function CalendarWidget({ tests = [] }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth(); 
  
  const firstDayOfMonth = new Date(year, month, 1).getDay(); 
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  
  const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const blanksArray = Array.from({ length: firstDayOfMonth }, (_, i) => i);

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  const getTestsForDay = (day) => {
    const formattedDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return tests.filter(t => t.testDate === formattedDate);
  };

  return (
    <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #E5E7EB', padding: '16px', boxShadow: '0 1px 2px rgba(0,0,0,0.05)', flex: 1, minWidth: '300px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: 'bold' }}>{monthNames[month]} {year}</h3>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={prevMonth} style={{ background: '#F3F4F6', border: 'none', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>&lt;</button>
          <button onClick={nextMonth} style={{ background: '#F3F4F6', border: 'none', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>&gt;</button>
        </div>
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', textAlign: 'center', fontWeight: 'bold', fontSize: '12px', color: '#6B7280', marginBottom: '8px' }}>
        <div>Su</div><div>Mo</div><div>Tu</div><div>We</div><div>Th</div><div>Fr</div><div>Sa</div>
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px' }}>
        {blanksArray.map(b => <div key={`blank-${b}`} style={{ padding: '8px' }}></div>)}
        {daysArray.map(day => {
          const dayTests = getTestsForDay(day);
          const hasTest = dayTests.length > 0;
          return (
            <div 
              key={day} 
              style={{ 
                padding: '8px 4px', 
                textAlign: 'center', 
                fontSize: '14px',
                borderRadius: '6px',
                background: hasTest ? '#FEF3C7' : 'transparent',
                border: hasTest ? '1px solid #FDE68A' : '1px solid transparent',
                cursor: hasTest ? 'pointer' : 'default',
                position: 'relative'
              }}
              title={hasTest ? dayTests.map(t => `${t.subject}: ${t.topics}`).join('\n') : ''}
            >
              <span style={{ color: hasTest ? '#D97706' : '#111827', fontWeight: hasTest ? 'bold' : 'normal' }}>{day}</span>
              {hasTest && (
                <div style={{ width: '4px', height: '4px', background: '#D97706', borderRadius: '50%', margin: '2px auto 0' }}></div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
