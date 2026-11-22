/** 영구 삭제된 옷의 구매 요약 기록 (캘린더의 구매 이력을 유지하기 위해 남긴다) */
export interface PurchaseRecord {
  /** 영구 삭제된 항목의 id */
  id: string;
  brandName: string;
  name: string;
  category: string;
  /** YYYY-MM-DD */
  purchaseDate: string;
  purchasePrice: number | "";
  /** 작은 썸네일(data URL 또는 외부 이미지 주소). 없으면 "" */
  thumbnail: string;
  /** 영구 삭제된 시각 (ms) */
  removedAt: number;
}
