import './globals.css';

export const metadata = {
  title: 'EduTrack - Tuition Portal',
  description: 'Track tuition progress and test scores',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {/* Jungle Theme Background */}
        <div style={{
          position: 'fixed',
          top: 0, left: '250px', right: 0, bottom: 0,
          pointerEvents: 'none',
          zIndex: 0,
          overflow: 'hidden',
          opacity: 0.7
        }}>
          {/* Top Left Area */}
          <div className="jungle-emoji" style={{ top: '5%', left: '5%', fontSize: '150px', animationDelay: '0s' }}>🌴</div>
          <div className="jungle-emoji" style={{ top: '15%', left: '20%', fontSize: '80px', animationDelay: '3.5s' }}>🦜</div>
          
          {/* Top Right Area */}
          <div className="jungle-emoji" style={{ top: '5%', right: '5%', fontSize: '150px', animationDelay: '2.5s' }}>🌴</div>
          <div className="jungle-emoji" style={{ top: '15%', right: '20%', fontSize: '90px', animationDelay: '2s' }}>🐒</div>
          
          {/* Bottom Left Area */}
          <div className="jungle-emoji" style={{ bottom: '5%', left: '5%', fontSize: '140px', animationDelay: '3s' }}>🐘</div>
          <div className="jungle-emoji" style={{ bottom: '20%', left: '20%', fontSize: '80px', animationDelay: '1.2s' }}>🥥</div>
          
          {/* Bottom Right Area */}
          <div className="jungle-emoji" style={{ bottom: '5%', right: '5%', fontSize: '120px', animationDelay: '1s' }}>🐅</div>
          <div className="jungle-emoji" style={{ bottom: '20%', right: '20%', fontSize: '80px', animationDelay: '1.5s' }}>🥥</div>

          {/* Center Fluff */}
          <div className="jungle-emoji" style={{ top: '45%', right: '10%', fontSize: '60px', animationDelay: '0.5s' }}>🌿</div>
          <div className="jungle-emoji" style={{ top: '45%', left: '10%', fontSize: '60px', animationDelay: '2s' }}>🌿</div>
        </div>
        
        <div style={{ position: 'relative', zIndex: 1 }}>
          {children}
        </div>
      </body>
    </html>
  );
}
