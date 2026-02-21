/**
 * DataVex API Client
 * Connects React frontend to FastAPI backend
 */

const API_BASE = 'http://localhost:8000/api/v1';

export async function triggerScan(query) {
    const res = await fetch(`${API_BASE}/scan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, sources: ['github', 'web', 'news'], depth: 'full' }),
    });
    if (!res.ok) throw new Error(`Scan failed: ${res.status}`);
    return res.json();
}

export async function getScanStatus(scanId) {
    const res = await fetch(`${API_BASE}/scan/${scanId}`);
    if (!res.ok) throw new Error(`Status check failed: ${res.status}`);
    return res.json();
}

export async function getCompanies(sort = 'score', order = 'desc') {
    const res = await fetch(`${API_BASE}/companies?sort_by=${sort}&order=${order}&limit=50`);
    if (!res.ok) throw new Error(`Companies fetch failed: ${res.status}`);
    return res.json();
}

export async function getCompany(id) {
    const res = await fetch(`${API_BASE}/companies/${id}`);
    if (!res.ok) throw new Error(`Company fetch failed: ${res.status}`);
    return res.json();
}

export async function getCapabilityMatch(id) {
    const res = await fetch(`${API_BASE}/companies/${id}/capability-match`);
    if (!res.ok) throw new Error(`Capability match failed: ${res.status}`);
    return res.json();
}

export async function getTrace(id) {
    const res = await fetch(`${API_BASE}/companies/${id}/trace`);
    if (!res.ok) throw new Error(`Trace fetch failed: ${res.status}`);
    return res.json();
}

export async function triggerDiscovery() {
    const res = await fetch(`${API_BASE}/discover`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
    });
    if (res.status === 429) {
        const data = await res.json();
        throw new Error(data.detail || 'A scan is already running. Wait for it to finish.');
    }
    if (!res.ok) throw new Error(`Discovery failed: ${res.status}`);
    return res.json();
}

export async function getDiscoveryStatus(scanId) {
    const res = await fetch(`${API_BASE}/discover/${scanId}`);
    if (!res.ok) throw new Error(`Status check failed: ${res.status}`);
    return res.json();
}
