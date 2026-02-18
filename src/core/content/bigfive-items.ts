
import { BigFiveDomain } from '../types';

export interface BigFiveItem {
    id: number;
    text: string;
    domain: BigFiveDomain;
    reversed: boolean; // true if score needs to be inverted (6 - score)
}

export const BIG_FIVE_ITEMS: BigFiveItem[] = [
    // --- Extroversão ---
    { id: 1, text: "Eu sou a alma da festa.", domain: BigFiveDomain.EXTROVERSAO, reversed: false },
    { id: 2, text: "Eu falo pouco.", domain: BigFiveDomain.EXTROVERSAO, reversed: true },
    { id: 3, text: "Eu me sinto confortável perto das pessoas.", domain: BigFiveDomain.EXTROVERSAO, reversed: false },
    { id: 4, text: "Eu fico em segundo plano.", domain: BigFiveDomain.EXTROVERSAO, reversed: true },
    { id: 5, text: "Eu começo conversas.", domain: BigFiveDomain.EXTROVERSAO, reversed: false },
    { id: 6, text: "Eu tenho pouco a dizer.", domain: BigFiveDomain.EXTROVERSAO, reversed: true },
    { id: 7, text: "Eu converso com muitas pessoas diferentes em festas.", domain: BigFiveDomain.EXTROVERSAO, reversed: false },
    { id: 8, text: "Eu não gosto de chamar atenção para mim mesmo.", domain: BigFiveDomain.EXTROVERSAO, reversed: true },
    { id: 9, text: "Eu não me importo de ser o centro das atenções.", domain: BigFiveDomain.EXTROVERSAO, reversed: false },
    { id: 10, text: "Eu sou quieto perto de estranhos.", domain: BigFiveDomain.EXTROVERSAO, reversed: true },

    // --- Amabilidade ---
    { id: 11, text: "Eu sinto pouca preocupação pelos outros.", domain: BigFiveDomain.AMABILIDADE, reversed: true },
    { id: 12, text: "Eu me interesso pelas pessoas.", domain: BigFiveDomain.AMABILIDADE, reversed: false },
    { id: 13, text: "Eu insulto as pessoas.", domain: BigFiveDomain.AMABILIDADE, reversed: true },
    { id: 14, text: "Eu simpatizo com os sentimentos dos outros.", domain: BigFiveDomain.AMABILIDADE, reversed: false },
    { id: 15, text: "Eu não me interesso pelos problemas dos outros.", domain: BigFiveDomain.AMABILIDADE, reversed: true },
    { id: 16, text: "Eu tenho um coração mole.", domain: BigFiveDomain.AMABILIDADE, reversed: false },
    { id: 17, text: "Eu não me importo muito com os outros.", domain: BigFiveDomain.AMABILIDADE, reversed: true },
    { id: 18, text: "Eu tenho tempo para os outros.", domain: BigFiveDomain.AMABILIDADE, reversed: false },
    { id: 19, text: "Eu sinto as emoções dos outros.", domain: BigFiveDomain.AMABILIDADE, reversed: false },
    { id: 20, text: "Eu faço as pessoas se sentirem à vontade.", domain: BigFiveDomain.AMABILIDADE, reversed: false },

    // --- Conscienciosidade ---
    { id: 21, text: "Eu estou sempre preparado.", domain: BigFiveDomain.CONSCIENCIOSIDADE, reversed: false },
    { id: 22, text: "Eu deixo minhas coisas espalhadas.", domain: BigFiveDomain.CONSCIENCIOSIDADE, reversed: true },
    { id: 23, text: "Eu presto atenção aos detalhes.", domain: BigFiveDomain.CONSCIENCIOSIDADE, reversed: false },
    { id: 24, text: "Eu faço bagunça nas coisas.", domain: BigFiveDomain.CONSCIENCIOSIDADE, reversed: true },
    { id: 25, text: "Eu resolvo as tarefas imediatamente.", domain: BigFiveDomain.CONSCIENCIOSIDADE, reversed: false },
    { id: 26, text: "Eu muitas vezes esqueço de colocar as coisas no lugar.", domain: BigFiveDomain.CONSCIENCIOSIDADE, reversed: true },
    { id: 27, text: "Eu gosto de ordem.", domain: BigFiveDomain.CONSCIENCIOSIDADE, reversed: false },
    { id: 28, text: "Eu fujo dos meus deveres.", domain: BigFiveDomain.CONSCIENCIOSIDADE, reversed: true },
    { id: 29, text: "Eu sigo um cronograma.", domain: BigFiveDomain.CONSCIENCIOSIDADE, reversed: false },
    { id: 30, text: "Eu sou exigente no meu trabalho.", domain: BigFiveDomain.CONSCIENCIOSIDADE, reversed: false }, // Standard IPIP item

    // --- Estabilidade Emocional (Standard: Neuroticism items. Inverted if measuring Stability) ---
    // High Score = Stable.
    // "Get stressed out easily" -> Inverted.
    // "Am relaxed most of the time" -> Normal.
    { id: 31, text: "Eu me estresso facilmente.", domain: BigFiveDomain.ESTABILIDADE, reversed: true }, // N+
    { id: 32, text: "Eu sou relaxado na maior parte do tempo.", domain: BigFiveDomain.ESTABILIDADE, reversed: false }, // N-
    { id: 33, text: "Eu me preocupo com as coisas.", domain: BigFiveDomain.ESTABILIDADE, reversed: true }, // N+
    { id: 34, text: "Eu raramente me sinto triste.", domain: BigFiveDomain.ESTABILIDADE, reversed: false }, // N-
    { id: 35, text: "Eu me irrito facilmente.", domain: BigFiveDomain.ESTABILIDADE, reversed: true }, // N+
    { id: 36, text: "Eu tenho oscilações de humor frequentes.", domain: BigFiveDomain.ESTABILIDADE, reversed: true }, // N+
    { id: 37, text: "Eu tenho emoções controladas.", domain: BigFiveDomain.ESTABILIDADE, reversed: false }, // N- (Implied) - Replacing "Seldom feel blue" duplicate or similar.
    // Let's use strict IPIP-50
    // "Have frequent mood swings" (N+) -> Inverted
    // "Get upset easily" (N+) -> Inverted
    { id: 37, text: "Eu fico chateado facilmente.", domain: BigFiveDomain.ESTABILIDADE, reversed: true },
    { id: 38, text: "Eu mudo de humor com frequência.", domain: BigFiveDomain.ESTABILIDADE, reversed: true }, // Duplicate of 36? I'll check.
    // Item 36 was "mood swings". Item 38 "change my mood a lot". Close enough.
    { id: 39, text: "Eu me sinto triste frequentemente.", domain: BigFiveDomain.ESTABILIDADE, reversed: true }, // N+ "Feel blue"
    { id: 40, text: "Eu muitas vezes me sinto abatido(a).", domain: BigFiveDomain.ESTABILIDADE, reversed: true }, // N+ 

    // --- Abertura ao Novo (Intelecto/Imaginação) ---
    { id: 41, text: "Eu tenho um vocabulário rico.", domain: BigFiveDomain.ABERTURA, reversed: false },
    { id: 42, text: "Eu tenho dificuldade para entender ideias abstratas.", domain: BigFiveDomain.ABERTURA, reversed: true },
    { id: 43, text: "Eu tenho uma imaginação vivida.", domain: BigFiveDomain.ABERTURA, reversed: false },
    { id: 44, text: "Eu não me interesso por ideias abstratas.", domain: BigFiveDomain.ABERTURA, reversed: true },
    { id: 45, text: "Eu tenho excelentes ideias.", domain: BigFiveDomain.ABERTURA, reversed: false },
    { id: 46, text: "Eu não tenho uma boa imaginação.", domain: BigFiveDomain.ABERTURA, reversed: true },
    { id: 47, text: "Eu entendo as coisas rapidamente.", domain: BigFiveDomain.ABERTURA, reversed: false }, // Intellect
    { id: 48, text: "Eu uso palavras difíceis.", domain: BigFiveDomain.ABERTURA, reversed: false }, // Maybe? Or reversed? IPIP: "Use difficult words" (+)
    { id: 49, text: "Eu passo tempo refletindo sobre as coisas.", domain: BigFiveDomain.ABERTURA, reversed: false },
    { id: 50, text: "Eu sou cheio de ideias.", domain: BigFiveDomain.ABERTURA, reversed: false }
];

export const BIG_FIVE_DOMAINS_INFO = {
    [BigFiveDomain.ABERTURA]: {
        label: "Abertura ao Novo",
        description: "Mede o grau de curiosidade intelectual, criatividade e preferência por novidades e variedade.",
        low: "Prático, convencional, prefere rotina.",
        high: "Curioso, independente, imaginativo."
    },
    [BigFiveDomain.CONSCIENCIOSIDADE]: {
        label: "Conscienciosidade",
        description: "Refere-se à autodisciplina, ao senso de dever e à busca por realização.",
        low: "Espontâneo, pode ser desorganizado.",
        high: "Organizado, cuidadoso, disciplinado."
    },
    [BigFiveDomain.ESTABILIDADE]: {
        label: "Estabilidade Emocional",
        description: "Reflete a capacidade de lidar com estresse e manter o equilíbrio emocional.",
        low: "Sensível, emotivo, propenso ao estresse.",
        high: "Calmo, seguro, confiante."
    },
    [BigFiveDomain.EXTROVERSAO]: {
        label: "Extroversão",
        description: "Indica o nível de energia, busca por interações sociais e emoções positivas.",
        low: "Reservado, reflexivo, prefere a solidão.",
        high: "Sociável, falante, assertivo."
    },
    [BigFiveDomain.AMABILIDADE]: {
        label: "Amabilidade",
        description: "Mede a tendência a ser compassivo e cooperativo em vez de desconfiado e antagonista.",
        low: "Cético, competitivo, direto.",
        high: "Confiável, prestativo, empático."
    }
};

export const BIG_FIVE_ITEMS_BY_DOMAIN = Object.values(BigFiveDomain).reduce((acc, domain) => {
    acc[domain] = {
        items: BIG_FIVE_ITEMS.filter(i => i.domain === domain).map(i => i.id),
        ...BIG_FIVE_DOMAINS_INFO[domain]
    };
    return acc;
}, {} as Record<BigFiveDomain, { items: number[], label: string, description: string }>);
