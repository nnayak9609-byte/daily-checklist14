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

let pChart, tChart;
let swInterval, swSeconds = 0;

window.onload = () => {
    const rotaNum = localStorage.getItem('activeRota') || 1;
    document.getElementById('current-rota-title').innerText = `Rota ${rotaNum}: Active`;
    document.getElementById('date-display').innerText = new Date().toDateString();
    
    renderUI();
    initCharts();
    loadStoredData();
};

function renderUI() {
    const container = document.getElementById('schedule-container');
    container.innerHTML = shiftDefs.map((s, i) => `
        <section class="shift-card" style="border-top-color: ${s.color}">
            <h3 style="color: ${s.color}">${s.name}</h3>
            <table>
                <thead><tr><th>Task</th><th>Hrs</th><th>Done</th></tr></thead>
                <tbody>
                    ${s.tasks.map((t, ti) => `
                        <tr>
                            <td>${t.n}</td>
                            <td>${t.h}h</td>
                            <td><input type="checkbox" class="t-check" data-shift="${i}" data-hrs="${t.h}" onchange="refreshAnalytics()"></td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </section>
    `).join('');
}

function initCharts() {
    const pCtx = document.getElementById('progressChart').getContext('2d');
    const tCtx = document.getElementById('timeChart').getContext('2d');
    
    pChart = new Chart(pCtx, {
        type: 'line',
        data: { labels: shiftDefs.map(s => s.name), datasets: [{ label: '% Done', data: [], borderColor: '#0984e3', tension: 0.3, fill: true }] },
        options: { responsive: true, maintainAspectRatio: false }
    });

    tChart = new Chart(tCtx, {
        type: 'bar',
        data: { labels: shiftDefs.map(s => s.name), datasets: [{ label: 'Hours Studied', data: [], backgroundColor: shiftDefs.map(s => s.color) }] },
        options: { responsive: true, maintainAspectRatio: false }
    });
}

function refreshAnalytics() {
    let weeklyTotal = 0;
    const progressArr = [];
    const hoursArr = [];

    shiftDefs.forEach((s, i) => {
        const totalTasks = document.querySelectorAll(`.t-check[data-shift="${i}"]`);
        const doneTasks = document.querySelectorAll(`.t-check[data-shift="${i}"]:checked`);
        let shiftHrs = 0;
        doneTasks.forEach(c => shiftHrs += parseFloat(c.dataset.hrs));
        
        progressArr.push(totalTasks.length ? (doneTasks.length / totalTasks.length) * 100 : 0);
        hoursArr.push(shiftHrs);
        weeklyTotal += shiftHrs;
    });

    pChart.data.datasets[0].data = progressArr;
    tChart.data.datasets[0].data = hoursArr;
    pChart.update(); tChart.update();
    document.getElementById('weekly-total').innerText = weeklyTotal.toFixed(1);
}

function toggleStopwatch() {
    const btn = document.getElementById('sw-btn');
    if (swInterval) {
        clearInterval(swInterval); swInterval = null; btn.innerText = "Start";
    } else {
        swInterval = setInterval(() => {
            swSeconds++;
            let h = Math.floor(swSeconds/3600), m = Math.floor((swSeconds%3600)/60), s = swSeconds%60;
            document.getElementById('stopwatch').innerText = `${h.toString().padStart(2,'0')}:${m.toString().padStart(2,'0')}:${s.toString().padStart(2,'0')}`;
        }, 1000);
        btn.innerText = "Stop";
    }
}

function setAlarm() {
    const target = document.getElementById('alarm-time').value;
    if(!target) return;
    alert("Alarm set for " + target);
    setInterval(() => {
        const now = new Date();
        if(`${now.getHours().toString().padStart(2,'0')}:${now.getMinutes().toString().padStart(2,'0')}` === target) {
            document.getElementById('alarm-sound').play();
        }
    }, 10000);
}

function startNewRota() {
    if(confirm("Archiving this rota. Start fresh page for the next cycle?")) {
        localStorage.setItem('activeRota', (parseInt(localStorage.getItem('activeRota')||1)+1));
        localStorage.removeItem('rotaProgress');
        location.reload();
    }
}

function saveData() {
    const states = Array.from(document.querySelectorAll('.t-check')).map(c => c.checked);
    localStorage.setItem('rotaProgress', JSON.stringify(states));
    alert("Progress Saved!");
}

function loadStoredData() {
    if (localStorage.getItem('rotaTheme') === 'dark') toggleTheme();
    const saved = JSON.parse(localStorage.getItem('rotaProgress'));
    if (saved) {
        document.querySelectorAll('.t-check').forEach((c, i) => c.checked = saved[i]);
    }
    refreshAnalytics();
}

function toggleTheme() {
    const isDark = document.body.classList.toggle('dark-theme');
    localStorage.setItem('rotaTheme', isDark ? 'dark' : 'light');
}