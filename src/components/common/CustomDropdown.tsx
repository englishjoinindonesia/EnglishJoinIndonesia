import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, ChevronUp, Check } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

export interface DropdownOption {
  value: string;
  label: string;
  badge?: string;
  style?: React.CSSProperties;
  className?: string;
  labelStyle?: React.CSSProperties;
  labelClassName?: string;
}

interface CustomDropdownProps {
  label?: string;
  options: DropdownOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  buttonClassName?: string;
  buttonStyle?: React.CSSProperties;
  id?: string;
}

export const CustomDropdown: React.FC<CustomDropdownProps> = ({
  label,
  options,
  value,
  onChange,
  placeholder = 'Pilih opsi...',
  className = '',
  buttonClassName = '',
  buttonStyle,
  id,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const { isDark } = useTheme();

  const selectedOption = options.find((opt) => opt.value === value);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSelect = (val: string) => {
    onChange(val);
    setIsOpen(false);
  };

  return (
    <div className={`relative w-full ${className}`} ref={containerRef} id={id}>
      {label && (
        <label className={`block font-bold text-xs mb-1.5 ${
          isDark ? 'text-slate-200' : 'text-slate-700'
        }`}>
          {label}
        </label>
      )}

      {/* Main Trigger Button styled exactly as image preview */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        style={buttonStyle}
        className={`w-full px-4 py-3 rounded-2xl flex items-center justify-between text-left font-medium text-xs sm:text-sm transition-all duration-200 cursor-pointer select-none outline-none border ${
          isOpen
            ? 'border-[#F7B425] shadow-lg shadow-[#F7B425]/15'
            : isDark 
              ? 'border-[#3a3a3a] hover:border-[#F7B425]' 
              : 'border-amber-500 hover:border-amber-600'
        } ${
          isDark
            ? 'bg-[#1e1e1e] text-white'
            : 'bg-white text-slate-900 shadow-sm'
        } ${buttonClassName}`}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span className="truncate pr-2 font-semibold">
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {selectedOption?.badge && (
            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#F7B425]/20 text-[#F7B425] border border-[#F7B425]/40">
              {selectedOption.badge}
            </span>
          )}
          {isOpen ? (
            <ChevronUp className="w-5 h-5 text-[#F7B425] stroke-[2.5]" />
          ) : (
            <ChevronDown className="w-5 h-5 text-[#F7B425] stroke-[2.5]" />
          )}
        </div>
      </button>

      {/* Options Panel matching screenshot golden border and pill items */}
      {isOpen && (
        <div
          className={`absolute left-0 right-0 mt-2 z-50 p-2 rounded-2xl border border-[#F7B425] shadow-2xl space-y-1.5 animate-in fade-in slide-in-from-top-2 duration-150 ${
            isDark
              ? 'bg-[#0E0E0E] shadow-black/90'
              : 'bg-white shadow-xl'
          }`}
          role="listbox"
        >
          {options.map((option) => {
            const isSelected = option.value === value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => handleSelect(option.value)}
                style={option.style}
                className={`w-full px-4 py-3 rounded-xl flex items-center justify-between text-left text-xs sm:text-sm font-semibold transition-all duration-150 cursor-pointer ${option.className || ''} ${
                  isSelected
                    ? 'bg-[#F7B425] text-white font-black shadow-md'
                    : isDark
                      ? 'bg-[#0B0B0B] border border-[#F7B425]/70 text-white hover:bg-white/10 hover:border-[#F7B425]'
                      : 'bg-slate-50 border border-amber-400 text-slate-800 hover:bg-amber-50'
                }`}
                role="option"
                aria-selected={isSelected}
              >
                <span className={`truncate pr-2 ${option.labelClassName || ''}`} style={option.labelStyle}>
                  {option.label}
                </span>
                {isSelected && (
                  <Check className="w-4 h-4 text-white stroke-[3] flex-shrink-0" />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
