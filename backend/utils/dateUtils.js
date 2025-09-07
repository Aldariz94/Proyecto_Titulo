function addBusinessDays(startDate, days) {
    let currentDate = new Date(startDate);
    let addedDays = 0;
    while (addedDays < days) {
        currentDate.setDate(currentDate.getDate() + 1);
        const dayOfWeek = currentDate.getDay();
        if (dayOfWeek !== 0 && dayOfWeek !== 6) {
            addedDays++;
        }
    }
    return currentDate;
}

module.exports = { addBusinessDays };