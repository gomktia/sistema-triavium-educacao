import { CharacterStrength } from '@/src/core/types';

// ============================================================
// Types
// ============================================================

export interface EvolutionDataPoint {
    window: string;
    externalizing: number;
    internalizing: number;
}

export interface HomeSuggestion {
    strengthLabel: string;
    activities: string[];
}

// ============================================================
// generateEvolutionNarrative
// ============================================================

/**
 * Gera uma narrativa em linguagem familiar sobre a evolucao
 * socioemocional do estudante ao longo das janelas de avaliacao.
 *
 * Sem jargao tecnico, sem scores de risco. Linguagem positiva
 * e acolhedora para as familias.
 */
export function generateEvolutionNarrative(data: EvolutionDataPoint[]): string {
    if (data.length === 0) {
        return '';
    }

    if (data.length === 1) {
        const entry = data[0];
        return (
            `Esta é a primeira avaliação de ${entry.window}, ` +
            'que servirá como referência para acompanhar o desenvolvimento ' +
            'do(a) seu(sua) filho(a) ao longo do ano letivo.'
        );
    }

    const first = data[0];
    const last = data[data.length - 1];
    const firstTotal = first.externalizing + first.internalizing;
    const lastTotal = last.externalizing + last.internalizing;
    const diff = lastTotal - firstTotal;

    const trajectory = describeTrajectory(diff);

    return (
        `Entre as avaliações de ${first.window} e ${last.window}, ` +
        `observamos ${trajectory}. ` +
        'A equipe pedagógica continuará acompanhando o desenvolvimento ' +
        'do(a) seu(sua) filho(a) com atenção e cuidado.'
    );
}

function describeTrajectory(diff: number): string {
    if (diff <= -3) {
        return (
            'uma melhoria significativa no bem-estar emocional e social. ' +
            'Parabéns pelo apoio da família nesse progresso'
        );
    }
    if (diff < 0) {
        return (
            'uma melhoria gradual no bem-estar emocional e social. ' +
            'Os avanços, mesmo pequenos, são muito importantes'
        );
    }
    if (diff === 0) {
        return (
            'que o desenvolvimento manteve-se estável. ' +
            'Essa consistência é um bom sinal de equilíbrio'
        );
    }
    if (diff <= 3) {
        return (
            'algumas áreas que merecem atenção no desenvolvimento emocional. ' +
            'Juntos, escola e família podem apoiar da melhor forma'
        );
    }
    return (
        'alguns aspectos que precisam de atenção especial. ' +
        'Recomendamos uma conversa com a equipe pedagógica para ' +
        'alinhar estratégias de apoio conjunto'
    );
}

// ============================================================
// getHomeSuggestions
// ============================================================

const STRENGTH_ACTIVITIES: Record<CharacterStrength, string[]> = {
    [CharacterStrength.CRIATIVIDADE]: [
        'Dediquem um tempo para projetos criativos em família, como pintura, colagem ou construção com materiais reciclados.',
        'Incentivem a escrita de histórias ou diários, valorizando a imaginação.',
        'Proponham desafios criativos no dia a dia, como inventar receitas ou criar jogos novos.',
    ],
    [CharacterStrength.CURIOSIDADE]: [
        'Visitem museus, feiras de ciências ou exposições juntos e conversem sobre o que chamou a atenção.',
        'Estimulem perguntas no dia a dia e pesquisem as respostas juntos.',
        'Leiam livros ou assistam documentários sobre temas que despertam o interesse do(a) jovem.',
    ],
    [CharacterStrength.PENSAMENTO_CRITICO]: [
        'Conversem sobre notícias e eventos atuais, pedindo a opinião do(a) jovem.',
        'Proponham jogos de lógica e estratégia, como xadrez ou quebra-cabeças.',
        'Incentivem a análise de diferentes pontos de vista em situações do cotidiano.',
    ],
    [CharacterStrength.AMOR_APRENDIZADO]: [
        'Criem juntos uma lista de temas que gostariam de aprender e explorem um por mês.',
        'Incentivem a participação em cursos, oficinas ou workshops de interesse.',
        'Valorizem as descobertas e conquistas de aprendizado, mesmo as pequenas.',
    ],
    [CharacterStrength.SENSATEZ]: [
        'Incluam o(a) jovem em decisões familiares, pedindo conselhos e opiniões.',
        'Conversem sobre situações difíceis e reflitam juntos sobre possíveis soluções.',
        'Leiam juntos histórias ou biografias de pessoas conhecidas pela sabedoria.',
    ],
    [CharacterStrength.BRAVURA]: [
        'Incentivem a participação em atividades que envolvam superar medos, como esportes ou apresentações.',
        'Compartilhem histórias de coragem da própria família e reflitam sobre o significado de ser corajoso.',
        'Elogiem momentos em que o(a) jovem demonstrou bravura no dia a dia.',
    ],
    [CharacterStrength.PERSEVERANCA]: [
        'Definam juntos metas de curto e longo prazo e acompanhem o progresso.',
        'Contem histórias sobre desafios superados pela família, valorizando a persistência.',
        'Quando houver dificuldade, ajudem a dividir o problema em etapas menores e mais alcançáveis.',
    ],
    [CharacterStrength.AUTENTICIDADE]: [
        'Criem um ambiente em casa onde todos possam expressar opiniões e sentimentos com respeito.',
        'Valorizem a honestidade e a sinceridade nas interações familiares.',
        'Conversem sobre a importância de ser verdadeiro consigo mesmo e com os outros.',
    ],
    [CharacterStrength.VITALIDADE]: [
        'Pratiquem atividades físicas em família, como caminhadas, passeios de bicicleta ou esportes.',
        'Incentivem uma rotina de sono saudável e alimentação equilibrada.',
        'Planejem atividades ao ar livre que tragam energia e alegria para todos.',
    ],
    [CharacterStrength.AMOR]: [
        'Reservem momentos do dia para demonstrar afeto e atenção, como refeições juntos.',
        'Expressem verbalmente o carinho e a importância de cada membro da família.',
        'Cultivem tradições familiares que fortaleçam os laços afetivos.',
    ],
    [CharacterStrength.BONDADE]: [
        'Participem juntos de ações voluntárias ou de ajuda a vizinhos e comunidade.',
        'Incentivem pequenos gestos de gentileza no cotidiano e reconheçam quando acontecem.',
        'Conversem sobre como as ações bondosas impactam positivamente as pessoas ao redor.',
    ],
    [CharacterStrength.INTELIGENCIA_SOCIAL]: [
        'Conversem sobre emoções e sentimentos, ajudando a identificar o que os outros podem estar sentindo.',
        'Incentivem a participação em atividades em grupo, como esportes coletivos ou grupos de estudo.',
        'Pratiquem a escuta ativa durante as conversas em família.',
    ],
    [CharacterStrength.CIDADANIA]: [
        'Participem de atividades comunitárias ou projetos sociais em família.',
        'Conversem sobre direitos e deveres, incentivando a participação responsável na comunidade.',
        'Valorizem o trabalho em equipe dentro de casa, dividindo responsabilidades.',
    ],
    [CharacterStrength.IMPARCIALIDADE]: [
        'Incentivem a mediação de conflitos entre irmãos ou amigos, buscando soluções justas.',
        'Conversem sobre situações injustas e reflitam juntos sobre o que seria o mais justo.',
        'Valorizem o tratamento igualitário nas relações familiares.',
    ],
    [CharacterStrength.LIDERANCA]: [
        'Deem oportunidades para o(a) jovem liderar atividades em família, como planejar um passeio ou organizar um evento.',
        'Incentivem a participação em grêmios estudantis, projetos ou grupos de liderança.',
        'Conversem sobre líderes admiráveis e as qualidades que os tornam inspiradores.',
    ],
    [CharacterStrength.PERDAO]: [
        'Pratiquem o diálogo aberto quando houver desentendimentos em família, buscando a reconciliação.',
        'Conversem sobre a importância do perdão para o bem-estar emocional de todos.',
        'Demonstrem, como exemplo, a capacidade de perdoar e seguir em frente.',
    ],
    [CharacterStrength.MODESTIA]: [
        'Valorizem as conquistas do(a) jovem sem comparações com outros, focando no esforço pessoal.',
        'Incentivem o reconhecimento das contribuições de todos nos projetos em família.',
        'Conversem sobre a importância de aprender com os outros e reconhecer seus méritos.',
    ],
    [CharacterStrength.PRUDENCIA]: [
        'Envolvam o(a) jovem no planejamento de atividades familiares, incentivando a pensar antes de agir.',
        'Conversem sobre consequências de decisões e a importância de avaliar as opções.',
        'Incentivem o hábito de refletir antes de tomar decisões importantes.',
    ],
    [CharacterStrength.AUTORREGULACAO]: [
        'Ajudem a criar uma rotina organizada com horários para estudo, lazer e descanso.',
        'Pratiquem juntos técnicas de respiração ou relaxamento em momentos de estresse.',
        'Incentivem o(a) jovem a identificar suas emoções e escolher formas saudáveis de lidar com elas.',
    ],
    [CharacterStrength.APRECIACAO_BELO]: [
        'Visitem juntos exposições de arte, concertos ou espetáculos culturais.',
        'Observem a natureza juntos, apreciando paisagens, jardins ou o céu estrelado.',
        'Incentivem a expressão artística, como desenho, música ou fotografia.',
    ],
    [CharacterStrength.GRATIDAO]: [
        'Criem o hábito de compartilhar, no jantar ou antes de dormir, algo pelo qual são gratos no dia.',
        'Escrevam juntos cartas ou mensagens de agradecimento para pessoas importantes.',
        'Valorizem os momentos simples e conversem sobre as coisas boas da vida.',
    ],
    [CharacterStrength.HUMOR]: [
        'Reservem momentos para rir juntos, como assistir comédias ou contar piadas.',
        'Incentivem o bom humor no dia a dia, sem ridicularizar os outros.',
        'Relembrem juntos momentos engraçados da família para fortalecer os laços.',
    ],
    [CharacterStrength.ESPERANCA]: [
        'Conversem sobre sonhos e planos para o futuro, ajudando a traçar caminhos para alcançá-los.',
        'Compartilhem histórias de superação e resiliência da família.',
        'Cultivem o otimismo diante de dificuldades, focando nas possibilidades e soluções.',
    ],
    [CharacterStrength.ESPIRITUALIDADE]: [
        'Reservem momentos de reflexão em família sobre valores e propósito de vida.',
        'Pratiquem juntos atividades contemplativas, como meditação ou momentos de silêncio.',
        'Conversem sobre o que dá sentido e significado à vida de cada membro da família.',
    ],
};

const FALLBACK_ACTIVITIES: string[] = [
    'Conversem em família sobre os pontos fortes do(a) jovem e como aplicá-los no dia a dia.',
    'Incentivem atividades que permitam ao(à) jovem explorar e desenvolver suas habilidades.',
    'Celebrem juntos as conquistas e os esforços, fortalecendo a autoconfiança.',
];

/**
 * Retorna sugestoes de atividades praticas para a familia
 * com base nas forcas de carater do estudante.
 */
export function getHomeSuggestions(
    strengths: { strength: CharacterStrength; label: string }[],
): HomeSuggestion[] {
    return strengths.map(function mapStrengthToSuggestion({ strength, label }) {
        const activities = STRENGTH_ACTIVITIES[strength] ?? FALLBACK_ACTIVITIES;

        return {
            strengthLabel: label,
            activities,
        };
    });
}
