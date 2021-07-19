module.exports = (start, finish) => {
    const start_time_scanned = new Date(start).getTime();
    const finish_time_scanned = finish ? new Date(finish).getTime() : Date.now();
    // Returns in seconds
    return (finish_time_scanned - start_time_scanned) /1000;
}