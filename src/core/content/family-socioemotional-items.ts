import { FamilySocioemotionalAxis, BigFiveDomain } from '../types';

export interface FamilySocioemotionalItem {
    id: number;
    text: string;
    axis: FamilySocioemotionalAxis;
}

/**
 * Instrumento de Avaliação Socioemocional de Relato Familiar (Heteroavaliação)
 * 15 itens, escala Likert 1-5 (armazenada como 0-4)
 * Modelo: Big Five x CASEL
 */
export const FAMILY_SOCIOEMOTIONAL_ITEMS: FamilySocioemotionalItem[] = [
    // Eixo I: Autogestão e Conscienciosidade (Regulação da Ação)
    {
        id: 1,
        text: 'O(a) estudante consegue iniciar e concluir suas tarefas escolares em casa sem a necessidade de cobranças constantes.',
        axis: FamilySocioemotionalAxis.AUTOGESTAO,
    },
    {
        id: 2,
        text: 'Diante de uma tarefa longa ou difícil, mantém o esforço e não desiste nos primeiros obstáculos.',
        axis: FamilySocioemotionalAxis.AUTOGESTAO,
    },
    {
        id: 3,
        text: 'Mantém seus materiais, rotinas e espaços de estudo organizados de forma autônoma.',
        axis: FamilySocioemotionalAxis.AUTOGESTAO,
    },

    // Eixo II: Resiliência e Estabilidade Emocional (Regulação da Emoção)
    {
        id: 4,
        text: 'Recupera-se com facilidade após receber uma crítica, correção ou ao enfrentar uma situação de perda (ex: em jogos).',
        axis: FamilySocioemotionalAxis.RESILIENCIA,
    },
    {
        id: 5,
        text: 'Consegue expressar raiva ou frustração por meio de palavras, evitando comportamentos agressivos físicos ou explosões desproporcionais.',
        axis: FamilySocioemotionalAxis.RESILIENCIA,
    },
    {
        id: 6,
        text: 'Adapta-se rapidamente a mudanças inesperadas na rotina sem apresentar ansiedade paralisante.',
        axis: FamilySocioemotionalAxis.RESILIENCIA,
    },

    // Eixo III: Amabilidade e Consciência Social (Empatia)
    {
        id: 7,
        text: 'Demonstra preocupação genuína ao perceber que um familiar, colega ou animal está triste ou machucado.',
        axis: FamilySocioemotionalAxis.AMABILIDADE,
    },
    {
        id: 8,
        text: 'É capaz de ceder a própria vez ou compartilhar seus pertences para o benefício do grupo escolar ou familiar.',
        axis: FamilySocioemotionalAxis.AMABILIDADE,
    },
    {
        id: 9,
        text: 'Escuta atentamente a opinião dos outros, mesmo quando contrária à sua, antes de argumentar.',
        axis: FamilySocioemotionalAxis.AMABILIDADE,
    },

    // Eixo IV: Engajamento Social e Habilidades Relacionais (Extroversão)
    {
        id: 10,
        text: 'Inicia conversas e interações com outras crianças e adultos com naturalidade e confiança.',
        axis: FamilySocioemotionalAxis.ENGAJAMENTO_SOCIAL,
    },
    {
        id: 11,
        text: 'Resolve conflitos com irmãos ou colegas por meio do diálogo, negociando soluções em vez de impor sua vontade.',
        axis: FamilySocioemotionalAxis.ENGAJAMENTO_SOCIAL,
    },
    {
        id: 12,
        text: 'Trabalha bem em equipe, assumindo responsabilidades e encorajando os demais membros do grupo.',
        axis: FamilySocioemotionalAxis.ENGAJAMENTO_SOCIAL,
    },

    // Eixo V: Abertura ao Novo e Tomada de Decisão (Curiosidade Cognitiva)
    {
        id: 13,
        text: 'Demonstra curiosidade por temas diversos, fazendo perguntas complexas sobre como o mundo, a natureza ou a sociedade funcionam.',
        axis: FamilySocioemotionalAxis.ABERTURA,
    },
    {
        id: 14,
        text: 'Antes de tomar uma atitude que afeta outras pessoas, pausa para refletir sobre as possíveis consequências de seus atos.',
        axis: FamilySocioemotionalAxis.ABERTURA,
    },
    {
        id: 15,
        text: 'Mostra-se receptivo a experimentar novos métodos de estudo, novos alimentos ou novas atividades culturais.',
        axis: FamilySocioemotionalAxis.ABERTURA,
    },
];

export interface FamilySocioemotionalAxisInfo {
    label: string;
    description: string;
    caselCompetence: string;
    bigFiveDomain: BigFiveDomain;
    itemIds: number[];
}

/** Metadados dos 5 eixos com mapeamento Big Five e CASEL */
export const FAMILY_SOCIOEMOTIONAL_AXES_INFO: Record<FamilySocioemotionalAxis, FamilySocioemotionalAxisInfo> = {
    [FamilySocioemotionalAxis.AUTOGESTAO]: {
        label: 'Autogestão e Conscienciosidade',
        description: 'Capacidade de postergar gratificações, organizar demandas e sustentar o foco.',
        caselCompetence: 'Autogestão',
        bigFiveDomain: BigFiveDomain.CONSCIENCIOSIDADE,
        itemIds: [1, 2, 3],
    },
    [FamilySocioemotionalAxis.RESILIENCIA]: {
        label: 'Resiliência e Estabilidade Emocional',
        description: 'Flexibilidade cognitiva diante de estressores e capacidade de modular respostas afetivas.',
        caselCompetence: 'Autoconhecimento',
        bigFiveDomain: BigFiveDomain.ESTABILIDADE,
        itemIds: [4, 5, 6],
    },
    [FamilySocioemotionalAxis.AMABILIDADE]: {
        label: 'Amabilidade e Consciência Social',
        description: 'Capacidade de leitura de estados mentais alheios e inclinação à cooperação.',
        caselCompetence: 'Consciência Social',
        bigFiveDomain: BigFiveDomain.AMABILIDADE,
        itemIds: [7, 8, 9],
    },
    [FamilySocioemotionalAxis.ENGAJAMENTO_SOCIAL]: {
        label: 'Engajamento Social e Habilidades Relacionais',
        description: 'Assertividade, proatividade nas interações sociais e resolução de conflitos.',
        caselCompetence: 'Habilidades de Relacionamento',
        bigFiveDomain: BigFiveDomain.EXTROVERSAO,
        itemIds: [10, 11, 12],
    },
    [FamilySocioemotionalAxis.ABERTURA]: {
        label: 'Abertura ao Novo e Tomada de Decisão',
        description: 'Receptividade a novas experiências e avaliação ética das próprias escolhas.',
        caselCompetence: 'Tomada de Decisão Responsável',
        bigFiveDomain: BigFiveDomain.ABERTURA,
        itemIds: [13, 14, 15],
    },
};

/** Labels da escala Likert para o QuestionCard (5 pontos, 0-indexed) */
export const FAMILY_SOCIOEMOTIONAL_LABELS = [
    'Nunca',
    'Raramente',
    'Algumas Vezes',
    'Frequentemente',
    'Quase Sempre',
];

/** Zone labels e cores */
export const FAMILY_SOCIOEMOTIONAL_ZONE_LABELS: Record<string, { label: string; color: string; bg: string; border: string; text: string }> = {
    MAESTRIA: {
        label: 'Zona de Maestria',
        color: '#10b981',
        bg: 'bg-emerald-50',
        border: 'border-emerald-200',
        text: 'text-emerald-700',
    },
    PROXIMAL: {
        label: 'Zona de Desenvolvimento Proximal',
        color: '#f59e0b',
        bg: 'bg-amber-50',
        border: 'border-amber-200',
        text: 'text-amber-700',
    },
    ATENCAO: {
        label: 'Zona de Atenção Pedagógica',
        color: '#f43f5e',
        bg: 'bg-rose-50',
        border: 'border-rose-200',
        text: 'text-rose-700',
    },
};
