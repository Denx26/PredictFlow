function switchView(viewId) {
    document.querySelectorAll('.page-view').forEach(view => view.classList.add('hidden'));
    document.getElementById(`view-${viewId}`).classList.remove('hidden');
}
