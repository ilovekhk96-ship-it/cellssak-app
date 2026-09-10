const CLOUD_IMAGES = ['/images/cloud-1.png', '/images/cloud-2.png', '/images/cloud-3.png'];

// w는 px 고정값이 아니라 '55%' 같은 CSS width 값 — 화면 크기가 달라져도 하늘 대비 구름
// 비율이 일정하게 유지되도록 함
export default function Cloud({ w, variant = 0 }) {
  return <img src={CLOUD_IMAGES[variant % CLOUD_IMAGES.length]} alt="" style={{ width: w, height: 'auto', display: 'block' }} />;
}
