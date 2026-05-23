function switchView(viewId) {
    document.querySelectorAll('.page-view').forEach(view => view.classList.add('hidden'));
    document.getElementById(`view-${viewId}`).classList.remove('hidden');
}

const clickCounts = { HomeBtn: 0, AuthBtn: 0, DashBtn: 0, HistBtn: 0 };
function trackClick(buttonId) {
    clickCounts[buttonId]++;
    document.getElementById(`count-${buttonId}`).innerText = clickCounts[buttonId];
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
            toast: true,
            position: 'top-end',
            icon: 'info',
            title: 'UX Adaptation Active',
            text: 'Dashboard layout inverted based on usage telemetry data structure!',
            showConfirmButton: false,
            timer: 2000,
            timerProgressBar: true
        });
    } else {
        container.insertBefore(panelUpload, panelStats);
        isRearranged = false;
    }
}

function toggleDarkMode() {
    const body = document.getElementById('app-body');
    body.classList.toggle('bg-slate-950');
    body.classList.toggle('text-slate-100');
    body.classList.toggle('bg-slate-50');
    body.classList.toggle('text-slate-800');
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
    Swal.fire({
        title: 'Validation Error',
        text: mesaj,
        icon: 'error',
        confirmButtonText: 'Correct',
        confirmButtonColor: '#10b981'
    });
}

function validateAuth(event) {
    event.preventDefault();
    const name = document.getElementById('valName').value.trim();
    const email = document.getElementById('valEmail').value.trim();
    const password = document.getElementById('valPassword').value.trim();
    let isValid = true;

    if (name.length === 0) {
        document.getElementById('errName').classList.remove('hidden');
        isValid = false;
    }
    else {
        document.getElementById('errName').classList.add('hidden');
    }

    if (!email.includes('@')) {
        document.getElementById('errEmail').classList.remove('hidden');
        isValid = false;
    }
    else {
        document.getElementById('errEmail').classList.add('hidden');
    }

    if (password.length < 6) {
        document.getElementById('errPassword').classList.remove('hidden');
        isValid = false;
    }
    else {
        document.getElementById('errPassword').classList.add('hidden');
    }

    if (isValid) {
        Swal.fire({
            title: 'Înregistrare Reușită!',
            text: `Welcome, ${name}! Your PredictFlow account has been successfully created.`,
            icon: 'success',
            confirmButtonText: 'Enter in Workspace',
            confirmButtonColor: '#10b981'
        }).then((result) => {
            if (result.isConfirmed) {
                switchView('dashboard');
            }
        });
    }
}

