
// --- Glass Calendar Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    if (typeof dycalendar !== 'undefined') {
        dycalendar.draw({
            target: "#dycalendar",
            type: 'month',
            dayformat: 'full',
            monthformat: 'full',
            highlighttargetdate: true,
            highlighttoday: true,
            prevnextbutton: 'show'
        });
    }
});
