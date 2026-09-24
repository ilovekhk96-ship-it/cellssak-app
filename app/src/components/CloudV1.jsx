// 버전1(벡터) 전용 구름 — 다른 버전은 구름도 사진(png)이라 공용 Cloud.jsx를 쓰지만,
// 버전1은 나무·잎·열매가 전부 도형이라 구름만 사진이면 혼자 겉돈다. 흰 타원 세 개를
// 겹쳐 만든 도형이라 확대해도 안 깨지고 용량도 안 든다.
// 공용 Cloud.jsx를 고치면 버전2~6이 전부 바뀌므로 따로 둔다.
export default function CloudV1({ w }) {
  return (
    <svg width={w} height={w * 0.55} viewBox="0 0 100 55">
      <ellipse cx="30" cy="35" rx="26" ry="18" fill="#FFFFFFB0" />
      <ellipse cx="58" cy="28" rx="30" ry="22" fill="#FFFFFFB0" />
      <ellipse cx="80" cy="38" rx="20" ry="14" fill="#FFFFFFB0" />
    </svg>
  );
}
