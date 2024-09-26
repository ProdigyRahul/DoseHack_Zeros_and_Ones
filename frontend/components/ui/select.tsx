import React from "react";

export const Select = ({ onValueChange, children }) => {
  const handleChange = (e) => {
    onValueChange(e.target.value);
  };

  return (
    <select
      onChange={handleChange}
      className="border border-gray-300 rounded p-2"
    >
      {children}
    </select>
  );
};

export const SelectContent = ({ children }) => {
  return <div className="">{children}</div>;
};

export const SelectItem = ({ value, children }) => {
  return (
    <option value={value} className="p-2">
      {children}
    </option>
  );
};

export const SelectTrigger = ({ children, className }) => {
  return (
    <div className={`flex justify-between items-center ${className}`}>
      {children}
    </div>
  );
};

interface SelectValueProps {
  placeholder?: string;
  value?: string | null;
}

export const SelectValue: React.FC<SelectValueProps> = ({
  placeholder,
  value,
}) => {
  return <div className="p-2 text-gray-700">{value ? value : placeholder}</div>;
};
