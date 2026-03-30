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
    const saved = localStorage.getItem('pq_user');
    if (saved) {
        currentUser = JSON.parse(saved);
        document.getElementById('loginName').value = currentUser.name || '';
        document.getElementById('loginEmail').value = currentUser.email || '';
    }
    document.getElementById('siteDate').valueAsDate = new Date();
    buildSections();
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
    SECTIONS.forEach((section) => {
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
    if (ratings[key] === value) {
        delete ratings[key];
        btn.classList.remove('selected');
    } else {
        ratings[key] = value;
        btn.parentElement.querySelectorAll('.rating-btn').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
    }
    updateProgress();
    updateScore();
}

// ========== PROGRESS ==========
function updateProgress() {
    const total = SECTIONS.reduce((sum, s) => sum + s.criteria.length, 0);
    const filled = Object.keys(ratings).length;
    document.getElementById('progressBar').style.width = (total > 0 ? (filled / total) * 100 : 0) + '%';
    SECTIONS.forEach(section => {
        const count = section.criteria.filter((_, i) => ratings[`${section.id}_${i}`]).length;
        document.getElementById(`badge_${section.id}`).textContent = `${count}/${section.criteria.length}`;
    });
}

// ========== SCORE ==========
function updateScore() {
    const ratingValues = Object.values(ratings);
    if (ratingValues.length === 0) { document.getElementById('scoreSummary').classList.add('hidden'); return; }
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

    const circle = document.getElementById('scoreCircle');
    const offset = (2 * Math.PI * 52) - (pct / 100) * (2 * Math.PI * 52);
    circle.style.strokeDashoffset = offset;

    let label, color;
    if (pct >= 90) { label = 'Excellent'; color = '#1B8A5A'; }
    else if (pct >= 70) { label = 'Satisfaisant'; color = '#6247AA'; }
    else if (pct >= 50) { label = 'À améliorer'; color = '#C67D20'; }
    else { label = 'Insuffisant'; color = '#A93246'; }
    circle.style.stroke = color;
    document.getElementById('scoreLabel').textContent = label;
    document.getElementById('scoreLabel').style.color = color;
}

// ========== SECTIONS TOGGLE ==========
function toggleSection(sectionId) {
    document.getElementById(sectionId).querySelector('.card-body').classList.toggle('open');
}

// ========== VOICE DICTATION ==========
function startDictation(textareaId) {
    const textarea = document.getElementById(textareaId);
    const btn = textarea.closest('.textarea-wrapper').querySelector('.btn-mic');
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
        showToast('Dictée vocale non supportée'); return;
    }
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    const rec = new SR();
    rec.lang = 'fr-FR'; rec.continuous = false; rec.interimResults = false;
    btn.classList.add('recording');
    rec.onresult = (e) => {
        textarea.value = (textarea.value ? textarea.value + ' ' : '') + e.results[0][0].transcript;
        textarea.dispatchEvent(new Event('input'));
    };
    rec.onend = () => btn.classList.remove('recording');
    rec.onerror = () => { btn.classList.remove('recording'); showToast('Erreur dictée vocale'); };
    rec.start();
}

// ========== PHOTOS ==========
function handlePhotos(input) {
    Array.from(input.files).forEach(file => {
        const reader = new FileReader();
        reader.onload = (e) => { photos.push({ data: e.target.result, name: file.name }); renderPhotos(); };
        reader.readAsDataURL(file);
    });
    input.value = '';
}

function renderPhotos() {
    document.getElementById('photoGrid').innerHTML = photos.map((p, i) => `
        <div class="photo-thumb">
            <img src="${p.data}" alt="Photo ${i + 1}">
            <button class="photo-remove" onclick="removePhoto(${i})">&times;</button>
        </div>
    `).join('');
    document.getElementById('photoBadge').textContent = photos.length;
}

function removePhoto(idx) { photos.splice(idx, 1); renderPhotos(); }

// ========== ACTIONS ==========
let actionCounter = 0;

function addAction() {
    const id = ++actionCounter;
    actions.push(id);
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
        <div class="form-group"><label>Responsable</label><input type="text" id="actionResp_${id}" placeholder="Qui doit agir ?"></div>
        <div class="form-group"><label>Échéance</label><input type="date" id="actionDate_${id}"></div>
    `;
    document.getElementById('actionsList').appendChild(item);
}

function removeAction(id) {
    actions = actions.filter(a => a !== id);
    document.getElementById(`action_${id}`)?.remove();
}

// ====================================================================
//  REPORT — Beautiful violet-themed HTML with embedded base64 photos
// ====================================================================
function buildReportFullHTML() {
    const ratingValues = Object.values(ratings);
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

    let label, labelColor;
    if (pct >= 90) { label = 'Excellent'; labelColor = '#1B8A5A'; }
    else if (pct >= 70) { label = 'Satisfaisant'; labelColor = '#6247AA'; }
    else if (pct >= 50) { label = 'À améliorer'; labelColor = '#C67D20'; }
    else { label = 'Insuffisant'; labelColor = '#A93246'; }

    // Sections HTML
    let sectionsHTML = '';
    SECTIONS.forEach(section => {
        sectionsHTML += `
        <div style="margin-top:28px">
            <div style="display:flex;align-items:center;gap:10px;margin-bottom:12px">
                <span style="background:${section.color};color:white;font-weight:800;font-size:12px;padding:4px 10px;border-radius:6px">${section.id}</span>
                <span style="font-weight:700;font-size:15px;color:#2D2A33">${section.name}</span>
            </div>
            <table><thead><tr><th style="width:45%">Critère</th><th style="width:20%">Note</th><th>Commentaire</th></tr></thead><tbody>`;
        section.criteria.forEach((c, i) => {
            const key = `${section.id}_${i}`;
            const r = ratings[key];
            const comment = comments[key] || '';
            const rLabel = r ? RATING_LABELS[r] : '—';
            const rColor = r ? RATING_COLORS[r] : { text: '#B0ADB8', bg: '#F2F1F4' };
            sectionsHTML += `<tr><td>${c}</td><td><span style="display:inline-block;padding:3px 10px;border-radius:20px;font-weight:700;font-size:12px;background:${rColor.bg};color:${rColor.text}">${rLabel}</span></td><td style="color:#666;font-size:13px">${comment || '—'}</td></tr>`;
        });
        sectionsHTML += `</tbody></table></div>`;
    });

    // Actions
    let actionsHTML = '', hasActions = false;
    actions.forEach(id => {
        const text = document.getElementById(`actionText_${id}`)?.value;
        const resp = document.getElementById(`actionResp_${id}`)?.value;
        const date = document.getElementById(`actionDate_${id}`)?.value;
        if (text) { hasActions = true; actionsHTML += `<tr><td>${text}</td><td>${resp || '—'}</td><td>${date || '—'}</td></tr>`; }
    });

    const globalComment = document.getElementById('globalComment').value;

    // Photos as base64
    let photosHTML = '';
    if (photos.length > 0) {
        photosHTML = `<div style="margin-top:28px"><h2 style="color:#2980B9;font-size:15px;font-weight:700;margin-bottom:12px;padding-bottom:6px;border-bottom:2px solid #ECEBF5">Photos</h2><div style="display:flex;flex-wrap:wrap;gap:10px">${photos.map((p, i) => `<img src="${p.data}" alt="Photo ${i+1}" style="width:200px;height:150px;object-fit:cover;border-radius:8px;border:1px solid #DDD8E8">`).join('')}</div></div>`;
    }

    const confPct = scored > 0 ? (counts.conforme / scored * 100) : 0;
    const amelPct = scored > 0 ? (counts.ameliorer / scored * 100) : 0;
    const ncPct = scored > 0 ? (counts.non_conforme / scored * 100) : 0;

    const fullHTML = `<!DOCTYPE html>
<html lang="fr"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Rapport Pluri'Quali — ${site.client} — ${site.date}</title>
<style>
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;800&family=DM+Sans:wght@400;500;600;700&display=swap');
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'DM Sans',sans-serif;background:#F6F4FB;color:#2D2A33;line-height:1.6}
.header{background:linear-gradient(135deg,#0D0B11 0%,#1a1530 40%,#4E3888 100%);color:white;padding:40px 32px 60px;position:relative;overflow:hidden}
.header::after{content:'';position:absolute;top:-50%;right:-20%;width:400px;height:400px;background:radial-gradient(circle,rgba(206,194,240,0.15) 0%,transparent 70%)}
.header h1{font-family:'Playfair Display',serif;font-size:28px;font-weight:800;position:relative;z-index:1}
.header .sub{color:#CEC2F0;font-size:14px;position:relative;z-index:1;margin-top:4px}
.score-banner{background:white;margin:0 24px;padding:24px;border-radius:16px;box-shadow:0 8px 32px rgba(98,71,170,0.12);position:relative;top:-32px;display:flex;align-items:center;gap:24px}
.score-big{font-family:'Playfair Display',serif;font-size:48px;font-weight:800;line-height:1}
.score-big small{font-size:20px;color:#8A8494}
.score-label{font-weight:700;font-size:15px;margin-bottom:8px}
.score-bar{height:8px;border-radius:4px;background:#ECEBF5;overflow:hidden;display:flex}
.score-bar div{height:100%}
.stats{display:flex;gap:8px;margin-top:10px;flex-wrap:wrap}
.stat{font-size:12px;font-weight:600;padding:3px 10px;border-radius:20px}
.container{max-width:800px;margin:-12px auto 40px;padding:0 24px}
.info-card{background:white;border-radius:12px;padding:20px 24px;box-shadow:0 2px 8px rgba(98,71,170,0.06);margin-bottom:16px}
.info-row{display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #ECEBF5;font-size:14px}
.info-row:last-child{border-bottom:none}
.info-row .lbl{font-weight:700;color:#6247AA;min-width:140px}
table{width:100%;border-collapse:collapse;background:white;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(98,71,170,0.06)}
th{background:#6247AA;color:white;padding:10px 14px;text-align:left;font-size:13px;font-weight:600}
td{padding:10px 14px;font-size:13px;border-bottom:1px solid #ECEBF5}
tr:last-child td{border-bottom:none}
h2{font-size:15px;font-weight:700;margin:28px 0 12px;padding-bottom:6px;border-bottom:2px solid #ECEBF5}
.footer{text-align:center;padding:32px;color:#8A8494;font-size:12px;border-top:1px solid #ECEBF5;margin-top:40px}
</style></head><body>
<div class="header">
    <h1>Rapport de Contrôle Qualité</h1>
    <div class="sub">Agence Pluri'Elles — ${site.date}</div>
</div>
<div class="score-banner">
    <div><div class="score-big" style="color:${labelColor}">${pct}<small>%</small></div></div>
    <div style="flex:1">
        <div class="score-label" style="color:${labelColor}">${label}</div>
        <div class="score-bar">
            <div style="width:${confPct}%;background:#1B8A5A"></div>
            <div style="width:${amelPct}%;background:#C67D20"></div>
            <div style="width:${ncPct}%;background:#A93246"></div>
        </div>
        <div class="stats">
            <span class="stat" style="background:#D4EFDF;color:#1B8A5A">${counts.conforme} Conforme</span>
            <span class="stat" style="background:#FCF0DB;color:#C67D20">${counts.ameliorer} À améliorer</span>
            <span class="stat" style="background:#FADEE4;color:#A93246">${counts.non_conforme} Non conforme</span>
            <span class="stat" style="background:#F2F1F4;color:#B0ADB8">${counts.na} N/A</span>
        </div>
    </div>
</div>
<div class="container">
    <div class="info-card">
        <div class="info-row"><span class="lbl">Client / Site</span><span>${site.client}</span></div>
        <div class="info-row"><span class="lbl">Type de contrôle</span><span>${site.type}</span></div>
        <div class="info-row"><span class="lbl">Métier</span><span>${site.metier}</span></div>
        <div class="info-row"><span class="lbl">Ressource</span><span>${site.ressource}</span></div>
        <div class="info-row"><span class="lbl">Contrôleur</span><span>${currentUser?.name || '—'}</span></div>
    </div>
    ${sectionsHTML}
    ${hasActions ? `<div style="margin-top:28px"><h2 style="color:#6247AA">Plan d'actions</h2><table><thead><tr><th>Action</th><th>Responsable</th><th>Échéance</th></tr></thead><tbody>${actionsHTML}</tbody></table></div>` : ''}
    ${globalComment ? `<div style="margin-top:28px"><h2 style="color:#C67D20">Commentaire global</h2><div class="info-card" style="font-size:14px;color:#444">${globalComment}</div></div>` : ''}
    ${photosHTML}
</div>
<div class="footer">Rapport généré par Pluri'Quali — Agence Pluri'Elles<br>${currentUser?.name || ''} — ${new Date().toLocaleDateString('fr-FR')}</div>
</body></html>`;

    return { fullHTML, site, pct, label, counts };
}

// ========== GENERATE REPORT ==========
function generateReport() {
    if (Object.keys(ratings).length === 0) { showToast('Veuillez noter au moins un critère'); return; }
    const { fullHTML, site, pct, label, counts } = buildReportFullHTML();

    // Preview in iframe for accurate rendering
    const preview = document.getElementById('reportPreview');
    preview.innerHTML = '';
    const iframe = document.createElement('iframe');
    iframe.style.cssText = 'width:100%;min-height:600px;border:none;border-radius:8px';
    preview.appendChild(iframe);
    iframe.srcdoc = fullHTML;

    document.getElementById('reportModal').classList.remove('hidden');
    saveToHistory(site, pct, label, counts);
}

function closeReport() { document.getElementById('reportModal').classList.add('hidden'); }

// ========== DOWNLOAD + AUTO MAILTO (combined) ==========
function downloadAndEmail() {
    const { fullHTML, site } = buildReportFullHTML();

    // 1) Download
    const blob = new Blob([fullHTML], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `PluriQuali_${(site.client||'site').replace(/[^a-zA-Z0-9]/g,'_')}_${site.date}.html`;
    a.click();
    URL.revokeObjectURL(url);

    // 2) Auto-open mail client with pre-filled FROM email
    setTimeout(() => {
        const toEmail = currentUser?.email || '';
        const subject = encodeURIComponent(`Rapport Pluri'Quali — ${site.client} — ${site.date}`);
        const body = encodeURIComponent(
`Bonjour,

Veuillez trouver ci-joint le rapport de contrôle qualité.

Client / Site : ${site.client}
Date : ${site.date}
Type : ${site.type}
Contrôleur : ${currentUser?.name || ''}

Cordialement,
${currentUser?.name || ''}
Agence Pluri'Elles`);
        window.location.href = `mailto:${toEmail}?subject=${subject}&body=${body}`;
    }, 600);

    showToast('Rapport téléchargé — mail ouvert');
}

// Individual buttons kept as fallback
function downloadReport() {
    const { fullHTML, site } = buildReportFullHTML();
    const blob = new Blob([fullHTML], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `PluriQuali_${(site.client||'site').replace(/[^a-zA-Z0-9]/g,'_')}_${site.date}.html`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Rapport téléchargé');
}

function emailReport() {
    const { site } = buildReportFullHTML();
    const toEmail = currentUser?.email || '';
    const subject = encodeURIComponent(`Rapport Pluri'Quali — ${site.client} — ${site.date}`);
    const body = encodeURIComponent(`Bonjour,\n\nVeuillez trouver ci-joint le rapport de contrôle qualité.\n\nClient / Site : ${site.client}\nDate : ${site.date}\nType : ${site.type}\nContrôleur : ${currentUser?.name || ''}\n\nCordialement,\n${currentUser?.name || ''}\nAgence Pluri'Elles`);
    window.location.href = `mailto:${toEmail}?subject=${subject}&body=${body}`;
}

// ========== HISTORY ==========
function saveToHistory(site, score, label, counts) {
    const history = JSON.parse(localStorage.getItem('pq_history') || '[]');
    history.unshift({ id: Date.now(), date: site.date, client: site.client, type: site.type, metier: site.metier, ressource: site.ressource, controleur: currentUser?.name || '', score, label, counts, timestamp: new Date().toISOString() });
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
            return `<div class="history-item"><div class="history-score" style="background:${bg};color:${color}">${h.score}%</div><div class="history-info"><strong>${h.client}</strong><small>${h.date} — ${h.type} — ${h.controleur}</small></div></div>`;
        }).join('');
    }
    document.getElementById('historyModal').classList.remove('hidden');
}

function closeHistory() { document.getElementById('historyModal').classList.add('hidden'); }

// ========== CSV EXPORT ==========
function exportCSV() {
    const history = JSON.parse(localStorage.getItem('pq_history') || '[]');
    if (history.length === 0) { showToast('Aucune donnée à exporter'); return; }
    const headers = ['Date','Client/Site','Type','Métier','Ressource','Contrôleur','Score %','Niveau','Conformes','À améliorer','Non conformes','N/A'];
    const rows = history.map(h => [h.date,h.client,h.type,h.metier,h.ressource,h.controleur,h.score,h.label,h.counts?.conforme||0,h.counts?.ameliorer||0,h.counts?.non_conforme||0,h.counts?.na||0]);
    const csv = [headers,...rows].map(r => r.map(c => `"${String(c).replace(/"/g,'""')}"`).join(';')).join('\n');
    const blob = new Blob(['\uFEFF'+csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url;
    a.download = `PluriQuali_historique_${new Date().toISOString().split('T')[0]}.csv`;
    a.click(); URL.revokeObjectURL(url);
    showToast('CSV exporté');
}

// ========== RESET ==========
function resetForm() {
    if (!confirm('Réinitialiser le formulaire ?')) return;
    ratings = {}; comments = {}; photos = []; actions = []; actionCounter = 0;
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
    addAction(); renderPhotos();
    window.scrollTo({ top: 0, behavior: 'smooth' });
    showToast('Formulaire réinitialisé');
}

// ========== TOAST ==========
function showToast(msg) {
    const t = document.getElementById('toast');
    t.textContent = msg; t.classList.remove('hidden');
    clearTimeout(t._to);
    t._to = setTimeout(() => t.classList.add('hidden'), 3000);
}
