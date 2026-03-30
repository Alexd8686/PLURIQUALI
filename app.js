/* ========================================
   PLURI'QUALI — Application Logic
   ======================================== */

// ========== DATA ==========
const SECTIONS = [
    {
        id: 'PT', name: 'Présentation & Tenue', color: '#6247AA',
        criteria: [
            'Tenue conforme aux standards',
            'Chaussures adaptées et propres',
            'Badge visible et en bon état',
            'Hygiène et présentation',
            'Posture professionnelle'
        ]
    },
    {
        id: 'CS', name: 'Comportement & Sens du service', color: '#1B8A5A',
        criteria: [
            'Accueil chaleureux',
            'Proactivité et anticipation',
            'Gestion des demandes',
            'Politesse et courtoisie',
            'Pas de téléphone personnel',
            'Esprit d\'équipe'
        ]
    },
    {
        id: 'CF', name: 'Connaissances & Formation', color: '#2980B9',
        criteria: [
            'Procédures du site',
            'Maîtrise des outils',
            'Consignes de sécurité',
            'Quizz de formation',
            'Cahier de consignes'
        ]
    },
    {
        id: 'QP', name: 'Qualité des prestations', color: '#C67D20',
        criteria: [
            'Respect des horaires',
            'Qualité d\'exécution',
            'Propreté du poste',
            'Gestion des flux',
            'Reporting à jour'
        ]
    },
    {
        id: 'VA', name: 'Valeur ajoutée', color: '#A93246',
        criteria: [
            'Propositions d\'amélioration',
            'Initiative positive',
            'Satisfaction client',
            'Implication sur site'
        ]
    }
];

const RATING_LABELS = {
    conforme: 'Conforme',
    ameliorer: 'À améliorer',
    non_conforme: 'Non conforme',
    na: 'N/A'
};

const RATING_COLORS = {
    conforme: { text: '#1B8A5A', bg: '#D4EFDF' },
    ameliorer: { text: '#C67D20', bg: '#FCF0DB' },
    non_conforme: { text: '#A93246', bg: '#FADEE4' },
    na: { text: '#B0ADB8', bg: '#F2F1F4' }
};

// ========== STATE ==========
let ratings = {};
let comments = {};
let photos = [];
let actions = [];
let currentUser = null;

// ========== INIT ==========
document.addEventListener('DOMContentLoaded', () => {
    // Restore user session
    const saved = localStorage.getItem('pq_user');
    if (saved) {
        currentUser = JSON.parse(saved);
        document.getElementById('loginName').value = currentUser.name || '';
        document.getElementById('loginEmail').value = currentUser.email || '';
    }

    // Set today's date
    document.getElementById('siteDate').valueAsDate = new Date();

    // Build quality sections
    buildSections();

    // Add first action by default
    addAction();
});

// ========== LOGIN ==========
function handleLogin() {
    const name = document.getElementById('loginName').value.trim();
    const email = document.getElementById('loginEmail').value.trim();

    if (!name) { showToast('Veuillez saisir votre nom'); return; }
    if (!email || !email.includes('@')) { showToast('Email invalide'); return; }

    currentUser = { name, email };
    localStorage.setItem('pq_user', JSON.stringify(currentUser));

    document.getElementById('loginScreen').classList.remove('active');
    document.getElementById('appScreen').classList.add('active');

    // Greeting
    const hour = new Date().getHours();
    const greeting = hour < 12 ? 'Bonjour' : hour < 18 ? 'Bon après-midi' : 'Bonsoir';
    document.getElementById('greetingText').textContent = `${greeting}, ${name.split(' ')[0]}`;
}

function handleLogout() {
    localStorage.removeItem('pq_user');
    document.getElementById('appScreen').classList.remove('active');
    document.getElementById('loginScreen').classList.add('active');
}

// ========== BUILD SECTIONS ==========
function buildSections() {
    const container = document.getElementById('sectionsContainer');
    container.innerHTML = '';

    SECTIONS.forEach((section, sIdx) => {
        const sectionId = `section_${section.id}`;
        const totalCriteria = section.criteria.length;

        const card = document.createElement('section');
        card.className = 'card';
        card.id = sectionId;

        card.innerHTML = `
            <div class="card-header" onclick="toggleSection('${sectionId}')">
                <div class="card-header-left">
                    <span class="section-icon" style="background:${section.color}">
                        <span class="section-tag" style="background:transparent;padding:0;font-size:0.8rem">${section.id}</span>
                    </span>
                    <h2>${section.name}</h2>
                </div>
                <span class="badge" id="badge_${section.id}">0/${totalCriteria}</span>
                <svg class="chevron" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
            </div>
            <div class="card-body">
                ${section.criteria.map((c, cIdx) => {
                    const key = `${section.id}_${cIdx}`;
                    return `
                        <div class="criterion">
                            <div class="criterion-label">${c}</div>
                            <div class="rating-buttons">
                                <button class="rating-btn" data-value="conforme" data-key="${key}" onclick="rate('${key}','conforme',this)">Conforme</button>
                                <button class="rating-btn" data-value="ameliorer" data-key="${key}" onclick="rate('${key}','ameliorer',this)">À améliorer</button>
                                <button class="rating-btn" data-value="non_conforme" data-key="${key}" onclick="rate('${key}','non_conforme',this)">Non conforme</button>
                                <button class="rating-btn" data-value="na" data-key="${key}" onclick="rate('${key}','na',this)">N/A</button>
                            </div>
                            <div class="criterion-comment">
                                <div class="textarea-wrapper">
                                    <textarea id="comment_${key}" rows="2" placeholder="Commentaire..." oninput="comments['${key}']=this.value"></textarea>
                                    <button class="btn-mic" onclick="startDictation('comment_${key}')" title="Dictée vocale">
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z"/><path d="M19 10v2a7 7 0 01-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>
                                    </button>
                                </div>
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        `;

        container.appendChild(card);
    });
}

// ========== RATING ==========
function rate(key, value, btn) {
    // Toggle if clicking same value
    if (ratings[key] === value) {
        delete ratings[key];
        btn.classList.remove('selected');
    } else {
        ratings[key] = value;
        // Deselect siblings
        const parent = btn.parentElement;
        parent.querySelectorAll('.rating-btn').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
    }

    updateProgress();
    updateScore();
}

// ========== PROGRESS ==========
function updateProgress() {
    const total = SECTIONS.reduce((sum, s) => sum + s.criteria.length, 0);
    const filled = Object.keys(ratings).length;

    const pct = total > 0 ? (filled / total) * 100 : 0;
    document.getElementById('progressBar').style.width = pct + '%';

    // Update badges
    SECTIONS.forEach(section => {
        const count = section.criteria.filter((_, i) => ratings[`${section.id}_${i}`]).length;
        document.getElementById(`badge_${section.id}`).textContent = `${count}/${section.criteria.length}`;
    });
}

// ========== SCORE ==========
function updateScore() {
    const ratingValues = Object.values(ratings);
    if (ratingValues.length === 0) {
        document.getElementById('scoreSummary').classList.add('hidden');
        return;
    }

    document.getElementById('scoreSummary').classList.remove('hidden');

    const counts = { conforme: 0, ameliorer: 0, non_conforme: 0, na: 0 };
    ratingValues.forEach(v => counts[v]++);

    const scored = counts.conforme + counts.ameliorer + counts.non_conforme;
    const pct = scored > 0 ? Math.round((counts.conforme / scored) * 100) : 0;

    document.getElementById('countConf').textContent = counts.conforme;
    document.getElementById('countAmel').textContent = counts.ameliorer;
    document.getElementById('countNC').textContent = counts.non_conforme;
    document.getElementById('countNA').textContent = counts.na;
    document.getElementById('scorePercent').textContent = pct;

    // Ring animation
    const circle = document.getElementById('scoreCircle');
    const circumference = 2 * Math.PI * 52;
    const offset = circumference - (pct / 100) * circumference;
    circle.style.strokeDashoffset = offset;

    // Color and label
    let label, color;
    if (pct >= 90) { label = 'Excellent'; color = '#1B8A5A'; }
    else if (pct >= 70) { label = 'Satisfaisant'; color = '#6247AA'; }
    else if (pct >= 50) { label = 'À améliorer'; color = '#C67D20'; }
    else { label = 'Insuffisant'; color = '#A93246'; }

    circle.style.stroke = color;
    const labelEl = document.getElementById('scoreLabel');
    labelEl.textContent = label;
    labelEl.style.color = color;
}

// ========== SECTIONS TOGGLE ==========
function toggleSection(sectionId) {
    const card = document.getElementById(sectionId);
    const body = card.querySelector('.card-body');
    body.classList.toggle('open');
}

// ========== VOICE DICTATION ==========
function startDictation(textareaId) {
    const textarea = document.getElementById(textareaId);
    const btn = textarea.closest('.textarea-wrapper').querySelector('.btn-mic');

    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
        showToast('Dictée vocale non supportée sur ce navigateur');
        return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = 'fr-FR';
    recognition.continuous = false;
    recognition.interimResults = false;

    btn.classList.add('recording');

    recognition.onresult = (e) => {
        const text = e.results[0][0].transcript;
        textarea.value = textarea.value ? textarea.value + ' ' + text : text;
        textarea.dispatchEvent(new Event('input'));
    };

    recognition.onend = () => { btn.classList.remove('recording'); };
    recognition.onerror = () => {
        btn.classList.remove('recording');
        showToast('Erreur de dictée vocale');
    };

    recognition.start();
}

// ========== PHOTOS ==========
function handlePhotos(input) {
    const files = Array.from(input.files);
    files.forEach(file => {
        const reader = new FileReader();
        reader.onload = (e) => {
            photos.push({ data: e.target.result, name: file.name });
            renderPhotos();
        };
        reader.readAsDataURL(file);
    });
    input.value = '';
}

function renderPhotos() {
    const grid = document.getElementById('photoGrid');
    grid.innerHTML = photos.map((p, i) => `
        <div class="photo-thumb">
            <img src="${p.data}" alt="Photo ${i + 1}">
            <button class="photo-remove" onclick="removePhoto(${i})">&times;</button>
        </div>
    `).join('');
    document.getElementById('photoBadge').textContent = photos.length;
}

function removePhoto(idx) {
    photos.splice(idx, 1);
    renderPhotos();
}

// ========== ACTIONS ==========
let actionCounter = 0;

function addAction() {
    const id = ++actionCounter;
    actions.push(id);
    const list = document.getElementById('actionsList');
    const item = document.createElement('div');
    item.className = 'action-item';
    item.id = `action_${id}`;
    item.innerHTML = `
        <button class="action-remove" onclick="removeAction(${id})">&times;</button>
        <div class="form-group">
            <label>Action corrective</label>
            <div class="textarea-wrapper">
                <textarea id="actionText_${id}" rows="2" placeholder="Décrire l&#39;action corrective..."></textarea>
                <button class="btn-mic" onclick="startDictation('actionText_${id}')" title="Dictée vocale">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z"/><path d="M19 10v2a7 7 0 01-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>
                </button>
            </div>
        </div>
        <div class="form-group">
            <label>Responsable</label>
            <input type="text" id="actionResp_${id}" placeholder="Qui doit agir ?">
        </div>
        <div class="form-group">
            <label>Échéance</label>
            <input type="date" id="actionDate_${id}">
        </div>
    `;
    list.appendChild(item);
}

function removeAction(id) {
    actions = actions.filter(a => a !== id);
    const el = document.getElementById(`action_${id}`);
    if (el) el.remove();
}

// ========== REPORT GENERATION ==========
function generateReport() {
    const ratingValues = Object.values(ratings);
    if (ratingValues.length === 0) {
        showToast('Veuillez noter au moins un critère');
        return;
    }

    const site = {
        client: document.getElementById('siteClient').value || 'Non renseigné',
        date: document.getElementById('siteDate').value || new Date().toISOString().split('T')[0],
        type: document.getElementById('siteType').value || 'Non renseigné',
        metier: document.getElementById('siteMetier').value || 'Non renseigné',
        ressource: document.getElementById('siteRessource').value || 'Non renseigné'
    };

    const counts = { conforme: 0, ameliorer: 0, non_conforme: 0, na: 0 };
    ratingValues.forEach(v => counts[v]++);
    const scored = counts.conforme + counts.ameliorer + counts.non_conforme;
    const pct = scored > 0 ? Math.round((counts.conforme / scored) * 100) : 0;

    let label;
    if (pct >= 90) label = 'Excellent';
    else if (pct >= 70) label = 'Satisfaisant';
    else if (pct >= 50) label = 'À améliorer';
    else label = 'Insuffisant';

    // Build sections HTML
    let sectionsHTML = '';
    SECTIONS.forEach(section => {
        sectionsHTML += `<h2 style="color:${section.color}">${section.id} — ${section.name}</h2>`;
        sectionsHTML += '<table><thead><tr><th>Critère</th><th>Note</th><th>Commentaire</th></tr></thead><tbody>';
        section.criteria.forEach((c, i) => {
            const key = `${section.id}_${i}`;
            const r = ratings[key];
            const comment = comments[key] || '';
            const rLabel = r ? RATING_LABELS[r] : '—';
            const rColor = r ? RATING_COLORS[r] : { text: '#B0ADB8', bg: '#F2F1F4' };
            sectionsHTML += `<tr>
                <td>${c}</td>
                <td><span class="report-status" style="background:${rColor.bg};color:${rColor.text}">${rLabel}</span></td>
                <td>${comment || '—'}</td>
            </tr>`;
        });
        sectionsHTML += '</tbody></table>';
    });

    // Actions
    let actionsHTML = '';
    actions.forEach(id => {
        const text = document.getElementById(`actionText_${id}`)?.value;
        const resp = document.getElementById(`actionResp_${id}`)?.value;
        const date = document.getElementById(`actionDate_${id}`)?.value;
        if (text) {
            actionsHTML += `<tr><td>${text}</td><td>${resp || '—'}</td><td>${date || '—'}</td></tr>`;
        }
    });

    const globalComment = document.getElementById('globalComment').value;

    const reportHTML = `
        <h1>Rapport de Contrôle Qualité</h1>
        <p style="color:#8A8494;margin-bottom:16px">Pluri'Elles — ${site.date}</p>
        <table>
            <tr><th>Client / Site</th><td>${site.client}</td></tr>
            <tr><th>Type</th><td>${site.type}</td></tr>
            <tr><th>Métier</th><td>${site.metier}</td></tr>
            <tr><th>Ressource</th><td>${site.ressource}</td></tr>
            <tr><th>Contrôleur</th><td>${currentUser?.name || '—'}</td></tr>
            <tr><th>Score</th><td><strong>${pct}% — ${label}</strong></td></tr>
        </table>
        ${sectionsHTML}
        ${actionsHTML ? `<h2>Plan d&#39;actions</h2><table><thead><tr><th>Action</th><th>Responsable</th><th>Échéance</th></tr></thead><tbody>${actionsHTML}</tbody></table>` : ''}
        ${globalComment ? `<h2>Commentaire global</h2><p>${globalComment}</p>` : ''}
    `;

    document.getElementById('reportPreview').innerHTML = reportHTML;
    document.getElementById('reportModal').classList.remove('hidden');

    // Save to history
    saveToHistory(site, pct, label, counts);
}

function closeReport() {
    document.getElementById('reportModal').classList.add('hidden');
}

// ========== DOWNLOAD & EMAIL ==========
function downloadReport() {
    const content = document.getElementById('reportPreview').innerHTML;
    const fullHTML = `<!DOCTYPE html>
<html lang="fr"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Rapport Pluri&#39;Quali</title>
<style>
body{font-family:'Segoe UI',sans-serif;max-width:800px;margin:40px auto;padding:0 20px;color:#2D2A33;line-height:1.6}
h1{color:#6247AA;font-size:1.6rem;margin-bottom:0}
h2{font-size:1.1rem;margin:20px 0 8px;padding-bottom:4px;border-bottom:2px solid #ECEBF5}
table{width:100%;border-collapse:collapse;margin:8px 0}
th,td{padding:8px 10px;text-align:left;border-bottom:1px solid #DDD8E8;font-size:0.9rem}
th{background:#ECEBF5;font-weight:700}
.report-status{display:inline-block;padding:2px 8px;border-radius:4px;font-weight:600;font-size:0.82rem}
</style></head><body>${content}</body></html>`;

    const blob = new Blob([fullHTML], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const date = document.getElementById('siteDate').value || 'rapport';
    const client = document.getElementById('siteClient').value?.replace(/[^a-zA-Z0-9]/g, '_') || 'site';
    a.download = `PluriQuali_${client}_${date}.html`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Rapport téléchargé');
}

function emailReport() {
    const site = document.getElementById('siteClient').value || 'Site';
    const date = document.getElementById('siteDate').value || '';
    const subject = encodeURIComponent(`Rapport Pluri'Quali — ${site} — ${date}`);
    const body = encodeURIComponent(`Bonjour,\n\nVeuillez trouver ci-joint le rapport de contrôle qualité.\n\nSite : ${site}\nDate : ${date}\nContrôleur : ${currentUser?.name || ''}\n\nCordialement,\n${currentUser?.name || ''}\nAgence Pluri'Elles`);
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
}

// ========== HISTORY ==========
function saveToHistory(site, score, label, counts) {
    const history = JSON.parse(localStorage.getItem('pq_history') || '[]');
    history.unshift({
        id: Date.now(),
        date: site.date,
        client: site.client,
        type: site.type,
        metier: site.metier,
        ressource: site.ressource,
        controleur: currentUser?.name || '',
        score,
        label,
        counts,
        timestamp: new Date().toISOString()
    });

    // Keep max 100
    if (history.length > 100) history.length = 100;
    localStorage.setItem('pq_history', JSON.stringify(history));
}

function showHistory() {
    const history = JSON.parse(localStorage.getItem('pq_history') || '[]');
    const list = document.getElementById('historyList');

    if (history.length === 0) {
        list.innerHTML = '<div class="history-empty"><p>Aucun contrôle enregistré</p></div>';
    } else {
        list.innerHTML = history.map(h => {
            let bg, color;
            if (h.score >= 90) { bg = '#D4EFDF'; color = '#1B8A5A'; }
            else if (h.score >= 70) { bg = '#ECEBF5'; color = '#6247AA'; }
            else if (h.score >= 50) { bg = '#FCF0DB'; color = '#C67D20'; }
            else { bg = '#FADEE4'; color = '#A93246'; }
            return `
                <div class="history-item">
                    <div class="history-score" style="background:${bg};color:${color}">${h.score}%</div>
                    <div class="history-info">
                        <strong>${h.client}</strong>
                        <small>${h.date} — ${h.type} — ${h.controleur}</small>
                    </div>
                </div>
            `;
        }).join('');
    }

    document.getElementById('historyModal').classList.remove('hidden');
}

function closeHistory() {
    document.getElementById('historyModal').classList.add('hidden');
}

// ========== CSV EXPORT ==========
function exportCSV() {
    const history = JSON.parse(localStorage.getItem('pq_history') || '[]');
    if (history.length === 0) { showToast('Aucune donnée à exporter'); return; }

    const headers = ['Date', 'Client/Site', 'Type', 'Métier', 'Ressource', 'Contrôleur', 'Score %', 'Niveau', 'Conformes', 'À améliorer', 'Non conformes', 'N/A'];
    const rows = history.map(h => [
        h.date, h.client, h.type, h.metier, h.ressource, h.controleur,
        h.score, h.label,
        h.counts?.conforme || 0, h.counts?.ameliorer || 0, h.counts?.non_conforme || 0, h.counts?.na || 0
    ]);

    const csv = [headers, ...rows].map(row =>
        row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(';')
    ).join('\n');

    const bom = '\uFEFF';
    const blob = new Blob([bom + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `PluriQuali_historique_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('CSV exporté');
}

// ========== RESET ==========
function resetForm() {
    if (!confirm('Réinitialiser le formulaire ? Les données non sauvegardées seront perdues.')) return;

    ratings = {};
    comments = {};
    photos = [];
    actions = [];
    actionCounter = 0;

    document.getElementById('siteClient').value = '';
    document.getElementById('siteDate').valueAsDate = new Date();
    document.getElementById('siteType').value = '';
    document.getElementById('siteMetier').value = '';
    document.getElementById('siteRessource').value = '';
    document.getElementById('globalComment').value = '';
    document.getElementById('scoreSummary').classList.add('hidden');
    document.getElementById('progressBar').style.width = '0%';

    buildSections();
    document.getElementById('actionsList').innerHTML = '';
    addAction();
    renderPhotos();

    window.scrollTo({ top: 0, behavior: 'smooth' });
    showToast('Formulaire réinitialisé');
}

// ========== TOAST ==========
function showToast(msg) {
    const toast = document.getElementById('toast');
    toast.textContent = msg;
    toast.classList.remove('hidden');
    clearTimeout(toast._timeout);
    toast._timeout = setTimeout(() => toast.classList.add('hidden'), 3000);
}
