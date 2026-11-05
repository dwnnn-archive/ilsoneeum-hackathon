export type CropDemand = {
  crop: "반시" | "사과";
  index: number;
};

export type MonthlyDemand = {
  month: number;
  crops: CropDemand[];
};

export const seasonalDemand = {
  source: "시연용 가상 계절 수요 지수. 청도군 농촌일자리지원센터 집계자료를 사용하지 않았습니다.",
  unit: "상대 지수(0-100), 실제 구인 건수·인원·공식 통계가 아님",
  months: [
    { month: 1, crops: [{ crop: "반시", index: 5 }, { crop: "사과", index: 8 }] },
    { month: 2, crops: [{ crop: "반시", index: 5 }, { crop: "사과", index: 8 }] },
    { month: 3, crops: [{ crop: "반시", index: 8 }, { crop: "사과", index: 12 }] },
    { month: 4, crops: [{ crop: "반시", index: 12 }, { crop: "사과", index: 20 }] },
    { month: 5, crops: [{ crop: "반시", index: 15 }, { crop: "사과", index: 30 }] },
    { month: 6, crops: [{ crop: "반시", index: 20 }, { crop: "사과", index: 45 }] },
    { month: 7, crops: [{ crop: "반시", index: 25 }, { crop: "사과", index: 60 }] },
    { month: 8, crops: [{ crop: "반시", index: 35 }, { crop: "사과", index: 78 }] },
    { month: 9, crops: [{ crop: "반시", index: 55 }, { crop: "사과", index: 92 }] },
    { month: 10, crops: [{ crop: "반시", index: 88 }, { crop: "사과", index: 75 }] },
    { month: 11, crops: [{ crop: "반시", index: 100 }, { crop: "사과", index: 45 }] },
    { month: 12, crops: [{ crop: "반시", index: 40 }, { crop: "사과", index: 18 }] },
  ] satisfies MonthlyDemand[],
} as const;
