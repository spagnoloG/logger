module.exports = (time) => {
    const time_scanned = new Date(time).getTime();
    const time_now = Date.now();
    // Returns in miliseconds
    return time_now - time_scanned;
}