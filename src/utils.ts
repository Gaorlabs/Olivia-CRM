export function formatSoles(amount: number): string {
  return new Intl.NumberFormat("es-PE", {
    style: "currency",
    currency: "PEN"
  }).format(amount);
}

export function formatDate(isoString: string): string {
  if (!isoString) return "";
  try {
    const d = new Date(isoString);
    return d.toLocaleDateString("es-PE", {
      day: "numeric",
      month: "short",
      year: "numeric"
    });
  } catch (e) {
    return isoString;
  }
}

export function formatTime(isoString: string): string {
  if (!isoString) return "";
  try {
    const d = new Date(isoString);
    return d.toLocaleTimeString("es-PE", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true
    });
  } catch (e) {
    return isoString;
  }
}
