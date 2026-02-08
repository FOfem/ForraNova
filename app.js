// Tell user to install as app
let deferredPrompt;

window.addEventListener('beforeinstallprompt', (e) => {
    // Prevent Chrome 67 and earlier from automatically showing the prompt
    e.preventDefault();
    // Stash the event so it can be triggered later.
    deferredPrompt = e;
    // Update UI to notify the user they can install ForraNova
    showInstallPromotion(); 
});

async function installForraNova() {
    if (deferredPrompt) {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        console.log(`User response to install: ${outcome}`);
        deferredPrompt = null;
    }
}

/**
 * ForraNova Academy - Core AI Engine v1.0.0
 * Features: Adaptive Learning, Multi-Voice Synthesis, Progress Matrix, Persistence
 */

// --- 1. STATE MANAGEMENT ---
const state = {
    student: {
        id: "user_profile", // Constant ID for IndexedDB lookups
        name: "Scholar",
        level: 1,
        masteryPoints: 0,
        streak: 0,
        subjects: {},
        personalityPreference: "Coach"
    },
    ui: {
        isTyping: false,
        currentVoice: null,
        voices: []
    }
};

// --- 2. ADAPTIVE LEARNING ENGINE USING INDEXDB ---
const ForraNovaAI = {
    async learnFromStudent(input) {
        const keywords = input.toLowerCase();
        if (keywords.includes("math")) state.student.subjects.math = (state.student.subjects.math || 0) + 1;
        if (keywords.includes("science")) state.student.subjects.science = (state.student.subjects.science || 0) + 1;
        
        state.student.masteryPoints += 5;
        await this.updatePersistence();
    },

    async updatePersistence() {
        // SAVING TO INDEXEDDB (Migration Complete)
        await NeuralDB.save('vault', state.student);
        this.syncUI();
    },

    syncUI() {
        const nameDisp = document.getElementById('display-name');
        const levelDisp = document.getElementById('level-display');
        const streakDisp = document.getElementById('streak-count');
        
        if (nameDisp) nameDisp.innerText = `Scholar: ${state.student.name}`;
        if (levelDisp) levelDisp.innerText = `Level ${state.student.level}`;
        if (streakDisp) streakDisp.innerText = state.student.streak;
    }
};


// --- 3. PROFESSIONAL VOICE ENGINE ---
function initVoices() {
    state.ui.voices = synth.getVoices();
    const voiceSelect = document.getElementById('voice-selector');
    if(!voiceSelect) return;

    voiceSelect.innerHTML = state.ui.voices
        .map((voice, index) => `<option value="${index}">${voice.name} (${voice.lang})</option>`)
        .join('');
}

// Ensure voices load correctly on Android
if (speechSynthesis.onvoiceschanged !== undefined) {
    speechSynthesis.onvoiceschanged = initVoices;
}

function speakResponse(text) {
    if (synth.speaking) synth.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    const selectedVoiceIndex = document.getElementById('voice-selector')?.value || 0;
    
    utterance.voice = state.ui.voices[selectedVoiceIndex];
    utterance.pitch = 1.0;
    utterance.rate = 1.0;
    
    // Animate Avatar while speaking
    utterance.onstart = () => document.getElementById('avatar').classList.add('speaking');
    utterance.onend = () => document.getElementById('avatar').classList.remove('speaking');
    
    synth.speak(utterance);
}

// --- 4. TYPING & UI INTERACTION ---
function typeEffect(elementId, text, speed = 30) {
    let i = 0;
    const element = document.getElementById(elementId);
    element.innerHTML = "";
    state.ui.isTyping = true;

    function type() {
        if (i < text.length) {
            element.innerHTML += text.charAt(i);
            i++;
            setTimeout(type, speed);
        } else {
            state.ui.isTyping = false;
        }
    }
    type();
}

// --- 5. MAIN CHAT LOGIC ---
async function handleSubmission() {
    const inputField = document.getElementById('user-input');
    const query = inputField.value;
    if(!query || state.ui.isTyping) return;

    // 1. Process Input through Learning Engine
    ForraNovaAI.learnFromStudent(query);
    inputField.value = "";

    // 2. Mock AI Logic (Connect your API endpoint here)
    const responseText = `Excellent question about ${query}. Based on your Lvl ${state.student.level} mastery, I've updated your progress matrix.`;

    // 3. UI Response
    typeEffect('ai-response', responseText);
    speakResponse(responseText);
}
// --- NEURAL MASTERY CHART DEFINITION ---
function initMasteryChart() {
    const ctx = document.getElementById('masteryChart');
    if (!ctx) {
        console.warn("Mastery Chart canvas not found in HTML.");
        return; 
    }

    new Chart(ctx, {
        type: 'radar',
        data: {
            labels: ['Math', 'Logic', 'Memory', 'Focus', 'Speed', 'Creative'],
            datasets: [{
                label: 'Neural Progress',
                data: [85, 90, 75, 95, 80, 88],
                // Matching theme_color from manifest.json (#4f46e5)
                backgroundColor: 'rgba(79, 70, 229, 0.2)', 
                borderColor: '#4f46e5',
                pointBackgroundColor: '#4f46e5',
                borderWidth: 2
            }]
        },
        options: {
            scales: {
                r: {
                    angleLines: { color: 'rgba(255,255,255,0.05)' },
                    grid: { color: 'rgba(255,255,255,0.1)' },
                    pointLabels: { 
                        color: '#a5b4fc', 
                        font: { family: 'JetBrains Mono', size: 10 } 
                    },
                    ticks: { display: false },
                    suggestedMin: 0,
                    suggestedMax: 100
                }
            },
            plugins: {
                legend: { display: false }
            },
            responsive: true,
            maintainAspectRatio: false
        }
    });
}
// --- . GLOBAL EVENT LISTENERS ---
document.getElementById('send-btn').addEventListener('click', handleSubmission);


async function checkIdentity() {
    // Attempt to find the user profile in IndexedDB
    const vaultItems = await NeuralDB.getAll('vault');
    const profile = vaultItems.find(item => item.id === 'user_profile');

    const modal = document.getElementById('setup-modal');

    if (!profile) {
        if (modal) modal.style.display = 'flex';
        
        document.getElementById('finish-setup').onclick = async () => {
            const nameInput = document.getElementById('setup-name').value;
            if (nameInput) {
                state.student.name = nameInput;
                // Save profile to IndexedDB instead of localStorage
                await NeuralDB.save('vault', {
                    id: 'user_profile',
                    name: nameInput,
                    level: 1,
                    subjects: {},
                    dateCreated: new Date().toISOString()
                });
                
                modal.style.opacity = '0';
                setTimeout(() => modal.style.display = 'none', 500);
                VoiceCore.speak(`Identity synced, Scholar ${nameInput}.`);
            }
        };
    } else {
        // Load existing user into global state
        state.student.name = profile.name;
        state.student.level = profile.level || 1;
        state.student.subjects = profile.subjects || {};
        console.log("Neural Profile Loaded from IndexedDB");
    }
}



// --- AI TUTOR SHORTCUT LOGIC ---
document.querySelectorAll('.action-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        const action = e.target.innerText.toLowerCase();
        
        if (action.includes('quiz')) {
            VoiceCore.speak("Generating neural quiz based on your mastery levels.");
            // Logic to launch quiz mode
        } else if (action.includes('map')) {
            VoiceCore.speak("Opening your cognitive learning map.");
            // Logic to switch to 'map' view
        }
    });
});


// --- 6. DEBUGGER LOGIC --- 
const Debugger = {
    toggle: function() {
        const panel = document.getElementById('debug-panel');
        panel.classList.toggle('debug-collapsed');
        panel.classList.toggle('debug-expanded');
    },

    updateDisplay: function() {
        const display = document.getElementById('matrix-data');
        if (!display) return;
        
        // This shows the raw data "DNA" of your AI and Student
        const debugInfo = {
            current_state: state.student,
            voice_engine: {
                total_voices: state.ui.voices.length,
                selected: state.ui.voices[document.getElementById('voice-selector')?.value || 0]?.name
            },//localStorage can be used her to debug. This is not storage
            system_memory: `${(JSON.stringify(localStorage).length / 1024).toFixed(2)} KB used`
        };
        
        display.innerHTML = JSON.stringify(debugInfo, null, 2);
    }
};

// Update the toggle button listener
document.getElementById('debug-toggle').addEventListener('click', Debugger.toggle);

// IMPORTANT: Add this line inside your 'ForraNovaAI.saveData' function 
// so the display updates every time the AI learns something new:
// Debugger.updateDisplay();

//--- 7. Initial display update
window.addEventListener('load', Debugger.updateDisplay);

const NeuralWisdom = {
    scriptures: [
        "‘For I well know the thoughts that I am thinking toward you,’ declares Jehovah, ‘thoughts of peace, and not of calamity, to give you a future and a hope.’ — Jeremiah 29:11",
        "‘Trust in Jehovah with all your heart, and do not rely on your own understanding.’ — Proverbs 3:5",
        "‘The one walking with the wise will become wise.’ — Proverbs 13:20",
        "‘It is honorable for a man to refrain from a dispute, but every fool will become embroiled in it.’ — Prov. 20:3",
        "‘There is going to be a resurrection of both the righteous and the unrighteous.’ — Acts 24:15",
        "‘Your word is a lamp to my foot, and a light for my path.’ — Psalm 119:105"
    ],
    facts: [
        "The human brain can process images that the eye sees for as little as 13 milliseconds.",
        "Your brain generates about 20 watts of power—enough to power a dim lightbulb!",
        "Neuroplasticity: Your brain never stops changing and learning, no matter your age."
    ]
};

import { LocalNotifications } from '@capacitor/local-notifications';

async function scheduleNeuralNotification() {
    // 1. Request Permission
    const permission = await LocalNotifications.requestPermissions();
    if (permission.display !== 'granted') return;

    // 2. Select a random Scripture and Fact
    const randomScripture = NeuralWisdom.scriptures[Math.floor(Math.random() * NeuralWisdom.scriptures.length)];
    const randomFact = NeuralWisdom.facts[Math.floor(Math.random() * NeuralWisdom.facts.length)];

    // 3. Schedule the Notification (for 24 hours from now)
    await LocalNotifications.schedule({
        notifications: [
            {
                title: "ForraNova Neural Sync",
                body: `${randomScripture}\n\nBrain Fact: ${randomFact}`,
                id: 1,
                schedule: { at: new Date(Date.now() + 1000 * 60 * 60 * 24) }, // 24 Hours
                sound: null,
                attachments: null,
                actionTypeId: "",
                extra: null
            }
        ]
    });
    console.log("Next Neural Sync scheduled!");
}

// Trigger this inside your window.onload
window.addEventListener('load', () => {
    scheduleNeuralNotification();
});

// --- 8. NEURAL LISTENING (Speech Recognition) ---
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

if (SpeechRecognition) {
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.lang = 'en-US';
    recognition.interimResults = false;

    const micBtn = document.getElementById('mic-btn');
    const inputField = document.getElementById('user-input');

    micBtn.onclick = () => {
        recognition.start();
        micBtn.innerHTML = "🔴"; // Visual feedback that AI is listening
        micBtn.style.boxShadow = "0 0 15px #ff0000";
    };

    recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        inputField.value = transcript;
        micBtn.innerHTML = "🎤";
        micBtn.style.boxShadow = "none";
        
        // Optional: Automatically trigger send after speaking
        handleSubmission();
    };

    recognition.onerror = () => {
        micBtn.innerHTML = "🎤";
        micBtn.style.boxShadow = "none";
        alert("Neural Sync interrupted. Please try speaking again.");
    };
} else {
    document.getElementById('mic-btn').style.display = 'none';
    console.log("Speech recognition not supported on this engine.");
}

// --- 9. CAREER ORACLE & SCHOLARSHIP TRACKER ---
const CareerOracle = {
    mapping: {
        'Logic': { career: 'Data Scientist / Philosopher', color: '#00f2ff' },
        'Science': { career: 'Biotech Researcher', color: '#7000ff' },
        'Arts': { career: 'Creative Director', color: '#ff007a' },
        'Tech': { career: 'Systems Architect', color: '#39ff14' },
        'Math': { career: 'Quantum Cryptographer', color: '#f2ff00' }
    },

    analyzeMastery: function() {
        const labels = ['Logic', 'Science', 'Arts', 'Tech', 'Math'];
        const data = state.student.masteryData;
        
        // Find index of the highest mastery score
        const maxIndex = data.indexOf(Math.max(...data));
        const strength = labels[maxIndex];
        const recommendation = this.mapping[strength];

        // Update UI
        document.getElementById('top-strength').innerText = strength;
        document.getElementById('top-strength').style.color = recommendation.color;
        document.getElementById('recommended-career').innerText = recommendation.career;
        
        // Update the match percentage based on level
        const matchPercent = Math.min(state.student.level * 10, 100);
        document.getElementById('career-match-fill').style.width = `${matchPercent}%`;
        document.getElementById('career-match-fill').style.backgroundColor = recommendation.color;
    }
};

//-- Neural Quiz & Cognitive Map and Teacher Tools

const TeacherTools = {
    // 1. Neural Quiz Engine
    startQuiz() {
        const overlay = document.getElementById('quiz-overlay');
        overlay.classList.remove('hidden');
        VoiceCore.speak("Generating a neural quiz based on your mastery data.");
        
        const qBox = document.getElementById('quiz-question');
        qBox.innerText = "Evaluate the derivative of f(x) = x² at x=3.";
        
        const options = document.getElementById('quiz-options');
        options.innerHTML = `
            <button onclick="TeacherTools.checkAns(true)">6</button>
            <button onclick="TeacherTools.checkAns(false)">3</button>
            <button onclick="TeacherTools.checkAns(false)">9</button>
        `;
    },

    checkAns(isCorrect) {
        if(isCorrect) {
            VoiceCore.speak("Correct! Your neural sync has increased.");
            // Update the Mastery Chart here!
        } else {
            VoiceCore.speak("Incorrect. Reviewing complex derivation logic.");
        }
    },

    // 2. Cognitive Map Toggle
    toggleMap() {
        const chartCard = document.querySelector('.mastery-card');
        chartCard.classList.toggle('highlight-map');
        VoiceCore.speak("Switching to Cognitive Learning Map view.");
    }
};

// Connect the HTML buttons from your Intelligence Panel
document.addEventListener('DOMContentLoaded', () => {
    const buttons = document.querySelectorAll('.action-btn');
    buttons[0].onclick = () => TeacherTools.startQuiz(); // Quiz
    buttons[1].onclick = () => TeacherTools.toggleMap(); // Map
    document.getElementById('export-pdf-btn').onclick = () => exportNeuralReport(); // Report
});


// --- 10. SIMULTANEOUS AUDIO-TEXT ENGINE ---
async function handleSubmission() {
    const input = document.getElementById('user-input');
    const responseArea = document.getElementById('ai-response');
    const personality = document.getElementById('tutor-personality').value;

    if (!input.value || state.ui.isTyping) return;

    const userText = input.value;
    input.value = "";

    // 1. Prepare the Response (Mock AI logic for now)
    const reply = `Analysis complete. Regarding "${userText}", I have updated your neural pathways. You are showing 85% mastery in ${personality} reasoning.`;

    // 2. Trigger Audio and Text Simultaneously
    state.ui.isTyping = true;
    
    // Start Speaking
    speakResponse(reply); 
    
    // Start Visual Typing Effect (Matches Audio Start)
    typeEffect('ai-response', reply);
}

function typeEffect(elementId, text) {
    let i = 0;
    const element = document.getElementById(elementId);
    element.innerHTML = "";
    
    function type() {
        if (i < text.length) {
            element.innerHTML += text.charAt(i);
            i++;
            setTimeout(type, 30); // Adjust speed to roughly match reading pace
        } else {
            state.ui.isTyping = false;
        }
    }
    type();
}



// --- 12. NEURAL SKETCHPAD LOGIC ---
const canvas = document.getElementById('sketch-canvas');
const ctx = canvas.getContext('2d');
let drawing = false;

// Set canvas resolution
canvas.width = canvas.offsetWidth;
canvas.height = canvas.offsetHeight;

function startDraw(e) { drawing = true; draw(e); }
function endDraw() { drawing = false; ctx.beginPath(); }

function draw(e) {
    if (!drawing) return;
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#00f2ff';

    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX || e.touches[0].clientX) - rect.left;
    const y = (e.clientY || e.touches[0].clientY) - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);
}

canvas.addEventListener('mousedown', startDraw);
canvas.addEventListener('mousemove', draw);
window.addEventListener('mouseup', endDraw);
canvas.addEventListener('touchstart', startDraw);
canvas.addEventListener('touchmove', draw);
canvas.addEventListener('touchend', endDraw);

function clearCanvas() { ctx.clearRect(0, 0, canvas.width, canvas.height); }

// --- 13. STUDY VAULT & PDF EXPORT ---

/**
 * FORRANOVA UNIFIED MEDIA ENGINE
 * Handles: CRUD, Personalized Naming, Sorting, Grouping, and Media Rendering
 */
// CRUD (Create, Read, Update, Delete) Custom naming and save, download.
// The Digital Trove Renderer 
// This function scans the IndexedDB and builds the UI for the "Digital Trove" section.

const NeuralStudio = {
    currentOpenedId: null, // Tracks if we are editing an existing file
    viewMode: 'grid', // 'grid' or 'list'

    // --- 1. THE UNIFIED SAVER (Universal Entry Point) ---
    // Use this for: Notepad, Canvas, Video Gen, Song Gen, and File Uploads
    async saveToVault({
        name = "", 
        type = "document", 
        format = "txt", 
        content = null, 
        blob = null,
        isUpdate = false
    }) {
        // Handle Naming Logic
        let fileName = isUpdate ? this.currentOpenedId : (name || document.getElementById('active-file-name')?.value.trim());
        
        if (!fileName && !isUpdate) {
            fileName = prompt(`Enter a Subject, Topic or Name for your ${type} (e.g. Health_Benefits):`);
            if (!fileName) return; 
        }

        const fullID = fileName.includes('.') ? fileName : `${fileName}.${format}`;
        const storageData = blob || content;

        const entry = {
            id: fullID,
            type: type, 
            mime: format,
            data: storageData,
            timestamp: new Date().toISOString(),
            size: blob ? blob.size : new Blob([content]).size
        };

        try {
            await NeuralDB.save('vault', entry);
            this.currentOpenedId = fullID; 
            VoiceCore.speak(`${fullID} synced to vault.`);
            this.renderTrove(); 
        } catch (e) {
            console.error("Vault Error:", e);
            VoiceCore.speak("Storage failed. Check database capacity.");
        }
    },

    async renderTrove(filterType = 'all', sortBy = 'date') {
        const container = document.getElementById('digital-trove-display');
        const countDisplay = document.getElementById('storage-count');
        const spaceDisplay = document.getElementById('storage-space');
        if (!container) return;

        let items = await NeuralDB.getAll('vault');

        // Stats Calculation
        if (countDisplay) countDisplay.innerText = `${items.length} Items`;
        let totalSize = items.reduce((acc, item) => acc + (item.size || 0), 0);
        if (spaceDisplay) spaceDisplay.innerText = `Used: ${this.formatBytes(totalSize)}`;

        // Filter & Sort
        if (filterType !== 'all') items = items.filter(i => i.type === filterType);
        items.sort((a, b) => {
            if (sortBy === 'name') return a.id.localeCompare(b.id);
            return new Date(b.timestamp) - new Date(a.timestamp);
        });

        container.innerHTML = items.map(item => `
            <div class="trove-card ${this.viewMode}-view">
                <div class="file-preview" onclick="NeuralStudio.loadItem('${item.id}')">
                    ${this.getPreview(item)}
                </div>
                <div class="file-details">
                    <span class="file-name">${item.id}</span>
                    <span class="file-meta">${item.type.toUpperCase()} | ${this.formatBytes(item.size)}</span>
                </div>
                <div class="file-actions">
                    <button onclick="NeuralStudio.loadItem('${item.id}')" title="Open"><i class="fas fa-external-link-alt"></i></button>
                    <button onclick="NeuralStudio.downloadFile('${item.id}')" title="Download"><i class="fas fa-download"></i></button>
                    <button onclick="NeuralStudio.deleteItem('${item.id}')" class="btn-del" title="Delete"><i class="fas fa-trash"></i></button>
                </div>
            </div>
        `).join('');
    },

    getPreview(item) {
        const icons = { video: '🎬', audio: '🎵', image: '🖼️', canvas: '🎨', document: '📄' };
        return icons[item.type] || '📁';
    },

    async loadItem(id) {
        const item = await NeuralDB.get('vault', id);
        if (!item) return;

        this.currentOpenedId = id;

        if (item.type === 'document' || item.type === 'canvas') {
            this.openEditor(item.mime === 'lined' ? 'lined' : 'blank');
            document.getElementById('neural-editor').innerHTML = item.data;
            document.getElementById('active-file-name').value = item.id.split('.')[0];
            document.getElementById('export-format').value = item.mime;
            VoiceCore.speak(`Opening ${id}`);
        } else {
            this.openMediaPlayer(item);
        }
    },

    openMediaPlayer(item) {
        const viewer = document.getElementById('neural-viewer');
        const content = document.getElementById('viewer-content');
        viewer.style.display = 'flex';
        
        const url = URL.createObjectURL(item.data);
        if (item.type === 'video') content.innerHTML = `<video src="${url}" controls autoplay style="max-width:100%"></video>`;
        if (item.type === 'audio') content.innerHTML = `<div class="audio-player"><h3>${item.id}</h3><audio src="${url}" controls autoplay></audio></div>`;
        if (item.type === 'image') content.innerHTML = `<img src="${url}" style="max-width:100%; max-height:80vh;">`;
    },

    filterSearch() {
        const q = document.getElementById('trove-search-input').value.toLowerCase();
        document.querySelectorAll('.trove-card').forEach(card => {
            const name = card.querySelector('.file-name').innerText.toLowerCase();
            card.style.display = name.includes(q) ? "" : "none";
        });
    },

    async deleteItem(id) {
        if (confirm(`Do you really want to Delete ${id} permanently?`)) {
            await NeuralDB.delete('vault', id);
            if (this.currentOpenedId === id) this.currentOpenedId = null;
            this.renderTrove();
        }
    },

    downloadFile(id) {
        NeuralDB.get('vault', id).then(item => {
            const blob = item.data instanceof Blob ? item.data : new Blob([item.data], {type: 'text/html'});
            const a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = item.id;
            a.click();
        });
    },

    formatBytes(bytes) {
        if (!bytes || bytes === 0) return '0 B';
        const i = Math.floor(Math.log(bytes) / Math.log(1024));
        return (bytes / Math.pow(1024, i)).toFixed(1) + ' ' + ['B', 'KB', 'MB', 'GB'][i];
    },

    openEditor(type) {
        document.getElementById('neural-notepad').style.display = 'flex';
        document.getElementById('neural-editor').className = (type === 'lined') ? 'editor-lined' : 'editor-blank';
    },

    closeEditor() { 
        document.getElementById('neural-notepad').style.display = 'none'; 
        this.currentOpenedId = null;
    },
    
    setView(m) { this.viewMode = m; this.renderTrove(); }
};

// Make the notepad draggable
dragElement(document.getElementById("neural-notepad"));

function dragElement(elmnt) {
    let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
    const header = document.getElementById(elmnt.id + "drag");
    if (header) {
        header.onmousedown = dragMouseDown;
    }

    function dragMouseDown(e) {
        pos3 = e.clientX;
        pos4 = e.clientY;
        document.onmouseup = closeDragElement;
        document.onmousemove = elementDrag;
    }

    function elementDrag(e) {
        pos1 = pos3 - e.clientX;
        pos2 = pos4 - e.clientY;
        pos3 = e.clientX;
        pos4 = e.clientY;
        elmnt.style.top = (elmnt.offsetTop - pos2) + "px";
        elmnt.style.left = (elmnt.offsetLeft - pos1) + "px";
    }

    function closeDragElement() {
        document.onmouseup = null;
        document.onmousemove = null;
    }
}


// --- 14. QUANTUM CALCULATOR LOGIC ---
// --- See: 24. QUANTUM CALCULATOR CORE (UNIFIED & OFFLINE) ---

/**
 * Polynomial Logic Engine (Newton-Raphson Method)
 * Used for solving degrees 2, 3, and 4
 */
const PolyLogic = {
    evaluate(coeffs, x) {
        return coeffs.reduce((sum, coeff, i) => sum + coeff * Math.pow(x, i), 0);
    },
    evaluateDerivative(coeffs, x) {
        return coeffs.reduce((sum, coeff, i) => i === 0 ? sum : sum + i * coeff * Math.pow(x, i - 1), 0);
    },
    solve(coeffs) {
        const roots = [];
        // Attempt to find roots by starting guesses at different intervals
        for (let guess of [-100, -10, -1, 0, 1, 10, 100]) {
            let x = guess;
            for (let i = 0; i < 50; i++) {
                let f = this.evaluate(coeffs, x);
                let df = this.evaluateDerivative(coeffs, x);
                if (Math.abs(df) < 1e-10) break;
                let nextX = x - f / df;
                if (Math.abs(nextX - x) < 1e-10) {
                    x = nextX;
                    break;
                }
                x = nextX;
            }
            // Add unique real roots only
            if (!roots.some(r => Math.abs(r - x) < 1e-4)) {
                if (Math.abs(this.evaluate(coeffs, x)) < 1e-3) {
                    roots.push(x.toFixed(4));
                }
            }
        }
        return roots.length > 0 ? `Roots: ${roots.join(", ")}` : "No real roots found";
    }
};

/**
 * Main Quantum Calculator Object
 */
const QuantumCalc = {
    mode: 'math',

    switchMode() {
        this.mode = document.getElementById('calc-mode').value;
        const screen = document.getElementById('calc-screen');
        
        // UI Adjustments
        document.getElementById('calc-poly-inputs').style.display = (this.mode === 'poly') ? 'grid' : 'none';
        document.getElementById('base-n-grid').style.display = (this.mode === 'base-n') ? 'grid' : 'none';
        
        screen.value = "";
        screen.placeholder = `[${this.mode.toUpperCase()} MODE]`;
        VoiceCore.speak(`${this.mode} mode engaged.`);
    },

    // 1-8: General Math, Complex, Stats, Matrix, Vector
    executeCore() {
        const screen = document.getElementById('calc-screen');
        const expr = screen.value;
        try {
            if (this.mode === 'base-n') {
                this.runBaseN(expr);
            } else if (this.mode === 'cmplx') {
                // Handling 'i' for complex numbers via simple eval replacement
                let complexExpr = expr.replace(/i/g, 'Math.sqrt(-1)');
                screen.value = eval(complexExpr);
            } else {
                screen.value = eval(expr);
            }
        } catch (e) {
            screen.value = "SYNTAX ERROR";
        }
    },

    // 4. Base-N Calculations
    runBaseN(val) {
        const dec = parseInt(val, 10);
        if (isNaN(dec)) return;
        document.getElementById('base-bin').innerText = dec.toString(2);
        document.getElementById('base-hex').innerText = dec.toString(16).toUpperCase();
        document.getElementById('base-oct').innerText = dec.toString(8);
    },

    // 9-11: Polynomial Solver (ax^4 + bx^3 + cx^2 + dx + e = 0)
    runPolySolve() {
        const a = parseFloat(document.getElementById('poly-a').value) || 0;
        const b = parseFloat(document.getElementById('poly-b').value) || 0;
        const c = parseFloat(document.getElementById('poly-c').value) || 0;
        const d = parseFloat(document.getElementById('poly-d').value) || 0;
        const e = parseFloat(document.getElementById('poly-e').value) || 0;

        // Newton-Raphson expects coefficients in order: [constant, x, x^2, x^3, x^4]
        const coeffs = [e, d, c, b, a];
        const result = PolyLogic.solve(coeffs);
        document.getElementById('calc-screen').value = result;
        VoiceCore.speak("Polynomial roots identified via approximation.");
    },

    // 13. Graphing Engine  ---- Precision Integrated Logical GraphEngine
    const GraphEngine = {
    chart: null,
    showGrid: true,

    plot(expression) {
        const ctx = document.getElementById('graphCanvas').getContext('2d');
        const labels = [], data = [];
        
        // Generate high-density data points (-20 to 20)
        for (let x = -20; x <= 20; x += 0.2) {
            labels.push(x.toFixed(1));
            try {
                // Replace 'x' with current value and solve
                let val = eval(expression.replace(/x/g, `(${x})`));
                data.push(val);
            } catch(e) { data.push(null); }
        }

        if (this.chart) this.chart.destroy();

        this.chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: `f(x) = ${expression}`,
                    data: data,
                    borderColor: '#00ff91',
                    borderWidth: 2,
                    pointRadius: 0, // Clean line
                    tension: 0.3
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: { 
                        display: true, 
                        grid: { color: 'rgba(255,255,255,0.1)', display: this.showGrid },
                        ticks: { color: '#00ff91' }
                    },
                    y: { 
                        display: true, 
                        grid: { color: 'rgba(255,255,255,0.1)', display: this.showGrid },
                        ticks: { color: '#00ff91' }
                    }
                },
                plugins: {
                    // This creates the persistent Crosslines at 0,0
                    autocolors: false,
                    annotation: {
                        annotations: {
                            lineVertical: {
                                type: 'line',
                                xMin: '0', xMax: '0',
                                borderColor: 'rgba(255, 255, 255, 0.5)',
                                borderWidth: 1,
                                label: { content: 'Y-AXIS', display: true }
                            },
                            lineHorizontal: {
                                type: 'line',
                                yMin: 0, yMax: 0,
                                borderColor: 'rgba(255, 255, 255, 0.5)',
                                borderWidth: 1,
                                label: { content: 'X-AXIS', display: true }
                            }
                        }
                    }
                }
            }
        });
        document.getElementById('graph-modal').classList.remove('hidden');
    },

    toggleGrid() {
        this.showGrid = !this.showGrid;
        this.chart.options.scales.x.grid.display = this.showGrid;
        this.chart.options.scales.y.grid.display = this.showGrid;
        document.getElementById('grid-toggle').innerText = `Grid: ${this.showGrid ? 'ON' : 'OFF'}`;
        this.chart.update();
    },

    zoom(factor) {
        // Manual scaling of the axes
        this.chart.options.scales.x.min = this.chart.scales.x.min * factor;
        this.chart.options.scales.x.max = this.chart.scales.x.max * factor;
        this.chart.options.scales.y.min = this.chart.scales.y.min * factor;
        this.chart.options.scales.y.max = this.chart.scales.y.max * factor;
        this.chart.update();
    },

    resetZoom() {
        this.chart.options.scales.x.min = undefined;
        this.chart.options.scales.x.max = undefined;
        this.chart.options.scales.y.min = undefined;
        this.chart.options.scales.y.max = undefined;
        this.chart.update();
    }


};

// --- 15. ADVANCED QUANTUM MODULES (STAT, TABLE, MATRIX, VECTOR, UNITS) ---

/**
 * 8. Unit Converter Logic
 * Perform conversions using local constant factors
 */
const UnitEngine = {
    convert() {
        const val = parseFloat(document.getElementById('unit-input').value);
        const type = document.getElementById('unit-type').value;
        let res = 0;
        
        const factors = {
            'km-m': val * 1000,
            'm-cm': val * 100,
            'kg-lb': val * 2.20462,
            'lb-kg': val * 0.453592,
            'c-f': (val * 9/5) + 32,
            'f-c': (val - 32) * 5/9,
            'gb-mb': val * 1024
        };
        
        res = factors[type] || 0;
        document.getElementById('calc-screen').value = res.toLocaleString();
        VoiceCore.speak(`Converted value is ${res.toFixed(2)}`);
    }
};

/**
 * 5. Table Generator Logic
 * Generates f(x) values for a specific range
 */
const TableEngine = {
    generate() {
        const fx = document.getElementById('table-fx').value;
        const start = parseFloat(document.getElementById('table-start').value) || 0;
        const end = parseFloat(document.getElementById('table-end').value) || 10;
        const step = parseFloat(document.getElementById('table-step').value) || 1;
        
        let output = "x  |  f(x)\n----------\n";
        
        for (let x = start; x <= end; x += step) {
            try {
                // Securely replace x and evaluate
                let expression = fx.replace(/x/g, `(${x})`);
                let y = eval(expression);
                output += `${x.toFixed(1)} | ${y.toFixed(2)}\n`;
            } catch(e) { output += `${x} | ERR\n`; }
        }
        
        // Show in screen and log for full view
        document.getElementById('calc-screen').value = "TABLE GEN: CHECK CONSOLE";
        console.log("%c NEURAL TABLE OUTPUT ", "background: #00ff91; color: #000", "\n" + output);
        alert(output); // Offline-friendly popup for results
    }
};

/**
 * 6 & 7. Matrix and Vector Logic
 * Handles 3x3 Determinants and Dot Products
 */
const MatrixLogic = {
    getMatrix() {
        return [
            [parseFloat(document.getElementById('m11').value || 0), parseFloat(document.getElementById('m12').value || 0), parseFloat(document.getElementById('m13').value || 0)],
            [parseFloat(document.getElementById('m21').value || 0), parseFloat(document.getElementById('m22').value || 0), parseFloat(document.getElementById('m23').value || 0)],
            [parseFloat(document.getElementById('m31').value || 0), parseFloat(document.getElementById('m32').value || 0), parseFloat(document.getElementById('m33').value || 0)]
        ];
    },
    
    determinant() {
        const m = this.getMatrix();
        const det = m[0][0] * (m[1][1] * m[2][2] - m[1][2] * m[2][1]) -
                    m[0][1] * (m[1][0] * m[2][2] - m[1][2] * m[2][0]) +
                    m[0][2] * (m[1][0] * m[2][1] - m[1][1] * m[2][0]);
        
        document.getElementById('calc-screen').value = `DET: ${det.toFixed(2)}`;
        VoiceCore.speak(`Matrix determinant is ${det}`);
    },

    vectorDot() {
        const m = this.getMatrix();
        // Uses Row 1 and Row 2 as Vector A and B
        const dot = (m[0][0] * m[1][0]) + (m[0][1] * m[1][1]) + (m[0][2] * m[1][2]);
        document.getElementById('calc-screen').value = `VEC-DOT: ${dot}`;
        VoiceCore.speak(`Vector dot product is ${dot}`);
    }
};

/**
 * 3. Stats and Distribution Logic
 * Calculates Mean, Variance, and Standard Deviation
 */
const StatsLogic = {
    analyze() {
        const input = document.getElementById('stats-data').value;
        const data = input.split(',').map(n => parseFloat(n.trim())).filter(n => !isNaN(n));
        
        if (data.length === 0) return;

        const sum = data.reduce((a, b) => a + b, 0);
        const mean = sum / data.length;
        const sqDiffs = data.map(n => Math.pow(n - mean, 2));
        const variance = sqDiffs.reduce((a, b) => a + b, 0) / data.length;
        const stdDev = Math.sqrt(variance);

        document.getElementById('calc-screen').value = `MEAN:${mean.toFixed(2)} STD:${stdDev.toFixed(2)}`;
        VoiceCore.speak(`Data analyzed. Standard deviation is ${stdDev.toFixed(2)}`);
    }
};

// --- UPDATED UI SWITCHER (Replace previous switchMode inside QuantumCalc) ---
QuantumCalc.switchMode = function() {
    this.mode = document.getElementById('calc-mode').value;
    
    // List of all specialized panels
    const panels = {
        'poly': 'calc-poly-inputs',
        'base-n': 'base-n-grid',
        'unit': 'calc-unit-panel',
        'table': 'calc-table-panel',
        'matrix': 'calc-matrix-panel',
        'stat': 'calc-stats-panel'
    };

    // Hide all, then show the active one
    Object.values(panels).forEach(id => {
        const el = document.getElementById(id);
        if(el) el.style.display = 'none';
    });

    if (panels[this.mode]) {
        document.getElementById(panels[this.mode]).style.display = (this.mode === 'matrix') ? 'block' : 'grid';
        if (this.mode === 'stat' || this.mode === 'matrix') document.getElementById(panels[this.mode]).style.display = 'block';
    }

    document.getElementById('calc-screen').value = "";
    document.getElementById('calc-screen').placeholder = `MODE: ${this.mode.toUpperCase()}`;
    VoiceCore.speak(`${this.mode} mode active.`);
};
// --- MEMORY & HISTORY SYSTEM FOR THE CALCULATOR ---
let calcMemory = 0;
let calcHistory = [];

const QuantumCalc = {
    // ... previous code ...

    // Memory Functions
    memAdd() {
        const val = parseFloat(document.getElementById('calc-screen').value) || 0;
        calcMemory += val;
        this.updateMemUI();
    },
    memClear() {
        calcMemory = 0;
        this.updateMemUI();
    },
    updateMemUI() {
        document.getElementById('mem-indicator').innerText = `M: ${calcMemory}`;
    },

    // Copy to Clipboard via Touch
    copyResult() {
        const screen = document.getElementById('calc-screen');
        if (screen.value === "" || screen.value === "0") return;
        
        navigator.clipboard.writeText(screen.value);
        VoiceCore.speak("Result copied to clipboard");
        
        // Visual Feedback
        screen.style.color = "#fff";
        setTimeout(() => screen.style.color = "var(--primary-glow)", 200);
    },

    // History Tracking
    addToHistory(equation, result) {
        calcHistory.push({eq: equation, res: result});
        const histDiv = document.getElementById('lcd-history');
        histDiv.innerHTML += `<div>${equation} = ${result}</div>`;
        histDiv.scrollTop = histDiv.scrollHeight;
    }
};

// --- ENHANCED GRAPH ENGINE (INTEGRATED) ---
const GraphEngine = {
    isFullScreen: false,
    
    plot(expression) {
        const container = document.getElementById('mini-graph-container');
        container.classList.remove('hidden');
        
        // Display the formula hint over the graph
        document.getElementById('lcd-formula-hint').innerText = `Graph: y = ${expression}`;
        
        // (Insert your previous Chart.js plot logic here, but targeting the existing canvas)
        this.renderChart(expression);
    },

    toggleFullScreen() {
        const lcd = document.getElementById('neural-lcd');
        this.isFullScreen = !this.isFullScreen;
        
        if (this.isFullScreen) {
            lcd.classList.add('lcd-fullscreen');
        } else {
            lcd.classList.remove('lcd-fullscreen');
        }
        // Force chart to resize to new container dimensions
        this.chart.resize();
    }
};

// The D-Pad Logic

function moveCursor(direction) {
    const screen = document.getElementById('calc-screen');
    const pos = screen.selectionStart;

    if (direction === 'left') screen.setSelectionRange(pos - 1, pos - 1);
    if (direction === 'right') screen.setSelectionRange(pos + 1, pos + 1);
    
    // For Matrix navigation, it detects if we are in matrix mode
    if (QuantumCalc.mode === 'matrix') {
        // Logic to cycle focus through m11, m12, etc.
        const current = document.activeElement;
        if (current.id.startsWith('m')) {
            // Find next input based on ID
            VoiceCore.speak("Navigating grid");
        }
    }
    screen.focus();
}


// ---16-A. GLOBAL ATTACHMENTS FOR HTML BUTTONS ---
window.num = (v) => document.getElementById('calc-screen').value += v;
window.clearCalc = () => document.getElementById('calc-screen').value = "";
window.deleteLast = () => {
    let s = document.getElementById('calc-screen').value;
    document.getElementById('calc-screen').value = s.slice(0, -1);
};
window.calc = () => QuantumCalc.executeCore();
window.runPolySolve = () => QuantumCalc.runPolySolve();
// --- 16. NEURAL IMAGE GENERATOR (Using Pollinations AI) ---
document.getElementById('gen-image-btn').onclick = async () => {
    const prompt = document.getElementById('image-prompt').value;
    if (!prompt) return;

    const imgElement = document.getElementById('generated-image');
    imgElement.style.opacity = "0.5";
    
    // Constructing the AI image URL
    const encodedPrompt = encodeURIComponent(prompt);
    const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=512&height=512&nologo=true`;

    imgElement.src = imageUrl;
    imgElement.onload = () => {
        imgElement.style.opacity = "1";
        saveToGallery("Image", prompt, imageUrl);
    };
};
// --- 16-B. PROFESSIONAL UNIT CONVERSION ENGINE ---

const UnitEngine = {
    // Comprehensive Conversion Ratios (Target to Base Unit)
    // Length: Base = Meters (m)
    // Mass: Base = Grams (g)
    // Data: Base = Bytes (b)
    // Area: Base = Square Meters (m2)
    
    ratios: {
        length: {
            nm: 1e-9, um: 1e-6, mm: 0.001, cm: 0.01, m: 1, km: 1000,
            in: 0.0254, ft: 0.3048, yd: 0.9144, mi: 1609.34, nmi: 1852
        },
        mass: {
            mg: 0.001, g: 1, kg: 1000, t: 1e6, 
            oz: 28.3495, lb: 453.592, st: 6350.29
        },
        data: {
            b: 1, kb: 1024, mb: 1048576, gb: 1073741824, tb: 1099511627776
        },
        area: {
            m2: 1, km2: 1e6, ft2: 0.092903, ac: 4046.86, ha: 10000
        },
        speed: {
            mps: 1, kph: 0.277778, mph: 0.44704, kn: 0.514444
        }
    },

    convert() {
        const val = parseFloat(document.getElementById('unit-val').value);
        const category = document.getElementById('unit-category').value;
        const fromUnit = document.getElementById('unit-from').value;
        const toUnit = document.getElementById('unit-to').value;

        if (isNaN(val)) return;

        let result;

        // Special Logic for Temperature (Non-multiplicative)
        if (category === 'temp') {
            result = this.handleTemperature(val, fromUnit, toUnit);
        } else {
            // General Logic: (Value * FromRatio) / ToRatio
            const baseValue = val * this.ratios[category][fromUnit];
            result = baseValue / this.ratios[category][toUnit];
        }

        // Display with high precision for scientific use
        const formattedResult = result < 0.0001 ? result.toExponential(4) : result.toLocaleString(undefined, {maximumFractionDigits: 6});
        
        document.getElementById('calc-screen').value = formattedResult;
        VoiceCore.speak(`Result: ${formattedResult} ${toUnit}`);
    },

    handleTemperature(v, from, to) {
        if (from === to) return v;
        let celsius;
        // Convert to Base (Celsius)
        if (from === 'c') celsius = v;
        if (from === 'f') celsius = (v - 32) * 5 / 9;
        if (from === 'k') celsius = v - 273.15;

        // Convert from Base to Target
        if (to === 'c') return celsius;
        if (to === 'f') return (celsius * 9 / 5) + 32;
        if (to === 'k') return celsius + 273.15;
    },

    // Dynamic UI: Changes the "From" and "To" dropdowns based on category
    updateUnitLists() {
        const category = document.getElementById('unit-category').value;
        const fromSelect = document.getElementById('unit-from');
        const toSelect = document.getElementById('unit-to');
        
        const unitMap = {
            length: ['nm', 'um', 'mm', 'cm', 'm', 'km', 'in', 'ft', 'yd', 'mi', 'nmi'],
            mass: ['mg', 'g', 'kg', 't', 'oz', 'lb', 'st'],
            temp: ['c', 'f', 'k'],
            data: ['b', 'kb', 'mb', 'gb', 'tb'],
            area: ['m2', 'km2', 'ft2', 'ac', 'ha'],
            speed: ['mps', 'kph', 'mph', 'kn']
        };

        const options = unitMap[category].map(u => `<option value="${u}">${u.toUpperCase()}</option>`).join('');
        fromSelect.innerHTML = options;
        toSelect.innerHTML = options;
    }
};
// --- Gallery View within the Digital Treasury ---
// Queries the vault store specifically for records of type: "drawing". ---
/**
 * GalleryCore - Handles the retrieval and display of saved sketches
 */
const GalleryCore = {
    async loadDrawings() {
        const grid = document.getElementById('gallery-grid');
        if (!grid) return;

        try {
            // Retrieve all records from the vault store
            const allRecords = await NeuralDB.getAll('vault');
            
            // Filter for drawings only
            const drawings = allRecords.filter(record => record.type === 'drawing');

            if (drawings.length === 0) {
                grid.innerHTML = `<p style="color: var(--text-dim); text-align: center; grid-column: 1 / -1;">Vault is empty.</p>`;
                return;
            }

            // Render the drawings
            grid.innerHTML = drawings.map(draw => `
                <div class="gallery-item" style="background: var(--glass); padding: 10px; border-radius: 10px; border: 1px solid var(--glass-border);">
                    <img src="${draw.data}" style="width: 100%; border-radius: 5px; background: #fff;" alt="Schematic">
                    <div style="margin-top: 10px; font-size: 0.8rem;">
                        <span style="color: var(--primary-glow); font-weight: bold;">${draw.subject}</span><br>
                        <small style="color: var(--text-dim);">${new Date(draw.timestamp).toLocaleDateString()}</small>
                    </div>
                    <button class="calc-btn" onclick="GalleryCore.deleteDrawing('${draw.id}')" style="width: 100%; margin-top: 10px; color: #ff4b2b;">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </div>
            `).join('');

        } catch (err) {
            console.error("Gallery Load Error:", err);
        }
    },

    async deleteDrawing(id) {
        if (!confirm("Permanently purge this schematic from the vault?")) return;
        
        try {
            const db = await NeuralDB.open();
            const tx = db.transaction('vault', 'readwrite');
            await tx.store.delete(id);
            await tx.done;
            
            VoiceCore.speak("Schematic purged.");
            this.loadDrawings(); // Refresh the grid
        } catch (err) {
            console.error("Delete Error:", err);
        }
    }
};

// Auto-load gallery when the Hub is initialized
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => GalleryCore.loadDrawings(), 1000);
});


// --- 17. Quantum Calculator Camera Eye ---
async openCamera() {
    const container = document.getElementById('scanner-ui');
    const video = document.getElementById('camera-preview');
    
    container.classList.remove('hidden');
    VoiceCore.speak("Initializing Neural Vision. Please align the equation.");

    try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
            video: { facingMode: 'environment' } 
        });
        video.srcObject = stream;
        
        // Auto-capture after 3 seconds of focus
        setTimeout(() => this.captureAndSolve(stream), 4000);
    } catch (err) {
        VoiceCore.speak("Camera access denied.");
        container.classList.add('hidden');
    }
},

async captureAndSolve(stream) {
    const video = document.getElementById('camera-preview');
    const canvas = document.getElementById('snapshot-buffer');
    const ctx = canvas.getContext('2d');
    
    // Draw current frame to hidden canvas
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0);
    
    VoiceCore.speak("Analyzing patterns...");
    
    // Use Tesseract (must be cached in sw.js)
    const { data: { text } } = await Tesseract.recognize(canvas, 'eng');
    
    // Clean and send to calculator
    const cleanExpr = text.replace(/[^0-9+\-*/().x^]/g, '');
    document.getElementById('calc-screen').value = cleanExpr;
    
    // Stop camera and close UI
    stream.getTracks().forEach(track => track.stop());
    document.getElementById('scanner-ui').classList.add('hidden');
    
    VoiceCore.speak(`System identified: ${cleanExpr}. Ready to compute.`);
},

closeScanner() {
    document.getElementById('scanner-ui').classList.add('hidden');
    // Stop all camera tracks
    const video = document.getElementById('camera-preview');
    if(video.srcObject) {
        video.srcObject.getTracks().forEach(track => track.stop());
    }
}

// --- 18. NEURAL READER (PDF & SYNCED SPEECH) ---
// The INPUT text Extractor, Save and read it out, AI Save point for next Exam on the subjects.

const pdfjsLib = window['pdfjs-dist/build/pdf'];

// Ensure the worker is pulled from the service worker cache
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js';

document.getElementById('pdf-upload').onchange = async function(e) {
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onload = async function() {
        const typedarray = new Uint8Array(this.result);
        const pdf = await pdfjsLib.getDocument(typedarray).promise;
        let fullText = "";
        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const content = await page.getTextContent();
            fullText += content.items.map(item => item.str).join(" ") + "\n";
        }
        document.getElementById('reader-text-area').value = fullText;
        
        // ✨ NEW: Automatically save this to the Vault for the Exam Engine
        const subject = document.getElementById('exam-subject-select')?.value || "General";
        await captureLearning(subject, fullText); 

        speakResponse("PDF decoded and synchronized with Neural Vault. System ready.");
    };
    reader.readAsArrayBuffer(file);
};

document.getElementById('start-read-btn').onclick = () => {
    const text = document.getElementById('reader-text-area').value;
    if(!text) return;

    const utterance = new SpeechSynthesisUtterance(text);
    const index = document.getElementById('voice-selector').value;
    utterance.voice = state.ui.voices[index];

    utterance.onboundary = (event) => {
        const total = text.length;
        const current = event.charIndex;
        document.getElementById('reading-bar').style.width = `${(current / total) * 100}%`;
    };

    utterance.onend = () => document.getElementById('reading-bar').style.width = "0%";
    
    window.speechSynthesis.speak(utterance);
};

document.getElementById('stop-read-btn').onclick = () => window.speechSynthesis.cancel();

// --- 19. SECURE MEDIA VAULT LOGIC ---
/** * FORRANOVA NEURAL STORAGE (IndexedDB Core)
 * Replaces localStorage for large media to prevent crashes.
 */
const NeuralDB = {
    dbName: "ForraNovaVault",
    dbVersion: 1,
    db: null,

    // 1. INITIALIZE DATABASE
    async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.dbVersion);
            request.onupgradeneeded = (e) => {
                const db = e.target.result;
                // Create stores if they don't exist
                if (!db.objectStoreNames.contains('vault')) db.createObjectStore('vault', { keyPath: 'id' });
                if (!db.objectStoreNames.contains('gallery')) db.createObjectStore('gallery', { keyPath: 'id' });
            };
            request.onsuccess = (e) => {
                this.db = e.target.result;
                resolve(this.db);
            };
            request.onerror = (e) => reject("Database Error: " + e.target.error);
        });
    },

    // 2. CREATE / UPDATE (Upsert)
    async save(storeName, data) {
        if (!this.db) await this.init();
        return new Promise((resolve) => {
            const tx = this.db.transaction(storeName, 'readwrite');
            const store = tx.objectStore(storeName);
            // Ensure ID exists for CRUD tracking
            if (!data.id) data.id = Date.now(); 
            store.put(data); // .put handles both create and update
            tx.oncomplete = () => resolve(true);
        });
    },

    // 3. READ (Get All)
    async getAll(storeName) {
        if (!this.db) await this.init();
        return new Promise((resolve) => {
            const tx = this.db.transaction(storeName, 'readonly');
            const request = tx.objectStore(storeName).getAll();
            request.onsuccess = () => resolve(request.result);
        });
    },

    // 4. DELETE
    async delete(storeName, id) {
        if (!this.db) await this.init();
        return new Promise((resolve) => {
            const tx = this.db.transaction(storeName, 'readwrite');
            tx.objectStore(storeName).delete(Number(id));
            tx.oncomplete = () => resolve(true);
        });
    }
};

// --- CRUD UI MAPPING ---

// Handle Vault Uploads
document.getElementById('vault-upload').onchange = async function(e) {
    const files = Array.from(e.target.files);
    for (const file of files) {
        const reader = new FileReader();
        reader.onload = async function() {
            await NeuralDB.save('vault', {
                name: file.name,
                type: file.type,
                data: reader.result, // Base64 Data
                date: new Date().toLocaleDateString()
            });
            renderVault();
            VoiceCore.speak("File synchronized to vault.");
        };
        reader.readAsDataURL(file);
    }
};

async function renderVault() {
    const container = document.getElementById('vault-grid');
    if (!container) return;
    const files = await NeuralDB.getAll('vault');
    
    container.innerHTML = files.map(file => `
        <div class="vault-item">
            <span class="vault-icon">${file.type.includes('image') ? '🖼️' : '📄'}</span>
            <span class="vault-name">${file.name}</span>
            <div class="vault-actions">
                <button onclick="downloadVaultFile('${file.id}')">💾</button>
                <button onclick="deleteVaultFile('${file.id}')" style="color:#ff4b4b;">🗑️</button>
            </div>
        </div>
    `).join('');
}

// Global CRUD Helpers for UI Buttons
window.downloadVaultFile = async (id) => {
    const files = await NeuralDB.getAll('vault');
    const file = files.find(f => f.id == id);
    const link = document.createElement('a');
    link.href = file.data;
    link.download = file.name;
    link.click();
};

window.deleteVaultFile = async (id) => {
    await NeuralDB.delete('vault', id);
    renderVault();
};


// --- 20. NEURAL STUDIO VIDEO (OFFLINE SONG ENGINE) ---
const NeuralGenerator = {
    isGenerating: false,
    currentBlob: null,

    async start() {
        const prompt = document.getElementById('neural-prompt-input').value;
        const type = document.getElementById('gen-type').value;
        if (!prompt) return alert("Please type a description first.");

        this.isGenerating = true;
        document.getElementById('gen-status-display').innerHTML = `<i class="fas fa-spinner fa-spin"></i> Synthesizing ${type}...`;
        
        // --- SIMULATED AI GENERATION (Replace with your API calls later) ---
        setTimeout(() => {
            if(!this.isGenerating) return;
            this.isGenerating = false;
            document.getElementById('gen-status-display').innerText = "Generation Complete!";
            
            // For now, we simulate a result (e.g., a dummy blob)
            this.currentBlob = new Blob(["Simulated Data"], { type: type === 'video' ? 'video/mp4' : 'image/png' });
            
            // Open in Universal Viewer for Preview
            NeuralStudio.openMediaPlayer({
                id: `Generated_${Date.now()}`,
                type: type,
                data: this.currentBlob,
                mime: type === 'video' ? 'mp4' : 'png'
            });
        }, 3000);
    },

    stop() {
        this.isGenerating = false;
        document.getElementById('gen-status-display').innerText = "Generation Stopped.";
    }
    // --- Studio Specific Logic ---
    NeuralGenerator.start = async function() {
        // 1. Get Prompt & Type
        // 2. Show spinner in #gen-status-display
        // 3. When done, put the video/image into #studio-media-output
        // 4. Show #studio-post-actions (The "Send to Trove" button)
    };

    // --- Trove Specific Logic ---
    NeuralStudio.loadItem = async function(id) {
        const item = await NeuralDB.get('vault', id);
        // Directly open the #neural-viewer inside the Trove
        this.openMediaPlayer(item); 
    };

};

// --- UPDATES TO NEURAL STUDIO OBJECT ---
NeuralStudio.openMediaPlayer = function(item) {
    this.currentViewingItem = item; // Store for Save/Delete buttons
    const viewer = document.getElementById('neural-viewer');
    const content = document.getElementById('viewer-content');
    const title = document.getElementById('viewer-title');
    
    viewer.style.display = 'flex';
    title.innerText = item.id;
    content.innerHTML = ""; // Clear old content

    const url = URL.createObjectURL(item.data);

    if (item.type === 'video') {
        content.innerHTML = `
            <video id="pro-player" src="${url}" controls autoplay class="main-media">
                Your browser does not support video.
            </video>`;
    } else if (item.type === 'audio') {
        content.innerHTML = `
            <div class="audio-ui">
                <i class="fas fa-music fa-5x"></i>
                <audio src="${url}" controls autoplay></audio>
            </div>`;
    } else if (item.type === 'image' || item.type === 'canvas') {
        content.innerHTML = `<img src="${url}" class="main-media">`;
    } else if (item.type === 'document') {
        content.innerHTML = `<div class="doc-preview">${item.data}</div>`;
    }
};

NeuralStudio.closeViewer = function() {
    document.getElementById('neural-viewer').style.display = 'none';
    document.getElementById('viewer-content').innerHTML = ""; // Stop playback
};

NeuralStudio.toggleFullScreen = function() {
    const el = document.getElementById('viewer-content');
    if (el.requestFullscreen) el.requestFullscreen();
};

NeuralStudio.saveFromViewer = function() {
    if (!this.currentViewingItem) return;
    this.saveToVault({
        name: this.currentViewingItem.id,
        type: this.currentViewingItem.type,
        format: this.currentViewingItem.mime,
        blob: this.currentViewingItem.data,
        content: typeof this.currentViewingItem.data === 'string' ? this.currentViewingItem.data : null
    });
};
// --- THE STUDIO-TO-TROVE BRIDGE ---
NeuralStudio.saveFromStudio = async function() {
    if (!NeuralGenerator.currentBlob) {
        VoiceCore.speak("Nothing to save. Generate something first.");
        return;
    }

    const type = document.getElementById('gen-type').value;
    const format = (type === 'video') ? 'mp4' : (type === 'audio' ? 'mp3' : 'png');
    
    // Trigger the universal saver
    await this.saveToVault({
        type: type,
        format: format,
        blob: NeuralGenerator.currentBlob
    });

    // Clean up the Studio after successful save
    document.getElementById('studio-media-output').innerHTML = "";
    document.getElementById('studio-post-actions').style.display = 'none';
    document.getElementById('gen-status-display').innerText = "Transfer complete. Item secured in Trove.";
    
    VoiceCore.speak("Data transfer successful. You can find it in your Trove.");
};

// --- UPDATED GENERATOR CLEAR ---
NeuralGenerator.clear = function() {
    this.currentBlob = null;
    document.getElementById('studio-media-output').innerHTML = "";
    document.getElementById('studio-post-actions').style.display = 'none';
    document.getElementById('gen-status-display').innerText = "Workspace cleared.";
};

// --- 21. WORKBENCH ---
/**
 * FORRANOVA NEURAL WORKBENCH LOGIC
 * Handles Drag-and-Drop, PDF Extraction, and Controlled Speech
 */
const NeuralWorkbench = {
    speechSynth: window.speechSynthesis,
    currentUtterance: null,
    isPaused: false,

    // --- 1. DRAG & DROP HANDLERS ---
    handleDragOver(e) {
        e.preventDefault();
        document.getElementById('workbench-surface').classList.add('drag-over');
    },

    handleDragLeave(e) {
        e.preventDefault();
        document.getElementById('workbench-surface').classList.remove('drag-over');
    },

    handleDrop(e) {
        e.preventDefault();
        document.getElementById('workbench-surface').classList.remove('drag-over');
        const files = e.dataTransfer.files;
        if (files.length > 0) this.processFile(files[0]);
    },

    handleFileUpload(e) {
        const file = e.target.files[0];
        if (file) this.processFile(file);
    },

    //When the student is at the Workbench and they read a note about "Tailoring: How to use a Seam Ripper," 
    // this code should save that note to the vault with type: 'lesson_note'.
    async function saveLessonToMemory(subject, content) {
        const note = {
            id: `NOTE-${Date.now()}`,
            type: 'lesson_note',
            subject: subject,
            content: content, // The actual text of the tailoring lesson
            timestamp: new Date().toISOString()
        };
        await NeuralDB.save('vault', note);
    }


    // --- 2. FILE PROCESSING (Media vs. Documents) ---
    async processFile(file) {
        const status = document.getElementById('workbench-status-text');
        status.innerText = `Processing ${file.name}...`;

        // Case A: Video or Audio -> Send to Universal Viewer
        if (file.type.startsWith('video/') || file.type.startsWith('audio/') || file.type.startsWith('image/')) {
            status.innerText = "Media detected. Opening Viewer...";
            NeuralStudio.openMediaPlayer({
                id: file.name,
                type: file.type.split('/')[0],
                data: file,
                mime: file.type
            });
            return;
        }

        // Case B: Text or PDF -> Load into Workbench Pad
        const reader = new FileReader();
        reader.onload = (e) => {
            const content = e.target.result;
            // Simple text display (For PDF extraction, you'd integrate pdf.js here)
            document.getElementById('workbench-pad').innerText = content;
            status.innerText = "Document loaded. Manual read available.";
        };
        
        if (file.type === "application/pdf") {
            status.innerText = "PDF detected. Extracting text...";
            // Placeholder for PDF.js logic
            reader.readAsText(file); 
        } else {
            reader.readAsText(file);
        }
    },

    // --- 3. MANUAL VOICE CONTROLS ---
    toggleSpeech() {
        const pad = document.getElementById('workbench-pad');
        const text = pad.innerText || pad.textContent;
        const btn = document.getElementById('voice-play-pause');
        const waves = document.getElementById('voice-waves');

        if (!text.trim()) return VoiceCore.speak("The workbench is empty.");

        if (this.speechSynth.speaking && !this.isPaused) {
            // PAUSE
            this.speechSynth.pause();
            this.isPaused = true;
            btn.innerHTML = `<i class="fas fa-play"></i> Resume`;
            waves.style.display = 'none';
        } else if (this.isPaused) {
            // RESUME
            this.speechSynth.resume();
            this.isPaused = false;
            btn.innerHTML = `<i class="fas fa-pause"></i> Pause`;
            waves.style.display = 'flex';
        } else {
            // START NEW
            this.stopSpeech(); // Clear any old queue
            this.currentUtterance = new SpeechSynthesisUtterance(text);
            
            this.currentUtterance.onend = () => this.stopSpeech();
            
            this.speechSynth.speak(this.currentUtterance);
            btn.innerHTML = `<i class="fas fa-pause"></i> Pause`;
            waves.style.display = 'flex';
            document.getElementById('workbench-status-text').innerText = "Reading document...";
        }
    },

    stopSpeech() {
        this.speechSynth.cancel();
        this.isPaused = false;
        const btn = document.getElementById('voice-play-pause');
        if(btn) btn.innerHTML = `<i class="fas fa-play"></i> Read`;
        document.getElementById('voice-waves').style.display = 'none';
        document.getElementById('workbench-status-text').innerText = "System Idle";
    },

    // --- 4. WORKBENCH ACTIONS ---
    async saveToVault() {
        const content = document.getElementById('workbench-pad').innerHTML;
        if (!content.trim()) return alert("Workbench is empty.");

        await NeuralStudio.saveToVault({
            type: 'document',
            format: 'lined',
            content: content
        });
    },

    clear() {
        if (confirm("Clear Workbench? Unsaved changes will be lost.")) {
            this.stopSpeech();
            document.getElementById('workbench-pad').innerHTML = "";
            document.getElementById('workbench-status-text').innerText = "Workbench Cleared.";
        }
    }
};

// Update the Workbench Logic

const WorkbenchController = {
    // Detects context and plays the correct audio
    playActiveContext: function() {
        const textInWorkbench = document.getElementById('workbench-text').value;
        
        // If the student typed something manually, prioritize that
        if (textInWorkbench.trim().length > 0) {
            VoiceCore.speak(textInWorkbench);
            return;
        }

        // Otherwise, check what is on the screen (AI response or Scripture)
        const aiResponse = document.getElementById('ai-response').innerText;
        if (aiResponse) {
            VoiceCore.speak(aiResponse);
        }
    },

    stopAll: function() {
        window.speechSynthesis.cancel();
    },

    clearAll: function() {
        this.stopAll();
        document.getElementById('workbench-text').value = '';
        document.getElementById('ai-response').innerHTML = '';
    }
};

// The QuizEngine  --- Class Room Quiz
// Handles generating questions from the Neural Reader's content and 
// toggling the overlay visibility.

/**
 * Quiz Engine - Handles the Quiz Overlay & Automatic Question Generation
 */
const QuizEngine = {
    currentQuestions: [],

    // 1. OPEN THE QUIZ
    open() {
        const overlay = document.getElementById('quiz-overlay');
        const readerText = document.getElementById('reader-text-area').value;

        if (!readerText || readerText.length < 50) {
            VoiceCore.speak("The reader is empty. Please upload a document to generate questions.");
            return;
        }

        // Generate questions from the text
        this.generateQuestions(readerText);
        
        // Show the modal
        overlay.classList.remove('hidden');
        this.renderQuiz();
        VoiceCore.speak("Starting your neural quiz phase.");
    },

    // 2. CLOSE THE QUIZ
    close() {
        const overlay = document.getElementById('quiz-overlay');
        overlay.classList.add('hidden');
    },

    // 3. GENERATE QUESTIONS (Simple NLP logic)
    generateQuestions(text) {
        // Splitting text into sentences to find "facts"
        const sentences = text.split(/[.!?]/).filter(s => s.trim().length > 20);
        this.currentQuestions = sentences.slice(0, 5).map((sentence, index) => {
            return {
                id: index,
                question: `Based on your notes: "...${sentence.trim()}...", is this a core concept?`,
                options: ["Absolutely", "Inconclusive", "Irrelevant"],
                answer: 0
            };
        });
    },

    // 4. RENDER TO UI
    renderQuiz() {
        const container = document.querySelector('.quiz-container');
        if (!container) return;

        container.innerHTML = `
            <h2 class="glow-text">Neural Quiz Phase</h2>
            ${this.currentQuestions.map(q => `
                <div class="quiz-card" style="margin-bottom:20px; padding:15px; background:var(--glass);">
                    <p>${q.question}</p>
                    <div class="quiz-options">
                        ${q.options.map(opt => `<button class="calc-btn" style="margin:5px;">${opt}</button>`).join('')}
                    </div>
                </div>
            `).join('')}
            <button onclick="QuizEngine.close()" class="action-btn" style="margin-top:20px;">Finish & Sync</button>
        `;
    }
// GLOBAL TRIGGER: Connect this to your Quiz button in HTML
// <button onclick="QuizEngine.open()">Start Quiz</button>  
};



// The "Quiz Me" Engine --- personal reading Test
const NeuralQuiz = {
    generateQuiz: function() {
        const content = document.getElementById('workbench-text').value || 
                        document.getElementById('ai-response').innerText;
        
        if (!content || content.length < 10) {
            VoiceCore.speak("Please import or type a lesson first to start a quiz.");
            return;
        }

        // The AI "Simulates" a quiz based on the text
        const responseBox = document.getElementById('ai-response');
        responseBox.innerHTML = `
            <div class="quiz-container">
                <h4>🧠 Neural Evaluation</h4>
                <p>Based on your lesson, are you ready for a 3-question challenge?</p>
                <button class="action-btn" onclick="NeuralQuiz.submitScore(100)">Pass Challenge</button>
            </div>
        `;
        VoiceCore.speak("Evaluation sequence initiated. Analyze the text and confirm when ready.");
    },

    submitScore: function(points) {
        state.student.masteryPoints += points;
        
        // Check for Level Up
        if (state.student.masteryPoints >= state.student.level * 500) {
            state.student.level += 1;
            VoiceCore.speak("Neural Level Synchronized. You are now Level " + state.student.level);
        }

        ForraNovaAI.updatePersistence(); // Saves to Dashboard
        WisdomCore.displayAndSpeak("Performance report sent to Dashboard. +100 Mastery Points.");
    }
};

// --- 22. CLASS ROOM CORE - Level and Subjects (Curriculum) Selector ---

const AcademicCore = {
    // 1. DYNAMICALLY ADD SUBJECTS
    addNewSubject() {
        const newSub = prompt("Enter the name of the new Subject:");
        if (newSub) {
            const select = document.getElementById('student-subject');
            const option = document.createElement('option');
            option.value = newSub.toLowerCase();
            option.text = newSub;
            select.add(option);
            select.value = option.value;
            VoiceCore.speak(`${newSub} has been added to your curriculum.`);
        }
    },

    // 2. GET CURRENT ACADEMIC LENS
    getLens() {
        return {
            level: document.getElementById('student-level').value,
            subject: document.getElementById('student-subject').value
        };
    },

    // 3. TRACK PERFORMANCE (Simulated Offline Scoring)
    updatePerformance(score) {
        const display = document.getElementById('perf-score');
        // Logic: Calculate average based on previous sessions stored in Trove
        display.innerText = `${score}% Proficiency`;
        
        if(score > 80) display.style.color = "#00ffcc";
        else if(score > 50) display.style.color = "#ffcc00";
        else display.style.color = "#ff4d4d";
    }
};

// Update the Save function in NeuralWorkbench to include these tags
NeuralWorkbench.saveToVault = async function() {
    const content = document.getElementById('workbench-pad').innerHTML;
    const lens = AcademicCore.getLens(); // Get Level and Subject

    if (!content.trim()) return;

    await NeuralStudio.saveToVault({
        type: 'document',
        format: 'lesson',
        content: content,
        metadata: {
            subject: lens.subject,
            level: lens.level,
            timestamp: Date.now()
        }
    });
    
    VoiceCore.speak(`Lesson saved under ${lens.subject} for ${lens.level} level.`);
};

//--- REAL TIME SUBJECT REVIEW Quiz
NeuralWorkbench.generateContextQuiz = function() {
    const text = document.getElementById('workbench-pad').innerText;
    if (text.length < 100) {
        VoiceCore.speak("This text is too short to generate a meaningful quiz. Add more content.");
        return;
    }

    // 1. Prepare the Quiz Interface
    const quizOverlay = document.createElement('div');
    quizOverlay.id = "context-quiz-overlay";
    quizOverlay.className = "trove-overlay"; // Reuse your sleek viewer CSS
    
    // 2. Extract "Knowledge Gems" (Simple NLP logic)
    const sentences = text.match(/[^\.!\?]+[\.!\?]+/g) || [];
    const questions = this.generateQuestionsFromText(sentences);

    // 3. Build the UI
    quizOverlay.innerHTML = `
        <div class="pro-viewer-window" style="max-width: 600px; height: auto;">
            <div class="viewer-nav">
                <span><i class="fas fa-brain"></i> Comprehension Check</span>
                <button onclick="this.parentElement.parentElement.parentElement.remove()"><i class="fas fa-times"></i></button>
            </div>
            <div id="quiz-body" style="padding: 20px; color: white;">
                <p style="color: #888; font-size: 0.9rem; margin-bottom: 20px;">Based on the document currently in your workbench:</p>
                <div id="question-container">${questions}</div>
                <button onclick="NeuralWorkbench.gradeQuiz()" class="save-btn" style="width: 100%; margin-top: 20px;">Submit Answers</button>
            </div>
        </div>
    `;
    document.body.appendChild(quizOverlay);
};

NeuralWorkbench.generateQuestionsFromText = function(sentences) {
    let html = "";
    // We pick 3 random significant sentences
    const pool = sentences.filter(s => s.length > 40 && s.length < 150);
    const selected = pool.sort(() => 0.5 - Math.random()).slice(0, 3);

    selected.forEach((sentence, index) => {
        // Create a "Cloze" (fill-in-the-blank) question by hiding a long word
        const words = sentence.trim().split(" ");
        let longWordIndex = words.findIndex(w => w.length > 6);
        if (longWordIndex === -1) longWordIndex = 0;

        const answer = words[longWordIndex].replace(/[,\.\?;]/g, "");
        words[longWordIndex] = `<input type="text" class="quiz-input" data-answer="${answer}" placeholder="...">`;

        html += `
            <div class="quiz-q-box" style="margin-bottom: 15px; line-height: 1.8;">
                <strong>Q${index + 1}:</strong> ${words.join(" ")}
            </div>
        `;
    });
    return html;
};

NeuralWorkbench.gradeQuiz = function() {
    const inputs = document.querySelectorAll('.quiz-input');
    let correct = 0;

    inputs.forEach(input => {
        const userAns = input.value.trim().toLowerCase();
        const actualAns = input.dataset.answer.toLowerCase();
        
        if (userAns === actualAns) {
            correct++;
            input.style.borderBottom = "2px solid #00ffcc";
        } else {
            input.style.borderBottom = "2px solid #ff4d4d";
            input.value += ` (${actualAns})`;
        }
    });

    const finalScore = Math.round((correct / inputs.length) * 100);
    AcademicCore.updatePerformance(finalScore); // Link to the dashboard!
    VoiceCore.speak(`Quiz complete. Your score is ${finalScore} percent.`);
};


//---REAL TIME PROGRESS PERFORMANCE IN CLASS
//  Performance Dashboard
const NeuralAnalytics = {
    // This runs every time John saves a new study session
    async refreshData() {
        const allData = await NeuralDB.getAll('vault'); // Get everything from storage
        const stats = {
            biology: { count: 0, score: 0 },
            chemistry: { count: 0, score: 0 },
            physics: { count: 0, score: 0 }
        };

        // 1. Sort data into subjects
        allData.forEach(item => {
            if (item.metadata && stats[item.metadata.subject]) {
                stats[item.metadata.subject].count++;
                // In a real app, you'd calculate actual quiz scores here
                stats[item.metadata.subject].score += 10; 
            }
        });

        // 2. Update the UI Bars
        for (let sub in stats) {
            const percentage = Math.min(stats[sub].score, 100); // Cap at 100%
            const card = document.getElementById(`stat-${sub}`);
            if (card) {
                card.querySelector('.fill').style.width = percentage + "%";
                card.querySelector('.stat-value').innerText = percentage + "%";
            }
        }

        this.generateVisualGraph(stats);
    },

    generateVisualGraph(stats) {
        // This simulates a bar graph using simple div elements
        const surface = document.querySelector('.analytics-surface');
        surface.innerHTML = ""; // Clear old graph
        
        for (let sub in stats) {
            const bar = document.createElement('div');
            const height = Math.min(stats[sub].score, 100);
            bar.style.height = height + "%";
            bar.style.width = "40px";
            bar.style.background = "#00ffcc";
            bar.style.boxShadow = "0 0 10px #00ffcc33";
            bar.title = `${sub}: ${height}%`;
            surface.appendChild(bar);
        }
    }
};

// --- 23. SPA NAVIGATION & STATE ENGINE ---

/**
 * Handles switching between different app modules (Academy, Lab, Vault, Studio)
 * @param {string} sectionId - The ID suffix of the section to display
 */
window.showSection = function(sectionId) {
    // 1. Identify all sections and nav items
    const sections = document.querySelectorAll('.app-section');
    const navItems = document.querySelectorAll('.nav-item');
    const viewTitle = document.getElementById('view-title');

    // 2. Mapping IDs to Professional Titles
    const titles = {
        'academy': 'ForraNova Academy',
        'lab': 'Resource Lab',
        'vault': 'Digital Trove',
        'studio': 'Multimedia Studio',
        'annex': 'Annex',
        'about': 'About ForraNova Hub',
        'features': 'Architecture',
        'class': 'Operations | Academy',
        'resource': 'Operations | Resource Lab',
        'trove': 'Operations | Digital Trove',
        'multimedia': 'Operations | Multimedia Studio',
        'terms': 'Terms of Use',
        'privacy': 'Privacy Policy'
    };

    // 3. Update UI Title with a fade effect
    if (viewTitle) {
        viewTitle.style.opacity = 0;
        setTimeout(() => {
            viewTitle.innerText = titles[sectionId] || 'ForraNova Hub';
            viewTitle.style.opacity = 1;
        }, 200);
    }

    // 4. Toggle Visibility Classes
    sections.forEach(section => {
        section.classList.remove('active');
        if (section.id === `section-${sectionId}`) {
            section.classList.add('active');
        }
    });

    // 5. Update Navigation Active State
    navItems.forEach(item => {
        item.classList.remove('active');
        // Check if the onclick attribute contains the sectionId
        if (item.getAttribute('onclick')?.includes(sectionId)) {
            item.classList.add('active');
        }
    });

    // 6. Special Initialization Logic per Section
    handleSectionInit(sectionId);

    // 7. Save current state to local storage
    localStorage.setItem('forranova_last_section', sectionId);
};

/**
 * Runs specific initialization code when a section is opened
 */
function handleSectionInit(sectionId) {
    switch(sectionId) {
        case 'lab':
            // Reset calculator screen if needed
            console.log("Lab Modules Calibrated.");
            break;
        case 'vault':
            // Refresh file list from localStorage
            if (typeof renderVault === 'function') renderVault();
            break;
        case 'academy':
            // Ensure chart renders correctly in the visible container
            if (window.masteryChart) window.masteryChart.update();
            break;
    }
}

// --- 24. APP INITIALIZATION ---

window.addEventListener('load', () => {
    // Initialize Theme
    if (typeof ThemeEngine !== 'undefined') ThemeEngine.init();

    // Restore Last Visited Section or default to Academy
    const lastSection = localStorage.getItem('forranova_last_section') || 'academy';
    
    // Slight delay to allow splash screen transitions
    setTimeout(() => {
        showSection(lastSection);
    }, 500);

    // Close Mobile Sidebar/Menu when a nav item is clicked
    if (window.innerWidth < 768) {
        document.querySelectorAll('.nav-item').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelector('.sidebar').classList.remove('open');
            });
        });
    }
});


// --- 25. Toggle Sidebar ---

// Function to handle the "Mobile Hamburger" toggle
window.toggleSidebar = function() {
    const sidebar = document.querySelector('.sidebar');
    sidebar.classList.toggle('open');
};

// --- 26. NEURAL WELCOME PROTOCOL  ---
const WelcomeProtocol = {
    greet: function() {
        const userName = localStorage.getItem('forranova_user_name') || 'Scholar';
        const persona = document.getElementById('ai-persona-type').value;
        const currentTime = new Date().getHours();
        
        let timeGreeting = (currentTime < 12) ? "Good morning" : (currentTime < 18 ? "Good afternoon" : "Good evening");
        
        // Persona Configuration Matrix
        const configs = {
            friendly: {
                text: `${greeting}, ${userName}! Welcome to ForraNova Hub, a place where we believe that \"knowledge is for the living.\" A quotation by my builder: FOfem.github.io. I'm so glad to see you back. Ready to learn something amazing today? Then, lets get started!`,
                pitch: 1.2,
                rate: 1.0
            },
            strict: {
                text: `Attention, ${userName}. It's a ${timeGreeting}. A perfect time to learn. We have significant academic ground to cover. So, focus!`,
                pitch: 0.8,
                rate: 0.9
            },
            futuristic: {
                text: `Neural link established. Database is fully synchronised. ${timeGreeting}, Agent ${userName}. Matrix processing at 100 percent capacity. Permision to proceed?`,
                pitch: 0.5,
                rate: 1.1
            }
        };

        const config = configs[persona] || configs.friendly;
        this.triggerSpeech(config.text, config.pitch, config.rate);
    },
};
// Save persona preference
document.getElementById('ai-persona-type').onchange = (e) => {
    localStorage.setItem('forranova_persona', e.target.value);
    WelcomeProtocol.greet(); // Give a sample of the new persona
};

// Update your existing window.load listener:
window.addEventListener('load', () => {
    // ... existing initialization code ...

    // Trigger greeting after splash screen
    setTimeout(() => {
        // If user is already set up, greet them
        if(localStorage.getItem('forranova_user_name')) {
            WelcomeProtocol.greet();
        }
    }, 1500); 
});

// Also add it to your "Finish Setup" button logic:
document.getElementById('finish-setup').addEventListener('click', () => {
    const nameInput = document.getElementById('setup-name').value;
    if(nameInput) {
        localStorage.setItem('forranova_user_name', nameInput);
        document.getElementById('setup-modal').style.display = 'none';
        WelcomeProtocol.greet(); // Greet them immediately after they type their name
    }
});

// --- VOICE ENGINE (Unified) ---
const VoiceCore = {
    synth: window.speechSynthesis,
    availableVoices: [],

    init() {
        const loadVoices = () => {
            this.availableVoices = this.synth.getVoices();
            this.populateVoiceSelector();
        };
        this.synth.onvoiceschanged = loadVoices;
        loadVoices();
    },

    populateVoiceSelector() {
        const selector = document.getElementById('voice-selector');
        if (!selector) return;
        selector.innerHTML = this.availableVoices
            .map((v, i) => `<option value="${i}">${v.name}</option>`)
            .join('');
    },

    speak(text) {
        if (!text || this.synth.speaking) this.synth.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        const selector = document.getElementById('voice-selector');
        if (selector && this.availableVoices[selector.value]) {
            utterance.voice = this.availableVoices[selector.value];
        }
        utterance.rate = 0.9;
        this.synth.speak(utterance);
    }
};

// --- NEURAL NAVIGATION ENGINE FOR SIDEBAR MENU---
let sideBarTimer;

window.toggleSidebar = function() {
    const sidebar = document.querySelector('.sidebar');
    const isVisible = sidebar.classList.toggle('visible');
    
    if (isVisible) {
        startSidebarTimer();
    } else {
        clearTimeout(sideBarTimer);
    }
};

// Auto-hide after 5 seconds of inactivity
function startSidebarTimer() {
    clearTimeout(sideBarTimer);
    sideBarTimer = setTimeout(() => {
        document.querySelector('.sidebar').classList.remove('visible');
    }, 5000); // 5000ms = 5 seconds
}

// Reset timer if user moves mouse or touches sidebar
document.querySelector('.sidebar').addEventListener('mousemove', startSidebarTimer);
document.querySelector('.sidebar').addEventListener('touchstart', startSidebarTimer);

// --- SWIPE TO CLOSE LOGIC ---
let touchStartX = 0;

document.addEventListener('touchstart', e => {
    touchStartX = e.changedTouches[0].screenX;
});

document.addEventListener('touchend', e => {
    let touchEndX = e.changedTouches[0].screenX;
    const sidebar = document.querySelector('.sidebar');
    
    // Swipe Left to Close
    if (touchStartX - touchEndX > 70 && sidebar.classList.contains('visible')) {
        sidebar.classList.remove('visible');
    }
    
    // Swipe from Left Edge to Open
    if (touchEndX - touchStartX > 70 && touchStartX < 50) {
        sidebar.classList.add('visible');
        startSidebarTimer();
    }
});


window.toggleAccordion = function(labelElement) {
    const group = labelElement.parentElement;
    group.classList.toggle('collapsed');
    
    // Reset the auto-hide timer because the user is interacting
    if (typeof startSidebarTimer === 'function') startSidebarTimer();
};

// Optional: Auto-collapse other groups when one opens
function soloAccordion(selectedGroup) {
    document.querySelectorAll('.nav-group').forEach(group => {
        if (group !== selectedGroup) group.classList.add('collapsed');
    });
}

// --- 27. NEURAL VOICE ENGINE ---
const VoiceCore = {
    availableVoices: [],

    init() {
        // Android/Chrome Voice population
        this.synth.onvoiceschanged = () => {
            this.availableVoices = this.synth.getVoices();
        };
        this.availableVoices = this.synth.getVoices();
    },
    populateVoiceSelector() {
        const selector = document.getElementById('voice-selector');
        if (!selector) return;

        selector.innerHTML = this.availableVoices
            .map((voice, index) => `<option value="${index}">${voice.name} (${voice.lang})</option>`)
            .join('');

        // Restore saved voice preference
        const savedVoice = localStorage.getItem('forranova_voice_index');
        if (savedVoice) selector.value = savedVoice;
    },

    speak(text) {
        if (!text) return;
        this.synth.cancel(); // Stop overlapping audio

        const utterance = new SpeechSynthesisUtterance(text);
        // Default to first available voice if selector isn't used
        const selector = document.getElementById('voice-selector');
        const voiceIndex = selector ? selector.value : 0;
        
        utterance.voice = this.availableVoices[voiceIndex] || null;
        utterance.rate = 0.9; // Professional, steady pace for NWT
        utterance.pitch = 1.0;

        this.synth.speak(utterance);
    },

    getPersonaConfig(persona) {
        const profiles = {
            'friendly': { pitch: 1.2, rate: 1.0 },
            'strict': { pitch: 0.8, rate: 0.85 },
            'futuristic': { pitch: 0.5, rate: 1.1 }
        };
        return profiles[persona] || profiles.friendly;
    }
};

// --- SIDEBAR UI LOGIC ---

// Toggle Sidebar & Start 5s Auto-hide
let sidebarTimer;
window.toggleSidebar = function() {
    const sidebar = document.querySelector('.sidebar');
    const isVisible = sidebar.classList.toggle('visible');
    
    if (isVisible) {
        resetSidebarTimer();
    }
};

function resetSidebarTimer() {
    clearTimeout(sidebarTimer);
    sidebarTimer = setTimeout(() => {
        document.querySelector('.sidebar').classList.remove('visible');
    }, 5000); // 5 seconds of inactivity
}

// Keep sidebar open if user is interacting with it
document.querySelector('.sidebar').addEventListener('click', resetSidebarTimer);
document.querySelector('.sidebar').addEventListener('input', resetSidebarTimer);

// Initialize everything on load
window.addEventListener('load', () => {
    VoiceCore.init();
});

// --- 28. NEURAL READER UTILITY ---
const NeuralReader = {
    readSelection: function() {
        const selectedText = window.getSelection().toString().trim();
        
        if (selectedText.length > 0) {
            // Use the VoiceCore we built earlier
            VoiceCore.speak(selectedText);
        } else {
            VoiceCore.speak("Please highlight the text you wish for me to analyze, Scholar.");
        }
    }
};

// --- 29. MOBILE GESTURE ENGINE (Swipe to Close) ---
let touchStartX = 0;
let touchEndX = 0;

document.addEventListener('touchstart', e => {
    touchStartX = e.changedTouches[0].screenX;
}, false);

document.addEventListener('touchend', e => {
    touchEndX = e.changedTouches[0].screenX;
    handleSwipe();
}, false);

function handleSwipe() {
    const sidebar = document.querySelector('.sidebar');
    const swipeThreshold = 100; // pixels
    
    // Swipe Left (Close Sidebar)
    if (touchStartX - touchEndX > swipeThreshold) {
        if (sidebar.classList.contains('visible')) {
            sidebar.classList.remove('visible');
        }
    }
    
    // Swipe Right (Open Sidebar - optional, restricted to edge)
    if (touchEndX - touchStartX > swipeThreshold && touchStartX < 50) {
        sidebar.classList.add('visible');
        resetSidebarTimer();
    }
}

// --- 30. CONTEXT MENU OVERRIDE (Optional) ---
// This adds a "Listen" button when text is right-clicked/long-pressed
document.addEventListener('contextmenu', (e) => {
    const selectedText = window.getSelection().toString();
    if (selectedText) {
        console.log("Neural Reader ready for selection.");
        // You could trigger a custom popup menu here
    }
});

// --- 31. NEURAL SUMMARIZER ENGINE ---
const NeuralSummarizer = {
    analyze: function() {
        const text = window.getSelection().toString().trim();
        const outputDiv = document.getElementById('summary-output');
        const list = document.getElementById('summary-list');

        if (text.length < 50) {
            VoiceCore.speak("The text sample is too brief for neural synthesis. Please provide more data.");
            return;
        }

        // 1. Logic: Split into sentences and find high-value targets
        const sentences = text.split(/[.!?]/);
        const keywords = text.match(/[A-Z]{2,}|[0-9]+|[\w-]{8,}/g) || [];
        
        // 2. Filter for unique insights
        const uniqueKeywords = [...new Set(keywords)].slice(0, 5);
        const keySentences = sentences
            .filter(s => s.length > 20)
            .sort((a, b) => b.length - a.length)
            .slice(0, 3);

        // 3. Render to UI
        list.innerHTML = "";
        
        // Add Keywords
        const kwLi = document.createElement('li');
        kwLi.innerHTML = `<strong>Core Terms:</strong> ${uniqueKeywords.join(', ')}`;
        list.appendChild(kwLi);

        // Add Insights
        keySentences.forEach(s => {
            const li = document.createElement('li');
            li.innerText = s.trim() + ".";
            list.appendChild(li);
        });

        outputDiv.style.display = 'block';
        VoiceCore.speak("Synthesis complete. I have extracted the primary data points for your review.");
    }
};
// --- 32. DIVINE WISDOM ENGINE ---
const WisdomCore = {
    scriptures: [
        "‘God is our refuge and strength, A help that is readily found in times of distress. That is why we will not fear, though the earth undergoes change, Though the mountains topple into the depths of the sea, Though its waters roar and foam over, Though the mountains rock on account of its turbulence.’ — Psalms 46:1-3",
        "‘For I am convinced that neither death nor life nor angels nor governments nor things now here nor things to come nor powers nor height nor depth nor any other creation will be able to separate us from God’s love that is in Christ Jesus our Lord.’ — Romans 8:38,39",
        "‘For he has said: “I will never leave you, and I will never abandon you.”’ — Hebrews 13:5",
        "‘From far away Jehovah appeared to me and said: “I have loved you with an everlasting love. That is why I have drawn you to me with loyal love.”’ — Jeremiah 31:3",
        "‘When anxieties overwhelmed me, you comforted and soothed me.’ — Psalms 94:19",
        "‘Praise Jehovah your God.’ — 1 Chronicles 29:20",
        "‘Jehovah is alive! Praised be my Rock! Let the God of my salvation be exalted.’ — Psalms 18:46",
        "‘Jehovah is patient with you because he does not desire anyone to be destroyed but desires all to attain to repentance.’ — 2 Peter 3:9",
        "‘You need endurance.’ — Hebrews 10:36",
        "‘The shrewd person acts with knowledge.’ — Proverbs 13:16",
        "‘Let your petitions be made known to God.’ — Philippians 4:6",
        "‘God loved us and sent his Son as a propitiatory sacrifice for our sins.’ — 1 John 4:10",
        "‘Look out for yourselves, so that you do not lose the things we have worked to produce, but that you may obtain a full reward.’ — 2 John 8",
        "‘In my distress I called on Jehovah, and my cry to him for help reached his ears.’ — Psalms 18:6",
        "‘Let no one lead you astray in any way.’ — 2 Thessalonians 2:3",
        "‘If anyone does commit a sin, we have a helper.’ — 1 John 2:1",
        "‘Let each one keep seeking, not his own advantage, but that of the other person.’ — 1 Corinthians 10:24",
        "‘Christ suffered for you, leaving a model for you to follow his steps closely.’ — 1 Peter 2:21",
        "‘Just as Jehovah freely forgave you, you must also do the same.’ — Colossians 3:13",
        "‘If you become discouraged in the day of distress, your strength will be meager.’ — Proverbs 24:10",
        "‘A true friend shows love at all times.’ — Proverbs 17:17",
        "‘To the extent we have made progress, let us go on walking orderly in this same course.’ — Philippians 3:16",
        "‘God is not unrighteous so as to forget your work and the love you showed for his name by ministering and continuing to minister to the holy ones.’ — Hebrews 6:10",
        "‘I have not seen anyone righteous abandoned.’ — Psalms 37:25",
        "‘Keep on asking, and it will be given you.’ — Luke 11:9",
        "‘Jehovah is on my side; I will not be afraid.’ — Psalms 118:6"
    ],

    launchDailyVerse() {
        const verse = this.scriptures[Math.floor(Math.random() * this.scriptures.length)];
        this.displayAndSpeak(verse, "Daily Insight");
    },

    search() {
        const query = document.getElementById('scripture-search')?.value.toLowerCase();
        const resultsDiv = document.getElementById('search-results');
        if (!query || query.length < 2) { resultsDiv.innerHTML = ""; return; }

        const matches = this.scriptures.filter(s => s.toLowerCase().includes(query));
        resultsDiv.innerHTML = matches.map(m => `
            <div class="nav-item-secondary" 
                 onclick="WisdomCore.displayResult('${m.replace(/'/g, "\\'")}')"
                 style="font-size: 0.75rem; border-bottom: 1px solid var(--glass); cursor: pointer; padding: 10px;">
                ${m.split('—')[1]} 
            </div>
        `).join('');
    },

    displayResult(text) {
        this.displayAndSpeak(text);
        document.querySelector('.sidebar')?.classList.remove('visible');
    },

    displayAndSpeak(text, label = "Scripture Found") {
        const responseBox = document.getElementById('ai-response');
        if (responseBox) {
            responseBox.innerHTML = `<div class="wisdom-toast"><strong>${label}:</strong><br>${text}</div>`;
        }
        VoiceCore.speak(text);
    },

    //When the AI starts "thinking," the title glows. When it finishes, the glow stops.
    const UIController = {
    setLoading: function(isLoading) {
        const title = document.getElementById('view-title');
        if (isLoading) {
            title.classList.add('processing-pulse');
        } else {
            title.classList.remove('processing-pulse');
        }
    }

};


// --- 33. SYSTEM INITIALIZATION ---
window.addEventListener('load', () => {
    const loaderBar = document.getElementById('init-loader-bar');
    const status = document.getElementById('splash-status');
    const initBtn = document.getElementById('init-btn');
    const loaderContainer = document.getElementById('loader-container');

    // 1. Simulate Asset Loading
    let progress = 0;
    const interval = setInterval(() => {
        progress += Math.random() * 15;
        if (progress >= 100) {
            progress = 100;
            clearInterval(interval);
            showInitButton();
        }
        loaderBar.style.width = progress + '%';
    }, 200);

    function showInitButton() {
        loaderContainer.style.display = 'none';
        status.innerText = "System Synchronized";
        initBtn.style.display = 'block';
    }

    // 2. The Unlock Interaction
    initBtn.addEventListener('click', () => {
        // Unlocks Web Speech API for Android
        VoiceCore.init(); 
    });
});

// --- 19. MASTER SYSTEM INITIALIZATION ---
document.addEventListener('DOMContentLoaded', async () => {
    // A. Start Database
    await NeuralDB.init();
    await teamEngine.init(); // Starts the Team Engine using IndexedDB data

    // B. Load User Profile from IndexedDB
    const vaultItems = await NeuralDB.getAll('vault');
    const profile = vaultItems.find(item => item.id === 'user_profile');
    
    if (profile) {
        state.student = profile;
        ForraNovaAI.syncUI();
    } else {
        // No profile found? Show the setup modal
        const modal = document.getElementById('setup-modal');
        if (modal) modal.style.display = 'flex';
    }

    // C. Initialize Sub-Systems
    initMasteryChart();
    VoiceCore.init(); // Unlocks speech
    renderVault();    // Shows stored files

    // D. Splash Screen Logic
    const initBtn = document.getElementById('init-btn');
    const splash = document.getElementById('splash-screen');
    const status = document.getElementById('splash-status');

    if (initBtn) {
        if(status) status.innerText = "Neural Matrix Synchronized.";
        initBtn.style.display = 'block';

        initBtn.addEventListener('click', () => {
            VoiceCore.speak(`System Active. Welcome, ${state.student.name}.`);
            if (splash) {
                splash.style.transition = 'opacity 0.8s ease';
                splash.style.opacity = '0';
                setTimeout(() => splash.style.display = 'none', 800);
            }
        });
    }
   
});

// Setup Modal Logic (Triggers if new user)
document.getElementById('finish-setup').addEventListener('click', async () => {
    const nameInput = document.getElementById('setup-name').value;
    if (nameInput) {
        state.student.name = nameInput;
        await ForraNovaAI.updatePersistence(); // Saves to IndexedDB
        document.getElementById('setup-modal').style.display = 'none';
        VoiceCore.speak("Identity Synced.");
    }
});

// --- 20. OFFLINE SERVICE WORKER ---
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.worker = navigator.serviceWorker.register('./sw.js')
            .then(() => console.log("Shield Active"))
            .catch(err => console.error("Shield Error", err));
    });


/*  // RANDOM QUESTION GENERATOR Based on What has been read on the Work Bench.
*  Neural Pattern Extractor.
*  This logic scans the IndexedDB for the text of the lessons the student has 
*  been reading and uses "Contextual Substitution" to create questions.
*  Connect the Workbench Memory to the Exam Engine.
*/
// --- AI EXAM GENERATOR (Dynamic Context Learning) ---
const AIGenerator = {
    async generateFullExam(subject) {
        const vaultData = await NeuralDB.getAll('vault');
        const context = vaultData
            .filter(item => item.type === 'lesson_note' && 
                   (item.subject?.toLowerCase() === subject.toLowerCase() || subject === "General"))
            .map(item => item.content).join(" ");

        if (context.length < 200) return null;

        const sentences = context.split(/[.!?]/).filter(s => s.trim().length > 40);

        return {
            // PHASE 1: Objective (Multiple Choice)
            objectives: sentences.slice(0, 10).map(s => {
                const words = s.trim().split(" ");
                const target = words[Math.floor(words.length / 2)];
                const options = [target, "Standard", "Process", "System"].sort(() => Math.random() - 0.5);
                return { q: s.replace(target, "_______"), options, a: options.indexOf(target) };
            }),
            // PHASE 2: Fill-In (Identification)
            fillIn: sentences.slice(10, 15).map(s => {
                const words = s.trim().split(" ");
                const target = words.find(w => w.length > 6) || words[0];
                return { q: s.replace(target, "_______"), a: target.toLowerCase().trim() };
            }),
            // PHASE 3: Theory (Essay)
            theory: sentences.slice(15, 17).map(s => {
                return { 
                    q: `In your own words, explain the following concept from your study notes: "${s.trim()}"`,
                    keywords: s.split(" ").filter(w => w.length > 5) 
                };
            })
        };
    }
};

const ObjectiveModule = {
    questions: [],
    render(container) {
        container.innerHTML = `<h2 class="glow-text">Phase 1: Objectives</h2>`;
        this.questions.forEach((item, i) => {
            container.innerHTML += `
                <div class="q-block animate-in">
                    <p><strong>Q${i+1}:</strong> ${item.q}</p>
                    <div class="options-grid">
                        ${item.options.map((opt, oi) => `
                            <label><input type="radio" name="obj${i}" value="${oi}"> ${opt}</label>
                        `).join('')}
                    </div>
                </div>`;
        });
    },
    calculateScore() {
        let score = 0;
        this.questions.forEach((item, i) => {
            const sel = document.querySelector(`input[name="obj${i}"]:checked`);
            if (sel && parseInt(sel.value) === item.a) score++;
        });
        return (score / this.questions.length) * 100;
    },
    getDetailedLog() {
        return this.questions.map((item, i) => {
            const sel = document.querySelector(`input[name="obj${i}"]:checked`);
            return {
                question: item.q,
                studentAnswer: sel ? item.options[sel.value] : "No Answer",
                isCorrect: sel && parseInt(sel.value) === item.a
            };
        });
    }
};

const FillInModule = {
    questions: [],
    render(container) {
        container.innerHTML = `<h2 class="glow-text">Phase 2: Identification</h2>`;
        this.questions.forEach((item, i) => {
            container.innerHTML += `
                <div class="q-block animate-in">
                    <p><strong>Q${i+1}:</strong> ${item.q}</p>
                    <input type="text" id="fill${i}" class="neural-input" placeholder="Type answer here...">
                </div>`;
        });
    },
    calculateScore() {
        let score = 0;
        this.questions.forEach((item, i) => {
            const val = document.getElementById(`fill${i}`).value.toLowerCase().trim();
            if (val === item.a) score++;
        });
        return (score / this.questions.length) * 100;
    }
};

const TheoryModule = {
    questions: [],
    render(container) {
        container.innerHTML = `<h2 class="glow-text">Phase 3: Essay & Theory</h2>`;
        this.questions.forEach((item, i) => {
            container.innerHTML += `
                <div class="q-block animate-in">
                    <p><strong>Prompt:</strong> ${item.q}</p>
                    <textarea id="theory${i}" class="neural-textarea" rows="6" placeholder="Begin writing..."></textarea>
                </div>`;
        });
    },
    calculateScore() {
        let total = 0;
        this.questions.forEach((item, i) => {
            const ans = document.getElementById(`theory${i}`).value.toLowerCase();
            let matches = 0;
            item.keywords.forEach(word => { if(ans.includes(word.toLowerCase())) matches++; });
            total += (matches / item.keywords.length);
        });
        return (total / this.questions.length) * 100;
    }
};

/*   // The Exam Logic
* This engine manages the state of the exam, the 50-minute countdown, and the "Phase Transitions."
* The Consolidated Master Exam Engine
* Place the ObjectiveModule, FillInModule, and TheoryModule objects above this code in your script.
*/

cconst ExamEngine = {
    currentPhase: 0,
    examData: { objectives: [], fillIn: [], theory: [] },
    scores: { p1: 0, p2: 0, p3: 0 },

    init: async function(subject) {
        const data = await AIGenerator.generateFullExam(subject);
        if(!data) return alert("You nead to raed and study properly to prepare for your exams. At this time, you have less lesson data for a final exam. Please read more notes on your WORKBENCH first.");

        this.examData = data;
        this.currentPhase = 0;
        document.getElementById('exam-overlay').style.display = 'flex';
        this.startNextPhase();
    },

    // 2. TIMER LOGIC
    startTimer: function() {
        if (this.timer) clearInterval(this.timer);
        this.timer = setInterval(() => {
            this.timeLeft--;
            let mins = Math.floor(this.timeLeft / 60);
            let secs = this.timeLeft % 60;
            document.getElementById('exam-timer').innerText = `Time Left: ${mins}:${secs < 10 ? '0' : ''}${secs}`;
            
            if (this.timeLeft <= 0) {
                clearInterval(this.timer);
                this.autoSubmitFinal();
            }
        }, 1000);
    },

     showPhaseBreak: function(title, subtitle) {
        const content = document.getElementById('exam-content');
        content.innerHTML = `
            <div class="phase-break animate-in" style="text-align:center; padding:50px;">
                <h1 class="glow-text" style="font-size:2.5rem;">${title}</h1>
                <hr style="width:50%; margin: 20px auto; border-color: var(--primary-glow);">
                <p style="letter-spacing:2px;">${subtitle}</p>
                <div class="neural-spinner"></div>
            </div>`;
        VoiceCore.speak(`System initialized. Next Phase Loaded. Proceeding to examin you based on your previous study history on: ${title}. Subtitle: ${subtitle}. Wishing you success!`);
    },


    // . PHASE NAVIGATION
    startNextPhase: function() {
        this.currentPhase++;
        const content = document.getElementById('exam-content');
        
        // Hide "Submit" button during transitions
        document.getElementById('submit-exam-btn').style.display = 'none';

        if (this.currentPhase === 1) {
            this.showPhaseBreak("PHASE 1", "Objective Analysis");
            setTimeout(() => {
                this.renderObjectives(content);
                document.getElementById('submit-exam-btn').style.display = 'block';
            }, 3000);
        } else if (this.currentPhase === 2) {
            this.showPhaseBreak("PHASE 2", "Term Identification");
            setTimeout(() => {
                this.renderFillIn(content);
                document.getElementById('submit-exam-btn').style.display = 'block';
            }, 3000);
        } else if (this.currentPhase === 3) {
            this.showPhaseBreak("PHASE 3", "Theoretical Reasoning");
            setTimeout(() => {
                this.renderTheory(content);
                document.getElementById('submit-exam-btn').style.display = 'block';
            }, 3000);
        } else {
            this.finishExam();
        }
    },
    
    // --- RENDERERS ---
    renderObjectives(container) {
        container.innerHTML = `<h3>Select the correct options:</h3>`;
        this.examData.objectives.forEach((item, i) => {
            container.innerHTML += `<div class="q-block">
                <p>${i+1}. ${item.q}</p>
                ${item.options.map((opt, oi) => `<label><input type="radio" name="obj${i}" value="${oi}"> ${opt}</label>`).join('')}
            </div>`;
        });
    },

    renderFillIn(container) {
        container.innerHTML = `<h3>Type the missing identification terms:</h3>`;
        this.examData.fillIn.forEach((item, i) => {
            container.innerHTML += `<div class="q-block">
                <p>${i+1}. ${item.q}</p>
                <input type="text" id="fill${i}" class="neural-input" autocomplete="off">
            </div>`;
        });
    },

    renderTheory(container) {
        container.innerHTML = `<h3>Extended Response:</h3>`;
        this.examData.theory.forEach((item, i) => {
            container.innerHTML += `<div class="q-block">
                <p>${item.q}</p>
                <textarea id="theory${i}" class="neural-textarea" rows="5"></textarea>
            </div>`;
        });
    },

    submitCurrentPhase: function() {
        // 1. Calculate and store scores for the phase just completed
        if (this.currentPhase === 1) {
            this.scores.p1 = ObjectiveModule.calculateScore();
            // Optional: Save logs if you want detailed PDF reports later
            this.logs.phase1 = ObjectiveModule.getDetailedLog(); 
        } 
        else if (this.currentPhase === 2) {
            this.scores.p2 = FillInModule.calculateScore();
        } 
        else if (this.currentPhase === 3) {
            this.scores.p3 = TheoryModule.calculateScore();
        }

        // 2. Check if we just finished the final phase (Phase 3)
        if (this.currentPhase >= 3) {
            this.finishExam();
        } else {
            // Otherwise, proceed to the next phase transition
            this.startNextPhase();
        }
    }
};
    

    //  The Search & Report Logic
    const ExamReports = {
        // 1. Find a result in IndexedDB
        search: async function(query) {
            const dbRequest = indexedDB.open("ForraNovaDB", 1);
            dbRequest.onsuccess = (e) => {
                const db = e.target.result;
                const tx = db.transaction("exam_results", "readonly");
                const store = tx.objectStore("exam_results");
                const request = store.openCursor();
                
                let resultsFound = [];

                request.onsuccess = (event) => {
                    const cursor = event.target.result;
                    if (cursor) {
                        const data = cursor.value;
                        // Search by Subject or Level
                        if (data.subject.toLowerCase().includes(query.toLowerCase()) || 
                            data.level.toLowerCase().includes(query.toLowerCase())) {
                            resultsFound.push(data);
                        }
                        cursor.continue();
                    } else {
                        this.displaySearchResults(resultsFound);
                    }
                };
            };

            const resultsHTML = resultsFound.map(res => `
                <div class="search-result-item">
                    <span>${res.subject} - ${res.score}%</span>
                    <button onclick='ReportEngine.generate("EXAM", ${JSON.stringify(res)})'>
                        📄 Export PDF
                    </button>
                </div>
            `).join('');

        },


        // The "View Report" JS Logic
        // This builds a visual table that shows exactly where the student went wrong.

        const ExamReports = {
            renderDetailedReport: function(examData) {
                let reportHTML = `
                    <div class="report-overlay">
                        <h2>Exam Performance Report: ${examData.subject}</h2>
                        <table class="report-table">
                            <thead>
                                <tr>
                                    <th>Question</th>
                                    <th>Your Answer</th>
                                    <th>Correct Answer</th>
                                    <th>Result</th>
                                </tr>
                            </thead>
                            <tbody>
                `;

                // Loop through Phase 1 results
                examData.fullLog.phase1.forEach(item => {
                    reportHTML += `
                        <tr class="${item.isCorrect ? 'row-correct' : 'row-wrong'}">
                            <td>${item.question}</td>
                            <td>${item.studentAnswer}</td>
                            <td>${item.correctAnswer}</td>
                            <td>${item.isCorrect ? '✅' : '❌'}</td>
                        </tr>
                    `;
                });

                reportHTML += `</tbody></table>
                    <button onclick="window.print()">Print Report</button>
                    <button onclick="this.parentElement.remove()">Close</button>
                </div>`;

                document.body.insertAdjacentHTML('beforeend', reportHTML);
            }
        };

        // . Generate the PDF-friendly Transcript
        printExamTranscript: function(examId) {
            // Fetch the specific exam by ID from IDB
            // Then open a new window formatted for printing
            const printWindow = window.open('', '_blank');
            
            // This is a simplified version of the HTML for the printout
            let html = `
                <html>
                <head>
                    <title>Exam Transcript - ForraNova Academy</title>
                    <style>
                        body { font-family: 'Courier New', monospace; padding: 40px; color: #1a0033; }
                        .header { border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 20px; }
                        .score-box { background: #f0f0f0; padding: 15px; border: 1px solid #000; }
                        .correct { color: green; } .wrong { color: red; }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <h1>OFFICIAL EXAM TRANSCRIPT</h1>
                        <p>ForraNova Neural Hub | Session: 2026</p>
                    </div>
                    <div class="score-box">
                        <h2>Total Score: ${this.lastFoundScore}/100</h2>
                        <p>Subject: Biology | Level: SS 3</p>
                    </div>
                    <hr>
                    <p>Detailed answer analysis would be listed here...</p>
                    <script>window.onload = function() { window.print(); }</script>
                </body>
                </html>
            `;
            
            printWindow.document.write(html);
            printWindow.document.close();
        }
    };
/** 
 * UNIFIED NEURAL REPORT ENGINE ---
 * Pulls from NeuralDB and State to create a professional PDF
 * The Neural Report Logic (Updated for IndexedDB)
 * This function pulls the "Neural Profile" from your vault store before generating the PDF.
 * 
 **/
const ReportEngine = {
    /**
     * @param {string} type - 'EXAM', 'QUIZ', or 'BRAIN_SCAN'
     * @param {Object} data - The raw data from IndexedDB
     */
    async generate(type, data) {
        const printWindow = window.open('', '_blank');
        const timestamp = new Date().toLocaleString();
        
        let reportTitle = type === 'EXAM' ? "OFFICIAL ACADEMIC TRANSCRIPT" : "NEURAL PERFORMANCE ANALYSIS";
        
        let contentHtml = "";

        // Logic to build the table based on the type of data
        if (type === 'EXAM' || type === 'QUIZ') {
            contentHtml = `
                <div class="score-banner">
                    <h2>Total Score: ${data.score}%</h2>
                    <p>Subject: ${data.subject} | Level: ${data.level || 'Standard'}</p>
                </div>
                <table class="report-table">
                    <thead>
                        <tr>
                            <th>Requirement/Question</th>
                            <th>Student Input</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${this.buildTableRows(data)}
                    </tbody>
                </table>
            `;
        }

        const fullTemplate = `
            <html>
            <head>
                <title>ForraNova Report - ${data.subject}</title>
                <style>
                    body { font-family: 'Courier New', monospace; padding: 40px; background: #fff; color: #000; }
                    .header { border-bottom: 3px double #000; text-align: center; margin-bottom: 30px; }
                    .score-banner { background: #f0f0f0; border: 1px solid #000; padding: 20px; margin-bottom: 20px; text-align: center; }
                    .report-table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                    .report-table th, .report-table td { border: 1px solid #000; padding: 10px; text-align: left; }
                    .footer { margin-top: 50px; font-size: 0.8rem; border-top: 1px solid #ccc; padding-top: 10px; }
                    @media print { .no-print { display: none; } }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>FORRANOVA NEURAL ACADEMY</h1>
                    <p>Verified Secure Record | ID: ${data.id}</p>
                    <p>Date: ${timestamp}</p>
                </div>
                ${contentHtml}
                <div class="footer">
                    <p>This document is a certified digital output of the ForraNova Neural Engine.</p>
                </div>
                <button class="no-print" onclick="window.print()">Confirm & Print to PDF</button>
            </body>
            </html>
        `;

        printWindow.document.write(fullTemplate);
        printWindow.document.close();
    },

    buildTableRows(data) {
        // If the data has a detailed log, use it. Otherwise, use summary.
        if (data.fullLog && data.fullLog.phase1) {
            return data.fullLog.phase1.map(item => `
                <tr>
                    <td>${item.question}</td>
                    <td>${item.studentAnswer}</td>
                    <td>${item.isCorrect ? 'PASSED' : 'FAILED (Target: ' + item.correctAnswer + ')'}</td>
                </tr>
            `).join('');
        }
        return `<tr><td colspan="3">Detailed logs archived. Overall Score: ${data.score}%</td></tr>`;
    }
};

    // 7. FINALIZATION & INDEXEDDB STORAGE
    // This function performs the weighted calculation: 20% Objectives + 20% Fill-in + 40% Theory + 20% Quiz Performance.

finishExam: async function() {
    clearInterval(this.timer);
    
    // 1. Collect Scores
    const objScore = this.scores.p1; // Already /100
    const fillScore = this.scores.p2; // Already /100
    const theoryScore = this.scores.p3; // Already /100
    
    // 2. Fetch Quiz-Me Performance from State (The 20% weight)
    // We assume your 'NeuralQuiz' saves its last score to state.student.quizMastery
    const quizScore = state.student.quizMastery || 0; 

    // 3. Weighted Calculation
    const finalGrade = (
        (objScore * 0.20) + 
        (fillScore * 0.20) + 
        (theoryScore * 0.40) + 
        (quizScore * 0.20)
    ).toFixed(2);

    // 4. Update the Database & State
    state.student.masteryPoints += Math.round(finalGrade);
    const examResult = {
        id: `EXAM-${Date.now()}`,
        type: 'exam_record',
        subject: this.examData.subject || "General",
        score: finalGrade,
        timestamp: new Date().toISOString(),
        fullLog: this.logs
    };
    await NeuralDB.save('vault', examResult);

    // 5. Display Final Results
    const content = document.getElementById('exam-content');
    content.innerHTML = `
        <div class="results-screen animate-in" style="text-align:center;">
            <h1 class="glow-text">Examination Complete</h1>
            <div class="score-circle" style="font-size: 3rem; margin: 20px;">${finalGrade}%</div>
            <p>Academic Standing: ${this.getStanding(finalGrade)}</p>
            
            <div class="breakdown-grid" style="display:grid; grid-template-columns: 1fr 1fr; gap:10px; margin: 20px 0;">
                <div class="p-stat">Obj (20%): <strong>${(objScore * 0.2).toFixed(1)}</strong></div>
                <div class="p-stat">Fill (20%): <strong>${(fillScore * 0.2).toFixed(1)}</strong></div>
                <div class="p-stat">Theory (40%): <strong>${(theoryScore * 0.4).toFixed(1)}</strong></div>
                <div class="p-stat">Quiz (20%): <strong>${(quizScore * 0.2).toFixed(1)}</strong></div>
            </div>

            <button class="action-btn" onclick="CertificateEngine.render('${finalGrade}')">
                <i class="fas fa-certificate"></i> Claim Certificate
            </button>
            <button class="action-btn" onclick="ExamEngine.quit()">Return to Hub</button>
        </div>
    `;

    VoiceCore.speak(`Examination complete. Your final neural grade is ${finalGrade} percent. Your performance standing is ${this.getStanding(finalGrade)}.`);
},

getStanding: function(score) {
    if (score >= 90) return "Distinction (Alpha)";
    if (score >= 70) return "Excellence (Beta)";
    if (score >= 50) return "Competent (Gamma)";
    return "Requires Sync (Delta)";
}



//---- ----- Certificate Engine (IndexedDB Compatible)
// Ensures the data is fully loaded from the IndexedDB before the certificate is displayed.

const CertificateEngine = {
    // 1. Fetch Data from IndexedDB (Asynchronous)
    getStudentData: function() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open("ForraNovaDB", 1);
            request.onsuccess = (event) => {
                const db = event.target.result;
                const transaction = db.transaction(["user_state"], "readonly");
                const store = transaction.objectStore("user_state");
                const getRequest = store.get("current_student");
                
                getRequest.onsuccess = () => resolve(getRequest.result);
                getRequest.onerror = () => reject("Data fetch failed");
            };
        });
    },

    // 2. Generate the Certificate after Exam Success
    renderFinal: async function(examScore) {
        try {
            const student = await this.getStudentData();
            
            // Only allow if score is 70% or higher
            if (examScore < 70) {
                VoiceCore.speak("Academic threshold not met. Score required: 70%. Your score: " + examScore + "%");
                return;
            }

            const certSection = document.getElementById('certificate-template');
            certSection.style.display = 'block';

            // Map data to your HTML
            document.getElementById('cert-student-name').innerText = student.name || "Scholar";
            document.getElementById('cert-subject-name').innerText = "NEURAL AI TERMINUS";
            document.getElementById('cert-level-name').innerText = `GRADUATE LEVEL ${student.level}`;
            
            const today = new Date();
            document.getElementById('cert-date').innerText = today.toLocaleDateString('en-US', { 
                year: 'numeric', month: 'long', day: 'numeric' 
            });

            const uniqueID = `FN-${Date.now()}-${student.level}X`;
            document.getElementById('cert-id').innerText = uniqueID;

            VoiceCore.speak("Final examination verified. Certificate of Excellence granted.");
            
        } catch (error) {
            console.error("Certificate Error:", error);
        }
    }
};

//🎓 End-of-Term Exam Logic
// "Exam Controller" structure. Handle the quiz, calculate the score, and then trigger the CertificateEngine.
const FinalExamController = {
    examQuestions: [
        { q: "What is the core of the ForraNova Engine?", a: "Neural Matrix" },
        { q: "Which protocol handles offline data?", a: "Service Worker" }
        // Add more questions here
    ],

    startExam: function() {
        VoiceCore.speak("End of term examination initiated. Proceed with extreme focus.");
        // Logic to show questions one by one...
    },

    processResults: function(correctAnswers) {
        const total = this.examQuestions.length;
        const scorePercentage = (correctAnswers / total) * 100;

        if (scorePercentage >= 70) {
            // Success: Trigger Certificate
            CertificateEngine.renderFinal(scorePercentage);
        } else {
            // Failure: Encouragement
            VoiceCore.speak("Oh dear, you tried. However, You really need to do more. Focus to studies is required. Review the Academy modules and retry the Term Exam again.");
        }
    }
};


// 📊 3. Grading & PDF Reporting
// Once the student finishes Phase 3, it calculates the total score and save the full transcript to IndexedDB.
const ResultManager = {
    calculateTotal: function(phaseScores) {
        const total = phaseScores.phase1 + phaseScores.phase2 + phaseScores.phase3 + ExamEngine.quizBonus;
        
        // Save to IndexedDB
        this.saveToDB(total, phaseScores);

        if (total >= 70) {
            CertificateEngine.renderFinal(total);
        } else {
            VoiceCore.speak("You scored: " + total + ". However, you would need to have a Minimum of 70 marks to qualify for certification.");
        }
    },

    saveToDB: function(total, details) {
        const dbRequest = indexedDB.open("ForraNovaDB", 1);
        dbRequest.onsuccess = (e) => {
            const db = e.target.result;
            const tx = db.transaction("exam_results", "readwrite");
            tx.objectStore("exam_results").add({
                studentName: state.student.name,
                subject: "Biology",
                score: total,
                details: details, // Stores every question and student answer
                date: new Date().toISOString()
            });
        };
    },

    printResult: function() {
        // Logic to generate a printable window with the full exam transcript
        const printWindow = window.open('', '_blank');
        printWindow.document.write('<h1>Exam Transcript</h1>' + document.getElementById('exam-content').innerHTML);
        printWindow.print();
    }
};

// Certificate Logic and Engine - 
// Handle the IndexedDB asynchrony and the End-of-Term score requirement.

const CertificateEngine = {
    // 1. Fetch current exam results and student info from IndexedDB
    async generateFinal() {
        const dbRequest = indexedDB.open("ForraNovaDB", 1);
        
        dbRequest.onsuccess = async (e) => {
            const db = e.target.result;
            const tx = db.transaction(["user_state", "exam_results"], "readonly");
            
            // Get student info
            const student = await this.getData(tx.objectStore("user_state"), "current_student");
            
            // Get latest exam result
            const results = await this.getLatestExam(tx.objectStore("exam_results"));

            if (!results || results.score < 70) {
                VoiceCore.speak("Certification Locked. Final Exam score must be 70 or higher.");
                return;
            }

            this.show(student, results);
        };
    },

    // Helper to wrap IDB in Promises
    getData: (store, key) => new Promise(res => {
        const req = store.get(key);
        req.onsuccess = () => res(req.result);
    }),

    // Helper to find the most recent exam
    getLatestExam: (store) => new Promise(res => {
        const req = store.openCursor(null, 'prev');
        req.onsuccess = (e) => res(e.target.result ? e.target.result.value : null);
    }),

    // 2. Inject data into the overlay
    show(student, exam) {
        document.getElementById('cert-student-name').innerText = student.name;
        document.getElementById('cert-subject-name').innerText = exam.subject.toUpperCase();
        document.getElementById('cert-level-name').innerText = exam.level;
        document.getElementById('cert-date').innerText = new Date().toLocaleDateString('en-US', {
            year: 'numeric', month: 'long', day: 'numeric'
        });
        document.getElementById('cert-id').innerText = exam.id || `FN-${Date.now().toString().slice(-6)}`;

        document.getElementById('certificate-template').style.display = 'flex';
        VoiceCore.speak("Official Certification Loaded. Congratulations, " + student.name);
    },

    print() {
        window.print();
    }
};


 // --- NEURAL TEAM ENGINE (IndexedDB Migrated) ---
const teamEngine = {
    // 1. Initial Load from NeuralDB
    async init() {
        const teams = await NeuralDB.getAll('vault');
        const teamData = teams.find(item => item.id === 'forranova_team');
        
        if (teamData) {
            console.log("Neural Team Data Synced.");
            this.applyTeamSettings(teamData);
        }
    },

    // 2. Save Team Preferences to Vault
    async saveTeam(preferences) {
        const data = {
            id: 'forranova_team',
            updatedAt: new Date().toISOString(),
            ...preferences
        };
        
        await NeuralDB.save('vault', data);
        VoiceCore.speak("Team preferences secured in the neural vault.");
        this.applyTeamSettings(data);
    },

    // 3. Apply settings to the UI
    applyTeamSettings(data) {
        // Logic to update your specific team UI elements
        const teamStatus = document.getElementById('team-sync-status');
        if (teamStatus) teamStatus.innerText = "Team: Synchronized";
        
        // Example: If you have a theme color stored for the team
        if (data.themeColor) {
            document.documentElement.style.setProperty('--primary-glow', data.themeColor);
        }
    }
};

// Auto-initialize the Team Engine when the database is ready
// await teamEngine.init();
}


