'use client';

import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { cleanCPF, isValidCPF } from '@/src/lib/utils/cpf';
import { cn } from '@/lib/utils';

interface CPFInputProps {
    value: string;
    onChange: (value: string) => void;
    onValidityChange?: (isValid: boolean) => void;
    className?: string;
    placeholder?: string;
    disabled?: boolean;
    required?: boolean;
    showMask?: boolean; // Se true, mostra máscara visual (mas armazena limpo)
}

/**
 * SECURITY V7.1: Componente de input de CPF com higienização automática
 * Garante que o CPF seja sempre armazenado limpo (sem pontos e traços)
 * independente de como o usuário digita
 */
export function CPFInput({
    value,
    onChange,
    onValidityChange,
    className,
    placeholder = '000.000.000-00',
    disabled = false,
    required = false,
    showMask = true
}: CPFInputProps) {
    const [displayValue, setDisplayValue] = useState('');
    const [isValid, setIsValid] = useState<boolean | null>(null);

    useEffect(() => {
        // Atualizar display quando value externo mudar
        if (showMask && value) {
            setDisplayValue(formatCPF(value));
        } else {
            setDisplayValue(value);
        }
    }, [value, showMask]);

    const formatCPF = (cpf: string): string => {
        const cleaned = cleanCPF(cpf);
        if (cleaned.length <= 3) return cleaned;
        if (cleaned.length <= 6) return `${cleaned.slice(0, 3)}.${cleaned.slice(3)}`;
        if (cleaned.length <= 9) return `${cleaned.slice(0, 3)}.${cleaned.slice(3, 6)}.${cleaned.slice(6)}`;
        return `${cleaned.slice(0, 3)}.${cleaned.slice(3, 6)}.${cleaned.slice(6, 9)}-${cleaned.slice(9, 11)}`;
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const input = e.target.value;

        // SECURITY: Sempre limpar CPF antes de processar
        const cleaned = cleanCPF(input);

        // Limitar a 11 dígitos
        const limited = cleaned.slice(0, 11);

        // Validar CPF se tiver 11 dígitos
        let validity: boolean | null = null;
        if (limited.length === 11) {
            validity = isValidCPF(limited);
            setIsValid(validity);
            onValidityChange?.(validity);
        } else {
            setIsValid(null);
            onValidityChange?.(false);
        }

        // Atualizar display com máscara (se habilitado)
        if (showMask) {
            setDisplayValue(formatCPF(limited));
        } else {
            setDisplayValue(limited);
        }

        // SECURITY: Callback sempre recebe CPF LIMPO
        onChange(limited);
    };

    const handleBlur = () => {
        // Validar no blur se tiver conteúdo
        if (displayValue) {
            const cleaned = cleanCPF(displayValue);
            if (cleaned.length === 11) {
                const validity = isValidCPF(cleaned);
                setIsValid(validity);
                onValidityChange?.(validity);
            } else if (cleaned.length > 0) {
                setIsValid(false);
                onValidityChange?.(false);
            }
        }
    };

    return (
        <div className="relative">
            <Input
                type="text"
                value={displayValue}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder={placeholder}
                disabled={disabled}
                required={required}
                className={cn(
                    className,
                    isValid === false && 'border-red-500 focus-visible:ring-red-500',
                    isValid === true && 'border-green-500 focus-visible:ring-green-500'
                )}
                maxLength={showMask ? 14 : 11} // Com máscara: 000.000.000-00 (14 chars)
            />
            {isValid === false && (
                <p className="text-xs text-red-500 mt-1">CPF inválido</p>
            )}
            {isValid === true && (
                <p className="text-xs text-green-600 mt-1">✓ CPF válido</p>
            )}
        </div>
    );
}
