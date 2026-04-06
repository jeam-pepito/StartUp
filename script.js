
/* ==== AUDIO ENGINE (BELL SYNTH) ==== */
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function playBell(isWorkPhase = true) {
    const now = audioCtx.currentTime;
    const rootFreq = isWorkPhase ? 880 : 440; 
    const harmonics = [1, 2, 3, 4.2]; 
    harmonics.forEach((m, i) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(rootFreq * m, now);
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.1 / (i + 1), now + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.5);
        osc.connect(gain); gain.connect(audioCtx.destination);
        osc.start(now); osc.stop(now + 1.5);
    });
}

function triggerFlash() {
    const flash = document.getElementById('flashOverlay');
    flash.classList.remove('flash-active');
    void flash.offsetWidth; 
    flash.classList.add('flash-active');
}

/* ==== NAVIGATION ==== */
document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
        btn.classList.add('active');
        document.getElementById(btn.getAttribute('data-target')).classList.add('active');
    });
});

/* ==== INTERVAL TIMER (START UP) ==== */
let workTime, restTime, repeatCount, currentStage = "Work", countdown;
let timeLeft, totalTime, paused = false, timerRunning = false, cyclesCompleted = 0;
const mainBtn = document.getElementById("mainButton");

function runStage() {
    let stageTime = (currentStage === "Work") ? getSecs("workInput", "workUnit") : getSecs("restInput", "restUnit");
    document.getElementById("stage").textContent = currentStage;
    playBell(currentStage === "Work");
    triggerFlash();
    timeLeft = stageTime; totalTime = stageTime;
    const bar = document.getElementById("progressBar");
    bar.className = "progress-bar " + (currentStage === "Work" ? "work" : "rest");

    clearInterval(countdown);
    let last = Date.now();
    countdown = setInterval(() => {
        if (!paused) {
            timeLeft -= (Date.now() - last) / 1000;
            last = Date.now();
            if (timeLeft <= 0) {
                timeLeft = 0; clearInterval(countdown);
                if (currentStage === "Work") { currentStage = "Rest"; runStage(); }
                else {
                    cyclesCompleted++;
                    if (cyclesCompleted < repeatCount) { currentStage = "Work"; runStage(); }
                    else { finishSession(); }
                }
            }
            updateIntervalUI();
        } else { last = Date.now(); }
    }, 50);
}

function finishSession() {
    timerRunning = false; document.getElementById("stage").textContent = "Done!";
    document.getElementById("dot-interval").classList.remove('active');
    mainBtn.textContent = "Start"; playBell(true);
}

function updateIntervalUI() {
    let s = Math.ceil(timeLeft);
    let h = Math.floor(s / 3600);
    let m = Math.floor((s % 3600) / 60);
    let sec = s % 60;
    document.getElementById("timer").textContent = ${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')};
    document.getElementById("progressBar").style.width = ((totalTime - timeLeft) / totalTime * 100) + "%";
    document.getElementById("cycleCounter").textContent = Cycle ${cyclesCompleted} of ${repeatCount};
}

function getSecs(id, unitId) {
    let val = parseInt(document.getElementById(id).value) || 0;
    return document.getElementById(unitId).value === "minutes" ? val * 60 : val;
}

mainBtn.addEventListener("click", () => {
    if (!timerRunning) {
        repeatCount = parseInt(document.getElementById("repeatInput").value) || 1;
        cyclesCompleted = 0; currentStage = "Work"; timerRunning = true; paused = false;
        mainBtn.textContent = "Pause"; document.getElementById("dot-interval").classList.add('active');
        runStage();
    } else { paused = !paused; mainBtn.textContent = paused ? "Resume" : "Pause"; }
});

document.getElementById("resetButton").addEventListener("click", () => {
    clearInterval(countdown); timerRunning = false;
    document.getElementById("dot-interval").classList.remove('active');
    document.getElementById("timer").textContent = "00:00:00";
    document.getElementById("stage").textContent = "Ready";
    mainBtn.textContent = "Start";
});

/* ==== STOPWATCH ==== */
let swInterval, swStart, swElapsed = 0, swRunning = false;
const swBtn = document.getElementById('swStartBtn');
swBtn.addEventListener('click', () => {
    if (!swRunning) {
        swStart = Date.now() - swElapsed;
        swInterval = setInterval(() => {
            swElapsed = Date.now() - swStart;
            let s = Math.floor(swElapsed / 1000), ms = Math.floor((swElapsed % 1000) / 10);
            let m = Math.floor(s / 60), h = Math.floor(m / 60);
            document.getElementById('swDisplay').textContent = 
                ${String(h).padStart(2,'0')}:${String(m%60).padStart(2,'0')}:${String(s%60).padStart(2,'0')}.${String(ms).padStart(2,'0')};
        }, 30);
        swRunning = true; swBtn.textContent = "Pause";
        document.getElementById("dot-stopwatch").classList.add('active');
    } else {
        clearInterval(swInterval); swRunning = false; swBtn.textContent = "Resume";
        document.getElementById("dot-stopwatch").classList.remove('active');
    }
});
document.getElementById('swResetBtn').addEventListener('click', () => {
    clearInterval(swInterval); swElapsed = 0; swRunning = false;
    document.getElementById('swDisplay').textContent = "00:00:00.00";
    swBtn.textContent = "Start"; document.getElementById("dot-stopwatch").classList.remove('active');
});

/* ==== BASIC TIMER ==== */
let tInterval, tTotal = 0, tRunning = false;
const tBtn = document.getElementById('tStartBtn');
tBtn.addEventListener('click', () => {
    if (!tRunning) {
        if (tTotal <= 0) {
            tTotal = (parseInt(document.getElementById('tHours').value)||0)*3600 + (parseInt(document.getElementById('tMins').value)||0)*60 + (parseInt(document.getElementById('tSecs').value)||0);
        }
        if (tTotal > 0) {
            tRunning = true; tBtn.textContent = "Pause";
            document.getElementById("dot-timer").classList.add('active');
            tInterval = setInterval(() => {
                tTotal--;
                let h = Math.floor(tTotal / 3600), m = Math.floor((tTotal % 3600) / 60), s = tTotal % 60;
                document.getElementById('tDisplay').textContent = ${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')};
                if (tTotal <= 0) { clearInterval(tInterval); playBell(true); tRunning = false; tBtn.textContent = "Start"; document.getElementById("dot-timer").classList.remove('active'); }
            }, 1000);
        }
    } else { clearInterval(tInterval); tRunning = false; tBtn.textContent = "Resume"; }
});

/* ==== ALARM ==== */
let alarmTime = null, alarmActive = false;
const dismissBtn = document.getElementById('dismissAlarmBtn');
setInterval(() => {
    let now = new Date();
    document.getElementById('clockDisplay').textContent = now.toLocaleTimeString();
    if (alarmTime && !alarmActive) {
        let current = String(now.getHours()).padStart(2,'0') + ":" + String(now.getMinutes()).padStart(2,'0');
        if (current === alarmTime && now.getSeconds() === 0) {
            alarmActive = true; document.getElementById('alarmStatus').textContent = "RINGING! 🔔";
            dismissBtn.style.display = "inline-block"; document.getElementById("dot-alarm").classList.add('active');
            playBell(false);
        }
    }
}, 1000);
document.getElementById('setAlarmBtn').addEventListener('click', () => {
    alarmTime = document.getElementById('alarmTime').value;
    if (alarmTime) document.getElementById('alarmStatus').textContent = Set for ${alarmTime};
});
dismissBtn.addEventListener('click', () => {
    alarmActive = false; alarmTime = null; dismissBtn.style.display = "none";
    document.getElementById('alarmStatus').textContent = "No alarm set";
    document.getElementById("dot-alarm").classList.remove('active');
});

/* ==== BACKGROUND PARTICLES ==== */
const canvas = document.getElementById("bgParticles"), ctx = canvas.getContext("2d");
let parts = [];
function init() {
    canvas.width = window.innerWidth; canvas.height = window.innerHeight;
    parts = Array.from({length: 80}, () => ({ x: Math.random()*canvas.width, y: Math.random()*canvas.height, s: Math.random()*2, vx: Math.random()*0.4-0.2, vy: Math.random()*0.4-0.2 }));
}
function anim() {
    ctx.clearRect(0,0,canvas.width,canvas.height); ctx.fillStyle = "rgba(56,189,248,0.2)";
    parts.forEach(p => { p.x += p.vx; p.y += p.vy; if(p.x<0) p.x=canvas.width; if(p.x>canvas.width) p.x=0; if(p.y<0) p.y=canvas.height; if(p.y>canvas.height) p.y=0; ctx.beginPath(); ctx.arc(p.x, p.y, p.s, 0, Math.PI*2); ctx.fill(); });
    requestAnimationFrame(anim);
}
window.addEventListener('resize', init); init(); anim();
