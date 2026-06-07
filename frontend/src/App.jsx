import React, { useState, useRef, useCallback } from 'react';
import './App.css';

const API_URL = process.env.REACT_APP_API_URL || '';

const scoreColor = (s) => s >= 75 ? 'var(--good)' : s >= 50 ? 'var(--warn)' : 'var(--bad)';
const gradeColor = (g) => ['A+','A','A-'].includes(g) ? 'var(--good)' : ['B+','B','B-'].includes(g) ? 'var(--warn)' : 'var(--bad)';

function DropZone({ onFile, file, inputRef }) {
  const [dragging, setDragging] = useState(false);
  const localRef = useRef();
  const ref = inputRef || localRef;

  const handleDrop = useCallback((e) => {
    e.preventDefault(); setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f?.type === 'application/pdf') onFile(f);
  }, [onFile]);

  return (
    <div
      className={`dropzone ${dragging ? 'dragging' : ''} ${file ? 'has-file' : ''}`}
      onDragOver={e => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      onClick={() => ref.current.click()}
    >
      <input ref={ref} type="file" accept=".pdf" hidden onChange={e => e.target.files[0] && onFile(e.target.files[0])} />
      <div className="dropzone-icon-wrap">
        {file ? (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
        ) : (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/></svg>
        )}
      </div>
      {file ? (
        <>
          <div className="dropzone-title">{file.name}</div>
          <div className="dropzone-sub">{(file.size/1024).toFixed(1)} KB · click to replace</div>
        </>
      ) : (
        <>
          <div className="dropzone-title">Drop résumé here</div>
          <div className="dropzone-sub">PDF · click to browse</div>
        </>
      )}
    </div>
  );
}

function Results({ data }) {
  const [tab, setTab] = useState('overview');
  const tabs = ['overview', 'gaps', 'improvements', 'keywords'];

  return (
    <div>
      <div className="score-strip">
        <div className="score-main">
          <span className="score-number" style={{ color: scoreColor(data.ats_score) }}>{data.ats_score}</span>
          <span className="score-denom">/ 100 ATS</span>
        </div>
        <div className="score-grade">
          <span className="grade-letter" style={{ color: gradeColor(data.overall_grade) }}>{data.overall_grade}</span>
          <span className="grade-sub">Grade</span>
        </div>
        <div className="score-summary">
          <p className="score-summary-text">{data.summary}</p>
          {data.strengths && (
            <div className="score-summary-strengths">
              {data.strengths.map((s, i) => <span key={i} className="strength-pill">{s}</span>)}
            </div>
          )}
        </div>
      </div>

      {data.job_match && (
        <div className="job-match-bar">
          <div className="jm-col">
            <div className="jm-hd">Best-fit roles</div>
            <div className="jm-tags">{data.job_match.best_roles.map((r,i) => <span key={i} className="jm-tag">{r}</span>)}</div>
          </div>
          <div className="jm-col">
            <div className="jm-hd">Industries</div>
            <div className="jm-tags">{data.job_match.industries.map((r,i) => <span key={i} className="jm-tag">{r}</span>)}</div>
          </div>
        </div>
      )}

      <div className="tabs">
        {tabs.map(t => (
          <button key={t} className={`tab-btn ${tab===t?'active':''}`} onClick={() => setTab(t)}>
            {t.charAt(0).toUpperCase()+t.slice(1)}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <div className="tab-content section-grid">
          {Object.entries(data.sections).map(([key, val]) => (
            <div key={key} className="section-card">
              <div className="sc-top">
                <span className="sc-name">{key.charAt(0).toUpperCase()+key.slice(1)}</span>
                <span className="sc-score" style={{ color: scoreColor(val.score) }}>{val.score}</span>
              </div>
              <div className="sc-bar-track">
                <div className="sc-bar-fill" style={{ width: `${val.score}%`, background: scoreColor(val.score) }} />
              </div>
              <div className="sc-status" style={{ color: val.status==='good'?'var(--good)':val.status==='warning'?'var(--warn)':'var(--bad)' }}>
                {val.status}
              </div>
              <p className="sc-feedback">{val.feedback}</p>
            </div>
          ))}
        </div>
      )}

      {tab === 'gaps' && (
        <div className="tab-content gaps-list">
          {data.gaps.map((g, i) => (
            <div key={i} className="gap-item">
              <span className={`gap-type ${g.type}`}>{g.type}</span>
              <div>
                <div className="gap-title">{g.title}</div>
                <p className="gap-desc">{g.description}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'improvements' && (
        <div className="tab-content improvements-list">
          {data.improvements.map((imp, i) => (
            <div key={i} className="imp-item">
              <span className={`imp-priority ${imp.priority}`}>{imp.priority}</span>
              <div>
                <div className="imp-category">{imp.category}</div>
                <p className="imp-suggestion">{imp.suggestion}</p>
                {imp.example && <div className="imp-example">{imp.example}</div>}
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'keywords' && (
        <div className="tab-content">
          <div className="kw-top">
            <span className="kw-density-label">Keyword density — {data.keywords.density_score}/100</span>
            <div className="kw-density-track">
              <div className="kw-density-fill" style={{ width: `${data.keywords.density_score}%` }} />
            </div>
          </div>
          <div className="kw-grid">
            <div className="kw-col">
              <div className="kw-col-hd found">Found ({data.keywords.found.length})</div>
              <div className="kw-tags">{data.keywords.found.map((k,i) => <span key={i} className="kw-tag found">{k}</span>)}</div>
            </div>
            <div className="kw-col">
              <div className="kw-col-hd missing">Missing ({data.keywords.missing.length})</div>
              <div className="kw-tags">{data.keywords.missing.map((k,i) => <span key={i} className="kw-tag missing">{k}</span>)}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function App() {
  const [file, setFile] = useState(null);
  const [jobDesc, setJobDesc] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const resultsRef = useRef();
  const uploadSectionRef = useRef();
  const fileInputRef = useRef();

  const handleNavUpload = (e) => {
    e.preventDefault();
    uploadSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setTimeout(() => fileInputRef.current?.click(), 450);
  };

  const handleNavFeedback = (e) => {
    e.preventDefault();
    if (result) {
      resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      uploadSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const analyze = async () => {
    if (!file) { setError('Please upload a PDF resume first.'); return; }
    setError(''); setResult(null); setLoading(true);
    const fd = new FormData();
    fd.append('resume', file);
    if (jobDesc) fd.append('job_description', jobDesc);
    try {
      const res = await fetch(`${API_URL}/analyze`, { method: 'POST', body: fd });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || 'Analysis failed');
      setResult(json.data);
      setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app">
      <header className="header">
        <div className="logo">Résumé<span className="logo-dot">·</span>Critic</div>
        <nav className="nav">
          <a href="#upload" onClick={handleNavUpload}>Upload</a>
          <a href="#feedback" onClick={handleNavFeedback} className="nav-cta">Get Feedback →</a>
        </nav>
      </header>

      <section className="masthead">
        <div className="masthead-left">
          <div className="masthead-kicker">AI Resume Analysis</div>
          <h1 className="masthead-title">
            Your résumé,<br />
            <em>honestly</em><br />
            reviewed.
          </h1>
          <p className="masthead-body">
            Upload your PDF and get a real ATS compatibility score, gap analysis, and ranked improvements — not flattery, not filler.
          </p>
          <div className="masthead-stats">
            <div className="mstat">
              <span className="mstat-n">100</span>
              <span className="mstat-l">ATS Scale</span>
            </div>
            <div className="mstat">
              <span className="mstat-n">6</span>
              <span className="mstat-l">Sections</span>
            </div>
            <div className="mstat">
              <span className="mstat-n">Free</span>
              <span className="mstat-l">Always</span>
            </div>
          </div>
        </div>
        <div className="masthead-right">
          <div className="pull-quote">
            "Most resumes fail ATS before a human ever reads them. <strong>Yours shouldn't be one of them.</strong>"
          </div>
          <div className="how-mini">
            {[
              ['01', 'Upload', 'Drop your PDF resume into the analyzer'],
              ['02', 'Parse', 'We extract and structure every section'],
              ['03', 'Score', 'Groq AI rates ATS compatibility across 6 dimensions'],
              ['04', 'Fix', 'Get prioritized, specific improvements with examples'],
            ].map(([n, t, d]) => (
              <div key={n} className="how-mini-item">
                <span className="how-mini-n">{n}</span>
                <span className="how-mini-text"><strong>{t} — </strong>{d}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="upload-section" id="upload" ref={uploadSectionRef}>
        <div className="upload-label">Submit your résumé</div>
        <div className="upload-grid">
          <DropZone onFile={setFile} file={file} inputRef={fileInputRef} />
          <div className="jd-side">
            <div className="jd-side-label">
              Job description <span className="jd-optional">(optional — improves ATS match)</span>
            </div>
            <textarea
              className="jd-textarea"
              placeholder="Paste the job description here for a tailored score and keyword gap analysis…"
              value={jobDesc}
              onChange={e => setJobDesc(e.target.value)}
              rows={7}
            />
            <div className="upload-actions">
              <button className="analyze-btn" onClick={analyze} disabled={loading || !file}>
                {loading ? <><div className="btn-spinner" /> Analyzing</> : 'Run Analysis →'}
              </button>
              {error && <span className="error-msg">{error}</span>}
            </div>
          </div>
        </div>
      </section>

      {loading && (
        <div className="loading-bar-wrap">
          <div className="loading-track"><div className="loading-fill" /></div>
          <div className="loading-label">Analyzing résumé…</div>
        </div>
      )}

      {result && (
        <section className="results-section" id="feedback" ref={resultsRef}>
          <div className="results-header-bar">
            <h2>Analysis Report</h2>
            <button className="reset-btn" onClick={() => { setResult(null); setFile(null); setJobDesc(''); }}>
              ← New Analysis
            </button>
          </div>
          <Results data={result} />
        </section>
      )}

      <footer className="footer">
        <span className="footer-logo">Resume Critic</span>
        <span>Analyze • Improve • Get hired</span>
        <span>© {new Date().getFullYear()} Zaina Afreen A P</span>
      </footer>
    </div>
  );
}