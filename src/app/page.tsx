"use client";

import { useState, useRef, ChangeEvent } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Paperclip, ArrowUp, X, File as FileIcon, Image as ImageIcon } from 'lucide-react';

export default function Home() {
  const [idea, setIdea] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<{ architect?: string; analyst?: string; qa?: string }>({});
  const [error, setError] = useState("");
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleInput = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setIdea(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setFiles((prev) => [...prev, ...newFiles]);
    }
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!idea.trim() && files.length === 0) return;

    setLoading(true);
    setError("");
    setResults({});
    setProgress(1);

    try {
      const formData = new FormData();
      formData.append('idea', idea);
      files.forEach((file) => formData.append('files', file));

      const res = await fetch('/api/pipeline', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        let errMessage = "Failed to start pipeline";
        try {
          const errData = await res.json();
          if (errData.error) errMessage = errData.error;
        } catch (e) {}
        throw new Error(errMessage);
      }

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();

      if (reader) {
        let currentResults = {};
        let buffer = "";
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          buffer += decoder.decode(value, { stream: true });
          const parts = buffer.split('\n\n');
          buffer = parts.pop() || "";
          
          for (const part of parts) {
            if (part.startsWith('data: ')) {
              try {
                const data = JSON.parse(part.slice(6));
                if (data.stage) setProgress(data.stage);
                if (data.results) {
                  currentResults = { ...currentResults, ...data.results };
                  setResults(currentResults);
                }
                if (data.error) setError(data.error);
              } catch (e) {
                console.error("Parse error", e);
              }
            }
          }
        }
      }
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
      setProgress((prev) => (!error ? 5 : prev));
    }
  };

  // Custom component mapping for ReactMarkdown to inject Bootstrap table classes
  const MarkdownComponents: any = {
    table: ({ node, ...props }: any) => (
      <div className="table-responsive shadow-sm">
        <table className="table table-hover table-bordered mb-0" {...props} />
      </div>
    )
  };

  return (
    <div className="container-fluid animate-in px-xl-5">
      <div className="row g-4">
        {/* Left Column: Form & Progress */}
        <div className="col-lg-4 col-xl-4">
          <div className="sticky-top" style={{ top: '2rem', zIndex: 10 }}>
            <header className="mb-4">
              <h1 className="display-5 fw-bold mb-3" style={{ background: 'linear-gradient(135deg, #c084fc, #ec4899)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                AI Quality
              </h1>
              <p className="lead fs-6 text-muted">
                Transform ideas and diagrams into formal specifications and test matrices in seconds.
              </p>
            </header>

            <div className="mb-4">
              {/* Sleek Gemini-style Input Pill */}
              <div 
                className="bg-white p-2 d-flex flex-column" 
                style={{ 
                  borderRadius: '1.5rem', 
                  boxShadow: '0 4px 20px rgba(124, 58, 237, 0.1)',
                  border: '1px solid rgba(124, 58, 237, 0.15)',
                  transition: 'box-shadow 0.2s ease'
                }}
              >
                {/* File Previews */}
                {files.length > 0 && (
                  <div className="d-flex flex-wrap gap-2 px-3 pt-3 pb-1 border-bottom" style={{ borderColor: '#f1f5f9' }}>
                    {files.map((file, idx) => {
                      const isImage = file.type.startsWith('image/');
                      return (
                        <div key={idx} className="position-relative bg-light rounded px-3 py-1 d-flex align-items-center gap-2 border" style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                          {isImage ? <ImageIcon size={14} /> : <FileIcon size={14} />}
                          <span className="text-truncate" style={{ maxWidth: '120px' }}>{file.name}</span>
                          <button 
                            type="button" 
                            className="btn-close ms-1" 
                            style={{ fontSize: '0.5rem' }} 
                            onClick={() => removeFile(idx)}
                          ></button>
                        </div>
                      )
                    })}
                  </div>
                )}

                <div className="d-flex align-items-end p-2 gap-2">
                  <input 
                    type="file" 
                    multiple 
                    className="d-none" 
                    ref={fileInputRef} 
                    onChange={handleFileChange}
                  />
                  <button 
                    type="button" 
                    className="btn btn-light rounded-circle d-flex align-items-center justify-content-center flex-shrink-0" 
                    style={{ width: '40px', height: '40px', color: '#64748b' }}
                    onClick={() => fileInputRef.current?.click()}
                    title="Attach files"
                  >
                    <Paperclip size={20} />
                  </button>

                  <textarea 
                    ref={textareaRef}
                    value={idea}
                    onChange={handleInput}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSubmit();
                      }
                    }}
                    placeholder="Describe your idea or attach a diagram..."
                    className="form-control border-0 bg-transparent flex-grow-1 shadow-none px-2"
                    style={{ resize: 'none', height: '40px', overflowY: 'auto' }}
                  />

                  <button 
                    type="button" 
                    disabled={loading || (!idea.trim() && files.length === 0)}
                    onClick={handleSubmit}
                    className="btn rounded-circle d-flex align-items-center justify-content-center flex-shrink-0 border-0"
                    style={{ 
                      width: '40px', 
                      height: '40px', 
                      background: idea.trim() || files.length > 0 ? 'var(--primary-btn)' : '#e2e8f0',
                      color: idea.trim() || files.length > 0 ? '#fff' : '#94a3b8',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    {loading ? (
                      <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                    ) : (
                      <ArrowUp size={20} strokeWidth={3} />
                    )}
                  </button>
                </div>
              </div>
              <small className="text-muted mt-2 d-block text-center" style={{ fontSize: '0.8rem' }}>
                Press Enter to send, Shift + Enter for new line.
              </small>
            </div>

            {error && (
              <div className="alert alert-danger pastel-card border-0 text-danger fw-bold" role="alert">
                <h5 className="alert-heading">Error</h5>
                {error}
              </div>
            )}

            {(progress > 0 || results.architect) && (
              <div className="pastel-card p-4">
                <h4 className="border-bottom pb-2 mb-4" style={{ color: 'var(--text-primary)' }}>Pipeline Status</h4>
                <div className="d-flex flex-column gap-3">
                  {['Product Architect', 'Systems Analyst', 'QA Engineer', 'Done'].map((step, idx) => {
                    const stepNum = idx + 1;
                    const isActive = progress === stepNum;
                    const isPast = progress > stepNum;
                    let dotClass = 'pulse-dot pending';
                    if (isActive) dotClass = 'pulse-dot active';
                    if (isPast) dotClass = 'pulse-dot done';

                    return (
                      <div key={step} className="d-flex align-items-center gap-3" style={{ opacity: isActive || isPast ? 1 : 0.5 }}>
                        <div className={dotClass}>
                          {isPast ? '✓' : stepNum}
                        </div>
                        <span className={`fs-6 ${isActive ? 'fw-bold' : ''}`} style={{ color: 'var(--text-primary)' }}>{step}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Results Area */}
        <div className="col-lg-8 col-xl-8">
          <div className="d-flex flex-column gap-4 pb-5">
            {results.architect && (
              <div className="pastel-card p-4 p-md-5 animate-in">
                <h2 className="border-bottom pb-3 mb-4" style={{ color: '#c084fc' }}>1. Product Vision (Architect)</h2>
                <div className="prose">
                  <ReactMarkdown remarkPlugins={[remarkGfm]} components={MarkdownComponents}>
                    {results.architect}
                  </ReactMarkdown>
                </div>
              </div>
            )}
            
            {results.analyst && (
              <div className="pastel-card p-4 p-md-5 animate-in" style={{ animationDelay: '0.1s' }}>
                <h2 className="border-bottom pb-3 mb-4" style={{ color: '#f472b6' }}>2. SRS Requirements (Analyst)</h2>
                <div className="d-flex flex-column gap-3">
                  {(() => {
                    try {
                      // Attempt to parse the JSON string
                      let reqs = JSON.parse(results.analyst);
                      // Handle if it's wrapped in an object { requirements: [...] }
                      if (reqs.requirements) reqs = reqs.requirements;
                      if (!Array.isArray(reqs)) reqs = Object.values(reqs).flat();

                      if (!Array.isArray(reqs)) {
                        return <div className="alert alert-warning">Unable to parse requirements list.</div>;
                      }

                      return reqs.map((req: any, i: number) => (
                        <div key={i} className="card border-0 shadow-sm mb-2" style={{ background: '#fdf2f8' }}>
                          <div className="card-body">
                            <h5 className="card-title fw-bold" style={{ color: '#db2777' }}>
                              {req.id || req.ID || `REQ-${i+1}`} {req.title && `- ${req.title}`}
                            </h5>
                            <p className="card-text mb-1" style={{ color: 'var(--text-primary)' }}>
                              {req.description || req.Description || req.requirement || JSON.stringify(req)}
                            </p>
                            {(req.type || req.Type) && (
                              <span className="badge bg-white text-pink border border-pink mt-2" style={{ color: '#db2777', borderColor: '#fbcfe8' }}>
                                {req.type || req.Type}
                              </span>
                            )}
                          </div>
                        </div>
                      ));
                    } catch (e) {
                      // Fallback if parsing fails
                      return (
                        <div className="prose">
                          <pre className="m-0 shadow-sm border-0 bg-light"><code className="text-dark bg-transparent p-0">{results.analyst}</code></pre>
                        </div>
                      );
                    }
                  })()}
                </div>
              </div>
            )}

            {results.qa && (
              <div className="pastel-card p-4 p-md-5 animate-in" style={{ animationDelay: '0.2s' }}>
                <h2 className="border-bottom pb-3 mb-4" style={{ color: '#c084fc' }}>3. Test Cases & RTM (QA)</h2>
                <div className="prose">
                  <ReactMarkdown remarkPlugins={[remarkGfm]} components={MarkdownComponents}>
                    {results.qa}
                  </ReactMarkdown>
                </div>
              </div>
            )}
            
            {!results.architect && progress === 0 && (
              <div className="pastel-card p-5 text-center d-flex flex-column align-items-center justify-content-center animate-in" style={{ minHeight: '70vh', border: '2px dashed var(--border-color)', background: 'transparent', boxShadow: 'none' }}>
                <div className="display-1 mb-4">✨</div>
                <h2 className="fw-bold" style={{ color: 'var(--text-primary)' }}>Ready to Innovate</h2>
                <p className="fs-5" style={{ color: 'var(--text-muted)', maxWidth: '400px' }}>
                  Use the input box on the left to describe your project. You can even attach architecture diagrams or mockups!
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
