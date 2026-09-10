const CLOUD_IMAGES = ['/images/cloud-1.png', '/images/cloud-2.png', '/images/cloud-3.png'];

export default function Cloud({ w, variant = 0 }) {
  return <img src={CLOUD_IMAGES[variant % CLOUD_IMAGES.length]} alt="" style={{ width: w, height: 'auto', display: 'block' }} />;
}
