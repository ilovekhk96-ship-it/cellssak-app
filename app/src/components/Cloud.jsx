const CLOUD_IMAGES = ['/images/cloud-1.png', '/images/cloud-2.png', '/images/cloud-3.png'];

// 크기는 감싸는 wrapper div(.drift-cloud, width 고정)가 정하고 이 img는 항상 100% —
// img 자체에 %를 주면 부모(position:absolute, width:auto)가 크기를 정할 기준이 없어서
// 계산이 널뛰어 순간적으로 작아 보이는 문제가 있었음
export default function Cloud({ variant = 0 }) {
  return <img src={CLOUD_IMAGES[variant % CLOUD_IMAGES.length]} alt="" style={{ width: '100%', height: 'auto', display: 'block' }} />;
}
