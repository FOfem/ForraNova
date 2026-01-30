import { pipeline, env } from 'https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.1';

/**
 * 1. GLOBAL NEURAL CONFIGURATION
 * Optimized for Android/Mobile and bypassing 401 security filters
 */
env.allowLocalModels = false;
env.useBrowserCache = true;
env.remoteHost = 'https://huggingface.co';
env.remotePathComponent = 'models';

const state = {
    teacher: null,
    personality: 'professional',
    mastery: { Science: 20, Math: 10, History: 5, Art: 15, Tech: 25 },
    voices: [],
    selectedVoice: null,
    isAudioUnlocked: false,
    studentLevel: 1,
    studentXP: 4200
};

/**
 * 2. INITIALIZATION ENGINE
 * Orchestrates the loading sequence and Splash Screen removal
 */
async function init() {
    console.log("ForraNova Master Engine: Initializing...");
    
    const splashStatus = document.getElementById('splash-status');
    const splash = document.getElementById('splash-screen');
    
    if (!splashStatus) return;

    // Initialize UI Components
    setupCharts();
    setupVoices();
    setupEventListeners();
    updateStudentUI();

    try {
        // Pipeline with the 401 'Credentials Omit' fix
        state.teacher = await pipeline('text2text-generation', 'Xenova/LaMini-Flan-T5-78M', {
            fetch_kwargs: { 
                credentials: 'omit',
                mode: 'cors' 
            }, 
            progress_callback: (d) => {
                if (d.status === 'progress') {
                    splashStatus.innerText = `Neural Sync: ${Math.round(d.progress)}%`;
                }
                if (d.status === 'ready') {
                    splashStatus.innerText = "System Synced";
                    setTimeout(() => launchApp(splash), 800);
                }
            }
        });
    } catch (e) {
        console.error("Critical Sync Error:", e);
        splashStatus.innerText = "Sync Blocked. Tap to Retry.";
        splashStatus.style.color = "#ef4444";
        splashStatus.onclick = () => location.reload();
    }
}

function launchApp(splash) {
    if (splash) splash.classList.add('splash-hidden');
    playNeuralChime();
    
    const engineDot = document.getElementById('engine-dot');
    const statusText = document.getElementById('status-text');
    
    if (engineDot) engineDot.style.background = '#10b981';
    if (statusText) statusText.innerText = "Neural Engine Active";
    
    // Initial greeting
    setTimeout(() => {
        const welcome = "Welcome back, Scholar. All neural systems are active. What shall we learn today?";
        appendMessage('Tutor', welcome, 'bot-msg');
        speak(welcome);
    }, 1000);
}

/**
 * 3. MULTIMODAL VOICE ENGINE
 * Featuring 'Ursa/Gemini' preferred voice mapping
 */
function setupVoices() {
    const synth = window.speechSynthesis;
    
    const loadVoices = () => {
        state.voices = synth.getVoices();
        
        // Strategy: Seek Neural/Google voices for premium 'Ursa' feel
        const preferred = state.voices.find(v => 
            v.name.includes('Google US English') || 
            v.name.includes('en-us-x-sfg#female') || 
            v.name.includes('Samantha')
        );
        
        state.selectedVoice = preferred || state.voices[0];
        console.log("Neural Voice Selected:", state.selectedVoice?.name);
    };

    if (synth.onvoiceschanged !== undefined) synth.onvoiceschanged = loadVoices;
    loadVoices();
}

function speak(text) {
    if (!state.selectedVoice) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.voice = state.selectedVoice;
    utterance.rate = 1.0;
    utterance.pitch = 1.0; // Clean, professional pitch
    window.speechSynthesis.speak(utterance);
}

function playNeuralChime() {
    try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, audioCtx.currentTime); 
        osc.frequency.exponentialRampToValueAtTime(440, audioCtx.currentTime + 0.5);

        gain.gain.setValueAtTime(0, audioCtx.currentTime);
        gain.gain.linearRampToValueAtTime(0.2, audioCtx.currentTime + 0.1);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.8);

        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 1);
    } catch (err) { console.log("Audio deferred."); }
}

/**
 * 4. AI CORE LOGIC & ADAPTIVE PERSONA
 */
async function processQuery() {
    const inputField = document.getElementById('user-input');
    const text = inputField.value.trim();
    const statusText = document.getElementById('status-text');

    if (!text || !state.teacher) return;

    appendMessage('Scholar', text, 'user-msg');
    inputField.value = '';
    if (statusText) statusText.innerText = "AI Analyzing...";

    const persona = document.getElementById('tutor-personality')?.value || 'professional';
    
    // Cognitive Prompt Injection based on Persona
    const prompt = `Instruction: Act as a ${persona} mentor. User Query: ${text}. Response:`;

    try {
        const output = await state.teacher(prompt, { 
            max_new_tokens: 256, 
            temperature: 0.7,
            repetition_penalty: 1.1 
        });
        
        const response = output[0].generated_text;
        
        appendMessage('Tutor', response, 'bot-msg');
        speak(response);
        updateMastery(text);
        grantXP(15);
        if (statusText) statusText.innerText = "Neural Ready";
    } catch (err) {
        appendMessage('System', "Neural interference detected. Please re-sync.", 'bot-msg');
    }
}

/**
 * 5. STUDENT INTELLIGENCE & ANALYTICS
 */
let masteryChart;
function setupCharts() {
    const chartEl = document.getElementById('masteryChart');
    if (!chartEl) return;

    const ctx = chartEl.getContext('2d');
    masteryChart = new Chart(ctx, {
        type: 'radar',
        data: {
            labels: Object.keys(state.mastery),
            datasets: [{
                data: Object.values(state.mastery),
                backgroundColor: 'rgba(79, 70, 229, 0.2)',
                borderColor: '#4f46e5',
                borderWidth: 2,
                pointBackgroundColor: '#4f46e5'
            }]
        },
        options: {
            scales: { r: { grid: { color: '#334155' }, angleLines: { color: '#334155' }, ticks: { display: false }, pointLabels: { color: '#94a3b8', font: { size: 10 } } } },
            plugins: { legend: { display: false } }
        }
    });
}

function updateMastery(text) {
    if (!masteryChart) return;
    const input = text.toLowerCase();
    let updated = false;
    for (let key in state.mastery) {
        if (input.includes(key.toLowerCase())) {
            state.mastery[key] = Math.min(100, state.mastery[key] + 5);
            updated = true;
        }
    }
    if (updated) {
        masteryChart.data.datasets[0].data = Object.values(state.mastery);
        masteryChart.update();
    }
}

function grantXP(amount) {
    state.studentXP += amount;
    if (state.studentXP >= 5000) {
        state.studentLevel++;
        state.studentXP = 0;
    }
    updateStudentUI();
}

function updateStudentUI() {
    const xpFill = document.querySelector('.xp-fill');
    const levelText = document.querySelector('.profile-info p');
    if (xpFill) xpFill.style.width = `${(state.studentXP / 5000) * 100}%`;
    if (levelText) levelText.innerText = `Adaptive Level ${state.studentLevel}`;
}

/**
 * 6. UI UTILITIES & EVENT BRIDGE
 */
function appendMessage(sender, text, className) {
    const chatLog = document.getElementById('chat-history');
    const msg = document.createElement('div');
    msg.className = `message ${className}`;
    msg.innerHTML = `<small>${sender}</small><div>${text}</div>`;
    chatLog.appendChild(msg);
    chatLog.scrollTop = chatLog.scrollHeight;
}

function setupEventListeners() {
    const sendBtn = document.getElementById('send-btn');
    const themeBtn = document.getElementById('theme-toggle');
    const inputField = document.getElementById('user-input');

    if (sendBtn) sendBtn.addEventListener('click', processQuery);
    if (inputField) inputField.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') processQuery();
    });
    
    if (themeBtn) themeBtn.addEventListener('click', () => {
        const current = document.documentElement.getAttribute('data-theme');
        const next = current === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', next);
    });

    // Android/Mobile Audio Unlock
    document.addEventListener('click', () => {
        if (!state.isAudioUnlocked) {
            const context = new (window.AudioContext || window.webkitAudioContext)();
            if (context.state === 'suspended') context.resume();
            state.isAudioUnlocked = true;
            console.log("Neural Audio Unlocked");
        }
    }, { once: true });
}

// Start Neural Sync
init();