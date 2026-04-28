const API_BASE = import.meta.env.VITE_API_BASE || 'http://101.43.86.63:3001';

export const api = {
  health: () => fetch(`${API_BASE}/api/health`).then(r => r.json()),
  
  constraints: () => fetch(`${API_BASE}/api/schedule/constraints`).then(r => r.json()),
  
  upload: (file: File) => {
    const form = new FormData();
    form.append('file', file);
    return fetch(`${API_BASE}/api/schedule/upload`, { method: 'POST', body: form }).then(r => r.json());
  },
  
  generate: () => fetch(`${API_BASE}/api/schedule/generate`, { method: 'POST' }).then(r => r.json()),
  
  results: (page = 1, limit = 100) => 
    fetch(`${API_BASE}/api/schedule/results?page=${page}&limit=${limit}`).then(r => r.json()),
  
  override: (assignmentId: string, shiftStart: string, shiftEnd: string) =>
    fetch(`${API_BASE}/api/schedule/override`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ assignmentId, shiftStart, shiftEnd })
    }).then(r => r.json()),
};

export type { };
