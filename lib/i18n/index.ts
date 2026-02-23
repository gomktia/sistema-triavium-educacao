import { ptBR } from './pt-BR';

export type Locale = 'pt-BR';

const translations = {
    'pt-BR': ptBR,
} as const;

export function t(locale: Locale = 'pt-BR') {
    return translations[locale];
}
