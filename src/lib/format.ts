export const fmtWon = (n: number | string) => `₩${Number(n || 0).toLocaleString("ko-KR")}`;
