import React from "react";

export const Input = ({
  type,
  placeholder,
  value,
  onChange,
  className,
  min,
}: {
  type: any;
  placeholder: any;
  value: any;
  onChange: any;
  className: any;
  min: any;
}) => {
  return (
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      min={min}
      className={`border border-gray-500 rounded p-2 ${className}`}
    />
  );
};
