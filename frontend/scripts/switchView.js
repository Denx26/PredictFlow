function switchView(viewId) {

    if (viewId === 'dashboard' && !sessionStorage.getItem('loggedIn')) {
        Swal.fire({
            icon: 'warning',
            title: 'Access Denied',
            text: 'You must register first to access the Workspace!',
            confirmButtonColor: '#10b981'
        });
        return;
    }
    document.querySelectorAll('.page-view').forEach(view => {
        view.classList.add('hidden');
        view.classList.remove('grid');

    });
    const target = document.getElementById(`view-${viewId}`);
    target.classList.remove('hidden');
    if (viewId == 'history' || viewId === 'home') {
        target.classList.add('grid');
    }
}


