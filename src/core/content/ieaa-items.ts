
import { IEAADimension, IEAAProfile, IEAALevel } from '../types';

export interface IEAAItem {
    id: number;
    text: string;
    dimension: IEAADimension;
}

// 50 items do IEAA - Inventário de Estratégias de Aprendizagem e Autorregulação
export const IEAA_ITEMS: IEAAItem[] = [
    // Dimensão I: Estratégias Cognitivas (Processamento de Informação) - Itens 1-12
    { id: 1, text: "Ao estudar, relaciono as novas informações com conhecimentos que já possuo de outras disciplinas.", dimension: IEAADimension.COGNITIVA },
    { id: 2, text: "Costumo sublinhar ou destacar partes importantes dos textos para facilitar a memorização.", dimension: IEAADimension.COGNITIVA },
    { id: 3, text: "Consigo sintetizar as ideias principais de um capítulo em um esquema ou mapa mental próprio.", dimension: IEAADimension.COGNITIVA },
    { id: 4, text: "Reviso meus apontamentos de aula regularmente, mesmo quando não há avaliações próximas.", dimension: IEAADimension.COGNITIVA },
    { id: 5, text: "Quando encontro termos técnicos desconhecidos, busco imediatamente o significado em fontes confiáveis.", dimension: IEAADimension.COGNITIVA },
    { id: 6, text: "Tento explicar o conteúdo estudado para mim mesmo ou para colegas como forma de validar minha compreensão.", dimension: IEAADimension.COGNITIVA },
    { id: 7, text: "Utilizo mnemônicos ou associações criativas para memorizar fórmulas ou conceitos complexos.", dimension: IEAADimension.COGNITIVA },
    { id: 8, text: "Ao ler um texto acadêmico, foco mais na estrutura lógica dos argumentos do que em fatos isolados.", dimension: IEAADimension.COGNITIVA },
    { id: 9, text: "Pratico a resolução de exercícios exaustivamente para automatizar processos procedimentais.", dimension: IEAADimension.COGNITIVA },
    { id: 10, text: "Organizo o conteúdo de estudo em categorias ou tópicos hierárquicos para facilitar a recuperação da memória.", dimension: IEAADimension.COGNITIVA },
    { id: 11, text: "Costumo antecipar possíveis perguntas de prova enquanto estudo um tema novo.", dimension: IEAADimension.COGNITIVA },
    { id: 12, text: "Busco fontes complementares (vídeos, artigos, podcasts) para aprofundar o que foi visto em sala de aula.", dimension: IEAADimension.COGNITIVA },

    // Dimensão II: Metacognição (Monitoramento e Regulação) - Itens 13-24
    { id: 13, text: "Antes de iniciar uma tarefa, avalio o tempo e o esforço necessários para concluí-la.", dimension: IEAADimension.METACOGNITIVA },
    { id: 14, text: "Durante a leitura, percebo rapidamente quando perco o foco e retorno ao ponto de distração.", dimension: IEAADimension.METACOGNITIVA },
    { id: 15, text: "Ajusto meu método de estudo dependendo da natureza da disciplina (ex: Humanas vs. Exatas).", dimension: IEAADimension.METACOGNITIVA },
    { id: 16, text: "Avalio meu desempenho após as avaliações para identificar quais estratégias de estudo funcionaram.", dimension: IEAADimension.METACOGNITIVA },
    { id: 17, text: "Estabeleço metas claras e realistas para cada sessão de estudo.", dimension: IEAADimension.METACOGNITIVA },
    { id: 18, text: "Quando não entendo um conceito, identifico exatamente qual parte da explicação foi confusa.", dimension: IEAADimension.METACOGNITIVA },
    { id: 19, text: "Questiono a validade e a origem das informações que encontro durante minhas pesquisas.", dimension: IEAADimension.METACOGNITIVA },
    { id: 20, text: "Monitoro o tempo gasto em cada tópico para garantir que cobrirei todo o cronograma.", dimension: IEAADimension.METACOGNITIVA },
    { id: 21, text: "Reflito sobre como meu estado emocional (estresse, cansaço) interfere na minha capacidade de concentração.", dimension: IEAADimension.METACOGNITIVA },
    { id: 22, text: "Sou capaz de explicar o passo a passo do meu raciocínio ao resolver um problema complexo.", dimension: IEAADimension.METACOGNITIVA },
    { id: 23, text: "Reconheço quando preciso interromper o estudo para um descanso estratégico.", dimension: IEAADimension.METACOGNITIVA },
    { id: 24, text: "Procuro identificar o objetivo pedagógico de cada atividade proposta pelos professores.", dimension: IEAADimension.METACOGNITIVA },

    // Dimensão III: Gestão de Recursos (Ambiente e Esforço) - Itens 25-36
    { id: 25, text: "Possuo um local de estudo organizado, silencioso e livre de distrações digitais.", dimension: IEAADimension.GESTAO_RECURSOS },
    { id: 26, text: "Mantenho uma rotina ou cronograma semanal de estudos que sigo com rigor.", dimension: IEAADimension.GESTAO_RECURSOS },
    { id: 27, text: "Persisto na resolução de um problema mesmo quando ele parece excessivamente difícil.", dimension: IEAADimension.GESTAO_RECURSOS },
    { id: 28, text: "Sei o momento exato de buscar ajuda (professores, tutores ou colegas) quando esgoto minhas possibilidades.", dimension: IEAADimension.GESTAO_RECURSOS },
    { id: 29, text: "Utilizo ferramentas de gestão (agendas, planners ou aplicativos) para organizar minhas entregas.", dimension: IEAADimension.GESTAO_RECURSOS },
    { id: 30, text: "Evito a procrastinação, iniciando as tarefas no dia em que são propostas.", dimension: IEAADimension.GESTAO_RECURSOS },
    { id: 31, text: "Priorizo as tarefas acadêmicas mais complexas para os períodos em que estou com mais energia.", dimension: IEAADimension.GESTAO_RECURSOS },
    { id: 32, text: "Consigo manter o foco no estudo mesmo quando o conteúdo não é de meu interesse pessoal.", dimension: IEAADimension.GESTAO_RECURSOS },
    { id: 33, text: "Organizo meu material didático de forma que eu encontre rapidamente o que preciso.", dimension: IEAADimension.GESTAO_RECURSOS },
    { id: 34, text: "Participo ativamente de grupos de estudo, contribuindo e aprendendo com os pares.", dimension: IEAADimension.GESTAO_RECURSOS },
    { id: 35, text: "Preparo o ambiente e os materiais necessários antes de iniciar efetivamente a sessão de estudo.", dimension: IEAADimension.GESTAO_RECURSOS },
    { id: 36, text: "Cumpro os prazos estipulados sem a necessidade de lembretes externos constantes.", dimension: IEAADimension.GESTAO_RECURSOS },

    // Dimensão IV: Dimensão Motivacional e Afetiva - Itens 37-50
    { id: 37, text: "Sinto-me capaz de aprender qualquer conteúdo, desde que eu dedique o esforço necessário.", dimension: IEAADimension.MOTIVACIONAL },
    { id: 38, text: "Estudo porque quero compreender o mundo, e não apenas para obter notas altas.", dimension: IEAADimension.MOTIVACIONAL },
    { id: 39, text: "Consigo controlar minha ansiedade antes e durante a realização de provas importantes.", dimension: IEAADimension.MOTIVACIONAL },
    { id: 40, text: "Vejo valor prático no que aprendo na escola para minha vida futura ou carreira.", dimension: IEAADimension.MOTIVACIONAL },
    { id: 41, text: "Atribuo meus sucessos acadêmicos ao meu esforço e estratégia, e não apenas à sorte ou inteligência inata.", dimension: IEAADimension.MOTIVACIONAL },
    { id: 42, text: "Sinto curiosidade intelectual sobre temas que transcendem o currículo obrigatório.", dimension: IEAADimension.MOTIVACIONAL },
    { id: 43, text: "Mantenho uma atitude positiva mesmo diante de um resultado acadêmico insatisfatório.", dimension: IEAADimension.MOTIVACIONAL },
    { id: 44, text: "Percebo o erro como uma oportunidade de aprendizado e ajuste de rota.", dimension: IEAADimension.MOTIVACIONAL },
    { id: 45, text: "Minha motivação para estudar permanece estável ao longo do ano letivo.", dimension: IEAADimension.MOTIVACIONAL },
    { id: 46, text: "Valorizo o feedback dos professores como ferramenta de aprimoramento contínuo.", dimension: IEAADimension.MOTIVACIONAL },
    { id: 47, text: "Identifico a relevância social dos temas tratados nas ciências humanas e naturais.", dimension: IEAADimension.MOTIVACIONAL },
    { id: 48, text: "Sinto satisfação pessoal ao concluir um desafio intelectual complexo.", dimension: IEAADimension.MOTIVACIONAL },
    { id: 49, text: "Não me sinto intimidado pela complexidade de novas disciplinas no Ensino Médio.", dimension: IEAADimension.MOTIVACIONAL },
    { id: 50, text: "Desenvolvo autonomia para decidir quais temas necessitam de mais dedicação no meu estudo individual.", dimension: IEAADimension.MOTIVACIONAL },
];

export const IEAA_DIMENSIONS_INFO: Record<IEAADimension, {
    label: string;
    description: string;
    itemCount: number;
    maxScore: number;
    items: number[];
}> = {
    [IEAADimension.COGNITIVA]: {
        label: "Estratégias Cognitivas",
        description: "Avalia o nível de profundidade com que você lida com a informação (ensaio superficial vs. elaboração profunda).",
        itemCount: 12,
        maxScore: 60,
        items: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    },
    [IEAADimension.METACOGNITIVA]: {
        label: "Controle Metacognitivo",
        description: "Mede a capacidade de ser o 'maestro' de sua própria cognição, planejando e monitorando o aprendizado.",
        itemCount: 12,
        maxScore: 60,
        items: [13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24],
    },
    [IEAADimension.GESTAO_RECURSOS]: {
        label: "Gestão de Recursos",
        description: "Foca no comportamento e na organização do ambiente, fundamentais para a eficácia das estratégias cognitivas.",
        itemCount: 12,
        maxScore: 60,
        items: [25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36],
    },
    [IEAADimension.MOTIVACIONAL]: {
        label: "Componente Motivacional",
        description: "Analisa as crenças de autoeficácia e o valor atribuído à tarefa, que servem como motor para a persistência acadêmica.",
        itemCount: 14,
        maxScore: 70,
        items: [37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50],
    },
};

export const IEAA_PROFILES_INFO: Record<IEAAProfile, {
    label: string;
    description: string;
    correlations: IEAADimension[];
    interventionFocus: string;
}> = {
    [IEAAProfile.EXECUTIVO]: {
        label: "Perfil Executivo",
        description: "Foco em resultados e métodos. Possui forte domínio de gestão e estratégias cognitivas.",
        correlations: [IEAADimension.GESTAO_RECURSOS, IEAADimension.COGNITIVA],
        interventionFocus: "Estimular a reflexão crítica e a criatividade. Desenvolver curiosidade intelectual além do pragmático.",
    },
    [IEAAProfile.CIENTISTA]: {
        label: "Perfil Cientista",
        description: "Foco no rigor e na compreensão profunda. Possui forte consciência metacognitiva e elaboração cognitiva.",
        correlations: [IEAADimension.METACOGNITIVA, IEAADimension.COGNITIVA],
        interventionFocus: "Fortalecer a gestão de tempo e o controle de ansiedade. Equilibrar análise com produtividade.",
    },
    [IEAAProfile.ENGAJADO]: {
        label: "Perfil Engajado",
        description: "Foco no esforço e na constância. Alta motivação aliada à boa organização de recursos.",
        correlations: [IEAADimension.MOTIVACIONAL, IEAADimension.GESTAO_RECURSOS],
        interventionFocus: "Ensinar técnicas de estudo avançadas (elaboração e recuperação ativa). Aprofundar estratégias cognitivas.",
    },
    [IEAAProfile.VULNERAVEL]: {
        label: "Perfil Vulnerável",
        description: "Fragilidade em múltiplos processos. Necessita suporte intensivo em diversas áreas.",
        correlations: [],
        interventionFocus: "Intervenção psicopedagógica imediata e tutoria próxima. Scaffolding explícito e metas de curto prazo.",
    },
};

export const IEAA_LEVELS_INFO: Record<IEAALevel, {
    label: string;
    description: string;
    pedagogicalProfile: string;
    minPercentage: number;
    maxPercentage: number;
}> = {
    [IEAALevel.REATIVO]: {
        label: "Aprendiz Reativo",
        description: "Dependência de estímulos externos; baixa consciência de processos cognitivos; vulnerabilidade a distrações.",
        pedagogicalProfile: "Necessita intervenções focadas em estratégias de ensaio e organização básica. Scaffolding explícito e cronogramas rígidos de curto prazo.",
        minPercentage: 0,
        maxPercentage: 46,
    },
    [IEAALevel.TRANSICAO]: {
        label: "Aprendiz em Transição",
        description: "Utiliza estratégias de forma assistemática; monitoramento inconstante; oscilação na motivação intrínseca.",
        pedagogicalProfile: "Treinamento em metacognição (pensar sobre o próprio pensamento). Feedbacks formativos que destaquem a relação entre esforço estratégico e resultado acadêmico.",
        minPercentage: 47,
        maxPercentage: 73,
    },
    [IEAALevel.AUTORREGULADO]: {
        label: "Aprendiz Autorregulado",
        description: "Elevada autonomia; domínio de estratégias de processamento profundo; resiliência e foco em metas.",
        pedagogicalProfile: "Oferta de atividades de alta complexidade e projetos de pesquisa autônomos. Pode atuar como monitor, reforçando sua autorregulação através da tutoria por pares.",
        minPercentage: 74,
        maxPercentage: 100,
    },
};
