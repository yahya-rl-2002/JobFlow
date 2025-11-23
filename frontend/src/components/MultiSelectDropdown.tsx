import React, { useState, useRef, useEffect } from 'react'
import { FaCheckSquare, FaSquare } from 'react-icons/fa'

interface MultiSelectDropdownProps {
    options: string[]
    selected: string[]
    onChange: (selected: string[]) => void
    placeholder: string
    maxSelection?: number
    icon?: React.ReactNode
}

export default function MultiSelectDropdown({
    options,
    selected,
    onChange,
    placeholder,
    maxSelection = 3,
    icon
}: MultiSelectDropdownProps) {
    const [isOpen, setIsOpen] = useState(false)
    const [searchTerm, setSearchTerm] = useState('')
    const [isBlocked, setIsBlocked] = useState(false)
    const dropdownRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const filteredOptions = options.filter(option =>
        option.toLowerCase().includes(searchTerm.toLowerCase())
    )

    const handleSelect = (option: string) => {
        if (selected.includes(option)) {
            onChange(selected.filter(item => item !== option))
        } else {
            if (selected.length >= maxSelection) {
                setIsBlocked(true)
                setTimeout(() => setIsBlocked(false), 400) // Reset after animation
                return
            }
            onChange([...selected, option])
            setSearchTerm('') // Clear search after selection
        }
    }

    const handleRemove = (option: string, e: React.MouseEvent) => {
        e.stopPropagation()
        onChange(selected.filter(item => item !== option))
    }

    return (
        <div
            ref={dropdownRef}
            style={{ position: 'relative', flex: 1 }}
            className={isBlocked ? 'shake' : ''}
        >
            {/* Input / Trigger Area */}
            <div
                onClick={() => setIsOpen(true)}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '12px 16px',
                    backgroundColor: 'transparent',
                    cursor: 'text',
                    minHeight: '50px',
                    flexWrap: 'wrap',
                    gap: '8px'
                }}
            >
                {icon && <span style={{ color: '#9ca3af', fontSize: '1.2rem', marginRight: '8px' }}>{icon}</span>}

                {/* Selected Tags */}
                {selected.map((item) => (
                    <span
                        key={item}
                        style={{
                            backgroundColor: '#e0f2fe',
                            color: '#0284c7',
                            padding: '4px 8px',
                            borderRadius: '6px',
                            fontSize: '0.9rem',
                            fontWeight: '600',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            border: '1px solid #bae6fd'
                        }}
                    >
                        {item}
                        <button
                            onClick={(e) => handleRemove(item, e)}
                            style={{
                                border: 'none',
                                background: 'none',
                                cursor: 'pointer',
                                color: '#0284c7',
                                padding: 0,
                                display: 'flex',
                                fontSize: '1.1rem',
                                lineHeight: 1
                            }}
                        >
                            &times;
                        </button>
                    </span>
                ))}

                {/* Search Input */}
                {selected.length < maxSelection && (
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => {
                            setSearchTerm(e.target.value)
                            setIsOpen(true)
                        }}
                        onFocus={() => setIsOpen(true)}
                        placeholder={selected.length === 0 ? placeholder : ''}
                        style={{
                            border: 'none',
                            outline: 'none',
                            fontSize: '1rem',
                            flex: 1,
                            minWidth: '120px',
                            backgroundColor: 'transparent',
                            color: 'var(--text-primary)'
                        }}
                    />
                )}
            </div>

            {/* Dropdown Menu */}
            {isOpen && (
                <div style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    backgroundColor: 'white',
                    borderRadius: '12px',
                    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
                    marginTop: '8px',
                    zIndex: 50,
                    maxHeight: '300px',
                    overflowY: 'auto',
                    border: '1px solid #e5e7eb',
                    padding: '8px'
                }}>
                    {filteredOptions.length > 0 ? (
                        filteredOptions.map((option) => (
                            <div
                                key={option}
                                onClick={() => handleSelect(option)}
                                style={{
                                    padding: '10px 12px',
                                    cursor: 'pointer',
                                    borderRadius: '8px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '12px',
                                    backgroundColor: selected.includes(option) ? '#eff6ff' : 'transparent',
                                    transition: 'background-color 0.2s',
                                    marginBottom: '2px'
                                }}
                                onMouseEnter={(e) => {
                                    if (!selected.includes(option)) e.currentTarget.style.backgroundColor = '#f3f4f6'
                                }}
                                onMouseLeave={(e) => {
                                    if (!selected.includes(option)) e.currentTarget.style.backgroundColor = 'transparent'
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    {selected.includes(option) ? (
                                        <FaCheckSquare color="var(--primary-color)" size={18} />
                                    ) : (
                                        <FaSquare color="#d1d5db" size={18} />
                                    )}
                                </div>
                                <span style={{
                                    fontWeight: selected.includes(option) ? '600' : '400',
                                    color: selected.includes(option) ? 'var(--primary-color)' : 'var(--text-primary)'
                                }}>
                                    {option}
                                </span>
                            </div>
                        ))
                    ) : (
                        <div style={{ padding: '12px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                            Aucun résultat trouvé. Appuyez sur Entrée pour ajouter "{searchTerm}"
                        </div>
                    )}

                    {/* Allow adding custom term if not in list */}
                    {searchTerm && !filteredOptions.includes(searchTerm) && !selected.includes(searchTerm) && (
                        <div
                            onClick={() => handleSelect(searchTerm)}
                            style={{
                                padding: '10px 12px',
                                cursor: 'pointer',
                                borderRadius: '8px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px',
                                borderTop: '1px solid #e5e7eb',
                                marginTop: '4px',
                                color: 'var(--primary-color)',
                                fontWeight: '600'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                        >
                            <span>+ Ajouter "{searchTerm}"</span>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
