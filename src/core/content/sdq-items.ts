import { SDQSubscale, SDQBand, SDQVersion } from '../types';

export interface SDQItem {
    id: number;
    text: string;
    subscale: SDQSubscale;
    reversed: boolean;
}

/**
 * SDQ - 25 items in Portuguese (Brazilian)
 * Scale: 0 (Falso), 1 (Mais ou menos), 2 (Verdadeiro)
 * Reverse-scored items: 7, 11, 14, 21, 25
 */
export const SDQ_ITEMS: SDQItem[] = [
    // Comportamento Pró-Social (items 1, 4, 9, 17, 20)
    { id: 1,  text: 'Tem consideração pelos sentimentos de outras pessoas', subscale: SDQSubscale.PROSOCIAL, reversed: false },
    { id: 4,  text: 'Tem boa vontade em compartilhar doces, brinquedos, lápis, etc. com outras crianças', subscale: SDQSubscale.PROSOCIAL, reversed: false },
    { id: 9,  text: 'É prestativo(a) quando alguém está machucado, doente ou chateado', subscale: SDQSubscale.PROSOCIAL, reversed: false },
    { id: 17, text: 'É gentil com crianças mais novas', subscale: SDQSubscale.PROSOCIAL, reversed: false },
    { id: 20, text: 'Frequentemente se oferece para ajudar outras pessoas (pais, professores, outras crianças)', subscale: SDQSubscale.PROSOCIAL, reversed: false },

    // Hiperatividade (items 2, 10, 15, 21, 25)
    { id: 2,  text: 'Não consegue parar sentado(a) quando é necessário; se mexe muito, fica irrequieto(a)', subscale: SDQSubscale.HYPERACTIVITY, reversed: false },
    { id: 10, text: 'Está constantemente agitado(a) ou se mexendo', subscale: SDQSubscale.HYPERACTIVITY, reversed: false },
    { id: 15, text: 'Facilmente distraído(a), perde a concentração', subscale: SDQSubscale.HYPERACTIVITY, reversed: false },
    { id: 21, text: 'Pensa nas coisas antes de fazê-las', subscale: SDQSubscale.HYPERACTIVITY, reversed: true },
    { id: 25, text: 'Completa as tarefas que começa, tem boa capacidade de atenção', subscale: SDQSubscale.HYPERACTIVITY, reversed: true },

    // Sintomas Emocionais (items 3, 8, 13, 16, 24)
    { id: 3,  text: 'Queixa-se frequentemente de dores de cabeça, de estômago ou de enjoo', subscale: SDQSubscale.EMOTIONAL, reversed: false },
    { id: 8,  text: 'Tem muitas preocupações, frequentemente parece preocupado(a)', subscale: SDQSubscale.EMOTIONAL, reversed: false },
    { id: 13, text: 'Frequentemente parece infeliz, desanimado(a) ou choroso(a)', subscale: SDQSubscale.EMOTIONAL, reversed: false },
    { id: 16, text: 'É nervoso(a) ou inseguro(a) em situações novas, facilmente perde a confiança', subscale: SDQSubscale.EMOTIONAL, reversed: false },
    { id: 24, text: 'Tem muitos medos, assusta-se facilmente', subscale: SDQSubscale.EMOTIONAL, reversed: false },

    // Problemas de Conduta (items 5, 7, 12, 18, 22)
    { id: 5,  text: 'Frequentemente tem acessos de raiva ou crises de birra', subscale: SDQSubscale.CONDUCT, reversed: false },
    { id: 7,  text: 'Geralmente é obediente, normalmente faz o que os adultos pedem', subscale: SDQSubscale.CONDUCT, reversed: true },
    { id: 12, text: 'Frequentemente briga com outras crianças ou as persegue', subscale: SDQSubscale.CONDUCT, reversed: false },
    { id: 18, text: 'Frequentemente mente ou engana', subscale: SDQSubscale.CONDUCT, reversed: false },
    { id: 22, text: 'Rouba coisas de casa, da escola ou de outros lugares', subscale: SDQSubscale.CONDUCT, reversed: false },

    // Problemas com Colegas (items 6, 11, 14, 19, 23)
    { id: 6,  text: 'Tende a isolar-se, prefere brincar sozinho(a)', subscale: SDQSubscale.PEER, reversed: false },
    { id: 11, text: 'Tem pelo menos um(a) bom(boa) amigo(a)', subscale: SDQSubscale.PEER, reversed: true },
    { id: 14, text: 'Geralmente é querido(a) por outras crianças', subscale: SDQSubscale.PEER, reversed: true },
    { id: 19, text: 'É alvo de provocações ou perseguições de outras crianças', subscale: SDQSubscale.PEER, reversed: false },
    { id: 23, text: 'Dá-se melhor com adultos do que com outras crianças', subscale: SDQSubscale.PEER, reversed: false },
];

/** Items sorted by id for grid display */
export const SDQ_ITEMS_BY_ID = [...SDQ_ITEMS].sort((a, b) => a.id - b.id);

export interface SDQSubscaleInfo {
    label: string;
    description: string;
    itemIds: number[];
}

export const SDQ_SUBSCALES_INFO: Record<SDQSubscale, SDQSubscaleInfo> = {
    [SDQSubscale.EMOTIONAL]: {
        label: 'Sintomas Emocionais',
        description: 'Mede sintomas de ansiedade, preocupação, queixas somáticas e humor deprimido.',
        itemIds: [3, 8, 13, 16, 24],
    },
    [SDQSubscale.CONDUCT]: {
        label: 'Problemas de Conduta',
        description: 'Avalia comportamentos de oposição, desobediência, agressividade e mentira.',
        itemIds: [5, 7, 12, 18, 22],
    },
    [SDQSubscale.HYPERACTIVITY]: {
        label: 'Hiperatividade',
        description: 'Avalia inquietação, agitação, distração e impulsividade.',
        itemIds: [2, 10, 15, 21, 25],
    },
    [SDQSubscale.PEER]: {
        label: 'Problemas com Colegas',
        description: 'Mede dificuldades de relacionamento, isolamento social e vitimização.',
        itemIds: [6, 11, 14, 19, 23],
    },
    [SDQSubscale.PROSOCIAL]: {
        label: 'Comportamento Pró-Social',
        description: 'Avalia empatia, prestatividade, gentileza e compartilhamento.',
        itemIds: [1, 4, 9, 17, 20],
    },
};

interface CutoffRange {
    min: number;
    max: number;
}

interface SubscaleCutoff {
    [SDQBand.NORMAL]: CutoffRange;
    [SDQBand.BORDERLINE]: CutoffRange;
    [SDQBand.ABNORMAL]: CutoffRange;
}

export const SDQ_CUTOFFS: Record<SDQVersion, Record<SDQSubscale | 'TOTAL', SubscaleCutoff>> = {
    [SDQVersion.TEACHER]: {
        TOTAL: {
            [SDQBand.NORMAL]:     { min: 0, max: 11 },
            [SDQBand.BORDERLINE]: { min: 12, max: 15 },
            [SDQBand.ABNORMAL]:   { min: 16, max: 40 },
        },
        [SDQSubscale.EMOTIONAL]: {
            [SDQBand.NORMAL]:     { min: 0, max: 4 },
            [SDQBand.BORDERLINE]: { min: 5, max: 5 },
            [SDQBand.ABNORMAL]:   { min: 6, max: 10 },
        },
        [SDQSubscale.CONDUCT]: {
            [SDQBand.NORMAL]:     { min: 0, max: 2 },
            [SDQBand.BORDERLINE]: { min: 3, max: 3 },
            [SDQBand.ABNORMAL]:   { min: 4, max: 10 },
        },
        [SDQSubscale.HYPERACTIVITY]: {
            [SDQBand.NORMAL]:     { min: 0, max: 5 },
            [SDQBand.BORDERLINE]: { min: 6, max: 6 },
            [SDQBand.ABNORMAL]:   { min: 7, max: 10 },
        },
        [SDQSubscale.PEER]: {
            [SDQBand.NORMAL]:     { min: 0, max: 3 },
            [SDQBand.BORDERLINE]: { min: 4, max: 4 },
            [SDQBand.ABNORMAL]:   { min: 5, max: 10 },
        },
        [SDQSubscale.PROSOCIAL]: {
            [SDQBand.NORMAL]:     { min: 6, max: 10 },
            [SDQBand.BORDERLINE]: { min: 5, max: 5 },
            [SDQBand.ABNORMAL]:   { min: 0, max: 4 },
        },
    },
    [SDQVersion.PARENT]: {
        TOTAL: {
            [SDQBand.NORMAL]:     { min: 0, max: 13 },
            [SDQBand.BORDERLINE]: { min: 14, max: 16 },
            [SDQBand.ABNORMAL]:   { min: 17, max: 40 },
        },
        [SDQSubscale.EMOTIONAL]: {
            [SDQBand.NORMAL]:     { min: 0, max: 3 },
            [SDQBand.BORDERLINE]: { min: 4, max: 4 },
            [SDQBand.ABNORMAL]:   { min: 5, max: 10 },
        },
        [SDQSubscale.CONDUCT]: {
            [SDQBand.NORMAL]:     { min: 0, max: 2 },
            [SDQBand.BORDERLINE]: { min: 3, max: 3 },
            [SDQBand.ABNORMAL]:   { min: 4, max: 10 },
        },
        [SDQSubscale.HYPERACTIVITY]: {
            [SDQBand.NORMAL]:     { min: 0, max: 5 },
            [SDQBand.BORDERLINE]: { min: 6, max: 6 },
            [SDQBand.ABNORMAL]:   { min: 7, max: 10 },
        },
        [SDQSubscale.PEER]: {
            [SDQBand.NORMAL]:     { min: 0, max: 2 },
            [SDQBand.BORDERLINE]: { min: 3, max: 3 },
            [SDQBand.ABNORMAL]:   { min: 4, max: 10 },
        },
        [SDQSubscale.PROSOCIAL]: {
            [SDQBand.NORMAL]:     { min: 6, max: 10 },
            [SDQBand.BORDERLINE]: { min: 5, max: 5 },
            [SDQBand.ABNORMAL]:   { min: 0, max: 4 },
        },
    },
};

export const SDQ_BAND_LABELS: Record<SDQBand, string> = {
    [SDQBand.NORMAL]: 'Normal',
    [SDQBand.BORDERLINE]: 'Limítrofe',
    [SDQBand.ABNORMAL]: 'Anormal',
};

/** Items grouped by subscale for wizard steps */
export const SDQ_ITEMS_BY_SUBSCALE: Record<SDQSubscale, { label: string; description: string; items: number[] }> = Object.values(SDQSubscale).reduce(
    (acc, subscale) => {
        const info = SDQ_SUBSCALES_INFO[subscale];
        acc[subscale] = {
            label: info.label,
            description: info.description,
            items: info.itemIds,
        };
        return acc;
    },
    {} as Record<SDQSubscale, { label: string; description: string; items: number[] }>
);
