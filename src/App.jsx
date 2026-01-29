import { useState, useEffect, useRef } from 'react';

// Character Sets
const UPPERCASE_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const LOWERCASE_CHARS = "abcdefghijklmnopqrstuvwxyz";
const NUMBER_CHARS = "0123456789";
const SYMBOL_CHARS = "!@#$%^&*()_+~`|}{[]:;?><,./-=";

// IndexedDB Helper (singleton)
let db;

function initDB(setHistory) {
  const request = indexedDB.open('PasswordGenDB', 1);

  request.onerror = (event) => {
    console.error("Database error: " + event.target.errorCode);
  };

  request.onupgradeneeded = (event) => {
    db = event.target.result;
    if (!db.objectStoreNames.contains('history')) {
      const objectStore = db.createObjectStore('history', { keyPath: 'id', autoIncrement: true });
      objectStore.createIndex('created', 'created', { unique: false });
    }
  };

  request.onsuccess = (event) => {
    db = event.target.result;
    loadHistory(setHistory);
  };
}

function loadHistory(setHistory) {
  if (!db) return;

  const transaction = db.transaction(['history'], 'readonly');
  const objectStore = transaction.objectStore('history');
  const request = objectStore.getAll();

  request.onsuccess = (event) => {
    // Get last 10 entries, reversed
    const allHistory = event.target.result;
    setHistory(allHistory.slice(-10).reverse());
  };
}

function saveToHistory(password, setHistory) {
  if (!db) return;

  const transaction = db.transaction(['history'], 'readwrite');
  const objectStore = transaction.objectStore('history');
  const request = objectStore.add({ password: password, created: Date.now() });

  request.onsuccess = () => {
    loadHistory(setHistory);
  };
}

function clearDBHistory(setHistory) {
  if (!db) return;

  const transaction = db.transaction(['history'], 'readwrite');
  const objectStore = transaction.objectStore('history');
  const request = objectStore.clear();

  request.onsuccess = () => {
    setHistory([]);
  };
}

function App() {
  const [password, setPassword] = useState('');
  const [length, setLength] = useState(16);
  const [options, setOptions] = useState({
    uppercase: true,
    lowercase: true,
    numbers: true,
    symbols: true,
  });
  const [history, setHistory] = useState([]);
  const [copyFeedbackVisible, setCopyFeedbackVisible] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);

  const displayCardRef = useRef(null);

  useEffect(() => {
    // Initialize DB
    initDB(setHistory);

    // Capture install prompt
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Generate one on start
    const timer = setTimeout(() => {
      generatePassword();
    }, 500);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
    }
  };

  const generatePassword = () => {
    let chars = "";
    if (options.uppercase) chars += UPPERCASE_CHARS;
    if (options.lowercase) chars += LOWERCASE_CHARS;
    if (options.numbers) chars += NUMBER_CHARS;
    if (options.symbols) chars += SYMBOL_CHARS;

    if (chars === "") {
      setPassword("Select options");
      return;
    }

    let generatedPassword = "";
    const randomValues = new Uint32Array(length);
    window.crypto.getRandomValues(randomValues);

    for (let i = 0; i < length; i++) {
      generatedPassword += chars[randomValues[i] % chars.length];
    }

    setPassword(generatedPassword);
    saveToHistory(generatedPassword, setHistory);

    // Haptic Feedback
    if (navigator.vibrate) {
      navigator.vibrate(50);
    }

    // Visual Feedback (Shake)
    if (displayCardRef.current) {
      const card = displayCardRef.current;
      card.classList.remove('shake-animation');
      void card.offsetWidth; // Trigger reflow
      card.classList.add('shake-animation');
    }
  };

  const copyToClipboard = async (text) => {
    if (!text || text === "Select options") return;

    try {
      await navigator.clipboard.writeText(text);
      showCopyFeedback();
    } catch (err) {
      console.error('Failed to copy: ', err);
      // Fallback
      const textArea = document.createElement("textarea");
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      showCopyFeedback();
    }
  };

  const showCopyFeedback = () => {
    setCopyFeedbackVisible(true);
    setTimeout(() => {
      setCopyFeedbackVisible(false);
    }, 2000);
  };

  const handleOptionChange = (e) => {
    setOptions({
      ...options,
      [e.target.id]: e.target.checked
    });
  };

  return (
    <>
      <div className="background-mesh"></div>

      <main className="container">
        <header>
          <div className="logo-container">
            <img src="/icon.png" alt="SecurePass Logo" className="logo" />
            <h1>SecurePass</h1>
          </div>
          <p>Generate secure, random passwords instantly.</p>
          {deferredPrompt && (
            <button className="install-btn" onClick={handleInstallClick}>
              Install App
            </button>
          )}
        </header>

        <section className="card display-card" ref={displayCardRef}>
          <div className="password-display-container">
            <input
              type="text"
              className="password-input"
              value={password}
              placeholder="Your password here"
              readOnly
            />
            <button id="copyBtn" aria-label="Copy Password" onClick={() => copyToClipboard(password)}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
              </svg>
            </button>
          </div>
          <div className={`copy-feedback ${copyFeedbackVisible ? '' : 'hidden'}`}>Copied to clipboard!</div>
        </section>

        <section className="card controls-card">
          <div className="control-group">
            <div className="label-row">
              <label htmlFor="lengthRange">Length</label>
              <span id="lengthValue">{length}</span>
            </div>
            <input
              type="range"
              id="lengthRange"
              min="6"
              max="64"
              value={length}
              onChange={(e) => setLength(parseInt(e.target.value))}
            />
          </div>

          <div className="options-grid">
            <label className="checkbox-container">
              <input
                type="checkbox"
                id="uppercase"
                checked={options.uppercase}
                onChange={handleOptionChange}
              />
              <span className="checkmark"></span>
              Uppercase (A-Z)
            </label>
            <label className="checkbox-container">
              <input
                type="checkbox"
                id="lowercase"
                checked={options.lowercase}
                onChange={handleOptionChange}
              />
              <span className="checkmark"></span>
              Lowercase (a-z)
            </label>
            <label className="checkbox-container">
              <input
                type="checkbox"
                id="numbers"
                checked={options.numbers}
                onChange={handleOptionChange}
              />
              <span className="checkmark"></span>
              Numbers (0-9)
            </label>
            <label className="checkbox-container">
              <input
                type="checkbox"
                id="symbols"
                checked={options.symbols}
                onChange={handleOptionChange}
              />
              <span className="checkmark"></span>
              Symbols (!@#$)
            </label>
          </div>

          <button id="generateBtn" className="primary-btn" onClick={generatePassword}>Generate Password</button>
        </section>

        <section className="card history-card">
          <div className="history-header">
            <h2>History</h2>
            <button id="clearHistoryBtn" className="text-btn" onClick={() => clearDBHistory(setHistory)}>Clear</button>
          </div>
          <ul id="historyList" className="history-list">
            {history.length === 0 ? (
              <li className="empty-state">No history yet</li>
            ) : (
              history.map((item, index) => (
                <li key={item.id || index} className="history-item">
                  <span>{item.password}</span>
                  <button className="copy-mini-btn" onClick={() => copyToClipboard(item.password)}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                    </svg>
                  </button>
                </li>
              ))
            )}
          </ul>
        </section>
      </main>
    </>
  );
}

export default App;
