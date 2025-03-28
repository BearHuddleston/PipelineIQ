import { LoadingSpinnerProps } from '../types';

const LoadingSpinner = ({ size = 'medium' }: LoadingSpinnerProps) => {
  // Determine size class based on prop
  const sizeClass = {
    small: 'w-4 h-4',
    medium: 'w-8 h-8',
    large: 'w-12 h-12',
  }[size];

  return (
    <div className="flex justify-center items-center">
      <div className={`animate-spin rounded-full border-t-2 border-b-2 border-blue-500 ${sizeClass}`}></div>
      <span className="ml-2">Loading...</span>
    </div>
  );
};

export default LoadingSpinner;
