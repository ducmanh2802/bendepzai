import React from 'react';
import { fireCelebrationSmall, fireCelebrationMedium, fireCelebrationLarge, fireCelebrationExtreme } from '../../services/confetti';

interface CelebrationProps {
  /** Celebration type: small, medium, large, extreme */
  type: 'small' | 'medium' | 'large' | 'extreme';
  /** Callback when celebration is complete */
  onComplete?: () => void;
}

/** T19 — Component hiển thị hiệu ứng ăn mừng theo loại */
const CelebrationScreen: React.FC<CelebrationProps> = ({ type, onComplete }) => {
  React.useEffect(() => {
    switch (type) {
      case 'small':
        fireCelebrationSmall();
        break;
      case 'medium':
        fireCelebrationMedium();
        break;
      case 'large':
        fireCelebrationLarge();
        break;
      case 'extreme':
        fireCelebrationExtreme();
        break;
    }
    if (onComplete) {
      setTimeout(onComplete, 1000);
    }
  }, [type, onComplete]);

  return null;
};

export default CelebrationScreen;