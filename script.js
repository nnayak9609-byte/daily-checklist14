const shiftDefs = [
    { name: "Morning D1", color: "#FF6384", tasks: [{n:"Office (3hrs)", h:3}, {n:"Study 1", h:3}, {n:"Study 2", h:1.5}] },
    { name: "Morning D2", color: "#36A2EB", tasks: [{n:"Office (3hrs)", h:3}, {n:"Study 1", h:3}, {n:"Study 2", h:1.5}] },
    { name: "Evening D3", color: "#FFCE56", tasks: [{n:"Study 1", h:2.5}, {n:"Study 2", h:3.5}, {n:"Office (3hrs)", h:3}] },
    { name: "Evening D4", color: "#4BC0C0", tasks: [{n:"Study 1", h:2.5}, {n:"Study 2", h:3.5}, {n:"Office (3hrs)", h:3}] },
    { name: "Night 1st", color: "#9966FF", tasks: [{n:"Study 1", h:2.5}, {n:"Study 2", h:4.5}, {n:"Office (3hrs)", h:3}] },
    { name: "Night 2nd", color: "#FF9F40", tasks: [{n:"Study 1", h:3}, {n:"Study 2", h:2.5}, {n:"Office (3hrs)", h:3}] },
    { name: "Off Day", color: "#95a5a6", tasks: [{n:"Study 1", h:3}, {n:"Study 2", h:2.5}] },
    { name: "General", color: "#27ae60", tasks: [{n:"Study 1", h:3}, {n:"Study 2", h:3.5}] }
];

let pChart, tChart, swInterval, swSeconds = 0, alarmCheckInterval;

window.onload = () => {
    const rotaNum = localStorage.getItem('activeRota') || 1;
    document.getElementById('current-rota-title').innerText = `Rota ${rotaNum}: Active`;
    document.getElementById('date-display').innerText = new Date().toDateString();
    renderUI(); initCharts(); loadStoredData();
};

function renderUI() {
    const container = document.getElementById('schedule-container');
    container.innerHTML = shiftDefs.map((s, i) => `
        <section class="shift-card" style="border-top-color: ${s.color}">
            <h3 style="color: ${s.color}">${s.name}</h3>
            <table>
                ${s.tasks.map(t => `
                    <tr><td>${t.n}</td><td>${t.h}h</td>
                    <td><input type="checkbox" class="t-check" data-shift="${i}" data-hrs="${t.h}" onchange="refreshAnalytics()"></td></tr>
                `).join('')}
            </table>
        </section>`).join('');
}

function initCharts() {
    const common = { responsive: true, maintainAspectRatio: false };
    pChart = new Chart(document.getElementById('progressChart'), {
        type: 'line', data: { labels: shiftDefs.map(s => s.name), datasets: [{ label: '% Done', data: [], borderColor: '#0984e3', fill: true }] }, options: common
    });
    tChart = new Chart(document.getElementById('timeChart'), {
        type: 'bar', data: { labels: shiftDefs.map(s => s.name), datasets: [{ label: 'Hrs Studied', data: [], backgroundColor: shiftDefs.map(s => s.color) }] }, options: common
    });
}

function refreshAnalytics() {
    let weeklyTotal = 0, progressArr = [], hoursArr = [];
    shiftDefs.forEach((s, i) => {
        const total = document.querySelectorAll(`.t-check[data-shift="${i}"]`);
        const done = document.querySelectorAll(`.t-check[data-shift="${i}"]:checked`);
        let shiftHrs = 0; done.forEach(c => shiftHrs += parseFloat(c.dataset.hrs));
        progressArr.push(total.length ? (done.length / total.length) * 100 : 0);
        hoursArr.push(shiftHrs); weeklyTotal += shiftHrs;
    });
    pChart.data.datasets[0].data = progressArr; tChart.data.datasets[0].data = hoursArr;
    pChart.update(); tChart.update();
    document.getElementById('weekly-total').innerText = weeklyTotal.toFixed(1);
}

// STOPWATCH RESET ADDED HERE
function toggleStopwatch() {
    const btn = document.getElementById('sw-btn');
    if (swInterval) { clearInterval(swInterval); swInterval = null; btn.innerText = "Start"; }
    else {
        swInterval = setInterval(() => {
            swSeconds++;
            let h = Math.floor(swSeconds/3600), m = Math.floor((swSeconds%3600)/60), s = swSeconds%60;
            document.getElementById('stopwatch').innerText = `${h.toString().padStart(2,'0')}:${m.toString().padStart(2,'0')}:${s.toString().padStart(2,'0')}`;
        }, 1000);
        btn.innerText = "Stop";
    }
}

function resetStopwatch() {
    clearInterval(swInterval);
    swInterval = null;
    swSeconds = 0;
    document.getElementById('stopwatch').innerText = "00:00:00";
    document.getElementById('sw-btn').innerText = "Start";
}

// ALARM RESET/CLEAR ADDED HERE
function setAlarm() {
    const target = document.getElementById('alarm-time').value;
    if(!target) return alert("Select a time first!");
    if(alarmCheckInterval) clearInterval(alarmCheckInterval);
    alert("Alarm set for " + target);
    alarmCheckInterval = setInterval(() => {
        const now = new Date();
        if(`${now.getHours().toString().padStart(2,'0')}:${now.getMinutes().toString().padStart(2,'0')}` === target) triggerAlarm();
    }, 1000);
}

function triggerAlarm() {
    const audio = document.getElementById('alarm-sound');
    audio.play();
    document.getElementById('stop-alarm-btn').style.display = "inline-block";
}

function stopAlarmSound() {
    const audio = document.getElementById('alarm-sound');
    audio.pause(); audio.currentTime = 0;
    document.getElementById('stop-alarm-btn').style.display = "none";
}

function resetAlarm() {
    clearInterval(alarmCheckInterval);
    document.getElementById('alarm-time').value = "";
    stopAlarmSound();
}

function saveData() {
    const states = Array.from(document.querySelectorAll('.t-check')).map(c => c.checked);
    localStorage.setItem('rotaProgress', JSON.stringify(states));
    alert("Progress Saved!");
}

function loadStoredData() {
    if (localStorage.getItem('rotaTheme') === 'dark') toggleTheme();
    const saved = JSON.parse(localStorage.getItem('rotaProgress'));
    if (saved) document.querySelectorAll('.t-check').forEach((c, i) => c.checked = saved[i]);
    refreshAnalytics();
}

function startNewRota() {
    if(confirm("Archive current rota and start a fresh page?")) {
        localStorage.setItem('activeRota', (parseInt(localStorage.getItem('activeRota')||1)+1));
        localStorage.removeItem('rotaProgress');
        location.reload();
    }
}

function toggleTheme() {
    const isDark = document.body.classList.toggle('dark-theme');
    localStorage.setItem('rotaTheme', isDark ? 'dark' : 'light');
}
