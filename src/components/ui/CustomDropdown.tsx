import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

export interface DropdownOption {
  value: string;
  label: string;
  color?: string;
  icon?: React.ReactNode;
}

interface CustomDropdownProps {
  options: DropdownOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  showColorIndicator?: boolean;
  disabled?: boolean;
}

export default function CustomDropdown({
  options,
  value,
  onChange,
  placeholder = "Select an option",
  className = "",
  showColorIndicator = false,
  disabled = false,
}: CustomDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find(opt => opt.value === value);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (optionValue: string) => {
    onChange(optionValue);
    setIsOpen(false);
  };

  return (
    <div ref={dropdownRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`w-full flex items-center gap-3 px-4 py-2.5 bg-white border border-gray-200 rounded-lg transition-colors ${
          disabled
            ? 'bg-gray-50 cursor-not-allowed opacity-60'
            : 'hover:border-gray-300 cursor-pointer'
        }`}
      >
        {selectedOption ? (
          <>
            {showColorIndicator && selectedOption.color && (
              <div
                className="w-3 h-3 rounded-full flex-shrink-0"
                style={{ backgroundColor: selectedOption.color }}
              />
            )}
            {selectedOption.icon && (
              <span className="flex-shrink-0">{selectedOption.icon}</span>
            )}
            <span className="flex-1 text-left text-black font-medium">
              {selectedOption.label}
            </span>
          </>
        ) : (
          <span className="flex-1 text-left text-gray-400">
            {placeholder}
          </span>
        )}
        <ChevronDown 
          className={`w-4 h-4 text-gray-500 transition-transform flex-shrink-0 ${
            isOpen ? 'rotate-180' : ''
          }`} 
        />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden z-50">
          <div className="max-h-60 overflow-y-auto">
            {options.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => handleSelect(option.value)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors ${
                  option.value === value ? 'bg-gray-50' : ''
                }`}
              >
                {showColorIndicator && option.color && (
                  <div
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: option.color }}
                  />
                )}
                {option.icon && (
                  <span className="flex-shrink-0">{option.icon}</span>
                )}
                <span className="text-black font-medium text-left flex-1">
                  {option.label}
                </span>
                {option.value === value && (
                  <Check className="w-4 h-4 text-[#2E6F40] flex-shrink-0" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
