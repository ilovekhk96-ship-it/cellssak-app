// cloud-1/2.png는 원본이 뭉치 두 개가 멀리 떨어져 찍힌 사진이라, 크게 키우면 그 사이
// 빈 공간이 대각선으로 잘린 것처럼 보이는 문제가 있었음. cloud-3.png(뭉치 하나, 깔끔한
// 덩어리)만 쓰고, 좌우 반전으로 최소한의 변화만 줌
const CLOUD_IMAGES = ['/images/cloud-3.png'];

// 크기는 감싸는 wrapper div(.drift-cloud, width 고정)가 정하고 이 img는 항상 100% —
// img 자체에 %를 주면 부모(position:absolute, width:auto)가 크기를 정할 기준이 없어서
// 계산이 널뛰어 순간적으로 작아 보이는 문제가 있었음
export default function Cloud({ variant = 0, flip = false }) {
  return (
    <img
      src={CLOUD_IMAGES[variant % CLOUD_IMAGES.length]}
      alt=""
      style={{ width: '100%', height: 'auto', display: 'block', transform: flip ? 'scaleX(-1)' : undefined }}
    />
  );
}
