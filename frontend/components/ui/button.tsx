import React from "react";

export const Button = ({
  children,
  onClick,
  className,
}: {
  children: React.ReactNode;
  onClick: any;
  className: any;
}) => {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition ${className}`}
    >
      {children}
    </button>
  );
};
