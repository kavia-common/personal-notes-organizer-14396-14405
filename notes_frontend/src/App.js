import React, { useEffect, useMemo, useState } from 'react';
import './App.css';
import './index.css';
import { v4 as uuidv4 } from 'uuid';

/**
 * Minimal Notes App with:
 * - LocalStorage-backed authentication (email/password, NOT secure, demo only)
 * - Notes CRUD
 * - Search/filter
 * - Responsive layout (left sidebar, header branding)
 * - Light theme with specified colors
 *
 * No external backend is required; swap the storage layer to integrate an API later.
 */

// Storage keys
const LS_USER_KEY = 'notes_user';
const LS_NOTES_KEY_PREFIX = 'notes_data_';

// Helpers for localStorage persistence
const storage = {
  getUser() {
    try {
      const raw = localStorage.getItem(LS_USER_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },
  setUser(user) {
    localStorage.setItem(LS_USER_KEY, JSON.stringify(user));
  },
  clearUser() {
    localStorage.removeItem(LS_USER_KEY);
  },
  notesKey(email) {
    return `${LS_NOTES_KEY_PREFIX}${email}`;
  },
  getNotes(email) {
    try {
      const raw = localStorage.getItem(storage.notesKey(email));
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  },
  saveNotes(email, notes) {
    localStorage.setItem(storage.notesKey(email), JSON.stringify(notes));
  },
};

// PUBLIC_INTERFACE
export function formatDate(iso) {
  /** Returns a human-friendly date string. */
  const d = new Date(iso);
  return d.toLocaleString();
}

// PUBLIC_INTERFACE
export function useLocalStorageTheme() {
  /** Hook to manage theme with localStorage persistence. */
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('theme_pref');
    return saved || 'light';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme_pref', theme);
  }, [theme]);

  return { theme, setTheme };
}

function Header({ theme, onToggleTheme, user, onLogout }) {
  return (
    <header className="app-header">
      <div className="brand">
        <div className="brand-logo">📝</div>
        <div className="brand-text">
          <div className="brand-title">Notes</div>
          <div className="brand-sub">Personal Organizer</div>
        </div>
      </div>

      <div className="header-actions">
        {user && (
          <div className="user-info" title={user.email}>
            <span className="user-avatar">{user.email[0]?.toUpperCase() || 'U'}</span>
            <span className="user-email">{user.email}</span>
          </div>
        )}
        <button
          className="btn ghost"
          onClick={onToggleTheme}
          aria-label="Toggle theme"
          title="Toggle theme"
        >
          {theme === 'light' ? '🌙' : '☀️'}
        </button>
        {user && (
          <button className="btn" onClick={onLogout}>
            Logout
          </button>
        )}
      </div>
    </header>
  );
}

function Sidebar({ search, setSearch, onNew }) {
  return (
    <aside className="sidebar">
      <button className="btn primary full" onClick={onNew}>
        + New Note
      </button>
      <div className="search-box">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search notes..."
          aria-label="Search notes"
        />
      </div>
      <div className="sidebar-footer">
        <small>Tip: Use the search box to filter by title or content.</small>
      </div>
    </aside>
  );
}

function NotesList({ notes, selectedId, onSelect }) {
  if (!notes.length) {
    return (
      <div className="notes-list empty">
        <p>No notes yet. Create your first note!</p>
      </div>
    );
  }

  return (
    <div className="notes-list">
      {notes.map((n) => (
        <button
          key={n.id}
          className={`note-list-item ${selectedId === n.id ? 'active' : ''}`}
          onClick={() => onSelect(n.id)}
        >
          <div className="note-title">{n.title || 'Untitled'}</div>
          <div className="note-snippet">{n.content?.slice(0, 96) || ''}</div>
          <div className="note-meta">{formatDate(n.updatedAt)}</div>
        </button>
      ))}
    </div>
  );
}

function NoteEditor({ note, onChange, onSave, onDelete }) {
  if (!note) {
    return (
      <div className="note-editor empty">
        <p>Select a note from the list or create a new one.</p>
      </div>
    );
  }

  const handleChange = (field, value) => {
    onChange({ ...note, [field]: value, updatedAt: new Date().toISOString() });
  };

  return (
    <div className="note-editor">
      <div className="editor-toolbar">
        <button className="btn success" onClick={onSave} title="Save note">
          💾 Save
        </button>
        <button className="btn danger" onClick={onDelete} title="Delete note">
          🗑️ Delete
        </button>
      </div>
      <input
        className="editor-title"
        value={note.title}
        onChange={(e) => handleChange('title', e.target.value)}
        placeholder="Note title"
      />
      <textarea
        className="editor-content"
        value={note.content}
        onChange={(e) => handleChange('content', e.target.value)}
        placeholder="Start typing your note..."
      />
      <div className="editor-meta">Last updated: {formatDate(note.updatedAt)}</div>
    </div>
  );
}

function AuthView({ onAuth }) {
  const [mode, setMode] = useState('login'); // 'login' | 'signup'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // PUBLIC_INTERFACE
  const handleSubmit = (e) => {
    /** Handles a fake auth flow; stores email in localStorage. */
    e.preventDefault();
    if (!email || !password) return;
    // Minimal demo auth: just persist the user; DO NOT use for production
    const user = { email };
    storage.setUser(user);
    onAuth(user);
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-brand">📝 Notes</div>
        <h1 className="auth-title">{mode === 'login' ? 'Welcome back' : 'Create your account'}</h1>
        <p className="auth-subtitle">
          {mode === 'login' ? 'Log in to access your notes.' : 'Sign up to get started.'}
        </p>
        <form onSubmit={handleSubmit} className="auth-form">
          <label className="field">
            <span>Email</span>
            <input
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
            />
          </label>
          <label className="field">
            <span>Password</span>
            <input
              type="password"
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </label>
          <button className="btn primary full" type="submit">
            {mode === 'login' ? 'Log In' : 'Sign Up'}
          </button>
          <button
            className="btn ghost full"
            type="button"
            onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
          >
            {mode === 'login' ? 'Need an account? Sign up' : 'Have an account? Log in'}
          </button>
        </form>
        <p className="auth-note">
          Demo authentication only. Replace with a real auth provider for production.
        </p>
      </div>
    </div>
  );
}

// PUBLIC_INTERFACE
function App() {
  /** Root app that wires auth, layout, notes state, and search. */
  const { theme, setTheme } = useLocalStorageTheme();
  const [user, setUser] = useState(() => storage.getUser());
  const [notes, setNotes] = useState(() => (user ? storage.getNotes(user.email) : []));
  const [selectedId, setSelectedId] = useState(null);
  const [search, setSearch] = useState('');

  // Load notes when user logs in
  useEffect(() => {
    if (user) {
      const n = storage.getNotes(user.email);
      setNotes(n);
      if (n.length) setSelectedId(n[0].id);
    } else {
      setNotes([]);
      setSelectedId(null);
    }
  }, [user?.email]);

  // Persist notes on change
  useEffect(() => {
    if (user) {
      storage.saveNotes(user.email, notes);
    }
  }, [notes, user?.email]);

  const selectedNote = useMemo(() => notes.find((n) => n.id === selectedId) || null, [notes, selectedId]);

  const filteredNotes = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return notes.slice().sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
    return notes
      .filter((n) => (n.title || '').toLowerCase().includes(q) || (n.content || '').toLowerCase().includes(q))
      .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
  }, [notes, search]);

  // PUBLIC_INTERFACE
  const handleToggleTheme = () => {
    /** Toggle UI theme between light and dark. */
    setTheme((t) => (t === 'light' ? 'dark' : 'light'));
  };

  // PUBLIC_INTERFACE
  const handleLogout = () => {
    /** Logs out the current user and clears auth state. */
    storage.clearUser();
    setUser(null);
  };

  // PUBLIC_INTERFACE
  const handleNewNote = () => {
    /** Creates a new blank note and selects it. */
    const newNote = {
      id: uuidv4(),
      title: 'Untitled',
      content: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setNotes((prev) => [newNote, ...prev]);
    setSelectedId(newNote.id);
  };

  // PUBLIC_INTERFACE
  const handleChangeNote = (updated) => {
    /** Updates the selected note locally. */
    setNotes((prev) => prev.map((n) => (n.id === updated.id ? updated : n)));
  };

  // PUBLIC_INTERFACE
  const handleSaveNote = () => {
    /** Saves notes to persistence (auto-saved already). Included for UX parity. */
    // No-op as storage writes happen on state change; could add toast here.
  };

  // PUBLIC_INTERFACE
  const handleDeleteNote = () => {
    /** Deletes the currently selected note. */
    if (!selectedNote) return;
    setNotes((prev) => prev.filter((n) => n.id !== selectedNote.id));
    setSelectedId((prevId) => {
      if (prevId !== selectedNote.id) return prevId;
      // Select next available
      const rest = notes.filter((n) => n.id !== selectedNote.id);
      return rest.length ? rest[0].id : null;
    });
  };

  if (!user) {
    return (
      <div className="App">
        <Header theme={theme} onToggleTheme={handleToggleTheme} user={null} onLogout={() => {}} />
        <AuthView onAuth={setUser} />
      </div>
    );
  }

  return (
    <div className="App">
      <Header theme={theme} onToggleTheme={handleToggleTheme} user={user} onLogout={handleLogout} />
      <div className="app-layout">
        <Sidebar search={search} setSearch={setSearch} onNew={handleNewNote} />
        <main className="main">
          <div className="panel">
            <div className="panel-header">Notes</div>
            <NotesList notes={filteredNotes} selectedId={selectedId} onSelect={setSelectedId} />
          </div>
          <div className="panel">
            <div className="panel-header">Details</div>
            <NoteEditor
              note={selectedNote}
              onChange={handleChangeNote}
              onSave={handleSaveNote}
              onDelete={handleDeleteNote}
            />
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;
