
export enum MessageRiskLevel {
    HIGH = 'HIGH',
    MEDIUM = 'MEDIUM',
    LOW = 'LOW',
    NONE = 'NONE'
}

const HIGH_RISK_KEYWORDS = [
    'matar', 'suicidio', 'suicídio', 'morrer', 'acabar com tudo', 'não aguento mais',
    'vontade de sumir', 'me cortar', 'cortar os pulsos', 'arma', 'faca', 'sangue',
    'abuso', 'estupro', 'assédio', 'agressão', 'espancado'
];

const MEDIUM_RISK_KEYWORDS = [
    'triste', 'depressão', 'ansiedade', 'choro', 'chorando', 'sozinho', 'solidão',
    'bullying', 'brigaram comigo', 'me bateram', 'medo', 'pânico', 'excluído',
    'ninguém gosta de mim', 'inútil', 'fracasso', 'fugir'
];

export function analyzeMessageRisk(text: string): MessageRiskLevel {
    const lower = text.toLowerCase();

    if (HIGH_RISK_KEYWORDS.some(k => lower.includes(k))) return MessageRiskLevel.HIGH;
    if (MEDIUM_RISK_KEYWORDS.some(k => lower.includes(k))) return MessageRiskLevel.MEDIUM;

    return MessageRiskLevel.LOW;
}
