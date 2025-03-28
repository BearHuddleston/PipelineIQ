import { LoadingSpinnerProps } from '../types';

const LoadingSpinner = ({ size = 'medium', showText = true }: LoadingSpinnerProps) => {
  // Determine size class based on prop
  let textSize: string;
  
  switch(size) {
    case 'small':
      textSize = 'text-xs';
      break;
    case 'large':
      textSize = 'text-base';
      break;
    default: // medium
      textSize = 'text-sm';
  }

  return (
    <div className="flex justify-center items-center">
      <div className="loader">
        <div></div>
        <div></div>
        <div></div>
        <div></div>
      </div>
      {showText && <span className={`ml-2 ${textSize}`}>Loading...</span>}
    </div>
  );
};

export default LoadingSpinner;
