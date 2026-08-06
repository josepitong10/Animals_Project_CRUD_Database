// app.js - Private Dashboard
const API_BASE = 'https://animals-project-crud-database-2.onrender.com';

// ✅ Check authentication agad
const token = localStorage.getItem('accessToken') || '';
if (!token) {
    window.location.href = 'login.html';
}

// ✅ Kunin ang user data
let currentUser = null;
try {
    const userData = localStorage.getItem('currentUser');
    if (userData) {
        currentUser = JSON.parse(userData);
        console.log('👤 Current user:', currentUser);
    } else {
        window.location.href = 'login.html';
    }
} catch (e) {
    window.location.href = 'login.html';
}

// DOM Elements
const animalForm = document.getElementById('animalForm');
const notice = document.getElementById('notice');
const animalErrors = document.getElementById('animalErrors');
const animalsList = document.getElementById('animalsList');
const updateSection = document.getElementById('updateSection');
const updatingId = document.getElementById('updatingId');
const cancelUpdateBtn = document.getElementById('cancelUpdateBtn');
const submitAnimalBtn = document.getElementById('submitAnimalBtn');
const logoutBtn = document.getElementById('logoutBtn');

let editingId = null;

// ✅ Show welcome message
function showWelcomeMessage() {
    if (!currentUser) return;
    
    const welcomeDiv = document.createElement('div');
    welcomeDiv.className = 'welcome-banner';
    welcomeDiv.innerHTML = `
        <span>👋 Welcome, <strong>${currentUser.name}</strong>!</span>
        <span style="font-size: 0.8rem; color: var(--muted);">
            📧 ${currentUser.email}
            <span class="private-badge">🔒 Private</span>
        </span>
    `;
    
    const panelHeader = document.querySelector('.panel-header');
    if (panelHeader) {
        panelHeader.insertAdjacentElement('afterend', welcomeDiv);
    }
}

function setNotice(message, isError = false) {
    if (!notice) return;
    notice.textContent = message || '';
    notice.className = 'notice';
    if (isError) notice.classList.add('error');
}

function clearAnimalErrors() {
    if (animalErrors) animalErrors.textContent = '';
}

function showAnimalErrors(errors) {
    if (!errors || !errors.length) {
        if (animalErrors) animalErrors.textContent = '';
        return;
    }
    if (animalErrors) {
        animalErrors.innerHTML = errors.map((e) => `<div>❌ ${e}</div>`).join('');
    }
}

function resetAnimalForm() {
    if (animalForm) animalForm.reset();
    editingId = null;
    if (updateSection) updateSection.hidden = true;
    if (cancelUpdateBtn) cancelUpdateBtn.hidden = true;
    if (submitAnimalBtn) submitAnimalBtn.textContent = '➕ Create animal';
    clearAnimalErrors();
}

async function fetchJson(url, options = {}) {
    const headers = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
    };

    try {
        const response = await fetch(url, {
            ...options,
            headers,
            mode: 'cors',
        });

        const text = await response.text();
        let data;
        try {
            data = text ? JSON.parse(text) : {};
        } catch (e) {
            data = { message: text || 'Empty response' };
        }

        if (!response.ok) {
            const message = data.message || data.error || `HTTP error ${response.status}`;
            throw new Error(message);
        }

        return data;
    } catch (error) {
        console.error('❌ Fetch error:', error);
        if (error.message.includes('401') || error.message.includes('403')) {
            logout();
            throw new Error('Session expired. Please login again.');
        }
        throw error;
    }
}

// ✅ Load ONLY the logged-in user's animals
async function loadAnimals() {
    if (!animalsList) return;
    
    try {
        console.log('🔄 Loading your private animals...');
        const animals = await fetchJson(`${API_BASE}/animals`);
        console.log(`📦 Loaded ${animals.length} animals`);
        renderAnimals(animals);
    } catch (error) {
        console.error('❌ Load animals error:', error);
        animalsList.innerHTML = `<p style="color: var(--danger);">❌ ${error.message}</p>`;
    }
}

function renderAnimals(animals) {
    if (!animalsList) return;
    
    if (!Array.isArray(animals) || !animals.length) {
        animalsList.innerHTML = `
            <div class="empty-state">
                <span class="emoji">🐾</span>
                <p style="font-size: 1.2rem; font-weight: 500;">You don't have any animals yet.</p>
                <p style="color: var(--muted);">Create your first animal using the form above!</p>
            </div>
        `;
        return;
    }

    animalsList.innerHTML = animals
        .map((animal) => `
            <article class="animal-card">
                <div>
                    <h3>${escapeHtml(animal.name)}</h3>
                    <p>${animal.numLegs} legs</p>
                    <p class="animal-meta">🕐 Created ${new Date(animal.createdAt).toLocaleString()}</p>
                </div>
                <div class="card-actions">
                    <button class="ghost-btn" data-action="edit" data-id="${animal.id}">✏️ Update</button>
                    <button class="ghost-btn" data-action="delete" data-id="${animal.id}">🗑️ Delete</button>
                </div>
            </article>
        `)
        .join('');
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

async function createOrUpdateAnimal(event) {
    event.preventDefault();
    clearAnimalErrors();

    const name = document.getElementById('animalName').value.trim();
    const numLegs = document.getElementById('animalLegs').value.trim();
    const errors = [];

    if (!name) errors.push('Animal name is required.');
    if (!numLegs) errors.push('Number of legs is required.');
    if (Number(numLegs) < 0 || Number(numLegs) > 100) {
        errors.push('Number of legs must be between 0 and 100.');
    }

    if (errors.length) {
        showAnimalErrors(errors);
        return;
    }

    const submitBtn = animalForm.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = editingId ? 'Updating...' : 'Creating...';
    submitBtn.disabled = true;

    try {
        const payload = { name, numLegs: Number(numLegs) };
        const method = editingId ? 'PUT' : 'POST';
        const url = editingId ? `${API_BASE}/animals/${editingId}` : `${API_BASE}/animals`;

        await fetchJson(url, {
            method,
            body: JSON.stringify(payload),
        });

        setNotice(editingId ? '✅ Animal updated!' : '✅ Animal created!', false);
        resetAnimalForm();
        await loadAnimals();
    } catch (error) {
        showAnimalErrors([error.message || 'Operation failed.']);
    } finally {
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    }
}

async function deleteAnimal(id) {
    if (!confirm('Are you sure you want to delete this animal?')) return;
    
    try {
        await fetchJson(`${API_BASE}/animals/${id}`, { method: 'DELETE' });
        setNotice('✅ Animal deleted!', false);
        await loadAnimals();
    } catch (error) {
        setNotice(error.message || 'Delete failed.', true);
    }
}

async function startEditAnimal(id) {
    try {
        const animals = await fetchJson(`${API_BASE}/animals`);
        const animal = animals.find((item) => String(item.id) === String(id));
        if (!animal) {
            setNotice('Animal not found.', true);
            return;
        }

        editingId = animal.id;
        document.getElementById('animalName').value = animal.name;
        document.getElementById('animalLegs').value = animal.numLegs;
        if (updateSection) {
            updateSection.hidden = false;
            updatingId.textContent = animal.name;
        }
        if (cancelUpdateBtn) cancelUpdateBtn.hidden = false;
        if (submitAnimalBtn) submitAnimalBtn.textContent = '📝 Update animal';
        clearAnimalErrors();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
        setNotice(error.message || 'Failed to load animal.', true);
    }
}

function logout() {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('currentUser');
    window.location.href = 'login.html';
}

// ✅ Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    showWelcomeMessage();
    
    if (animalForm) {
        animalForm.addEventListener('submit', createOrUpdateAnimal);
    }
    if (cancelUpdateBtn) {
        cancelUpdateBtn.addEventListener('click', resetAnimalForm);
    }
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logout);
    }
    if (animalsList) {
        animalsList.addEventListener('click', (event) => {
            const button = event.target.closest('button[data-action]');
            if (!button) return;

            const action = button.dataset.action;
            const id = button.dataset.id;

            if (action === 'edit') {
                startEditAnimal(id);
            } else if (action === 'delete') {
                deleteAnimal(id);
            }
        });
    }

    if (token) {
        loadAnimals();
    }
});