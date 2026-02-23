# Family Report PDF Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Expand the existing TalentReport into a 3-page Family Report PDF with evolution narrative, home activity suggestions, and a personalized message from the psychologist.

**Architecture:** Evolve `TalentReport.tsx` to accept new optional props for the extra pages. Create a pure helper module (`lib/report/family-report-helpers.ts`) for the evolution narrative and home suggestion logic. Add a `FamilyReportDialog.tsx` client component with a textarea for the personalized message. Button on the student profile page, gated to PSYCHOLOGIST/COUNSELOR roles.

**Tech Stack:** `@react-pdf/renderer` (already installed), React 19, Next.js 15 Server Components, Vitest for tests.

---

### Task 1: Pure Helper Functions (evolution narrative + home suggestions)

**Files:**
- Create: `lib/report/family-report-helpers.ts`
- Create: `__tests__/family-report-helpers.test.ts`

**Context:** These are pure functions with no side effects. The evolution narrative converts SRSS-IE scores across screening windows into family-friendly text. Home suggestions map CharacterStrength enums to practical family activities.

**Step 1: Write the failing tests**

Create `__tests__/family-report-helpers.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { generateEvolutionNarrative, getHomeSuggestions } from '@/lib/report/family-report-helpers';
import { CharacterStrength } from '@/src/core/types';

describe('generateEvolutionNarrative', () => {
    it('returns first-assessment message when only one window exists', () => {
        const data = [
            { window: 'Março', externalizing: 5, internalizing: 3 },
        ];
        const result = generateEvolutionNarrative(data);
        expect(result).toContain('primeira avaliação');
    });

    it('returns improvement message when scores decrease', () => {
        const data = [
            { window: 'Março', externalizing: 8, internalizing: 6 },
            { window: 'Junho', externalizing: 4, internalizing: 3 },
        ];
        const result = generateEvolutionNarrative(data);
        expect(result).toContain('melhoria');
    });

    it('returns stable message when scores stay similar', () => {
        const data = [
            { window: 'Março', externalizing: 3, internalizing: 2 },
            { window: 'Junho', externalizing: 3, internalizing: 2 },
        ];
        const result = generateEvolutionNarrative(data);
        expect(result).toContain('estável');
    });

    it('returns attention message when scores increase', () => {
        const data = [
            { window: 'Março', externalizing: 2, internalizing: 2 },
            { window: 'Junho', externalizing: 7, internalizing: 5 },
        ];
        const result = generateEvolutionNarrative(data);
        expect(result).toContain('atenção');
    });

    it('returns empty string when no data', () => {
        const result = generateEvolutionNarrative([]);
        expect(result).toBe('');
    });

    it('handles three windows showing full trajectory', () => {
        const data = [
            { window: 'Março', externalizing: 8, internalizing: 6 },
            { window: 'Junho', externalizing: 5, internalizing: 4 },
            { window: 'Outubro', externalizing: 3, internalizing: 2 },
        ];
        const result = generateEvolutionNarrative(data);
        expect(result).toContain('melhoria');
        expect(result.length).toBeGreaterThan(50);
    });
});

describe('getHomeSuggestions', () => {
    it('returns suggestions for given strengths', () => {
        const strengths = [
            { strength: CharacterStrength.CURIOSIDADE, label: 'Curiosidade' },
            { strength: CharacterStrength.BONDADE, label: 'Bondade' },
        ];
        const result = getHomeSuggestions(strengths);
        expect(result).toHaveLength(2);
        expect(result[0].strengthLabel).toBe('Curiosidade');
        expect(result[0].activities.length).toBeGreaterThanOrEqual(2);
    });

    it('returns empty array for empty input', () => {
        const result = getHomeSuggestions([]);
        expect(result).toEqual([]);
    });

    it('provides fallback for unknown strengths', () => {
        const strengths = [
            { strength: 'UNKNOWN' as CharacterStrength, label: 'Desconhecida' },
        ];
        const result = getHomeSuggestions(strengths);
        expect(result).toHaveLength(1);
        expect(result[0].activities.length).toBeGreaterThanOrEqual(1);
    });
});
```

**Step 2: Run tests to verify they fail**

Run: `npx vitest run __tests__/family-report-helpers.test.ts`
Expected: FAIL — module not found

**Step 3: Implement the helpers**

Create `lib/report/family-report-helpers.ts`:

```typescript
import { CharacterStrength } from '@/src/core/types';

// --- Evolution Narrative ---

export interface EvolutionDataPoint {
    window: string;
    externalizing: number;
    internalizing: number;
}

export function generateEvolutionNarrative(data: EvolutionDataPoint[]): string {
    if (data.length === 0) return '';

    if (data.length === 1) {
        return `Esta é a primeira avaliação de ${data[0].window}, que servirá como referência para acompanhar o desenvolvimento ao longo do ano letivo.`;
    }

    const first = data[0];
    const last = data[data.length - 1];
    const totalFirst = first.externalizing + first.internalizing;
    const totalLast = last.externalizing + last.internalizing;
    const diff = totalLast - totalFirst;

    const windowRange = `${first.window} a ${last.window}`;

    if (diff <= -3) {
        return `No período de ${windowRange}, observamos uma melhoria significativa no desenvolvimento socioemocional. O(a) aluno(a) demonstrou progresso positivo, indicando que as estratégias de apoio estão funcionando bem. Recomendamos continuar incentivando as atividades que fortalecem suas qualidades.`;
    }

    if (diff < 0) {
        return `No período de ${windowRange}, observamos uma melhoria gradual no desenvolvimento socioemocional. O(a) aluno(a) vem apresentando evolução positiva, o que é um sinal encorajador. Manter a rotina de apoio em casa contribui para esse progresso.`;
    }

    if (diff === 0) {
        return `No período de ${windowRange}, o desenvolvimento socioemocional manteve-se estável. Isso demonstra consistência, o que é positivo. Continuar investindo nas atividades sugeridas pode potencializar ainda mais o crescimento.`;
    }

    if (diff <= 3) {
        return `No período de ${windowRange}, identificamos algumas áreas que merecem atenção e apoio adicional. Isso é normal no processo de desenvolvimento e representa uma oportunidade para fortalecer habilidades importantes. As sugestões de atividades abaixo podem ajudar.`;
    }

    return `No período de ${windowRange}, identificamos áreas que merecem atenção especial e apoio da família. Recomendamos conversar com a equipe pedagógica para alinhar estratégias conjuntas de apoio ao desenvolvimento socioemocional.`;
}

// --- Home Suggestions ---

export interface HomeSuggestion {
    strengthLabel: string;
    activities: string[];
}

interface StrengthInput {
    strength: CharacterStrength;
    label: string;
}

const HOME_ACTIVITIES: Record<string, string[]> = {
    [CharacterStrength.CRIATIVIDADE]: [
        'Realizem projetos artísticos juntos: pintura, colagem ou construção com materiais recicláveis.',
        'Incentivem a escrita criativa — diários, histórias curtas ou poemas.',
        'Proponham desafios de "como resolver isso de outro jeito?" no dia a dia.',
    ],
    [CharacterStrength.CURIOSIDADE]: [
        'Visitem museus, exposições ou feiras de ciências em família.',
        'Assistam documentários juntos e conversem sobre o que aprenderam.',
        'Incentivem perguntas — quando seu(sua) filho(a) perguntar "por quê?", explore a resposta junto.',
    ],
    [CharacterStrength.PENSAMENTO_CRITICO]: [
        'Discutam notícias do dia em família, analisando diferentes pontos de vista.',
        'Joguem jogos de lógica e estratégia (xadrez, sudoku, jogos de tabuleiro).',
        'Incentivem a questionar informações: "Será que isso é verdade? Como podemos verificar?"',
    ],
    [CharacterStrength.AMOR_APRENDIZADO]: [
        'Visitem bibliotecas e livrarias juntos regularmente.',
        'Apoiem um projeto de aprendizado pessoal: um idioma, instrumento ou habilidade nova.',
        'Compartilhem o que cada membro da família está aprendendo de novo.',
    ],
    [CharacterStrength.SENSATEZ]: [
        'Peçam a opinião do(a) filho(a) em decisões familiares adequadas à idade.',
        'Conversem sobre dilemas do dia a dia e explorem soluções juntos.',
        'Valorizem quando ele(a) der conselhos sensatos a irmãos ou amigos.',
    ],
    [CharacterStrength.BRAVURA]: [
        'Incentivem a participação em atividades que desafiam (teatro, esportes, apresentações).',
        'Valorizem quando ele(a) defender o que acredita, mesmo sendo difícil.',
        'Compartilhem histórias de superação da família — coragem se aprende com exemplos.',
    ],
    [CharacterStrength.PERSEVERANCA]: [
        'Ajudem a dividir projetos grandes em etapas menores e celebrem cada conquista.',
        'Contem histórias de persistência da família — "quando eu quase desisti, mas continuei..."',
        'Incentivem a terminar o que começou antes de iniciar algo novo.',
    ],
    [CharacterStrength.AUTENTICIDADE]: [
        'Criem um ambiente em casa onde todos possam expressar opiniões sem julgamento.',
        'Valorizem a honestidade, mesmo quando a verdade é difícil de dizer.',
        'Sejam modelo: compartilhem seus próprios sentimentos e valores abertamente.',
    ],
    [CharacterStrength.VITALIDADE]: [
        'Pratiquem atividades físicas em família: caminhadas, esportes, dança.',
        'Mantenham uma rotina de sono saudável — a energia vem do descanso.',
        'Planejem atividades ao ar livre nos fins de semana.',
    ],
    [CharacterStrength.AMOR]: [
        'Reservem momentos de qualidade em família sem telas (jantar, passeio, jogo).',
        'Expressem afeto diariamente — abraços, palavras de carinho, bilhetes.',
        'Incentivem o contato com avós, tios e primos para fortalecer vínculos familiares.',
    ],
    [CharacterStrength.BONDADE]: [
        'Realizem ações solidárias em família: doações, voluntariado, ajudar vizinhos.',
        'Pratiquem o "ato de bondade do dia" — cada membro da família faz algo por alguém.',
        'Valorizem e reconheçam quando ele(a) ajudar sem que ninguém peça.',
    ],
    [CharacterStrength.INTELIGENCIA_SOCIAL]: [
        'Conversem sobre emoções: "Como você acha que seu amigo se sentiu?"',
        'Incentivem a participação em atividades em grupo (esportes coletivos, teatro, banda).',
        'Pratiquem a escuta ativa em família — ouvir sem interromper.',
    ],
    [CharacterStrength.CIDADANIA]: [
        'Participem juntos de projetos comunitários ou escolares.',
        'Conversem sobre responsabilidades coletivas (cuidar do bairro, meio ambiente).',
        'Incentivem o trabalho em equipe nas tarefas de casa.',
    ],
    [CharacterStrength.IMPARCIALIDADE]: [
        'Discutam situações de justiça/injustiça que aparecem em filmes ou notícias.',
        'Estabeleçam regras familiares juntos, garantindo que todos tenham voz.',
        'Valorizem quando ele(a) defender quem está sendo tratado injustamente.',
    ],
    [CharacterStrength.LIDERANCA]: [
        'Deem responsabilidades adequadas à idade (organizar um passeio, liderar uma tarefa).',
        'Incentivem a participação em grêmio estudantil ou projetos escolares.',
        'Conversem sobre o que faz um bom líder — ouvir, incluir, inspirar.',
    ],
    [CharacterStrength.PERDAO]: [
        'Pratiquem o perdão em família — quando alguém errar, conversem e sigam em frente.',
        'Leiam juntos histórias sobre reconciliação e superação de conflitos.',
        'Modelem o perdão: peçam desculpas quando errarem e mostrem como seguir adiante.',
    ],
    [CharacterStrength.MODESTIA]: [
        'Valorizem o esforço, não apenas os resultados ou conquistas visíveis.',
        'Incentivem a reconhecer o mérito dos outros sem diminuir o próprio.',
        'Conversem sobre a diferença entre modéstia e insegurança.',
    ],
    [CharacterStrength.PRUDENCIA]: [
        'Incentivem a "pausa antes de agir" — contar até 10 antes de decisões importantes.',
        'Planejem juntos atividades da semana, praticando organização e antecipação.',
        'Valorizem escolhas bem pensadas, mesmo que levem mais tempo.',
    ],
    [CharacterStrength.AUTORREGULACAO]: [
        'Pratiquem técnicas de respiração e mindfulness em família.',
        'Criem uma "rotina de calma" para momentos de frustração (respirar, caminhar, conversar).',
        'Estabeleçam juntos limites saudáveis para telas e redes sociais.',
    ],
    [CharacterStrength.APRECIACAO_BELO]: [
        'Visitem exposições de arte, concertos ou espetáculos em família.',
        'Passem tempo na natureza — parques, jardins, trilhas.',
        'Incentivem a fotografia ou desenho de coisas bonitas do cotidiano.',
    ],
    [CharacterStrength.GRATIDAO]: [
        'Pratiquem o "momento de gratidão" no jantar — cada um diz algo bom do dia.',
        'Escrevam bilhetes de agradecimento para pessoas importantes na vida da família.',
        'Mantenham um "diário de coisas boas" onde todos possam escrever.',
    ],
    [CharacterStrength.HUMOR]: [
        'Riam juntos! Assistam comédias, contem piadas, brinquem em família.',
        'Usem o humor para aliviar momentos tensos — sem ridicularizar ninguém.',
        'Valorizem a capacidade de rir de si mesmo com leveza.',
    ],
    [CharacterStrength.ESPERANCA]: [
        'Conversem sobre sonhos e planos para o futuro em família.',
        'Quando enfrentarem dificuldades, lembrem juntos de desafios já superados.',
        'Criem um "mural de conquistas" em casa para visualizar o progresso.',
    ],
    [CharacterStrength.ESPIRITUALIDADE]: [
        'Reservem momentos de reflexão ou meditação em família.',
        'Conversem sobre valores, propósito e o que dá significado à vida.',
        'Respeitem e explorem as perguntas profundas que seu(sua) filho(a) faz.',
    ],
};

const FALLBACK_ACTIVITIES = [
    'Conversem regularmente sobre o dia a dia, criando um espaço seguro de diálogo.',
    'Realizem atividades prazerosas em família para fortalecer vínculos.',
];

export function getHomeSuggestions(strengths: StrengthInput[]): HomeSuggestion[] {
    return strengths.map((s) => ({
        strengthLabel: s.label,
        activities: HOME_ACTIVITIES[s.strength] || FALLBACK_ACTIVITIES,
    }));
}
```

**Step 4: Run tests to verify they pass**

Run: `npx vitest run __tests__/family-report-helpers.test.ts`
Expected: All 9 tests PASS

**Step 5: Commit**

```bash
git add lib/report/family-report-helpers.ts __tests__/family-report-helpers.test.ts
git commit -m "feat: add family report helper functions with tests"
```

---

### Task 2: Expand TalentReport with new pages

**Files:**
- Modify: `components/reports/TalentReport.tsx`

**Context:** The TalentReport currently renders a single page with the top 5 strengths. We add 2 optional pages: Page 2 (evolution + home suggestions) and Page 3 (personal message + closing). New props are all optional so existing callers still work.

**Step 1: Expand the TalentReport component**

Modify `components/reports/TalentReport.tsx` to add:

1. New optional props to the interface:
```typescript
interface TalentReportProps {
    studentName: string;
    grade: string;
    signatureStrengths: Strength[];
    // New optional props for Family Report
    schoolName?: string;
    evolutionNarrative?: string;
    homeSuggestions?: { strengthLabel: string; activities: string[] }[];
    personalMessage?: string;
    professionalName?: string;
    professionalRole?: string;
}
```

2. New styles for Page 2 and Page 3 (add to the existing StyleSheet.create):
```typescript
// Add to styles:
evolutionSection: {
    marginBottom: 25,
    padding: 15,
    backgroundColor: '#f0fdf4',
    borderRadius: 8,
    borderLeft: '3pt solid #22c55e',
},
evolutionTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#166534',
    marginBottom: 8,
},
evolutionText: {
    fontSize: 10,
    lineHeight: 1.6,
    color: '#334155',
},
suggestionCard: {
    marginBottom: 12,
    padding: 10,
    backgroundColor: '#fefce8',
    borderRadius: 6,
},
suggestionStrength: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#854d0e',
    marginBottom: 6,
},
suggestionItem: {
    fontSize: 9,
    lineHeight: 1.5,
    color: '#475569',
    marginBottom: 3,
    paddingLeft: 10,
},
messageSection: {
    marginBottom: 30,
    padding: 20,
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    borderLeft: '3pt solid #4f46e5',
},
messageTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#4f46e5',
    marginBottom: 10,
},
messageText: {
    fontSize: 10,
    lineHeight: 1.6,
    color: '#334155',
    fontStyle: 'italic',
},
signatureBlock: {
    marginTop: 40,
    paddingTop: 15,
    borderTop: '1pt solid #e2e8f0',
    textAlign: 'center',
},
signatureName: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#1e293b',
},
signatureRole: {
    fontSize: 9,
    color: '#64748b',
    marginTop: 2,
},
```

3. Conditionally render Page 2 when `evolutionNarrative` or `homeSuggestions` are provided:
```typescript
{(evolutionNarrative || homeSuggestions) && (
    <Page size="A4" style={styles.page}>
        {evolutionNarrative && (
            <View style={styles.evolutionSection}>
                <Text style={styles.evolutionTitle}>Evolução do Desenvolvimento</Text>
                <Text style={styles.evolutionText}>{evolutionNarrative}</Text>
            </View>
        )}

        {homeSuggestions && homeSuggestions.length > 0 && (
            <View>
                <Text style={styles.sectionTitle}>Sugestões de Atividades para Casa</Text>
                <Text style={{ fontSize: 9, marginBottom: 12, color: '#64748b' }}>
                    Baseadas nas forças de assinatura, estas atividades ajudam a fortalecer o desenvolvimento socioemocional em família.
                </Text>
                {homeSuggestions.map((suggestion, i) => (
                    <View key={i} style={styles.suggestionCard}>
                        <Text style={styles.suggestionStrength}>{suggestion.strengthLabel}</Text>
                        {suggestion.activities.map((activity, j) => (
                            <Text key={j} style={styles.suggestionItem}>• {activity}</Text>
                        ))}
                    </View>
                ))}
            </View>
        )}

        <Text style={styles.footer}>
            Este documento é uma ferramenta pedagógica baseada no framework VIA Character.
            © 2026 Sistema de Gestão Socioemocional
        </Text>
    </Page>
)}
```

4. Conditionally render Page 3 when `personalMessage` is provided:
```typescript
{personalMessage && (
    <Page size="A4" style={styles.page}>
        <View style={styles.header}>
            <Text style={styles.title}>Mensagem da Equipe</Text>
            <Text style={styles.subtitle}>Comunicação Escola-Família</Text>
        </View>

        <View style={styles.messageSection}>
            <Text style={styles.messageTitle}>Mensagem para a Família</Text>
            <Text style={styles.messageText}>{personalMessage}</Text>
        </View>

        <View style={styles.signatureBlock}>
            {professionalName && (
                <Text style={styles.signatureName}>{professionalName}</Text>
            )}
            {professionalRole && (
                <Text style={styles.signatureRole}>{professionalRole}</Text>
            )}
            <Text style={{ fontSize: 9, color: '#94a3b8', marginTop: 8 }}>
                {schoolName || 'Instituição de Ensino'}
            </Text>
            <Text style={{ fontSize: 8, color: '#94a3b8', marginTop: 4 }}>
                Gerado em {new Date().toLocaleDateString('pt-BR')}
            </Text>
        </View>

        <Text style={styles.footer}>
            Este documento é uma ferramenta pedagógica. Em caso de dúvidas, entre em contato com a equipe escolar.
            © 2026 Sistema de Gestão Socioemocional
        </Text>
    </Page>
)}
```

5. Update the header on Page 1 to show schoolName if provided:
```typescript
<View style={styles.header}>
    <Text style={styles.title}>{schoolName ? 'Relatório para a Família' : 'Mapa de Talentos'}</Text>
    <Text style={styles.subtitle}>
        {schoolName || 'Sistema de Gestão Socioemocional'} - Relatório Individual
    </Text>
</View>
```

6. Update the Document title:
```typescript
<Document title={`${schoolName ? 'Relatório para Família' : 'Mapa de Talentos'} - ${studentName}`}>
```

**Step 2: Verify existing TalentReport usage still works**

Run: `npx vitest run`
Expected: All existing tests still pass (no breaking changes since all new props are optional)

**Step 3: Commit**

```bash
git add components/reports/TalentReport.tsx
git commit -m "feat: expand TalentReport with evolution, suggestions, and message pages"
```

---

### Task 3: FamilyReportDialog component

**Files:**
- Create: `components/reports/FamilyReportDialog.tsx`

**Context:** Client component that shows a dialog with a textarea for the personalized message. On submit, it dynamically imports `@react-pdf/renderer` and `TalentReport`, generates the PDF, and triggers a download. Follows the same pattern as `ExportStudentsPDF.tsx` (dynamic import + blob URL).

**Step 1: Create the dialog component**

Create `components/reports/FamilyReportDialog.tsx`:

```typescript
'use client';

import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { FileHeart, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface Strength {
    label: string;
    virtue: string;
    description: string;
    tip: string;
}

interface HomeSuggestion {
    strengthLabel: string;
    activities: string[];
}

interface FamilyReportDialogProps {
    studentName: string;
    grade: string;
    signatureStrengths: Strength[];
    evolutionNarrative: string;
    homeSuggestions: HomeSuggestion[];
    schoolName: string;
    professionalName: string;
    professionalRole: string;
}

export function FamilyReportDialog({
    studentName,
    grade,
    signatureStrengths,
    evolutionNarrative,
    homeSuggestions,
    schoolName,
    professionalName,
    professionalRole,
}: FamilyReportDialogProps) {
    const [open, setOpen] = useState(false);
    const [message, setMessage] = useState('');
    const [isPending, startTransition] = useTransition();

    const handleGenerate = () => {
        startTransition(async () => {
            try {
                const { pdf } = await import('@react-pdf/renderer');
                const { TalentReport } = await import('@/components/reports/TalentReport');

                const blob = await pdf(
                    <TalentReport
                        studentName={studentName}
                        grade={grade}
                        signatureStrengths={signatureStrengths}
                        schoolName={schoolName}
                        evolutionNarrative={evolutionNarrative}
                        homeSuggestions={homeSuggestions}
                        personalMessage={message || undefined}
                        professionalName={professionalName}
                        professionalRole={professionalRole}
                    />
                ).toBlob();

                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                const safeName = studentName.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
                link.download = `relatorio-familia-${safeName}-${new Date().toISOString().split('T')[0]}.pdf`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(url);

                toast.success('Relatório gerado com sucesso!');
                setOpen(false);
                setMessage('');
            } catch (error) {
                console.error('Error generating family report PDF:', error);
                toast.error('Erro ao gerar relatório');
            }
        });
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button
                    variant="outline"
                    className="border-emerald-200 text-emerald-700 hover:bg-emerald-50 hover:border-emerald-400"
                >
                    <FileHeart className="h-4 w-4 mr-2" />
                    Relatório para Família
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Relatório para a Família</DialogTitle>
                    <DialogDescription>
                        Gerar relatório de {studentName} com forças, evolução e sugestões para a família.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="personal-message">
                            Mensagem personalizada para a família (opcional)
                        </Label>
                        <Textarea
                            id="personal-message"
                            placeholder="Escreva uma mensagem personalizada para os responsáveis. Ex: 'O João tem demonstrado grande evolução na capacidade de trabalhar em equipe...'"
                            value={message}
                            onChange={(e) => setMessage(e.target.value.slice(0, 500))}
                            rows={5}
                            className="resize-none"
                        />
                        <p className="text-xs text-slate-400 text-right">
                            {message.length}/500 caracteres
                        </p>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="ghost" onClick={() => setOpen(false)} disabled={isPending}>
                        Cancelar
                    </Button>
                    <Button
                        onClick={handleGenerate}
                        disabled={isPending}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white"
                    >
                        {isPending ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                Gerando...
                            </>
                        ) : (
                            'Gerar PDF'
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
```

**Step 2: Verify the project builds**

Run: `npx next build`
Expected: Build succeeds (component is not yet used but should compile)

**Step 3: Commit**

```bash
git add components/reports/FamilyReportDialog.tsx
git commit -m "feat: add FamilyReportDialog component with message textarea"
```

---

### Task 4: Integrate into student profile page

**Files:**
- Modify: `app/(portal)/alunos/[id]/page.tsx`

**Context:** Add the FamilyReportDialog button to the student detail page. Only visible for PSYCHOLOGIST and COUNSELOR roles. Only enabled when the student has a complete profile (VIA + SRSS-IE). Pass all required data: signature strengths (with descriptions/tips from `STRENGTH_DESCRIPTIONS`), evolution narrative, home suggestions, school name, and professional info.

**Step 1: Add imports at the top of the file**

Add after the existing imports:

```typescript
import { FamilyReportDialog } from '@/components/reports/FamilyReportDialog';
import { generateEvolutionNarrative, getHomeSuggestions } from '@/lib/report/family-report-helpers';
import { STRENGTH_DESCRIPTIONS } from '@/src/core/content/strength-descriptions';
```

**Step 2: Prepare the data for the report (after profile is calculated)**

Add after the `interventionPlans` query (around line 117), before `displayGrade`:

```typescript
    // Preparar dados para Relatório da Família
    const canGenerateFamilyReport = profile && (user.role === UserRole.PSYCHOLOGIST || user.role === UserRole.COUNSELOR);

    let familyReportProps = null;
    if (canGenerateFamilyReport) {
        const strengthsForReport = profile.signatureStrengths.map((s) => {
            const desc = STRENGTH_DESCRIPTIONS[s.strength];
            return {
                label: s.label,
                virtue: s.virtue,
                description: desc?.description || '',
                tip: desc?.tip || '',
            };
        });

        const evolutionNarrative = generateEvolutionNarrative(evolutionData);
        const homeSuggestions = getHomeSuggestions(
            profile.signatureStrengths.map((s) => ({ strength: s.strength, label: s.label }))
        );

        familyReportProps = {
            studentName: student.name,
            grade: displayGrade,
            signatureStrengths: strengthsForReport,
            evolutionNarrative,
            homeSuggestions,
            schoolName: student.tenant.name,
            professionalName: user.name || '',
            professionalRole: user.role === UserRole.PSYCHOLOGIST ? 'Psicólogo(a)' : 'Orientador(a) Educacional',
        };
    }
```

**Important:** The `displayGrade` variable must be defined before this block. Move the `displayGrade` calculation to before this block (it's currently at line ~120).

**Step 3: Add the button to the page JSX**

Add the FamilyReportDialog button in the header area, next to the student name. Replace the current header `<div>` (around line 127-142) with:

```typescript
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/alunos">
                        <Button variant="ghost" size="icon" className="rounded-full">
                            <ChevronLeft size={20} />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
                            <UserCircle size={24} className="text-slate-400" />
                            {student.name}
                        </h1>
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                            {displayGrade}
                        </p>
                    </div>
                </div>
                {familyReportProps && (
                    <FamilyReportDialog {...familyReportProps} />
                )}
            </div>
```

**Step 4: Verify the build**

Run: `npx next build`
Expected: Build succeeds

**Step 5: Commit**

```bash
git add app/(portal)/alunos/[id]/page.tsx
git commit -m "feat: add family report button to student profile page"
```

---

### Task 5: Build verification and manual testing

**Files:** None (testing only)

**Step 1: Run all tests**

Run: `npx vitest run`
Expected: All tests pass (142+ existing + 9 new = 151+)

**Step 2: Run the build**

Run: `npx next build`
Expected: Build succeeds with no type errors

**Step 3: Manual test (dev server)**

Run: `npm run dev`

Test checklist:
1. Login as Psicólogo → navigate to `/alunos/[any-student-id]`
2. Verify "Relatório para Família" button appears (green/emerald outline)
3. Click button → dialog opens with textarea
4. Type a message → character counter updates
5. Click "Gerar PDF" → PDF downloads
6. Open PDF → verify 3 pages: strengths, evolution+suggestions, message
7. Login as Gestor → verify the button does NOT appear
8. Navigate to a student without complete profile → verify button does NOT appear

**Step 4: Final commit (if any fixes needed)**

```bash
git add -A
git commit -m "fix: address issues found during manual testing"
```
