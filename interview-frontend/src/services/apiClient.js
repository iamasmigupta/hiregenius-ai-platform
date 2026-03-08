import config from '../config';
const API_BASE_URL = config.API_BASE_URL;

const request = async (endpoint, options = {}) => {
    const url = `${API_BASE_URL}${endpoint}`;
    const token = localStorage.getItem('token');
    const requestConfig = {
        headers: { 'Content-Type': 'application/json', ...options.headers },
        ...options,
    };
    if (token) {
        requestConfig.headers['Authorization'] = `Bearer ${token}`;
    }
    try {
        const response = await fetch(url, requestConfig);
        if (!response.ok) {
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.indexOf('application/json') !== -1) {
                const errorData = await response.json();
                throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
            } else {
                const errorText = await response.text();
                throw new Error(errorText || `HTTP error! status: ${response.status}`);
            }
        }
        return response.status === 204 ? null : response.json();
    } catch (error) {
        console.error(`API Client Error: ${error.message}`);
        throw error;
    }
};

export const transcribeAudio = async (audioBlob) => {
    const url = `${API_BASE_URL}/interview/transcribe`;
    const token = localStorage.getItem('token');
    const formData = new FormData();
    formData.append('audio', audioBlob, 'interview-response.webm');
    const headers = {};
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    try {
        const response = await fetch(url, { method: 'POST', headers, body: formData });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
        }
        return response.json();
    } catch (error) {
        console.error(`API Client Error: ${error.message}`);
        throw error;
    }
};

export const register = (userData) => request('/auth/register', { method: 'POST', body: JSON.stringify(userData) });
export const login = (credentials) => request('/auth/login', { method: 'POST', body: JSON.stringify(credentials) });
export const forgotPassword = (email) => request('/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email }) });
export const resetPasswordWithOTP = (data) => request('/auth/reset-password', { method: 'POST', body: JSON.stringify(data) });
export const changePassword = (data) => request('/auth/change-password', { method: 'PUT', body: JSON.stringify(data) });
export const signup = (userData) => request('/auth/signup', { method: 'POST', body: JSON.stringify(userData) });
export const verifyEmail = (data) => request('/auth/verify-email', { method: 'POST', body: JSON.stringify(data) });
export const resendVerificationCode = (email) => request('/auth/resend-code', { method: 'POST', body: JSON.stringify({ email }) });

export const createTemplate = (templateData) => request('/templates', { method: 'POST', body: JSON.stringify(templateData) });
export const getTemplates = () => request('/templates');

export const getCandidates = () => request('/users?role=candidate');

export const createSession = async (sessionData, resumeFile) => {
    const url = `${API_BASE_URL}/interview/sessions`;
    const token = localStorage.getItem('token');
    const formData = new FormData();
    formData.append('templateId', sessionData.templateId);
    formData.append('candidateId', sessionData.candidateId);
    formData.append('scheduledAt', sessionData.scheduledAt);
    if (resumeFile) formData.append('resume', resumeFile);
    const headers = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const response = await fetch(url, { method: 'POST', headers, body: formData });
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create session.');
    }
    return response.json();
};
export const getSessionByLink = (uniqueLink) => request(`/interview/sessions/${uniqueLink}`);
export const submitResponse = (sessionId, responseData) => request(`/interview/sessions/${sessionId}/responses`, { method: 'POST', body: JSON.stringify(responseData) });
export const getMySessions = () => request('/interview/sessions/my-sessions');
export const getCompletedSessions = (page = 1, limit = 5, status, templateId, dateFrom, dateTo) => {
    let url = `/interview/sessions/completed?page=${page}&limit=${limit}`;
    if (status && status !== 'all') url += `&status=${status}`;
    if (templateId) url += `&templateId=${templateId}`;
    if (dateFrom) url += `&dateFrom=${encodeURIComponent(dateFrom)}`;
    if (dateTo) url += `&dateTo=${encodeURIComponent(dateTo)}`;
    return request(url);
};

/**
 * Fetches the full session details for an admin, including ideal answers.
 * @param {string} sessionId The ID of the session.
 */
export const getSessionDetailsForAdmin = (sessionId) => request(`/interview/sessions/${sessionId}/details`);

/**
 * Fetches the paginated list of individual candidate responses for a session.
 * @param {string} sessionId The ID of the session.
 * @param {number} page The page number to fetch.
 */
export const getSessionResponses = (sessionId, page = 1) => request(`/reports/${sessionId}/responses?page=${page}`);
export const generateReport = (sessionId) => request(`/reports/${sessionId}`, { method: 'POST' });
export const getReport = (sessionId) => request(`/reports/${sessionId}`);

export const markSessionCompletedOrTerminated = (sessionId, data) =>
  request(`/interview/sessions/${sessionId}/complete`, { method: 'POST', body: JSON.stringify(data) });

/**
 * Submits a decision for an interview session.
 * @param {string} sessionId - The ID of the interview session.
 * @param {'approved' | 'rejected'} decision - The decision status.
 * @param {string} [comments] - Optional feedback comments.
 */
export const submitDecision = (sessionId, { decision, comments }) => 
  request(`/interview/sessions/${sessionId}/decision`, {
    method: 'POST',
    body: JSON.stringify({ decision, comments }),
  });

/**
 * Handles exporting a report as either CSV or PDF and triggers a file download.
 * @param {string} sessionId - The ID of the interview session.
 * @param {'csv' | 'pdf'} type - The desired export format.
 * @param {string} query - Optional query string for filtered export.
 */
export const exportReport = async (sessionId, type, query = '') => {
    let url;
    if (sessionId === 'filtered') {
        url = `${API_BASE_URL}/reports/export${type === 'pdf' ? '/pdf' : ''}${query}`;
    } else {
        url = `${API_BASE_URL}/reports/${sessionId}/export${type === 'pdf' ? '/pdf' : ''}`;
    }
    const token = localStorage.getItem('token');
    const headers = { 'Authorization': `Bearer ${token}` };

    try {
        const response = await fetch(url, { headers });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText || 'Export failed.');
        }

        const blob = await response.blob();
        const fileName = response.headers.get('Content-Disposition')?.split('filename=')[1]?.replaceAll('"', '') || `report_${sessionId}.${type}`;
        
        const link = document.createElement('a');
        link.href = window.URL.createObjectURL(blob);
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(link.href);

    } catch (error) {
        console.error(`Export Error: ${error.message}`);
        throw error;
    }
};

export const getDashboardStats = () => request('/users/admin/dashboard-stats');
export const getRecentInterviews = () => request('/users/admin/recent-interviews');

export const updateProfile = (profileData) => request('/users/me', { method: 'PUT', body: JSON.stringify(profileData) });
export const deleteAccount = () => request('/users/me', { method: 'DELETE' });

// Resume Parsing
export const parseResume = async (file, candidateId) => {
    const url = `${API_BASE_URL}/resume/parse`;
    const token = localStorage.getItem('token');
    const formData = new FormData();
    formData.append('resume', file);
    if (candidateId) formData.append('candidateId', candidateId);
    const headers = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const response = await fetch(url, { method: 'POST', headers, body: formData });
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to parse resume.');
    }
    return response.json();
};

export const saveResumeToProfile = (candidateId, parsedResume) =>
    request(`/resume/save/${candidateId}`, { method: 'PUT', body: JSON.stringify({ parsedResume }) });