
import React from 'react';

interface FunctionCardProps {
  icon: string;
  name: string;
  isActive: boolean;
  onClick: () => void;
}

const FunctionCard: React.FC<FunctionCardProps> = ({ icon, name, isActive, onClick }) => {
  return (
    <div
      onClick={onClick}
      className={`function-card flex flex-col items-center justify-center p-4 rounded-lg cursor-pointer transition-all duration-200 border-2 ${
        isActive
          ? 'bg-accent/20 border-accent'
          : 'bg-input-bg border-transparent hover:border-border-color'
      }`}
    >
      <div className="text-2xl">{icon}</div>
      <div className="font-semibold mt-1 text-sm">{name}</div>
    </div>
  );
};

export default FunctionCard;
