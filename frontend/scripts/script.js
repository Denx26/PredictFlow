let isLoginState = true;
const clickCounts = { HomeBtn: 0, AuthBtn: 0, DashBtn: 0, HistBtn: 0 };

function trackClick(buttonId) {
    clickCounts[buttonId]++;
    const countDisplayElement = document.getElementById(`count-${buttonId}`);
    if (countDisplayElement) {
        countDisplayElement.innerText = clickCounts[buttonId];
    }
}

function updateNavbarAuthState() {
    const isLoggedIn = sessionStorage.getItem('loggedIn') === 'true';
    const userName = sessionStorage.getItem('userName') || 'User';

    const loggedOutContainer = document.getElementById('nav-auth-loggedout');
    const loggedInContainer = document.getElementById('nav-auth-loggedin');
    const nameDisplay = document.getElementById('nav-user-name');

    if (isLoggedIn) {
        if (loggedOutContainer) loggedOutContainer.classList.add('hidden');
        if (loggedInContainer) loggedInContainer.classList.remove('hidden');
        if (nameDisplay) nameDisplay.innerText = userName;
    } else {
        if (loggedOutContainer) loggedOutContainer.classList.remove('hidden');
        if (loggedInContainer) loggedInContainer.classList.add('hidden');
    }
}

function handleLogout() {
    sessionStorage.removeItem('loggedIn');
    sessionStorage.removeItem('userName');

    Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'info',
        title: 'Logged out successfully',
        showConfirmButton: false,
        timer: 1500
    });

    updateNavbarAuthState();
    switchView('home');
}

// Apelăm funcția la încărcarea scriptului pentru a păstra starea la refresh
updateNavbarAuthState();

document.getElementById('datasetFile')?.addEventListener('change', function (e) {
    const fileName = e.target.files[0]?.name || "Drop your engineering `.csv` file here or click to browse";
    document.getElementById('fileLabel').innerText = fileName;
});

let signalRConnectionId = "";
const connection = new signalR.HubConnectionBuilder()
    .withUrl("http://localhost:5286/orchestratorHub")
    .withAutomaticReconnect()
    .build();

async function startSignalR() {
    try {
        await connection.start();
        console.log(">>> SignalR Hub Connected successfully!");
        signalRConnectionId = await connection.invoke("GetConnectionId");
        console.log(">>> Connection ID allocated:", signalRConnectionId);
    } catch (err) {
        console.error("SignalR Connection Failure: ", err);
        setTimeout(startSignalR, 5000);
    }
}
startSignalR();

connection.onclose(async () => {
    console.log("SignalR deconectat. Încercăm reconectarea...");
    try {
        await connection.start();
        console.log("SignalR Reconectat cu succes!");
    } catch (err) {
        console.error("Eroare la reconectare: ", err);
    }
});

connection.on("ReceiveReport", function (jsonStringData) {
    document.getElementById('pipelineSpinner').classList.add('hidden');
    document.getElementById('btn-run-pipeline').removeAttribute('disabled');
    document.getElementById('btn-text').innerText = "Optimize Pipeline & Train AutoML";

    const result = JSON.parse(jsonStringData);

    document.getElementById('diag-algo').innerText = result.best_algorithm;
    document.getElementById('diag-algo').className = "text-xl font-black text-emerald-500 mt-1";
    document.getElementById('diag-score').innerText = result.score + " (" + result.task_detected + ")";
    document.getElementById('diag-score').className = "text-3xl font-black text-slate-800 mt-1";
    document.getElementById('diag-dimensions').innerText = `Rows: ${result.rows_count} | Features: ${result.features_count} (Target: ${result.target_detected})`;

    document.getElementById('report-text').innerText = result.report_markdown;
    document.getElementById('report-container').classList.remove('hidden');

    Swal.fire({
        icon: 'success',
        title: 'AutoML Optimization Complete',
        text: 'Metrics and executive analysis loaded downstream via SignalR sockets.',
        confirmButtonColor: '#10b981'
    });
});

connection.on("ReceiveError", function (errorMessage) {
    document.getElementById('pipelineSpinner').classList.add('hidden');
    document.getElementById('btn-run-pipeline').removeAttribute('disabled');
    showErrorAlert(errorMessage);
});

async function handleAuthSubmit(event) {
    event.preventDefault();
    const name = document.getElementById('valName').value.trim();
    const email = document.getElementById('valEmail').value.trim();
    const password = document.getElementById('valPassword').value.trim();

    let isValid = true;
    if (!isLoginState && name.length === 0) {
        isValid = false;
        document.getElementById('errName').classList.remove('hidden');
    }
    if (!email.includes('@')) {
        isValid = false;
        document.getElementById('errEmail').classList.remove('hidden');
    }
    if (password.length < 6) {
        isValid = false;
        document.getElementById('errPassword').classList.remove('hidden');
    }

    if (!isValid) return;

    const endpoint = isLoginState ? 'login' : 'register';
    const payload = isLoginState ? { email, password } : { name, email, password };

    try {
        const response = await fetch(`http://localhost:5286/api/auth/${endpoint}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (response.ok && data.status === "success") {
            sessionStorage.setItem('loggedIn', 'true');
            sessionStorage.setItem('userName', data.name);

            // Actualizăm Navbar-ul imediat după autentificare reușită
            updateNavbarAuthState();

            Swal.fire({
                title: 'Authentication Success',
                text: `Welcome back to PredictFlow workspace, ${data.name}!`,
                icon: 'success',
                confirmButtonColor: '#10b981'
            }).then(() => {
                switchView('dashboard');
            });
        } else {
            showErrorAlert(data.detail || "Authentication exception. Check credentials.");
        }
    } catch (err) {
        showErrorAlert("Could not reach backend identity system server.");
    }
}

async function handlePipelineSubmit(event) {
    event.preventDefault();

    if (!signalRConnectionId) {
        showErrorAlert("WebSocket initialization active. Retrying link token allocation...");
        return;
    }

    const fileInput = document.getElementById('datasetFile');
    const promptInput = document.getElementById('pipelinePrompt');

    if (fileInput.files.length === 0) return;

    document.getElementById('pipelineSpinner').classList.remove('hidden');
    document.getElementById('btn-run-pipeline').setAttribute('disabled', 'true');
    document.getElementById('btn-text').innerText = "Streaming data to orchestrator...";

    const formData = new FormData();
    formData.append("file", fileInput.files[0]);
    formData.append("prompt", promptInput.value);
    formData.append("connectionId", signalRConnectionId);

    try {
        const response = await fetch("http://localhost:5286/api/orchestrate/run", {
            method: "POST",
            body: formData
        });

        if (response.ok) {
            Swal.fire({
                toast: true,
                position: 'top-end',
                icon: 'info',
                title: 'Processing pipeline triggered',
                text: 'Asynchronous background optimization running...',
                showConfirmButton: false,
                timer: 3000
            });
        } else {
            const errText = await response.text();
            throw new Error(errText);
        }
    } catch (ex) {
        document.getElementById('pipelineSpinner').classList.add('hidden');
        document.getElementById('btn-run-pipeline').removeAttribute('disabled');
        document.getElementById('btn-text').innerText = "Optimize Pipeline & Train AutoML";
        showErrorAlert(ex.message || "Failed to submit orchestration file.");
    }
}

function toggleAuthPageState(isLogin) {
    isLoginState = isLogin;
    const nameField = document.getElementById('container-name-field');
    const submitBtn = document.getElementById('btn-auth-submit');
    const tabLogin = document.getElementById('btn-toggle-login');
    const tabRegister = document.getElementById('btn-toggle-register');

    if (isLoginState) {
        nameField.classList.add('hidden');
        submitBtn.innerText = "Sign In";
        tabLogin.className = "w-1/2 text-center font-bold text-sm text-emerald-500 border-b-2 border-emerald-500 pb-2 transition cursor-pointer";
        tabRegister.className = "w-1/2 text-center font-bold text-sm text-slate-400 pb-2 transition cursor-pointer";
    } else {
        nameField.classList.remove('hidden');
        submitBtn.innerText = "Create Account";
        tabRegister.className = "w-1/2 text-center font-bold text-sm text-emerald-500 border-b-2 border-emerald-500 pb-2 transition cursor-pointer";
        tabLogin.className = "w-1/2 text-center font-bold text-sm text-slate-400 pb-2 transition cursor-pointer";
    }
}

let isRearranged = false;
function rearrangeLayout() {
    const container = document.getElementById('grid-container');
    const panelUpload = document.getElementById('panel-upload');
    const panelStats = document.getElementById('panel-stats');

    if (!isRearranged) {
        container.insertBefore(panelStats, panelUpload);
        isRearranged = true;
        Swal.fire({
            toast: true, position: 'top-end', icon: 'info',
            title: 'UX Adaptation Active', text: 'Dashboard layout inverted based on usage telemetry!',
            showConfirmButton: false, timer: 2000, timerProgressBar: true
        });
    } else {
        container.insertBefore(panelUpload, panelStats);
        isRearranged = false;
    }
}

function toggleDarkMode() {
    const body = document.getElementById('app-body');
    const nav = document.getElementById('nav-body');
    body.classList.toggle('bg-slate-950'); body.classList.toggle('bg-slate-50');
    body.classList.toggle('text-slate-100'); body.classList.toggle('text-slate-800');
    nav.classList.toggle('bg-slate-900'); nav.classList.toggle('bg-white');
}

function applyTheme(themeClass) {
    const textElements = document.querySelectorAll('.dynamic-text');
    const bgElements = document.querySelectorAll('.dynamic-bg');
    let colorHex = "#10b981";
    if (themeClass === 'theme-ocean') colorHex = "#0284c7";
    if (themeClass === 'theme-midnight') colorHex = "#6366f1";
    textElements.forEach(el => el.style.color = colorHex);
    bgElements.forEach(el => el.style.backgroundColor = colorHex);
}

function showErrorAlert(mesaj) {
    Swal.fire({ title: 'System Notification', text: mesaj, icon: 'error', confirmButtonText: 'Acknowledge', confirmButtonColor: '#10b981' });
}