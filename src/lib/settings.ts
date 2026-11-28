/**
 * 자동 삭제 기간(일)을 읽는다. 양수만 유효하고, 그 외(없음, "null", 0, 음수, 잘못된 값)는 모두 null(= Never)이다.
 * (예전에는 설정이 없을 때 0으로 내보내져서, 그 백업을 가져오면 휴지통이 통째로 비워졌다)
 */
export function parseAutoDeleteDays(v: unknown): number | null {
  if (v === null || v === undefined || v === "" || v === "null") return null;
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : null;
}
