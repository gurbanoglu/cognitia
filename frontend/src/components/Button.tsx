import React from 'react';

export enum ButtonColor {
  Blue = 'blue',
  DarkBlue = 'darkBlue',
  Red = 'red',
  Green = 'green',
  Gray = 'gray',
  Black = 'black'
}

interface ButtonProps {
  color?: ButtonColor | '';
  size?: 'sm' | 'md' | 'lg';
  height?: string;
  width?: string;
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
}

/* Props are arguments passed into React components.

   React components use props to communicate with
   each other.
*/
const Button: React.FC<ButtonProps> = ({
  color = '',
  size = 'md',
  height,
  width,
  children,
  onClick,
  className = ''
}) => {
  const colorClasses = {
    blue: 'bg-blue-500 hover:bg-blue-700 text-white',
    darkBlue: 'bg-blue-800 hover:bg-blue-900 text-white',
    red: 'bg-red-500 hover:bg-red-700 text-white',
    green: 'bg-green-500 hover:bg-green-700 text-white',
    gray: 'bg-gray-500 hover:bg-gray-700 text-white',
    black: 'bg-black hover:bg-gray-900 text-white',
    '': ''
  };

  const sizeClasses = {
    sm: 'px-2 py-1 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg'
  };

  const heightClass = height ? height : 'h-10';
  const widthClass = width ? width : 'w-auto';

  return (
    <button
      className={`
        ${colorClasses[color]}
        ${sizeClasses[size]}
        ${heightClass}
        ${widthClass}
        font-bold rounded
        transition-colors duration-200
        ${className}
      `}
      onClick={onClick}
    >
      {children}
    </button>
  );
};

export default Button;