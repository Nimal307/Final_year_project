// Change Date Format
export function formatDate(dateStr) {
    if (!dateStr) return "";
    const [y, m, d] = dateStr.split("-");
    return `${d}/${m}/${y}`;
}
  
// Find number of days between two dates
export function dayDiffInclusive(start, end) {
    if (!start || !end) return 2;
    const s = new Date(start);
    const e = new Date(end);
    const diffMs = e - s;
    const days = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    return Math.max(2, days);
}