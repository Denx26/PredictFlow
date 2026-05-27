
const clickCounts = { HomeBtn: 0, AuthBtn: 0, DashBtn: 0, HistBtn: 0 };
function trackClick(buttonId) {
    clickCounts[buttonId]++;
    const countDisplayElement = document.getElementById(`count-${buttonId}`);
    if (countDisplayElement){
        countDisplayElement.innerText = clickCounts[buttonId];
    }

}