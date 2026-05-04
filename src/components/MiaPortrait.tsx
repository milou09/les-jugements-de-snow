import { useMemo } from 'react';

import mia1 from '../assets/mia/mia1.png';
import mia2 from '../assets/mia/mia2.png';
import mia3 from '../assets/mia/mia3.png';
import mia4 from '../assets/mia/mia4.png';
import mia5 from '../assets/mia/mia5.png';

const MIA_IMAGES = [mia1, mia2, mia3, mia4, mia5];

type MiaPortraitProps = {
  size?: number;
  alt?: string;
};

export default function MiaPortrait({
  size = 180,
  alt = 'Mia',
}: MiaPortraitProps) {
  const src = useMemo(() => {
    return MIA_IMAGES[Math.floor(Math.random() * MIA_IMAGES.length)];
  }, []);

  return (
    <img
      src={src}
      alt={alt}
      style={{
        width: `${size}px`,
        height: 'auto',
        display: 'block',
        margin: '0 auto',
        userSelect: 'none',
      }}
      draggable={false}
    />
  );
}