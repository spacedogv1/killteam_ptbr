'use client';

import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';

type Card = {
  id: string;
  kind: 'crit_op' | 'tac_op';
  number: number;
  name: string;
  archetype?: string;
  content_markdown: string;
  source: { name_en: string };
};

type Pack = { cards: Card[] };
type Tab = 'selection' | 'missions' | 'tacops' | 'selected';
type GuideSection = 'selection' | 'tacops' | 'killops';
type WorkspaceMode = 'missions' | 'rules' | 'teams' | 'match';

const archetypes = ['Todas', 'Infiltração', 'Reconhecimento', 'Segurança', 'Buscar e Destruir'] as const;
const killOpGrades = [
  [5, 1, 2, 3, 4, 5], [6, 1, 2, 4, 5, 6], [7, 1, 3, 4, 6, 7], [8, 2, 3, 5, 6, 8], [9, 2, 4, 5, 7, 9],
  [10, 2, 4, 6, 8, 10], [11, 2, 4, 7, 9, 11], [12, 2, 5, 7, 10, 12], [13, 3, 5, 8, 10, 13], [14, 3, 6, 8, 11, 14],
];

type WeaponRule = { category: string; name: string; translation: string; description: string };

const weaponRules: WeaponRule[] = [
  { category: 'Ataque', name: 'Accurate X', translation: 'Precisa X', description: 'Antes de rolar os dados de ataque, você pode reter até X dados como sucessos normais sem rolá-los.' },
  { category: 'Ataque', name: 'Balanced', translation: 'Equilibrada', description: 'Você pode repetir um dos seus dados de ataque.' },
  { category: 'Ataque', name: 'Blast X', translation: 'Explosão X', description: 'Escolha um alvo principal e, depois de resolver o disparo contra ele, faça uma sequência separada contra cada outro operativo visível e dentro de X do alvo principal. Esses alvos secundários podem ser escolhidos mesmo com ordem Conceal e usam a mesma situação de cobertura e obstrução do alvo principal.' },
  { category: 'Ataque', name: 'Brutal', translation: 'Brutal', description: 'O oponente só pode usar sucessos críticos para bloquear seus sucessos.' },
  { category: 'Ataque', name: 'Ceaseless', translation: 'Incansável', description: 'Você pode repetir qualquer quantidade dos seus dados de ataque que tenham um mesmo resultado, por exemplo, todos os dados que mostraram 2.' },
  { category: 'Ataque', name: 'Devastating X', translation: 'Devastadora X', description: 'Cada sucesso crítico retido causa X de dano imediatamente ao alvo. Se houver uma distância antes da regra, como 1", o dano também atinge operativos visíveis dentro dessa distância.' },
  { category: 'Ataque', name: 'Lethal X+', translation: 'Letal X+', description: 'Seus sucessos com resultado igual ou maior que X são considerados sucessos críticos. Exemplo: Lethal 5+ transforma resultados 5 e 6 em críticos.' },
  { category: 'Ataque', name: 'Piercing X', translation: 'Perfurante X', description: 'O defensor reúne X dados de defesa a menos. Exemplo: Piercing 1 faz o defensor rolar um dado de defesa a menos.' },
  { category: 'Ataque', name: 'Piercing Crits X', translation: 'Críticos Perfurantes X', description: 'Funciona como Piercing X, mas só produz efeito se você tiver retido pelo menos um sucesso crítico.' },
  { category: 'Ataque', name: 'Punishing', translation: 'Punitiva', description: 'Se você reteve algum sucesso crítico, pode reter uma das suas falhas como sucesso normal, em vez de descartá-la.' },
  { category: 'Ataque', name: 'Relentless', translation: 'Implacável', description: 'Você pode repetir qualquer quantidade dos seus dados de ataque.' },
  { category: 'Ataque', name: 'Rending', translation: 'Dilacerante', description: 'Se você reteve algum sucesso crítico, pode transformar um dos seus sucessos normais retidos em um sucesso crítico.' },
  { category: 'Ataque', name: 'Severe', translation: 'Severa', description: 'Se você não reteve nenhum sucesso crítico, pode transformar um dos seus sucessos normais em um sucesso crítico. Pela errata atual, Devastating e Piercing Crits continuam funcionando, mas Punishing e Rending não.' },
  { category: 'Ataque', name: 'Shock', translation: 'Choque', description: 'Na primeira vez que você atacar com um sucesso crítico em cada sequência, descarte um sucesso normal não resolvido do oponente. Se ele não tiver sucessos normais, descarte um sucesso crítico.' },
  { category: 'Ataque', name: 'Stun', translation: 'Atordoar', description: 'Se você reteve algum sucesso crítico, reduza o APL do operativo alvo em 1 até o fim da próxima ativação dele.' },
  { category: 'Alcance e alvos', name: 'Range X', translation: 'Alcance X', description: 'Somente operativos dentro de X da unidade ativa podem ser alvos válidos. Exemplo: Range 9".' },
  { category: 'Alcance e alvos', name: 'Saturate', translation: 'Saturação', description: 'O defensor não pode reter salvamentos de cobertura.' },
  { category: 'Alcance e alvos', name: 'Seek', translation: 'Buscar', description: 'Ao escolher um alvo válido, um operativo com ordem Conceal não pode usar terreno para obter cobertura. A regra não remove o salvamento de cobertura que ele já tenha.' },
  { category: 'Alcance e alvos', name: 'Seek Light', translation: 'Buscar Luz', description: 'É uma variação de Seek: o operativo com Conceal não pode usar terreno Light para obter cobertura, mas ainda pode receber o salvamento de cobertura quando aplicável.' },
  { category: 'Alcance e alvos', name: 'Torrent X', translation: 'Rajada X', description: 'Escolha um alvo principal normalmente. Depois, escolha qualquer quantidade de outros alvos válidos dentro de X do primeiro alvo, mas fora do controle de operativos aliados, e resolva uma sequência contra cada um.' },
  { category: 'Restrições e efeitos', name: 'Heavy', translation: 'Pesada', description: 'O operativo não pode usar esta arma em uma ativação ou contra-ação na qual tenha se movido; também não pode se mover em uma ativação ou contra-ação na qual tenha usado esta arma. Se aparecer como Heavy (X only), somente o tipo de movimento indicado por X é permitido.' },
  { category: 'Restrições e efeitos', name: 'Hot', translation: 'Instável', description: 'Depois de usar a arma, role 1D6. Se o resultado for menor que o atributo Hit da arma, o próprio operativo sofre dano igual ao resultado multiplicado por 2. Se a arma tiver Hot X, use X como multiplicador.' },
  { category: 'Restrições e efeitos', name: 'Limited X', translation: 'Limitada X', description: 'Depois que a arma for usada X vezes na batalha, o operativo não poderá usá-la novamente. Se for usada várias vezes na mesma ação, como com Blast, isso conta como uma única utilização.' },
  { category: 'Restrições e efeitos', name: 'Silent', translation: 'Silenciosa', description: 'O operativo pode realizar a ação Shoot com esta arma mesmo quando estiver com ordem Conceal.' },
];

type WeaponRuleTermEntry = { term: string; rule: WeaponRule; pattern: string };

const weaponRuleTermEntries = Array.from(new Map(weaponRules.flatMap((rule) => {
  const parameterized = /\sX\+?$/.test(rule.name);
  const terms = [rule.name, rule.translation].map((term) => term.replace(/\sX\+?$/, ''));
  return terms.map((term) => {
    const escapedTerm = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const pattern = parameterized ? `${escapedTerm}\\s+\\d+\\+?` : escapedTerm;
    return [term.toLocaleLowerCase('pt-BR'), { term, rule, pattern }] as const;
  });
})).values()).sort((a, b) => b.term.length - a.term.length);

const weaponRuleTermPattern = new RegExp(`(?<![\\p{L}])(${weaponRuleTermEntries.map(({ pattern }) => pattern).join('|')})(?![\\p{L}])`, 'giu');

function WeaponRuleTerm({ label, rule }: { label: string; rule: WeaponRule }) {
  const [open, setOpen] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ left: 12, top: 12, below: false });
  const triggerRef = useRef<HTMLButtonElement>(null);
  const tooltipRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!open) return;

    const updateTooltipPosition = () => {
      const trigger = triggerRef.current;
      const tooltip = tooltipRef.current;
      if (!trigger || !tooltip) return;

      const margin = 12;
      const gap = 10;
      const triggerRect = trigger.getBoundingClientRect();
      const tooltipWidth = tooltip.offsetWidth;
      const tooltipHeight = tooltip.offsetHeight;
      const preferredLeft = triggerRect.left + (triggerRect.width / 2) - (tooltipWidth / 2);
      const left = Math.max(margin, Math.min(window.innerWidth - tooltipWidth - margin, preferredLeft));
      const spaceAbove = triggerRect.top - margin - gap;
      const spaceBelow = window.innerHeight - triggerRect.bottom - margin - gap;
      const below = spaceAbove < tooltipHeight && spaceBelow > spaceAbove;
      const preferredTop = below ? triggerRect.bottom + gap : triggerRect.top - tooltipHeight - gap;
      const maxTop = Math.max(margin, window.innerHeight - tooltipHeight - margin);
      const top = Math.min(Math.max(margin, preferredTop), maxTop);

      setTooltipPosition({ left, top, below });
    };

    const frame = requestAnimationFrame(updateTooltipPosition);
    window.addEventListener('resize', updateTooltipPosition);
    window.addEventListener('scroll', updateTooltipPosition, true);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('resize', updateTooltipPosition);
      window.removeEventListener('scroll', updateTooltipPosition, true);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const closeOnOutsidePointer = (event: PointerEvent) => {
      const wrapper = triggerRef.current?.parentElement;
      if (wrapper && !wrapper.contains(event.target as Node)) setOpen(false);
    };

    document.addEventListener('pointerdown', closeOnOutsidePointer);
    return () => document.removeEventListener('pointerdown', closeOnOutsidePointer);
  }, [open]);

  return <span className={`weapon-rule-term-wrap ${open ? 'is-open' : ''}`} onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
    <button ref={triggerRef} type="button" className="weapon-rule-term" onClick={() => setOpen(true)} onFocus={() => setOpen(true)} onBlur={() => setOpen(false)} aria-label={`Ver significado de ${rule.name}`} aria-expanded={open}>{label}</button>
    <span ref={tooltipRef} className={`weapon-rule-tooltip ${tooltipPosition.below ? 'is-below' : ''}`} style={{ left: tooltipPosition.left, top: tooltipPosition.top }} role="tooltip"><strong>{rule.name} · {rule.translation}</strong><span>{rule.description}</span></span>
  </span>;
}

function renderWeaponRuleTerms(text: string): ReactNode {
  const parts = text.split(weaponRuleTermPattern);
  return parts.map((part, index) => {
    if (!part) return null;
    const entry = weaponRuleTermEntries.find(({ pattern }) => new RegExp(`^${pattern}$`, 'iu').test(part));
    return entry ? <WeaponRuleTerm key={`${part}-${index}`} label={part} rule={entry.rule} /> : <span key={`${part}-${index}`}>{part}</span>;
  });
}

function contentBlocks(content: string) {
  return content.split('\n\n').map((block, index) => {
    const lines = block.split('\n');
    const title = lines[0];

    if (/^[A-ZÁÀÃÂÇÉÊÍÓÔÕÚ\s]+$/.test(title) && lines.length === 1) return <h3 key={index} className="rule-title">{title}</h3>;
    if (/^[A-ZÁÀÃÂÇÉÊÍÓÔÕÚ\s]+$/.test(title)) {
      return <section key={index} className="rule-section"><h3 className="rule-title">{title}</h3>{lines.slice(1).map((line, lineIndex) => line.startsWith('- ') ? <p className="bullet" key={lineIndex}>{renderWeaponRuleTerms(line.slice(2))}</p> : <p key={lineIndex}>{renderWeaponRuleTerms(line)}</p>)}</section>;
    }
    if (lines.every((line) => line.startsWith('- '))) return <ul key={index}>{lines.map((line, lineIndex) => <li key={lineIndex}>{renderWeaponRuleTerms(line.slice(2))}</li>)}</ul>;
    return <p key={index}>{renderWeaponRuleTerms(block)}</p>;
  });
}

function MissionSelectionGuide() {
  const steps = [
    ['01', 'Escolham a Crit Op', 'Escolham por acordo ou sorteio uma Operação Crítica. Ela é a missão principal e é compartilhada pelos dois jogadores.'],
    ['02', 'Preparem o mapa', 'Escolham o layout da zona de combate e coloquem terreno e marcadores de objetivo conforme o mapa e a Crit Op.'],
    ['03', 'Escolham as Tac Ops', 'Cada jogador escolhe secretamente uma Tac Op de um arquétipo disponível para sua própria kill team.'],
    ['04', 'Definam iniciativa e zonas', 'Façam a primeira rolagem de iniciativa. Quem vencer decide quem terá a iniciativa e, por isso, escolhe a zona de desembarque.'],
    ['05', 'Preparem as kill teams', 'Selecionem operativos, equipamentos e façam a preparação normal da batalha.'],
    ['06', 'Escolham a Operação Primária', 'No primeiro Ponto de Virada, cada jogador escolhe secretamente Crit Op, Kill Op ou Tac Op como sua Operação Primária.'],
  ];

  return <section className="guide-layout">
    <div className="guide-intro"><p className="eyebrow">ANTES DA BATALHA</p><h2>Seleção de missões</h2><p>Uma forma rápida de preparar uma partida de Approved Ops 2025 sem esquecer decisões importantes.</p></div>
    <div className="selection-summary">
      <div><span>1</span><strong>Crit Op</strong><small>Compartilhada</small></div>
      <div><span>1</span><strong>Kill Op</strong><small>Compartilhada</small></div>
      <div><span>1</span><strong>Tac Op</strong><small>Secreta, por jogador</small></div>
    </div>
    <div className="steps-grid">
      {steps.map(([number, title, description]) => <article className="guide-step" key={number}><span>{number}</span><h3>{title}</h3><p>{description}</p></article>)}
    </div>
    <aside className="guide-note"><p className="eyebrow">LEMBRETE</p><p>A Kill Op é sempre usada. A Tac Op não é revelada no começo: siga a condição <em>REVELAR</em> impressa na carta escolhida.</p></aside>
  </section>;
}

function TacOpsGuide() {
  return <section className="guide-layout tac-guide">
    <div className="guide-intro"><p className="eyebrow">OPERAÇÃO TÁTICA</p><h2>Como funciona uma Tac Op</h2><p>Cada jogador escolhe uma única Tac Op, em segredo, entre os arquétipos que a sua kill team possui.</p></div>
    <div className="tac-basics">
      <article><span>1</span><h3>Escolha secreta</h3><p>Selecione uma carta antes da batalha. O oponente não deve saber qual foi.</p></article>
      <article><span>2</span><h3>Revele no momento certo</h3><p>Cada carta informa a condição <em>REVELAR</em>. Só vire a carta quando ela acontecer.</p></article>
      <article><span>3</span><h3>Marque o que a carta diz</h3><p>O momento e a quantidade de PV variam de Tac Op para Tac Op.</p></article>
    </div>
    <section className="score-table-wrap" aria-labelledby="tac-score-title">
      <div className="table-title"><p className="eyebrow">REFERÊNCIA RÁPIDA</p><h3 id="tac-score-title">Pontuação da Tac Op</h3></div>
      <div className="table-scroll"><table><thead><tr><th>Momento</th><th>Como pontuar</th><th>Observe</th></tr></thead><tbody>
        <tr><td>Condição de revelar</td><td>Não concede PV por si só; ela mostra quando a carta passa a ser pública.</td><td>Consulte a seção <strong>REVELAR</strong>.</td></tr>
        <tr><td>Durante um Ponto de Virada</td><td>Marque a quantidade de PV indicada na própria carta quando cumprir a condição.</td><td>Muitas cartas limitam quantos PV podem ser marcados por Ponto de Virada.</td></tr>
        <tr><td>Ao final da batalha</td><td>Algumas Tac Ops concedem PV extras se seus marcadores ou operativos estiverem na condição pedida.</td><td>Só vale quando a carta disser expressamente.</td></tr>
        <tr><td>Limite geral</td><td>Uma operação não pode render mais de <strong>6 PV</strong>.</td><td>Vale para a sua Tac Op, Crit Op e Kill Op.</td></tr>
        <tr><td>Se for Primária</td><td>No fim da batalha, marque PV extras iguais à metade dos PV feitos nela, arredondando para cima.</td><td>A Primária pode ser sua Tac Op, Crit Op ou Kill Op.</td></tr>
      </tbody></table></div>
    </section>
    <aside className="guide-note"><p className="eyebrow">IMPORTANTE</p><p>Não escolha qualquer arquétipo: use apenas os arquétipos listados nas regras da sua kill team.</p></aside>
  </section>;
}

function KillOpsGuide() {
  return <section className="guide-layout tac-guide">
    <div className="guide-intro"><p className="eyebrow">OPERAÇÃO DE ELIMINAÇÃO</p><h2>Como funciona a Kill Op</h2><p>É a operação compartilhada que recompensa incapacitar operativos inimigos ao longo da batalha.</p></div>
    <div className="tac-basics">
      <article><span>1</span><h3>Comece no grau 0</h3><p>Use a linha da tabela correspondente ao número inicial de operativos da kill team inimiga.</p></article>
      <article><span>2</span><h3>Avance por incapacitações</h3><p>Quando atingir cada limite da sua linha, seu grau de eliminação sobe e você marca 1 PV.</p></article>
      <article><span>3</span><h3>Compare no fim</h3><p>Se seu grau for maior que o grau do oponente ao fim da batalha, marque mais 1 PV.</p></article>
    </div>
    <section className="score-table-wrap" aria-labelledby="kill-score-title">
      <div className="table-title"><p className="eyebrow">TABELA DE GRAUS</p><h3 id="kill-score-title">Operativos incapacitados necessários</h3></div>
      <div className="table-scroll"><table><thead><tr><th>Operativos inimigos iniciais</th><th>Grau 1</th><th>Grau 2</th><th>Grau 3</th><th>Grau 4</th><th>Grau 5</th></tr></thead><tbody>
        {killOpGrades.map(([starting, ...grades]) => <tr key={starting}><td>{starting}</td>{grades.map((grade, index) => <td key={index}>{grade} incapacitado{grade === 1 ? '' : 's'}</td>)}</tr>)}
      </tbody></table></div>
    </section>
    <aside className="guide-note"><p className="eyebrow">EXEMPLO</p><p>Contra uma kill team que começou com 10 operativos, você chega ao Grau 1 após 2 incapacitações, ao Grau 2 após 4 e ao Grau 5 após 10. Cada novo grau rende 1 PV. A Kill Op também pode ser escolhida como sua Operação Primária.</p></aside>
  </section>;
}

function SelectedMissions({ mission, tacOp, onClearMission, onClearTacOp }: { mission: Card | null; tacOp: Card | null; onClearMission: () => void; onClearTacOp: () => void }) {
  const renderSelection = (card: Card | null, type: string, empty: string, onClear: () => void) => (
    <article className="selected-card">
      <div className="detail-topline"><span>{type}</span>{card && <span>#{String(card.number).padStart(2, '0')}</span>}</div>
      {card ? <><h3>{card.name}</h3><p className="original-name">{card.source.name_en}</p><div className="rules-copy">{contentBlocks(card.content_markdown)}</div><button className="clear-selection" onClick={onClear}>Remover seleção</button></> : <div className="empty-selection"><strong>Nenhuma carta escolhida</strong><p>{empty}</p></div>}
    </article>
  );

  return <section className="selected-layout">
    <div className="guide-intro"><p className="eyebrow">PARTIDA ATUAL</p><h2>Missões selecionadas</h2><p>Suas escolhas ficam guardadas neste navegador para consulta rápida durante a partida.</p></div>
    <div className="selected-grid">
      {renderSelection(mission, 'MISSÃO DA PARTIDA · CRIT OP', 'Escolha uma carta na aba “Missões da partida” e toque em “Selecionar para a partida”.', onClearMission)}
      {renderSelection(tacOp, 'SUA TAC OP', 'Escolha uma carta na aba “Tac Ops” e toque em “Selecionar para a partida”.', onClearTacOp)}
    </div>
  </section>;
}

function WeaponRulesGuide() {
  const [query, setQuery] = useState('');
  const normalizedQuery = query.trim().toLocaleLowerCase('pt-BR');
  const filteredRules = weaponRules.filter((rule) => [rule.name, rule.translation, rule.description].join(' ').toLocaleLowerCase('pt-BR').includes(normalizedQuery));
  const categories = [...new Set(weaponRules.map((rule) => rule.category))];

  return <div className="weapon-guide">
    <div className="guide-intro"><p className="eyebrow">GLOSSÁRIO UNIVERSAL</p><h2>Regras de armas</h2><p>Consulte o significado das regras que aparecem nos perfis de armas. O nome original fica visível para facilitar a conferência nas fichas em inglês.</p></div>
    <div className="weapon-toolbar">
      <label htmlFor="weapon-search"><span className="eyebrow">BUSCAR REGRA</span><input id="weapon-search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Ex.: Piercing, pesada, alcance…" /></label>
      <p>{filteredRules.length} de {weaponRules.length} regras</p>
    </div>
    {filteredRules.length === 0 ? <div className="weapon-empty">Nenhuma regra encontrada. Tente buscar pelo nome em inglês ou pela tradução.</div> : categories.map((category) => {
      const rules = filteredRules.filter((rule) => rule.category === category);
      if (!rules.length) return null;
      return <section className="weapon-category" key={category}><div className="weapon-category-heading"><p className="eyebrow">{category}</p><span>{rules.length}</span></div><div className="weapon-list">{rules.map((rule) => <article className="weapon-rule" key={rule.name}><div className="weapon-rule-heading"><h3>{rule.translation}</h3><span>{rule.name}</span></div><p>{renderWeaponRuleTerms(rule.description)}</p></article>)}</div></section>;
    })}
    <aside className="guide-note"><p className="eyebrow">NOTA DE ATUALIZAÇÃO</p><p>{renderWeaponRuleTerms('Esta é uma tradução de referência baseada nas Lite Rules. A redação de Heavy, Torrent e Severe já considera a errata oficial mais recente. Em caso de conflito, prevalece a regra oficial online da Games Workshop.')}</p></aside>
  </div>;
}

type MovementRule = { name: string; translation: string; ap: string; description: string; restrictions: string };

const movementRules: MovementRule[] = [
  { name: 'Reposition', translation: 'Reposicionar', ap: '1 AP', description: 'Mova o operativo até o valor do atributo Move dele, terminando em um local onde ele possa ser colocado. Ele não pode entrar no controle de alcance de um operativo inimigo.', restrictions: 'Não pode ser usada enquanto o operativo estiver no controle de alcance de um inimigo, nem na mesma ativação que Charge ou Fall Back.' },
  { name: 'Dash', translation: 'Avanço', ap: '1 AP', description: 'Funciona como Reposition, mas o operativo pode mover no máximo 3" e não pode escalar terreno.', restrictions: 'Não pode ser usada enquanto o operativo estiver no controle de alcance de um inimigo, nem na mesma ativação que Charge.' },
  { name: 'Charge', translation: 'Investida', ap: '1 AP', description: 'Funciona como Reposition, mas acrescenta 2" à distância máxima. O operativo pode entrar no controle de alcance de um inimigo e deve terminar o movimento dentro do controle de alcance de um inimigo.', restrictions: 'Não pode ser usada com ordem Conceal, enquanto o operativo já estiver no controle de alcance de um inimigo, nem na mesma ativação que Reposition, Dash ou Fall Back. Se entrar no controle de alcance de um inimigo e nenhum outro operativo aliado estiver dentro do controle de alcance dele, não pode sair desse controle durante a ação.' },
  { name: 'Fall Back', translation: 'Recuar', ap: '2 AP', description: 'Funciona como Reposition, mas permite mover-se dentro do controle de alcance de um inimigo. O operativo não pode terminar o movimento dentro desse controle de alcance.', restrictions: 'Só pode ser usada se houver um inimigo dentro do controle de alcance do operativo. Não pode ser usada na mesma ativação que Reposition ou Charge.' },
];

function MovementRulesGuide() {
  return <div className="movement-guide">
    <div className="guide-intro"><p className="eyebrow">AÇÕES DE MOVIMENTO</p><h2>Regras de movimento</h2><p>As ações abaixo são as formas básicas de mover seus operativos. Sempre respeite o APL disponível e termine a ação em um local onde o modelo possa ser colocado.</p></div>
    <div className="movement-list">{movementRules.map((rule) => <article className="movement-rule" key={rule.name}><div className="movement-rule-heading"><div><h3>{rule.translation}</h3><span>{rule.name}</span></div><strong>{rule.ap}</strong></div><p>{rule.description}</p><div className="movement-restriction"><span>RESTRIÇÕES</span><p>{rule.restrictions}</p></div></article>)}</div>
    <div className="movement-reference-grid">
      <article><p className="eyebrow">CONTROLE DE ALCANCE</p><h3>Control range</h3><p>Algo está dentro do controle de alcance de um operativo quando está visível para ele e a até 1" de distância. O controle entre operativos é mútuo: se a condição for verdadeira para um deles, ambos estão no controle de alcance um do outro.</p></article>
      <article><p className="eyebrow">CONTRA-AÇÃO</p><h3>Counteract</h3><p>Quando todos os seus operativos já foram gastos, um operativo aliado gasto com ordem Engage pode fazer uma ação de 1 AP gratuitamente. Ele só pode contra-agir uma vez por Ponto de Virada e não pode se mover mais de 2" durante a contra-ação.</p></article>
    </div>
    <aside className="guide-note"><p className="eyebrow">ORDEM CONCEAL</p><p>Um operativo com ordem Conceal não pode realizar Shoot nem Charge. Para fazer uma Investida, ele precisa estar com ordem Engage.</p></aside>
  </div>;
}

function FightRulesGuide() {
  return <div className="fight-guide">
    <div className="guide-intro"><p className="eyebrow">COMBATE CORPO A CORPO</p><h2>Lutar e retaliar</h2><p>A ação Fight resolve um combate inteiro. O operativo que iniciou a luta ataca primeiro; o alvo escolhido participa da mesma sequência e pode retaliar.</p></div>
    <div className="fight-flow">
      <article><span>01</span><h3>Escolha o alvo</h3><p>O atacante escolhe um operativo inimigo dentro do seu controle de alcance. Esse inimigo será o operativo que vai retaliar.</p></article>
      <article><span>02</span><h3>Escolham as armas</h3><p>Os dois jogadores escolhem uma arma corpo a corpo do seu operativo. Cada arma usa seu próprio Atk, Hit e Dmg.</p></article>
      <article><span>03</span><h3>Rolem os dados</h3><p>Cada jogador rola uma quantidade de D6 igual ao Atk da arma. Resultado igual ou maior que Hit é sucesso; 6 é crítico e 1 é falha.</p></article>
      <article><span>04</span><h3>Alternem resultados</h3><p>Começando pelo atacante, os jogadores alternam a resolução dos sucessos não bloqueados até que todos sejam resolvidos ou bloqueados.</p></article>
    </div>
    <section className="fight-actions" aria-labelledby="fight-actions-title">
      <div className="table-title"><p className="eyebrow">RESOLVENDO OS DADOS</p><h3 id="fight-actions-title">Golpear ou bloquear</h3></div>
      <div className="fight-action-grid">
        <article><h3>Golpear</h3><p>Cause dano ao operativo inimigo. Um sucesso normal causa o primeiro valor de Dmg da arma; um sucesso crítico causa o segundo valor.</p></article>
        <article><h3>Bloquear</h3><p>Aloque o dado para bloquear um sucesso ainda não resolvido do oponente. Um sucesso normal bloqueia um normal; um crítico bloqueia um normal ou um crítico.</p></article>
      </div>
    </section>
    <section className="fight-example" aria-labelledby="fight-example-title"><div className="table-title"><p className="eyebrow">EXEMPLO PRÁTICO</p><h3 id="fight-example-title">Quando o defensor tem mais sucessos</h3></div><p className="fight-example-intro">O atacante reteve <strong>2 sucessos</strong> e o defensor reteve <strong>3 sucessos</strong>. Considerando que nenhum dado seja bloqueado, a resolução acontece assim:</p><div className="fight-example-sequence"><div><span>1</span><strong>Atacante</strong><p>Resolve o primeiro dado.</p></div><div><span>2</span><strong>Defensor</strong><p>Retalia com o primeiro dado.</p></div><div><span>3</span><strong>Atacante</strong><p>Resolve o segundo dado.</p></div><div><span>4</span><strong>Defensor</strong><p>Retalia com o segundo dado.</p></div><div className="last-step"><span>5</span><strong>Defensor</strong><p>Como o atacante ficou sem dados, resolve o terceiro dado restante.</p></div></div><p className="fight-example-conclusion">Os dados extras do defensor não são descartados: ele pode usá-los para golpear ou bloquear enquanto ainda houver sucessos inimigos não resolvidos.</p></section>
    <section className="retaliate-card" aria-labelledby="retaliate-title"><p className="eyebrow">RESPOSTA DO ALVO</p><h3 id="retaliate-title">O que significa retaliar?</h3><p>Retaliar não é uma ação separada e não custa AP. É a resolução dos dados do operativo que foi escolhido como alvo da ação Fight. Depois que o atacante resolve um dado, o defensor pode resolver um dos seus dados bem-sucedidos não bloqueados, escolhendo Golpear ou Bloquear.</p><p>Por isso, mesmo que o atacante tenha iniciado a luta, o alvo pode causar dano antes do fim da sequência — a menos que seus dados sejam bloqueados ou que uma regra específica altere essa ordem.</p></section>
    <aside className="guide-note"><p className="eyebrow">RESUMO RÁPIDO</p><p><strong>Fight custa 1 AP.</strong> Só pode escolher um inimigo dentro do controle de alcance. Ambos rolam dados, o atacante resolve primeiro e o alvo alterna suas resoluções para retaliar. A luta usa armas corpo a corpo, não armas de tiro.</p></aside>
  </div>;
}

function OrdersVisibilityGuide() {
  return <div className="orders-guide">
    <div className="guide-intro"><p className="eyebrow">ORDENS E LINHA DE VISÃO</p><h2>Conceal, Engage e cobertura</h2><p>A ordem define como o operativo pode agir e como ele pode ser escolhido como alvo. Ela não substitui a verificação de visibilidade e cobertura.</p></div>
    <div className="orders-grid">
      <article className="order-card engage-card"><div className="order-card-heading"><h3>Engage</h3><span>Engajado</span></div><p>O operativo pode realizar ações normalmente e também pode fazer uma Contra-ação quando as condições forem atendidas.</p><div className="order-highlight"><strong>Alvo válido</strong><span>Se estiver visível para o atacante.</span></div></article>
      <article className="order-card conceal-card"><div className="order-card-heading"><h3>Conceal</h3><span>Oculto</span></div><p>O operativo não pode ser um alvo válido enquanto estiver em cobertura. Ele também não pode realizar Shoot nem Charge.</p><div className="order-highlight"><strong>Importante</strong><span>Conceal não significa invisível: se não estiver em cobertura, ainda pode ser alvo quando estiver visível.</span></div></article>
    </div>
    <section className="injured-card" aria-labelledby="injured-title"><div className="table-title"><p className="eyebrow">FERIDAS E ESTADO</p><h3 id="injured-title">Quando o operativo está ferido?</h3></div><div className="injured-copy"><p>Os termos abaixo descrevem estados diferentes. Perder qualquer quantidade de feridas torna o operativo <strong>wounded (ferido)</strong>; a penalidade acontece quando ele fica <strong>injured (gravemente ferido)</strong>.</p><div className="injured-effects"><article><strong>Wounded — ferido</strong><p>O operativo tem menos feridas do que o seu valor inicial, mas ainda não está abaixo da metade.</p></article><article><strong>Injured — gravemente ferido</strong><p>Com menos da metade das feridas iniciais, subtraia 2&quot; do seu atributo Move e piore em 1 o atributo Hit das suas armas.</p></article></div><p className="injured-note"><strong>Incapacitado:</strong> se o operativo chegar a 0 ou menos feridas, ele fica incapacitado e é removido da zona de combate.</p></div></section>
    <section className="visibility-card" aria-labelledby="visibility-title"><div className="table-title"><p className="eyebrow">LINHA DE VISÃO</p><h3 id="visibility-title">Como saber se algo está visível?</h3></div><div className="visibility-copy"><p>Olhe a partir da cabeça do operativo. Se for possível traçar uma linha reta sem obstrução até qualquer parte do modelo alvo, ignorando as bases, o alvo está visível.</p><div className="visibility-points"><div><span>✓</span><p>Uma pequena parte do modelo pode ser suficiente para haver visibilidade.</p></div><div><span>×</span><p>Se o terreno bloquear todas as linhas até o modelo, não há visibilidade.</p></div><div><span>!</span><p>Visível não significa automaticamente alvo válido: a ordem Conceal e a cobertura ainda precisam ser verificadas.</p></div></div></div></section>
    <section className="cover-card" aria-labelledby="cover-title"><div className="table-title"><p className="eyebrow">TERRENO E DEFESA</p><h3 id="cover-title">Como funciona a cobertura?</h3></div><div className="cover-grid"><article><h3>Quando existe cover?</h3><p>A cobertura é determinada de um operativo em relação ao outro. O alvo está em cobertura quando há terreno interveniente dentro do seu controle de alcance.</p><p>Porém, ele não pode estar em cobertura se estiver a menos de 2" do outro operativo — está perto demais para se esconder.</p></article><article><h3>Efeito na defesa</h3><p>Quando o alvo está em cobertura, o defensor pode reter um dado de defesa como sucesso normal sem rolá-lo.</p><p>Com Conceal, essa cobertura também pode impedir que o alvo seja escolhido como alvo válido.</p></article></div></section>
    <aside className="guide-note"><p className="eyebrow">ATUALIZAÇÃO IMPORTANTE</p><p>{renderWeaponRuleTerms('Se o mesmo terreno deixaria o operativo em cover e também obscured (obstruído), o defensor escolhe qual dos dois efeitos será usado naquela sequência. Regras como Seek podem permitir mirar um operativo em Conceal, mas não removem automaticamente o salvamento de cobertura.')}</p></aside>
  </div>;
}

type KillTeam = { id: string; name: string; faction: string; short: string; accent: string };

const killTeams: KillTeam[] = [
  { id: 'angels-of-death', name: 'Angels of Death', faction: 'Adeptus Astartes', short: 'AD', accent: 'Astartes' },
  { id: 'blades-of-khaine', name: 'Blades of Khaine', faction: 'Aeldari', short: 'BK', accent: 'Aeldari' },
  { id: 'death-korps', name: 'Death Korps', faction: 'Astra Militarum', short: 'DK', accent: 'Krieg' },
  { id: 'hierotek-circle', name: 'Hierotek Circle', faction: 'Necrons', short: 'HC', accent: 'Necron' },
  { id: 'kommandos', name: 'Kommandos', faction: 'Orks', short: 'KO', accent: 'Ork' },
  { id: 'legionaries', name: 'Legionaries', faction: 'Chaos Space Marines', short: 'LE', accent: 'Chaos' },
  { id: 'plague-marines', name: 'Plague Marines', faction: 'Death Guard', short: 'PM', accent: 'Nurgle' },
  { id: 'warpcoven', name: 'Warpcoven', faction: 'Thousand Sons', short: 'WC', accent: 'Warp' },
];

const killTeamArchetypes: Record<string, readonly (typeof archetypes[number])[]> = {
  'angels-of-death': ['Segurança', 'Buscar e Destruir'],
  'blades-of-khaine': ['Infiltração', 'Reconhecimento', 'Segurança', 'Buscar e Destruir'],
  'death-korps': ['Segurança', 'Buscar e Destruir'],
  'hierotek-circle': ['Reconhecimento', 'Segurança'],
  kommandos: ['Infiltração', 'Buscar e Destruir'],
  legionaries: ['Segurança', 'Buscar e Destruir'],
  'plague-marines': ['Segurança', 'Buscar e Destruir'],
  warpcoven: ['Reconhecimento', 'Segurança'],
};

const angelsOfDeathTactics = [
  { name: 'Aggressive', translation: 'Agressivo', effect: 'As armas corpo a corpo dos seus operativos têm a regra especial Rending (Dilacerante).' },
  { name: 'Dueller', translation: 'Duelista', effect: 'Uma vez por sequência de luta, ao lutar ou retaliar, um sucesso normal pode bloquear um sucesso crítico não resolvido do inimigo (a menos que a arma inimiga tenha Brutal). Um sucesso crítico pode bloquear dois sucessos normais não resolvidos, em vez de bloquear um crítico.' },
  { name: 'Resolute', translation: 'Resoluto', effect: 'Ignore quaisquer alterações no APL do operativo.' },
  { name: 'Stealthy', translation: 'Furtivo', effect: 'Quando o operativo for alvo de Shoot, se puder reter algum salvamento de cobertura, retenha um salvamento de cobertura adicional ou transforme um salvamento de cobertura em um sucesso crítico. Isso não se acumula com o salvamento de cobertura melhorado de terreno Vantage.' },
  { name: 'Mobile', translation: 'Móvel', effect: 'A ação Fall Back custa 1 AP a menos. Além disso, o operativo pode fazer Charge enquanto estiver no alcance de controle de um inimigo e pode sair desse alcance para realizar o movimento, respeitando os requisitos normais de Charge.' },
  { name: 'Hardy', translation: 'Resistente', effect: 'Quando o operativo for alvo de Shoot, resultados de 5+ nos dados de defesa são sucessos críticos.' },
  { name: 'Sharpshooter', translation: 'Atirador de elite', effect: 'Se o operativo não tiver realizado Charge, Fall Back ou Reposition durante a ativação, suas armas bolt usadas em Shoot têm Severe.' },
  { name: 'Siege Specialist', translation: 'Especialista em cerco', effect: 'As armas de tiro dos seus operativos têm Saturate.' },
];

type FactionPloy = { name: string; translation: string; effect: string };

const angelsStrategicPloys: FactionPloy[] = [
  { name: 'Combat Doctrine', translation: 'Doutrina de combate', effect: 'Escolha uma doutrina. Durante este Ponto de Virada, as armas dos seus operativos ANGEL OF DEATH têm Balanced quando: Devastator Doctrine: estão atirando em um operativo a mais de 6"; Tactical Doctrine: estão atirando em um operativo a até 6"; Assault Doctrine: estão lutando ou retaliando.' },
  { name: 'And They Shall Know No Fear', translation: 'E não conhecerão o medo', effect: 'Ignore quaisquer alterações nos atributos dos seus operativos ANGEL OF DEATH causadas por estarem feridos, incluindo alterações nos atributos das armas.' },
  { name: 'Adaptive Tactics', translation: 'Táticas adaptativas', effect: 'Troque sua Tática de Capítulo secundária. A troca dura somente até o fim deste Ponto de Virada; depois, sua Tática de Capítulo secundária original retorna.' },
  { name: 'Indomitus', translation: 'Indomitus', effect: 'Quando um operativo estiver atirando em um operativo ANGEL OF DEATH aliado, se rolar duas ou mais falhas, pode descartar uma delas para reter outra como sucesso normal.' },
];

const angelsFirefightPloys: FactionPloy[] = [
  { name: 'Adjust Doctrine', translation: 'Ajustar doutrina', effect: 'Use durante a ativação de um operativo ANGEL OF DEATH aliado, antes ou depois de ele realizar uma ação. Se você tiver usado Combat Doctrine neste Ponto de Virada, troque a doutrina de combate escolhida.' },
  { name: 'Transhuman Physiology', translation: 'Fisiologia trans-humana', effect: 'Use quando um operativo estiver atirando em um operativo ANGEL OF DEATH aliado, na etapa Rolar Dados de Defesa. Você pode reter um dos seus sucessos normais como sucesso crítico.' },
  { name: 'Shock Assault', translation: 'Assalto de choque', effect: 'Use quando um operativo ANGEL OF DEATH aliado estiver realizando Fight durante uma ativação na qual realizou Charge, no início da etapa Resolver Dados de Ataque. Até o fim dessa ação, sua arma corpo a corpo tem Shock e, na primeira vez que ele Golpear nessa sequência, causa 1 dano adicional, até o máximo de 7.' },
  { name: 'Wrath of Vengeance', translation: 'Ira da vingança', effect: 'Use quando um operativo ANGEL OF DEATH aliado estiver fazendo uma contra-ação. Ele pode realizar gratuitamente uma ação adicional de 1 AP durante essa contra-ação, mas as duas ações devem ser diferentes.' },
];

function AngelsOfDeathPloys({ type }: { type: 'strategic' | 'firefight' }) {
  const ploys = type === 'strategic' ? angelsStrategicPloys : angelsFirefightPloys;
  const isStrategic = type === 'strategic';

  return <section className="team-ploy-content" aria-labelledby={`${type}-ploys-title`}>
    <div className="team-ploy-heading"><p className="eyebrow">{isStrategic ? 'STRATEGIC PLOYS' : 'FIREFIGHT PLOYS'} · ANGELS OF DEATH</p><h4 id={`${type}-ploys-title`}>{isStrategic ? 'Ploys estratégicos' : 'Ploys de tiroteio'}</h4><p>{isStrategic ? 'Efeitos estratégicos para definir ou alterar a doutrina de combate dos Astartes.' : 'Efeitos usados durante ativações, lutas, disparos e contra-ações.'}</p></div>
    <div className="team-ploy-list">{ploys.map((ploy) => <article className="team-ploy-card" key={ploy.name}><div className="team-ploy-card-heading"><h5>{ploy.translation}</h5><span>{ploy.name}</span></div><p>{renderWeaponRuleTerms(ploy.effect)}</p></article>)}</div>
  </section>;
}

function AngelsOfDeathFactionRules() {
  return <section className="team-rule-content" aria-labelledby="angels-team-rule-title">
    <div className="team-rule-heading"><p className="eyebrow">REGRA DA EQUIPE · ANGELS OF DEATH</p><h4 id="angels-team-rule-title">Táticas de Capítulo</h4><p>Ao selecionar o time, escolha uma Tática de Capítulo primária e uma secundária. Os operativos ANGEL OF DEATH recebem os efeitos das duas durante a batalha.</p></div>
    <article className="team-faction-card"><p className="eyebrow">REGRA DE FACÇÃO</p><h4>Astartes</h4><ul><li>Durante a ativação, cada operativo ANGEL OF DEATH pode realizar duas ações Shoot ou duas ações Fight.</li><li>Se realizar duas ações Shoot, pelo menos uma delas deve usar uma arma bolt. Se as duas usarem bolt sniper rifle ou heavy bolter, a segunda ação custa 1 AP adicional.</li><li>Cada operativo ANGEL OF DEATH pode fazer uma contra-ação independentemente da sua ordem.</li></ul></article>
    <article className="team-faction-card"><p className="eyebrow">ESCOLHA DE TÁTICAS</p><h4>Oito opções de Capítulo</h4><div className="team-tactics-grid">{angelsOfDeathTactics.map((tactic) => <div className="team-tactic" key={tactic.name}><h5>{tactic.translation} <span>{tactic.name}</span></h5><p>{renderWeaponRuleTerms(tactic.effect)}</p></div>)}</div></article>
    <aside className="team-rule-note"><strong>Importante:</strong> se a mesma Tática de Capítulo for escolhida como primária e secundária, os efeitos não se acumulam. Em uma série de partidas, campanha ou torneio, mantenha as mesmas escolhas; a secundária ainda pode ser alterada por uma regra que permita isso, como a Strategic Ploy Adaptive Tactics.</aside>
  </section>;
}

const hierotekStrategicPloys: FactionPloy[] = [
  { name: 'Relentless Onslaught', translation: 'Investida implacável', effect: 'Sempre que um operativo HIEROTEK CIRCLE estiver realizando Shoot contra um operativo a até 8" dele, as armas de tiro desse operativo têm a regra Balanced. Ao usar Magnify, o operativo que está atirando ainda precisa estar a até 8" do alvo; não basta que o outro operativo usado para determinar o alvo esteja nessa distância.' },
  { name: 'Undying Androids', translation: 'Androides incansáveis', effect: 'Sempre que um operativo estiver atirando contra um operativo HIEROTEK CIRCLE aliado, se você não puder reter nenhum sucesso de defesa por cobertura, pode reter um dado de defesa como sucesso normal sem rolá-lo.' },
];

const hierotekFirefightPloys: FactionPloy[] = [
  { name: 'Cortical Control', translation: 'Controle cortical', effect: 'Use quando um APPRENTEK ou CRYPTEK HIEROTEK CIRCLE aliado realizar uma ação única SUPPORT. Até o fim dessa ação, ao escolher outro operativo aliado, ignore o requisito de distância; apenas a visibilidade é necessária.' },
  { name: 'Reanimated Function', translation: 'Função reanimada', effect: 'Use ao determinar o controle de um marcador. Escolha um dos seus marcadores de Reanimação. Até o início do próximo Ponto de Virada, sempre que determinar o controle de um marcador, trate esse marcador de Reanimação como um operativo HIEROTEK CIRCLE aliado com APL 1. Esta ploy não tem efeito para a Tac Op Martyrs, das Approved Ops 2025.' },
  { name: 'Methodical Elimination', translation: 'Eliminação metódica', effect: 'As armas corpo a corpo dos seus operativos HIEROTEK CIRCLE têm Accurate 1. Quando um operativo lutar em uma ativação na qual não tenha se movido mais do que seu atributo Move, ou quando estiver retaliando, suas armas corpo a corpo têm Accurate 2.' },
  { name: 'Living Lightning', translation: 'Relâmpago vivo', effect: 'Use quando um IMMORTAL HIEROTEK CIRCLE aliado estiver realizando Shoot e você escolher uma tesla carbine. Até o fim da ação, essa arma deixa de usar o requisito de 2" da sua regra Devastating e passa a ter Blast 2".' },
  { name: 'Command Underlings', translation: 'Comando dos subalternos', effect: 'Escolha uma opção: SUPPORT — cada outro operativo HIEROTEK CIRCLE aliado visível e a até 6" de um CRYPTEK aliado pode realizar imediatamente uma ação Dash gratuita, com a ordem que você escolher; ou SUPPORT — cada outro operativo HIEROTEK CIRCLE aliado, exceto CRYPTEK, visível e a até 3" de um APPRENTEK aliado pode fazer o mesmo.' },
  { name: 'Dimensional Ambush', translation: 'Emboscada dimensional', effect: 'Use durante a ativação de um DEATHMARK HIEROTEK CIRCLE aliado que tenha ordem Conceal. Durante essa ativação, ele pode realizar a ação Guard em qualquer killzone mesmo estando em Conceal. Porém, quando fizer a ação Shoot ou Fight gratuita durante a interrupção, sua ordem deve mudar para Engage.' },
];

function HierotekCirclePloys({ type }: { type: 'strategic' | 'firefight' }) {
  const ploys = type === 'strategic' ? hierotekStrategicPloys : hierotekFirefightPloys;
  const isStrategic = type === 'strategic';

  return <section className="team-ploy-content" aria-labelledby={`hierotek-${type}-ploys-title`}>
    <div className="team-ploy-heading"><p className="eyebrow">{isStrategic ? 'STRATEGIC PLOYS' : 'FIREFIGHT PLOYS'} · HIEROTEK CIRCLE</p><h4 id={`hierotek-${type}-ploys-title`}>{isStrategic ? 'Ploys estratégicos' : 'Ploys de tiroteio'}</h4><p>{isStrategic ? 'Recursos estratégicos para melhorar os disparos e a resistência dos Necrons.' : 'Efeitos usados durante ações, ativações, disparos e controle de marcadores.'}</p></div>
    <div className="team-ploy-list">{ploys.map((ploy) => <article className="team-ploy-card" key={ploy.name}><div className="team-ploy-card-heading"><h5>{ploy.translation}</h5><span>{ploy.name}</span></div><p>{renderWeaponRuleTerms(ploy.effect)}</p></article>)}</div>
  </section>;
}

function HierotekCircleFactionRules() {
  return <section className="team-rule-content" aria-labelledby="hierotek-team-rule-title">
    <div className="team-rule-heading"><p className="eyebrow">REGRA DA EQUIPE · HIEROTEK CIRCLE</p><h4 id="hierotek-team-rule-title">Protocolos Necrons</h4><p>Os Necrons podem se reanimar, recuperar feridas e usar a consciência dos Crypteks para ampliar a capacidade de combate dos seus servos.</p></div>
    <article className="team-faction-card"><p className="eyebrow">REGRA DE FACÇÃO</p><h4>Protocolos de Reanimação</h4><ul><li>Na primeira vez que cada operativo HIEROTEK CIRCLE aliado ficar incapacitado, antes de removê-lo, coloque um marcador de Reanimação dentro do seu controle de alcance. Depois remova o operativo, junto com seus tokens e efeitos de regras.</li><li>No passo Ready de cada fase de Estratégia, escolha um marcador e role 1D6. Com 1–2, ele permanece no killzone e você repete o processo com outro marcador, se houver. Com 3+, o operativo ligado a esse marcador é reanimado.</li><li>Cada marcador só pode ser escolhido uma vez por Ponto de Virada. Depois de obter 3+, não escolha mais marcadores nesse Ponto de Virada. O operativo reanimado é colocado a até 3&quot; do marcador, fora do alcance de controle inimigo, com 1 ferida, ordem à sua escolha e pronto; então remova o marcador.</li></ul></article>
    <article className="team-faction-card"><p className="eyebrow">REGRAS ADICIONAIS</p><h4>Magnify e Living Metal</h4><ul><li><strong>Magnify:</strong> ao realizar Shoot com uma arma que tenha essa regra, se outro APPRENTEK ou CRYPTEK aliado estiver em Engage e visível, você pode usá-lo para determinar alvo válido, cobertura e obstrução. A arma recebe Ceaseless até o fim da ação.</li><li><strong>Living Metal:</strong> no passo Ready de cada fase de Estratégia, depois das outras regras desse passo, cada operativo HIEROTEK CIRCLE aliado recupera 1D3+1 feridas perdidas.</li></ul></article>
    <aside className="team-rule-note"><strong>Kill Op:</strong> para a pontuação do oponente, o número inicial de operativos HIEROTEK CIRCLE é tratado como 5. Quando um operativo fica incapacitado, o Kill Grade aumenta, até 5; quando ele é reanimado, o Kill Grade pode diminuir. Isso não altera retroativamente VPs já obtidos por Tac Ops.</aside>
  </section>;
}

const legionaryStrategicPloys: FactionPloy[] = [
  { name: 'Implacable', translation: 'Implacável', effect: 'Sempre que um operativo inimigo estiver atirando contra um operativo LEGIONARY aliado, se a arma dele tiver Piercing 1, substitua essa regra por Piercing Crits 1. A arma não acumula as duas regras: Piercing 1 é trocado por Piercing Crits 1 nessa situação. Além disso, você pode ignorar quaisquer alterações nos atributos de operativos LEGIONARY NURGLE aliados causadas por estarem feridos, incluindo alterações nos atributos das armas.' },
  { name: 'Quicksilver Speed', translation: 'Velocidade relâmpago', effect: 'Sempre que um operativo LEGIONARY aliado que tenha realizado uma ação na qual se moveu neste Ponto de Virada estiver lutando ou retaliando, piore em 1 o atributo Hit das armas corpo a corpo do inimigo. Além disso, quando um operativo atirar contra um LEGIONARY SLAANESH aliado que esteja a mais de 6" dele e tenha se movido neste Ponto de Virada, piore em 1 o Hit das armas do inimigo. Esses efeitos não se acumulam com a condição de estar ferido.' },
  { name: 'Fickle Fates', translation: 'Destinos volúveis', effect: 'Sempre que um operativo LEGIONARY aliado atirar contra um inimigo pronto, suas armas de tiro têm Ceaseless; se a arma já tiver Ceaseless, ela terá Relentless. Além disso, quando um operativo estiver atirando contra um LEGIONARY TZEENTCH aliado pronto, na etapa Rolar Dados de Defesa, se você reteve algum sucesso crítico, pode reter uma das suas falhas como sucesso normal em vez de descartá-la.' },
  { name: 'Blood for the Blood God', translation: 'Sangue para o Deus do Sangue', effect: 'Sempre que um operativo LEGIONARY aliado, exceto KHORNE, estiver lutando, na primeira vez que você Golpear nessa sequência, cause 1 dano adicional, até o máximo de 7. As armas corpo a corpo dos operativos LEGIONARY KHORNE aliados recebem +1 nos dois atributos Dmg, também até o máximo de 7.' },
];

const legionaryFirefightPloys: FactionPloy[] = [
  { name: 'Unending Bloodshed', translation: 'Banho de sangue interminável', effect: 'Use quando um operativo LEGIONARY KHORNE aliado ficar incapacitado enquanto estiver lutando ou retaliando. Antes de removê-lo do killzone, você pode Golpear o operativo inimigo daquela sequência com um dos seus sucessos não resolvidos.' },
  { name: 'Sickening Captivation', translation: 'Fascínio nauseante', effect: 'Use durante a ativação de um operativo LEGIONARY SLAANESH aliado, antes ou depois de ele realizar uma ação. Escolha um operativo inimigo visível e a até 4" dele. Até o fim da próxima ativação desse inimigo, subtraia 1 do seu APL.' },
  { name: 'Malignant Aura', translation: 'Aura maligna', effect: 'Use quando um operativo LEGIONARY NURGLE aliado estiver realizando Shoot, ao escolher um alvo válido. Até o fim da ação, sempre que esse operativo atirar contra um inimigo a até 3" dele, inclusive um alvo secundário, suas armas de tiro têm Piercing 1.' },
  { name: 'Mutability and Change', translation: 'Mutabilidade e mudança', effect: 'Use quando um operativo LEGIONARY TZEENTCH aliado for ativado. Até o fim da ativação, adicione 1 ao seu APL, mas ele não pode realizar a mesma ação mais de uma vez nessa ativação. Se for um WARRIOR, o keyword Marks of Chaos dele não pode ser alterado durante este Ponto de Virada.' },
];

function LegionariesPloys({ type }: { type: 'strategic' | 'firefight' }) {
  const ploys = type === 'strategic' ? legionaryStrategicPloys : legionaryFirefightPloys;
  const isStrategic = type === 'strategic';

  return <section className="team-ploy-content" aria-labelledby={`legionaries-${type}-ploys-title`}>
    <div className="team-ploy-heading"><p className="eyebrow">{isStrategic ? 'STRATEGIC PLOYS' : 'FIREFIGHT PLOYS'} · LEGIONARIES</p><h4 id={`legionaries-${type}-ploys-title`}>{isStrategic ? 'Ploys estratégicos' : 'Ploys de tiroteio'}</h4><p>{isStrategic ? 'Efeitos estratégicos ligados às marcas e aos poderes do Caos.' : 'Efeitos usados durante ativações, lutas, disparos e reações dos Legionaries.'}</p></div>
    <div className="team-ploy-list">{ploys.map((ploy) => <article className="team-ploy-card" key={ploy.name}><div className="team-ploy-card-heading"><h5>{ploy.translation}</h5><span>{ploy.name}</span></div><p>{renderWeaponRuleTerms(ploy.effect)}</p></article>)}</div>
  </section>;
}

function LegionariesFactionRules() {
  const marks = [
    ['Khorne', 'Wrathful Onslaught', 'As armas corpo a corpo deste operativo têm Severe.'],
    ['Nurgle', 'Disgusting Vigour', 'Quando dano normal de 3 ou mais for causado a este operativo, role 1D6; com 5+, subtraia 1 desse dano.'],
    ['Slaanesh', 'Unnatural Agility', 'Adicione 1" ao atributo Move deste operativo.'],
    ['Tzeentch', 'Empyreal Guidance', 'As armas de tiro deste operativo têm Severe.'],
    ['Undivided', 'Vicious Reavers', 'Quando este operativo estiver atirando, lutando ou retaliando contra um inimigo a até 6", suas armas têm Ceaseless.'],
  ];

  return <section className="team-rule-content" aria-labelledby="legionaries-team-rule-title">
    <div className="team-rule-heading"><p className="eyebrow">REGRA DA EQUIPE · LEGIONARIES</p><h4 id="legionaries-team-rule-title">Marcas do Caos</h4><p>Ao escolher cada operativo para a batalha, atribua a ele uma marca do Caos. A marca escolhida define um efeito adicional e também determina quais benefícios ele poderá receber das ploys.</p></div>
    <article className="team-faction-card"><p className="eyebrow">REGRA DE FACÇÃO</p><h4>Astartes</h4><ul><li>Durante cada ativação, um operativo LEGIONARY pode realizar duas ações Shoot ou duas ações Fight.</li><li>Se realizar duas ações Shoot, pelo menos uma delas deve usar uma bolt pistol, boltgun ou tainted bolt pistol.</li><li>Cada operativo LEGIONARY pode fazer uma contra-ação independentemente da sua ordem.</li></ul></article>
    <article className="team-faction-card"><p className="eyebrow">ESCOLHA UMA MARCA</p><h4>Marcas do Caos</h4><p className="team-rule-card-intro">Cada operativo pode ter uma marca diferente. O BALEFIRE ACOLYTE não pode receber KHORNE.</p><div className="team-tactics-grid">{marks.map(([name, original, effect]) => <div className="team-tactic" key={name}><h5>{name} <span>{original}</span></h5><p>{renderWeaponRuleTerms(effect)}</p></div>)}</div></article>
    <aside className="team-rule-note"><strong>Importante:</strong> as Strategic Ploys e Firefight Ploys dos Legionaries recebem efeitos especiais quando usadas com operativos que tenham a marca correspondente.</aside>
  </section>;
}

const plagueMarinesStrategicPloys: FactionPloy[] = [
  { name: 'Contagion', translation: 'Contágio', effect: 'Subtraia 2" do atributo Move de um operativo inimigo e piore em 1 o Hit das suas armas, sem acumular com estar ferido, quando: ele tiver um dos seus Poison tokens e estiver visível e a até 3" de um PLAGUE MARINE aliado; ou estiver visível e a até 3" de um ICON BEARER PLAGUE MARINE aliado.' },
  { name: 'Lumbering Death', translation: 'Morte implacável', effect: 'As armas dos operativos PLAGUE MARINE aliados têm Ceaseless quando eles estiverem atirando ou lutando em uma ativação na qual não tenham se movido mais de 3", ou quando estiverem retaliando.' },
  { name: 'Cloud of Flies', translation: 'Nuvem de moscas', effect: 'Coloque um marcador Cloud of Flies no killzone. Sempre que um operativo atirar contra um PLAGUE MARINE aliado que esteja a mais de 3" dele, se o alvo estiver completamente a até 1" desse marcador, trate o alvo como obscured. Remova o marcador no passo Ready da próxima fase de Estratégia.' },
  { name: 'Nurglings', translation: 'Nurglings', effect: 'Escolha um inimigo a até 3" de um PLAGUE MARINE aliado, ou um inimigo com um dos seus Poison tokens que esteja a até 7" de um PLAGUE MARINE aliado. Até o fim da próxima ativação do alvo, subtraia 1 do seu APL.' },
];

const plagueMarinesFirefightPloys: FactionPloy[] = [
  { name: 'Virulent Poison', translation: 'Veneno virulento', effect: 'Use durante a ativação ou contra-ação de um PLAGUE MARINE aliado, antes ou depois de uma ação. Escolha uma opção: um inimigo a até 3", ou visível e a até 7", recebe um dos seus Poison tokens; ou role 2D6 e, com 7+, um inimigo a até 7" recebe um dos seus Poison tokens. Um inimigo que já tenha o token não recebe outro.' },
  { name: 'Poisonous Demise', translation: 'Morte venenosa', effect: 'Use quando um PLAGUE MARINE aliado ficar incapacitado, antes de removê-lo do killzone. Cada inimigo visível e a até 3" dele recebe um dos seus Poison tokens se ainda não tiver um. Para cada inimigo que já tinha o token, inclusive um que o recebeu durante este efeito, cause 1 dano nele.' },
  { name: 'Sickening Resilience', translation: 'Resiliência nauseante', effect: 'Use quando um dado de ataque causar dano a um PLAGUE MARINE aliado. Até o fim da ativação ou contra-ação, para a regra Disgustingly Resilient desse operativo, sempre subtraia 1 do dano causado, até o mínimo de 2, sem rolar o dado.' },
  { name: 'Curse of Rot', translation: 'Maldição da podridão', effect: 'Use quando um PLAGUE MARINE aliado estiver lutando ou atirando contra um inimigo a até 3", ou a até 7" se esse inimigo tiver um dos seus Poison tokens, depois que o oponente rolar seus dados de ataque ou defesa. Para cada resultado 3 rolado, cause 1 dano ao inimigo; esse resultado não pode ser retido como sucesso e não pode ser repetido.' },
];

function PlagueMarinesPloys({ type }: { type: 'strategic' | 'firefight' }) {
  const ploys = type === 'strategic' ? plagueMarinesStrategicPloys : plagueMarinesFirefightPloys;
  const isStrategic = type === 'strategic';

  return <section className="team-ploy-content" aria-labelledby={`plague-marines-${type}-ploys-title`}>
    <div className="team-ploy-heading"><p className="eyebrow">{isStrategic ? 'STRATEGIC PLOYS' : 'FIREFIGHT PLOYS'} · PLAGUE MARINES</p><h4 id={`plague-marines-${type}-ploys-title`}>{isStrategic ? 'Ploys estratégicos' : 'Ploys de tiroteio'}</h4><p>{isStrategic ? 'A contaminação e a resistência dos seguidores de Nurgle.' : 'Efeitos usados durante ativações, contra-ações, disparos e incapacitações.'}</p></div>
    <div className="team-ploy-list">{ploys.map((ploy) => <article className="team-ploy-card" key={ploy.name}><div className="team-ploy-card-heading"><h5>{ploy.translation}</h5><span>{ploy.name}</span></div><p>{renderWeaponRuleTerms(ploy.effect)}</p></article>)}</div>
  </section>;
}

function PlagueMarinesFactionRules() {
  return <section className="team-rule-content" aria-labelledby="plague-marines-team-rule-title">
    <div className="team-rule-heading"><p className="eyebrow">REGRA DA EQUIPE · PLAGUE MARINES</p><h4 id="plague-marines-team-rule-title">Resistência e contágio</h4><p>Os Plague Marines combinam a disciplina dos Astartes com venenos persistentes e uma resistência sobrenatural.</p></div>
    <article className="team-faction-card"><p className="eyebrow">REGRA DE FACÇÃO</p><h4>Astartes</h4><ul><li>Durante cada ativação, um operativo PLAGUE MARINE pode realizar duas ações Shoot ou duas ações Fight.</li><li>Se realizar duas ações Shoot, pelo menos uma delas deve usar uma bolt pistol, boltgun ou arma PSYCHIC. A mesma arma de tiro PSYCHIC não pode ser escolhida mais de uma vez na ativação.</li><li>Cada operativo PLAGUE MARINE pode fazer uma contra-ação independentemente da sua ordem.</li></ul></article>
    <article className="team-faction-card"><p className="eyebrow">REGRAS DE FACÇÃO</p><h4>Poison e Disgustingly Resilient</h4><ul><li><strong>Poison:</strong> quando uma arma com essa regra causar dano com qualquer sucesso, o alvo, exceto um PLAGUE MARINE aliado, recebe um dos seus Poison tokens se ainda não tiver um. Sempre que um operativo com esse token for ativado, cause 1 dano nele.</li><li><strong>Disgustingly Resilient:</strong> sempre que um dado de ataque causar 3 ou mais de dano a um PLAGUE MARINE aliado, role 1D6. Com 4+, subtraia 1 do dano causado.</li></ul></article>
    <aside className="team-rule-note"><strong>Regra de Poison:</strong> o token permanece no operativo e continua causando dano quando ele é ativado, até que uma regra permita removê-lo.</aside>
  </section>;
}

const warpcovenStrategicPloys: FactionPloy[] = [
  { name: 'Aetherial Warding', translation: 'Proteção etérea', effect: 'Sempre que um operativo estiver atirando contra um operativo WARCOVEN aliado, as armas com Piercing 1 passam a ter Piercing Crits 1. Piercing 1 é substituído por Piercing Crits 1 nessa situação.' },
  { name: 'Fate Itself Is My Weapon', translation: 'O próprio destino é minha arma', effect: 'Role 2D6 e reserve os resultados. Na próxima fase de Tiroteio, depois que os dados de ataque forem rolados e antes de repetições, você pode usar um dado reservado para substituir um D6 daquela sequência, sua ou do oponente. Esse dado não pode ser alterado, repetido ou retido como sucesso se o resultado não for um sucesso; ele é descartado ao fim da sequência. Você não pode usar mais de um dado reservado por sequência. Se a soma dos dois dados reservados for menor que 9, descarte o outro dado; descarte qualquer dado restante no fim do Ponto de Virada.' },
  { name: 'Brotherhood of Sorcerers', translation: 'Irmandade de feiticeiros', effect: 'As armas PSYCHIC dos operativos WARCOVEN SORCERER aliados têm Balanced; se houver outro SORCERER aliado a até 9" do operativo, elas têm Ceaseless em vez disso.' },
  { name: 'Savage Herd', translation: 'Horda selvagem', effect: 'As armas corpo a corpo dos operativos WARCOVEN TZAANGOR aliados têm Accurate 1. Quando um TZAANGOR aliado estiver sendo auxiliado por um operativo WARCOVEN aliado, ou estiver lutando enquanto visível e a até 6" de um SORCERER WARCOVEN aliado, suas armas corpo a corpo também têm Severe.' },
];

const warpcovenFirefightPloys: FactionPloy[] = [
  { name: 'All Is Dust', translation: 'Tudo é poeira', effect: 'Use quando um dado de ataque causar Dano Normal a um RUBRIC MARINE WARCOVEN aliado. Esse dado causa apenas 1 dano.' },
  { name: 'Capricious Plan', translation: 'Plano caprichoso', effect: 'Use no fim da ativação de um SORCERER WARCOVEN aliado. Esse operativo pode realizar imediatamente uma ação Dash gratuita, mesmo que tenha feito uma ação que normalmente o impeça de fazer Dash, e/ou você pode mudar sua ordem.' },
  { name: 'Psychic Cabal', translation: 'Cabala psíquica', effect: 'Use quando um SORCERER WARCOVEN aliado for ativado. Escolha outro SORCERER aliado visível e a até 9" dele. Escolha uma ação única PSYCHIC ou uma arma de tiro PSYCHIC desse outro operativo para o primeiro operativo ter até o fim da ativação. A arma escolhida não pode ter sido usada pelo outro operativo neste Ponto de Virada, e esse outro operativo não poderá usar essa arma neste Ponto de Virada.' },
  { name: 'Mutant Herd', translation: 'Rebanho mutante', effect: 'Use quando um TZAANGOR WARCOVEN aliado for ativado. Escolha outro TZAANGOR aliado pronto, visível e a até 2" dele, para ser ativado ao mesmo tempo. Resolva as duas ativações ação por ação, em qualquer ordem.' },
];

function WarpcovenPloys({ type }: { type: 'strategic' | 'firefight' }) {
  const ploys = type === 'strategic' ? warpcovenStrategicPloys : warpcovenFirefightPloys;
  const isStrategic = type === 'strategic';

  return <section className="team-ploy-content" aria-labelledby={`warpcoven-${type}-ploys-title`}>
    <div className="team-ploy-heading"><p className="eyebrow">{isStrategic ? 'STRATEGIC PLOYS' : 'FIREFIGHT PLOYS'} · WARPCOVEN</p><h4 id={`warpcoven-${type}-ploys-title`}>{isStrategic ? 'Ploys estratégicos' : 'Ploys de tiroteio'}</h4><p>{isStrategic ? 'Poderes estratégicos para proteger os Rubricae, canalizar a magia e manipular o destino.' : 'Efeitos usados durante ativações, disparos, ações psíquicas e combates.'}</p></div>
    <div className="team-ploy-list">{ploys.map((ploy) => <article className="team-ploy-card" key={ploy.name}><div className="team-ploy-card-heading"><h5>{ploy.translation}</h5><span>{ploy.name}</span></div><p>{renderWeaponRuleTerms(ploy.effect)}</p></article>)}</div>
  </section>;
}

function WarpcovenFactionRules() {
  const boons = [
    ['Visão incorpórea', 'Incorporeal Sight', 'As armas de tiro deste operativo têm Saturate. Sempre que ele estiver atirando, operativos inimigos não podem estar obscured.'],
    ['Caminhada temporal', 'Time-Walk', 'Adicione 1" ao atributo Move deste operativo.'],
    ['Ecos do Warp', 'Echoes from the Warp', 'Uma vez por batalha, quando este operativo fizer uma contra-ação, você pode mudar sua ordem e ele pode realizar gratuitamente uma ação adicional de 1 AP durante essa contra-ação. As duas ações devem ser diferentes.'],
    ['Surto do Warp', 'Warp Swell', 'Adicione 1 ao atributo Normal Dmg das armas corpo a corpo deste operativo.'],
    ['Voo imaterial', 'Immaterial Flight', 'Uma vez por Ponto de Virada, durante Charge ou Reposition na ativação, este operativo pode FLY: em vez de movê-lo, remova-o e coloque-o novamente até uma distância igual ao seu Move, medindo horizontalmente. Não pode atravessar paredes ou uma passagem de acesso em killzones de combate fechado. Durante Charge, não recebe distância adicional; fora de Charge, não pode ser colocado dentro do controle de alcance inimigo.'],
    ['Torção do destino', 'Twist of Fate', 'As armas de tiro PSYCHIC deste operativo têm Piercing Crits 1.'],
    ['Apêndice mutante', 'Mutant Appendage', 'A presença de um inimigo no controle de alcance não impede este operativo de realizar Pick Up Marker ou ações de missão. Uma vez por ativação, ele pode realizar Pick Up Marker, Place Marker ou uma ação de missão por 1 AP a menos.'],
    ['Bombardeio astral', 'Astral Bombardment', 'Escolha uma arma de tiro PSYCHIC deste operativo; ela tem Devastating 1. Se escolher doombolt, ela tem Devastating 2" em vez de Devastating 2. Se escolher firestorm ou mindburn, ao realizar Shoot escolha Seek Light ou Devastating 1 para essa arma até o fim da ação; ela não pode ter os dois.'],
    ['Mestre do Imaterium', 'Master of the Immaterium', 'Adicione 3" aos requisitos de distância das ações PSYCHIC deste operativo. Para a ação Temporal Flux do SORCERER OF TEMPYRION, esse bônus só afeta a distância do primeiro efeito da regra.'],
  ];

  return <section className="team-rule-content" aria-labelledby="warpcoven-team-rule-title">
    <div className="team-rule-heading"><p className="eyebrow">REGRA DA EQUIPE · WARPCOVEN</p><h4 id="warpcoven-team-rule-title">Dádivas de Tzeentch</h4><p>Os feiticeiros do Warpcoven recebem dádivas do Deus da Mudança. Cada SORCERER escolhido para a batalha deve receber uma dádiva diferente.</p></div>
    <article className="team-faction-card"><p className="eyebrow">REGRAS DOS SORCERERS</p><h4>Nove dádivas de Tzeentch</h4><div className="team-tactics-grid">{boons.map(([translation, original, effect]) => <div className="team-tactic" key={original}><h5>{translation} <span>{original}</span></h5><p>{renderWeaponRuleTerms(effect)}</p></div>)}</div></article>
    <article className="team-faction-card"><p className="eyebrow">REGRA DE FACÇÃO</p><h4>Astartes</h4><ul><li>Durante cada ativação, um operativo WARPCOVEN HERETIC ASTARTES pode realizar duas ações Shoot ou duas ações Fight.</li><li>Se realizar duas ações Shoot usando soulreaper cannon ou warpflamer nas duas, a segunda ação custa 1 AP adicional. A mesma arma de tiro PSYCHIC não pode ser escolhida mais de uma vez na ativação.</li><li>Cada operativo WARPCOVEN HERETIC ASTARTES pode fazer uma contra-ação independentemente da sua ordem.</li></ul></article>
    <aside className="team-rule-note"><strong>Escolha:</strong> cada SORCERER recebe apenas uma dádiva e nenhuma dádiva pode ser escolhida mais de uma vez na mesma batalha.</aside>
  </section>;
}

type FactionEquipment = { name: string; translation: string; effect: string };

const angelsEquipment: FactionEquipment[] = [
  { name: 'Purity Seals', translation: 'Selos de pureza', effect: 'Uma vez por Ponto de Virada, quando um operativo ANGEL OF DEATH aliado estiver atirando, lutando ou retaliando, se você rolar duas ou mais falhas, pode descartar uma delas para reter outra como sucesso normal.' },
  { name: 'Tilting Shields', translation: 'Escudos de justa', effect: 'Uma vez por Ponto de Virada, quando um operativo ANGEL OF DEATH aliado estiver lutando ou retaliando, depois que o oponente rolar os dados de ataque, mas antes das repetições, você pode usar este equipamento. Durante essa sequência, o oponente não pode reter resultados menores que 6 como sucessos críticos, inclusive por causa de Lethal, Rending ou Severe.' },
  { name: 'Chapter Reliquaries', translation: 'Relicários do Capítulo', effect: 'Você pode usar a Firefight Ploy Wrath of Vengeance por 0 CP se o operativo aliado especificado pela ploy tiver ordem Engage.' },
  { name: 'Auspex', translation: 'Auspex', effect: 'Uma vez por Ponto de Virada, quando um operativo ANGEL OF DEATH aliado realizar Shoot e você estiver escolhendo um alvo válido, use este equipamento. Até o fim da ativação ou contra-ação, operativos inimigos a até 8" desse operativo não podem estar obscured.' },
];

const hierotekEquipment: FactionEquipment[] = [
  { name: 'Magnification Conduits', translation: 'Condutos de magnificação', effect: 'Uma vez por Ponto de Virada, quando um APPRENTEK ou CRYPTEK HIEROTEK CIRCLE aliado estiver realizando Shoot, escolha outro operativo HIEROTEK CIRCLE aliado, exceto PLASMACYTE, que tenha Engage e esteja visível ao primeiro. Até o fim da ação, esse outro operativo pode ser tratado como o operativo ativo para a regra Magnify.' },
  { name: 'Tesseract Cube', translation: 'Cubo tesseract', effect: 'No passo Ready de cada fase de Estratégia, quando ganhar CP, se um CRYPTEK aliado não estiver incapacitado, dentro do controle de alcance inimigo ou reanimado neste Ponto de Virada, role 1D6. Com 1, você não pode usar este equipamento pelo resto da batalha; com 4+, ganhe 1 CP. Depois de ganhar 2 CP com ele, não pode usá-lo novamente.' },
  { name: 'Phase Shifter', translation: 'Deslocador de fase', effect: 'Uma vez por Ponto de Virada, quando um operativo estiver atirando contra um CRYPTEK HIEROTEK CIRCLE aliado, no início da etapa Rolar Dados de Defesa, piore em 1 o valor X da regra Piercing da arma até o fim da sequência. Piercing 1 é ignorado.' },
  { name: 'Tesla Weave', translation: 'Trama tesla', effect: 'Sempre que um operativo inimigo terminar a ação Charge, cause D3 de dano nele para cada operativo HIEROTEK CIRCLE aliado dentro do seu controle de alcance.' },
];

const legionaryEquipment: FactionEquipment[] = [
  { name: 'Warded Armour', translation: 'Armadura protegida', effect: 'GAMBIT ESTRATÉGICO. Escolha um operativo LEGIONARY aliado. Até o passo Ready da próxima fase de Estratégia, altere o atributo Save dele para 2+.' },
  { name: 'Tainted Rounds', translation: 'Munição corrompida', effect: 'Uma vez por Ponto de Virada, quando um operativo LEGIONARY aliado estiver realizando Shoot e você escolher uma bolt pistol ou boltgun, até o fim da ação essa arma tem Rending.' },
  { name: 'Malefic Blades', translation: 'Lâminas maléficas', effect: 'Todos os operativos LEGIONARY aliados recebem esta arma corpo a corpo durante a batalha: Malefic blade — Atk 5, Hit 3+, Dmg 3/4.' },
  { name: 'Chaos Talismans', translation: 'Talismãs do Caos', effect: 'GAMBIT ESTRATÉGICO. Escolha um keyword de Marks of Chaos. Uma vez durante cada ativação, quando um operativo LEGIONARY aliado com esse keyword estiver atirando, lutando ou retaliando, se você rolar duas ou mais falhas, pode causar D3 de dano nesse operativo para descartar uma falha e reter a outra como sucesso normal. Se for Shoot e o dano o incapacitar, a ação não termina.' },
];

const plagueEquipment: FactionEquipment[] = [
  { name: 'Plague Bells', translation: 'Sinos da peste', effect: 'Você pode ignorar quaisquer alterações nos atributos de operativos PLAGUE MARINE aliados causadas por estarem feridos, incluindo alterações nos atributos das armas.' },
  { name: 'Plague Rounds', translation: 'Munição da peste', effect: 'As boltguns e bolt pistols dos operativos PLAGUE MARINE aliados têm Poison e Severe.' },
  { name: 'Blight Grenades', translation: 'Granadas de praga', effect: 'Os operativos PLAGUE MARINE aliados recebem esta arma de tiro, que não pode ser escolhida mais de duas vezes durante a batalha: Blight grenade — Atk 4, Hit 4+, Dmg 2/4, Range 6", Blast 2", Saturate, Severe e Poison.' },
  { name: 'Poison Vents', translation: 'Saídas de veneno', effect: 'Sempre que um operativo inimigo que não tenha um dos seus Poison tokens for ativado a até 3" de um PLAGUE MARINE aliado, role 1D3. Com 3, esse inimigo recebe um dos seus Poison tokens.' },
];

const warpcovenEquipment: FactionEquipment[] = [
  { name: 'Ensorcelled Rounds', translation: 'Munição enfeitiçada', effect: 'As inferno boltguns, inferno bolt pistols e autopistols dos operativos WARCOVEN aliados têm Devastating 1.' },
  { name: 'Arcane Robes', translation: 'Túnicas arcanas', effect: 'Uma vez por Ponto de Virada para cada SORCERER WARCOVEN aliado, quando um dado de ataque causaria Dano Crítico nele, você pode fazer esse dado causar Dano Normal em vez disso.' },
  { name: 'Daemonmaw Weapons', translation: 'Armas bocarras demoníacas', effect: 'Adicione 1 ao atributo Atk das armas corpo a corpo dos RUBRIC MARINE WARCOVEN aliados. Quando um RUBRIC MARINE aliado estiver retaliando, suas armas corpo a corpo têm Accurate 1.' },
  { name: 'Sorcerous Scrolls', translation: 'Pergaminhos de feiticeiro', effect: 'Uma vez por batalha, quando um SORCERER WARCOVEN aliado for ativado ou fizer uma contra-ação, escolha uma dádiva de Tzeentch diferente para ele ter até o fim da batalha; ele perde a dádiva anterior. Não pode ser uma dádiva que outro operativo aliado tenha. Esta regra prevalece sobre a regra normal de Dádivas de Tzeentch.' },
];

const universalEquipment: FactionEquipment[] = [
  { name: 'Ammo Cache', translation: 'Depósito de munição', effect: 'Coloque um marcador dentro do seu território antes da batalha. Um operativo aliado que o controle pode realizar Ammo Resupply por 0 AP. Até o início do próximo Ponto de Virada, ele pode repetir um dado de ataque sempre que realizar Shoot com uma arma da própria ficha.' },
  { name: 'Razor Wire', translation: 'Arame farpado', effect: 'É terreno Exposed e Obstructing. Sempre que um operativo atravessar esse terreno a até 1" dele, trate a distância como 1" adicional.' },
  { name: 'Comms Device', translation: 'Dispositivo de comunicação', effect: 'Coloque um marcador dentro do seu território antes da batalha. Enquanto um operativo aliado o controlar, adicione 3" aos requisitos de distância das regras Support que selecionem operativos aliados.' },
  { name: 'Mines', translation: 'Minas', effect: 'Coloque um marcador dentro do seu território, a mais de 2" de outros marcadores, pontos de acesso e terreno Accessible. Na primeira vez que ele estiver no alcance de controle de um operativo, remova-o e cause D3+3 de dano nesse operativo.' },
  { name: 'Light Barricades', translation: 'Barricadas leves — 2 unidades', effect: 'São terreno Light, exceto pelos pés, que são Insignificant e Exposed. Coloque-as dentro do seu território, no chão da killzone e a mais de 2" de outros equipamentos de terreno, pontos de acesso e terreno Accessible.' },
  { name: 'Heavy Barricade', translation: 'Barricada pesada', effect: 'É terreno Heavy. Coloque-a totalmente dentro de 4" da sua zona de desembarque, no chão da killzone e a mais de 2" de outros equipamentos de terreno, pontos de acesso e terreno Accessible.' },
  { name: 'Ladders', translation: 'Escadas — 2 unidades', effect: 'São terreno Insignificant e Exposed. Coloque-as dentro do seu território, na vertical e encostadas em terreno de pelo menos 2" de altura, a mais de 2" de outros equipamentos e mais de 1" de portas e pontos de acesso. Uma vez por ação, a distância vertical da escalada pode ser tratada como 1" se a escada estiver no alcance de controle do operativo durante toda a escalada.' },
  { name: 'Portable Barricade', translation: 'Barricada portátil', effect: 'É terreno Light, Protective e Portable. Enquanto um operativo estiver em cobertura dela, melhore seu Salvamento em 1, até o máximo de 2+. O operativo conectado ao lado interno pode realizar Move With Barricade por 1 AP.' },
  { name: 'Utility Grenades', translation: 'Granadas utilitárias', effect: 'Escolha duas utilizações: 2 Smoke, 2 Stun ou 1 de cada. Cada granada é uma ação única que qualquer operativo aliado pode realizar, e a equipe só pode usar cada tipo o número de vezes escolhido.' },
  { name: 'Explosive Grenades', translation: 'Granadas explosivas', effect: 'Escolha duas utilizações: 2 Frag, 2 Krak ou 1 de cada. Cada seleção é uma arma de tiro que os operativos podem usar, e a equipe só pode usar cada tipo o número de vezes escolhido. Frag: Atk 4, Hit 4+, Dano 2/4, Alcance 6", Blast 2", Saturate. Krak: Atk 4, Hit 4+, Dano 4/5, Alcance 6", Piercing 1, Saturate.' },
  { name: 'Breaching Charge', translation: 'Carga de arrombamento', effect: 'Uma vez por batalha, quando um operativo aliado realizar Breach, você pode reduzir o custo dessa ação em 1 AP, até o mínimo de 1 AP.' },
];

function CollapsibleEquipmentCards({ equipment }: { equipment: FactionEquipment[] }) {
  const [openEquipment, setOpenEquipment] = useState<string | null>(null);

  return <div className="team-ploy-list">{equipment.map((item) => {
    const isOpen = openEquipment === item.name;
    return <article className={`team-ploy-card ${isOpen ? 'is-open' : ''}`} key={item.name}>
      <button type="button" className="team-ploy-card-toggle" aria-expanded={isOpen} onClick={() => setOpenEquipment(isOpen ? null : item.name)}>
        <div className="team-ploy-card-heading"><h5>{item.translation}</h5><span>{item.name}</span></div><b aria-hidden="true">{isOpen ? '−' : '+'}</b>
      </button>
      {isOpen ? <div className="team-ploy-card-content"><p>{renderWeaponRuleTerms(item.effect)}</p></div> : null}
    </article>;
  })}</div>;
}

function EquipmentSubsection({ title, description, equipment }: { title: string; description: string; equipment: FactionEquipment[] }) {
  const [isOpen, setIsOpen] = useState(true);

  return <section className={`team-equipment-subsection ${isOpen ? 'is-open' : ''}`}>
    <button type="button" className="team-equipment-subsection-toggle" aria-expanded={isOpen} onClick={() => setIsOpen(!isOpen)}>
      <span><strong>{title}</strong><small>{description}</small></span><b aria-hidden="true">{isOpen ? '−' : '+'}</b>
    </button>
    {isOpen ? <div className="team-equipment-subsection-content"><CollapsibleEquipmentCards equipment={equipment} /></div> : null}
  </section>;
}

function FactionEquipmentGuide({ teamName, equipment }: { teamName: string; equipment: FactionEquipment[] }) {
  return <section className="team-ploy-content" aria-labelledby={`${teamName.toLowerCase().replaceAll(' ', '-')}-equipment-title`}>
    <div className="team-ploy-heading"><p className="eyebrow">ARMAS E EQUIPAMENTOS · {teamName.toUpperCase()}</p><h4 id={`${teamName.toLowerCase().replaceAll(' ', '-')}-equipment-title`}>Armas e equipamentos</h4><p>Abra uma categoria e depois um equipamento para consultar seus efeitos. Cada opção pode ser minimizada novamente.</p></div>
    <div className="team-equipment-sections">
      <EquipmentSubsection title="Equipamentos de facção" description="Opções exclusivas deste time" equipment={equipment} />
      <EquipmentSubsection title="Equipamentos universais" description="Opções disponíveis para qualquer Kill Team" equipment={universalEquipment} />
    </div>
  </section>;
}

type TeamOperativeWeapon = { name: string; translation: string; profile: string; rules?: string };
type TeamOperative = { name: string; translation: string; profile: string; weapons: TeamOperativeWeapon[]; abilities?: { name: string; translation: string; effect: string }[] };

const angelsOperatives: TeamOperative[] = [
  {
    name: 'Space Marine Captain', translation: 'Capitão dos Space Marines', profile: 'APL 3 · Movimento 6" · Salvamento 3+ · Feridas 15',
    weapons: [
      { name: 'Plasma pistol (standard)', translation: 'Pistola de plasma (padrão)', profile: 'Atk 4 · Acerto 3+ · Dano 3/5', rules: 'Alcance 8", Piercing 1' },
      { name: 'Plasma pistol (supercharge)', translation: 'Pistola de plasma (sobrecarga)', profile: 'Atk 4 · Acerto 3+ · Dano 4/5', rules: 'Alcance 8", Hot, Lethal 5+, Piercing 1' },
      { name: 'Power fist', translation: 'Punho de poder', profile: 'Atk 5 · Acerto 3+ · Dano 5/7', rules: 'Brutal' },
    ],
    abilities: [
      { name: 'Heroic Leader', translation: 'Líder heroico', effect: 'Uma vez por Ponto de Virada, você pode usar uma Firefight Ploy por 0 CP se este for o operativo ANGEL OF DEATH especificado, exceto Command Re-roll. Alternativamente, pode usar Adjust Doctrine por 0 CP se este operativo estiver na killzone e não estiver dentro do alcance de controle de um inimigo.' },
      { name: 'Iron Halo', translation: 'Halo de ferro', effect: 'Uma vez por batalha, quando um dado de ataque causar Dano Normal a este operativo, você pode ignorar esse dano.' },
    ],
  },
  {
    name: 'Assault Intercessor Sergeant', translation: 'Sargento Assault Intercessor', profile: 'APL 3 · Movimento 6" · Salvamento 3+ · Feridas 15',
    weapons: [
      { name: 'Hand flamer', translation: 'Pistola lança-chamas', profile: 'Atk 4 · Acerto 2+ · Dano 3/3', rules: 'Alcance 6", Saturate, Torrent 1"' },
      { name: 'Heavy bolt pistol', translation: 'Pistola pesada de ferrolho', profile: 'Atk 4 · Acerto 3+ · Dano 3/4', rules: 'Alcance 8", Piercing Crits 1' },
      { name: 'Plasma pistol (standard)', translation: 'Pistola de plasma (padrão)', profile: 'Atk 4 · Acerto 3+ · Dano 3/5', rules: 'Alcance 8", Piercing 1' },
      { name: 'Plasma pistol (supercharge)', translation: 'Pistola de plasma (sobrecarga)', profile: 'Atk 4 · Acerto 3+ · Dano 4/5', rules: 'Alcance 8", Hot, Lethal 5+, Piercing 1' },
      { name: 'Chainsword', translation: 'Espada-serra', profile: 'Atk 5 · Acerto 3+ · Dano 4/5' },
      { name: 'Power fist', translation: 'Punho de poder', profile: 'Atk 5 · Acerto 4+ · Dano 5/7', rules: 'Brutal' },
      { name: 'Power weapon', translation: 'Arma de energia', profile: 'Atk 5 · Acerto 3+ · Dano 4/6', rules: 'Lethal 5+' },
      { name: 'Thunder hammer', translation: 'Martelo-trovão', profile: 'Atk 5 · Acerto 4+ · Dano 5/6', rules: 'Shock, Stun' },
    ],
    abilities: [
      { name: 'Doctrine Warfare', translation: 'Doutrina de guerra', effect: 'Você pode fazer cada uma das opções a seguir uma vez por batalha: ao usar a Strategic Ploy Combat Doctrine e escolher Assault ou Tactical, se este operativo estiver na killzone, ela custa 0 CP.' },
      { name: 'Chapter Veteran', translation: 'Veterano do Capítulo', effect: 'No fim da etapa Selecionar Operativos, se este operativo foi selecionado para ser colocado em campo, escolha uma Tática de Capítulo adicional para ele ter durante a batalha. Diferentemente das Táticas de Capítulo primária e secundária, você não precisa escolher a mesma em todas as partidas de uma campanha ou torneio.' },
    ],
  },
  {
    name: 'Assault Intercessor Grenadier', translation: 'Granadeiro Assault Intercessor', profile: 'APL 3 · Movimento 6" · Salvamento 3+ · Feridas 14',
    weapons: [
      { name: 'Heavy bolt pistol', translation: 'Pistola pesada de ferrolho', profile: 'Atk 4 · Acerto 3+ · Dano 3/4', rules: 'Alcance 8", Piercing Crits 1' },
      { name: 'Chainsword', translation: 'Espada-serra', profile: 'Atk 5 · Acerto 3+ · Dano 4/5' },
    ],
    abilities: [{ name: 'Grenadier', translation: 'Granadeiro', effect: 'Este operativo pode usar granadas frag e krak. Fazer isso não conta para os usos limitados que você tenha, inclusive se você também selecionar essas granadas como equipamento para outros operativos. Sempre que fizer isso, melhore o atributo Acerto daquela arma em 1.' }],
  },
  {
    name: 'Assault Intercessor Warrior', translation: 'Guerreiro Assault Intercessor', profile: 'APL 3 · Movimento 6" · Salvamento 3+ · Feridas 14',
    weapons: [
      { name: 'Heavy bolt pistol', translation: 'Pistola pesada de ferrolho', profile: 'Atk 4 · Acerto 3+ · Dano 3/4', rules: 'Alcance 8", Piercing Crits 1' },
      { name: 'Chainsword', translation: 'Espada-serra', profile: 'Atk 5 · Acerto 3+ · Dano 4/5' },
    ],
  },
  {
    name: 'Intercessor Sergeant', translation: 'Sargento Intercessor', profile: 'APL 3 · Movimento 6" · Salvamento 3+ · Feridas 15',
    weapons: [
      { name: 'Auto bolt rifle', translation: 'Rifle automático de ferrolho', profile: 'Atk 4 · Acerto 3+ · Dano 3/4', rules: 'Torrent 1"' },
      { name: 'Bolt rifle', translation: 'Rifle de ferrolho', profile: 'Atk 4 · Acerto 3+ · Dano 3/4', rules: 'Piercing Crits 1' },
      { name: 'Stalker bolt rifle (heavy)', translation: 'Rifle de ferrolho Stalker (pesado)', profile: 'Atk 4 · Acerto 3+ · Dano 3/5', rules: 'Heavy (Dash only), Lethal 5+, Piercing Crits 1' },
      { name: 'Stalker bolt rifle (mobile)', translation: 'Rifle de ferrolho Stalker (móvel)', profile: 'Atk 4 · Acerto 3+ · Dano 3/4' },
      { name: 'Chainsword', translation: 'Espada-serra', profile: 'Atk 4 · Acerto 3+ · Dano 4/5' },
      { name: 'Fists', translation: 'Punhos', profile: 'Atk 4 · Acerto 3+ · Dano 3/4' },
      { name: 'Power fist', translation: 'Punho de poder', profile: 'Atk 4 · Acerto 4+ · Dano 5/7', rules: 'Brutal' },
      { name: 'Power weapon', translation: 'Arma de energia', profile: 'Atk 4 · Acerto 3+ · Dano 4/6', rules: 'Lethal 5+' },
      { name: 'Thunder hammer', translation: 'Martelo-trovão', profile: 'Atk 4 · Acerto 4+ · Dano 5/6', rules: 'Shock, Stun' },
    ],
    abilities: [
      { name: 'Doctrine Warfare', translation: 'Doutrina de guerra', effect: 'Você pode fazer cada uma das opções a seguir uma vez por batalha: ao usar a Strategic Ploy Combat Doctrine e escolher Devastator ou Tactical, se este operativo estiver na killzone, ela custa 0 CP.' },
      { name: 'Chapter Veteran', translation: 'Veterano do Capítulo', effect: 'No fim da etapa Selecionar Operativos, se este operativo foi selecionado para ser colocado em campo, escolha uma Tática de Capítulo adicional para ele ter durante a batalha. Diferentemente das Táticas de Capítulo primária e secundária, você não precisa escolher a mesma em todas as partidas de uma campanha ou torneio.' },
    ],
  },
  {
    name: 'Intercessor Warrior', translation: 'Guerreiro Intercessor', profile: 'APL 3 · Movimento 6" · Salvamento 3+ · Feridas 14',
    weapons: [
      { name: 'Auto bolt rifle', translation: 'Rifle automático de ferrolho', profile: 'Atk 4 · Acerto 3+ · Dano 3/4', rules: 'Torrent 1"' },
      { name: 'Bolt rifle', translation: 'Rifle de ferrolho', profile: 'Atk 4 · Acerto 3+ · Dano 3/4', rules: 'Piercing Crits 1' },
      { name: 'Stalker bolt rifle (heavy)', translation: 'Rifle de ferrolho Stalker (pesado)', profile: 'Atk 4 · Acerto 3+ · Dano 3/5', rules: 'Heavy (Dash only), Lethal 5+, Piercing Crits 1' },
      { name: 'Stalker bolt rifle (mobile)', translation: 'Rifle de ferrolho Stalker (móvel)', profile: 'Atk 4 · Acerto 3+ · Dano 3/4' },
      { name: 'Fists', translation: 'Punhos', profile: 'Atk 4 · Acerto 3+ · Dano 3/4' },
    ],
  },
  {
    name: 'Intercessor Gunner', translation: 'Artilheiro Intercessor', profile: 'APL 3 · Movimento 6" · Salvamento 3+ · Feridas 14',
    weapons: [
      { name: 'Auto bolt rifle', translation: 'Rifle automático de ferrolho', profile: 'Atk 4 · Acerto 3+ · Dano 3/4', rules: 'Torrent 1"' },
      { name: 'Auxiliary grenade launcher (frag)', translation: 'Lançador de granadas auxiliar (frag)', profile: 'Atk 4 · Acerto 3+ · Dano 2/4', rules: 'Blast 2"' },
      { name: 'Auxiliary grenade launcher (krak)', translation: 'Lançador de granadas auxiliar (krak)', profile: 'Atk 4 · Acerto 3+ · Dano 4/5', rules: 'Piercing 1' },
      { name: 'Bolt rifle', translation: 'Rifle de ferrolho', profile: 'Atk 4 · Acerto 3+ · Dano 3/4', rules: 'Piercing Crits 1' },
      { name: 'Stalker bolt rifle (heavy)', translation: 'Rifle de ferrolho Stalker (pesado)', profile: 'Atk 4 · Acerto 3+ · Dano 3/5', rules: 'Heavy (Dash only), Lethal 5+, Piercing Crits 1' },
      { name: 'Stalker bolt rifle (mobile)', translation: 'Rifle de ferrolho Stalker (móvel)', profile: 'Atk 4 · Acerto 3+ · Dano 3/4' },
      { name: 'Fists', translation: 'Punhos', profile: 'Atk 4 · Acerto 3+ · Dano 3/4' },
    ],
  },
  {
    name: 'Heavy Intercessor Gunner', translation: 'Artilheiro Heavy Intercessor', profile: 'APL 3 · Movimento 5" · Salvamento 3+ · Feridas 18',
    weapons: [
      { name: 'Heavy bolter (focused)', translation: 'Heavy bolter (focado)', profile: 'Atk 5 · Acerto 3+ · Dano 4/5', rules: 'Piercing Crits 1' },
      { name: 'Heavy bolter (sweeping)', translation: 'Heavy bolter (varredura)', profile: 'Atk 4 · Acerto 3+ · Dano 4/5', rules: 'Piercing Crits 1, Torrent 1"' },
      { name: 'Fists', translation: 'Punhos', profile: 'Atk 4 · Acerto 3+ · Dano 3/4' },
    ],
  },
  {
    name: 'Eliminator Sniper', translation: 'Franco-atirador Eliminator', profile: 'APL 3 · Movimento 7" · Salvamento 3+ · Feridas 12',
    weapons: [
      { name: 'Bolt pistol', translation: 'Pistola de ferrolho', profile: 'Atk 4 · Acerto 3+ · Dano 3/4', rules: 'Alcance 8"' },
      { name: 'Bolt sniper rifle (executioner)', translation: 'Rifle de precisão de ferrolho (executioner)', profile: 'Atk 4 · Acerto 2+ · Dano 3/4', rules: 'Heavy (Dash only), Saturate, Seek Light, Silent' },
      { name: 'Bolt sniper rifle (hyperfrag)', translation: 'Rifle de precisão de ferrolho (hyperfrag)', profile: 'Atk 4 · Acerto 2+ · Dano 2/4', rules: 'Blast 1", Heavy (Dash only), Silent' },
      { name: 'Bolt sniper rifle (mortis)', translation: 'Rifle de precisão de ferrolho (mortis)', profile: 'Atk 4 · Acerto 2+ · Dano 3/3', rules: 'Devastating 3, Heavy (Dash only), Piercing 1, Silent' },
      { name: 'Fists', translation: 'Punhos', profile: 'Atk 4 · Acerto 3+ · Dano 3/4' },
    ],
    abilities: [
      { name: 'Camo Cloak', translation: 'Capa de camuflagem', effect: 'Sempre que um operativo estiver atirando neste operativo, ignore a regra Saturate. Este operativo tem a Tática de Capítulo Stealthy. Se você tiver escolhido essa Tática, pode usar as duas opções dela: reter dois salvamentos de cobertura, um normal e um crítico.' },
      { name: 'Optics — 1 AP', translation: 'Óptica — 1 AP', effect: 'Até o início da próxima ativação deste operativo, sempre que ele estiver atirando, operativos inimigos não podem estar obscured. Este operativo não pode realizar esta ação enquanto estiver dentro do alcance de controle de um inimigo.' },
    ],
  },
];

const teamWeapon = (name: string, translation: string, profile: string, rules?: string): TeamOperativeWeapon => rules ? { name, translation, profile, rules } : { name, translation, profile };
const teamAbility = (name: string, translation: string, effect: string) => ({ name, translation, effect });

const hierotekOperatives: TeamOperative[] = [
  { name: 'Chronomancer', translation: 'Cronomante', profile: 'APL 3 · Movimento 6" · Salvamento 3+ · Feridas 14', weapons: [
    teamWeapon('Aeonstave (ranged)', 'Aeonstave (à distância)', 'Atk 5 · Acerto 3+ · Dano 3/3', 'Blast 2", Lethal 5+, Stun, Magnify'),
    teamWeapon('Entropic lance (ranged)', 'Lança entrópica (à distância)', 'Atk 4 · Acerto 3+ · Dano 5/3', 'Devastating 3, Piercing 1, Magnify'),
    teamWeapon('Aeonstave (melee)', 'Aeonstave (corpo a corpo)', 'Atk 4 · Acerto 4+ · Dano 3/4', 'Lethal 5+, Shock'),
    teamWeapon('Entropic lance (melee)', 'Lança entrópica (corpo a corpo)', 'Atk 4 · Acerto 4+ · Dano 3/6'),
  ], abilities: [
    teamAbility('Interstitial Command', 'Comando intersticial — 1 AP', 'SUPORTE. Escolha outro operativo HIEROTEK CIRCLE aliado, exceto um Apprentek ou Cryptek, visível e a até 6". Ele pode realizar imediatamente uma ação de 1 AP gratuitamente, respeitando as restrições da ação.'),
    teamAbility('Timesplinter', 'Fragmentação temporal — 1 AP', 'SUPORTE. Escolha um operativo HIEROTEK CIRCLE aliado exaurido, visível e a até 5". Remova-o da killzone e reposicione-o visível e a até 5" deste operativo. Não pode ser usada no primeiro Ponto de Virada.'),
    teamAbility('Countertemporal Nanomine', 'Nanomina contratemporal — 1 AP', 'Coloque um marcador visível. Enquanto um inimigo estiver a até 4" dele, subtraia 2" do atributo Movimento desse inimigo. Remova o marcador quando este operativo for ativado, for incapacitado ou a ação for repetida.'),
    teamAbility('Chronometron', 'Cronômetron — 1 AP', 'SUPORTE. Escolha um operativo HIEROTEK CIRCLE aliado visível e a até 6". Até o início da próxima ativação deste operativo, subtraia 1 do Atk das armas sempre que ele for alvo de Shoot.'),
  ] },
  { name: 'Psychomancer', translation: 'Psicomante', profile: 'APL 3 · Movimento 6" · Salvamento 3+ · Feridas 14', weapons: [
    teamWeapon('Abyssal lance (ranged)', 'Lança abissal (à distância)', 'Atk 5 · Acerto 3+ · Dano 2/2', 'Blast 2", 2" Devastating 1, Piercing 2, Magnify'),
    teamWeapon('Abyssal lance (melee)', 'Lança abissal (corpo a corpo)', 'Atk 4 · Acerto 4+ · Dano 4/4', 'Devastating 1'),
  ], abilities: [
    teamAbility('Interstitial Command', 'Comando intersticial — 1 AP', 'SUPORTE. Um operativo HIEROTEK CIRCLE aliado elegível e visível a até 6" pode realizar uma ação de 1 AP gratuitamente, respeitando as restrições da ação.'),
    teamAbility('Harbinger of Despair', 'Arauto do desespero — 1 AP', 'Coloque um marcador de Desespero. Inimigos a até 2" dele gastam 1 AP adicional para pegar marcadores ou realizar ações de missão; além disso, sua APL total para controle de marcador é tratada como 1 menor.'),
    teamAbility('Nightmare Shroud', 'Sudário do pesadelo — 1 AP', 'Até o início da próxima ativação deste operativo, inimigos a até 4" não podem repetir dados de ataque nem reter resultados menores que 6 como críticos durante Shoot, Fight ou Retaliate.'),
    teamAbility('Vision of Madness', 'Visão da loucura — 1 AP', 'Escolha um inimigo visível para receber um marcador de Loucura. Quando ele for ativado, role 1D6; com resultado igual ou maior que sua APL, ele não pode ser ativado nessa ativação.'),
  ] },
  { name: 'Technomancer', translation: 'Tecnomante', profile: 'APL 3 · Movimento 6" · Salvamento 3+ · Feridas 14', weapons: [
    teamWeapon('Staff of light (ranged)', 'Cajado de luz (à distância)', 'Atk 6 · Acerto 3+ · Dano 3/4', 'Rending, Magnify'),
    teamWeapon('Staff of light (melee)', 'Cajado de luz (corpo a corpo)', 'Atk 4 · Acerto 4+ · Dano 3/5', 'Rending'),
  ], abilities: [
    teamAbility('Interstitial Command', 'Comando intersticial — 1 AP', 'SUPORTE. Um operativo HIEROTEK CIRCLE aliado elegível e visível a até 6" pode realizar uma ação de 1 AP gratuitamente, respeitando as restrições da ação.'),
    teamAbility('Canoptek Repair', 'Reparo Canoptek — 1 AP', 'SUPORTE. Escolha um operativo HIEROTEK CIRCLE aliado visível e a até 6" para recuperar até 2D3 Feridas perdidas.'),
    teamAbility('Augment Weapon', 'Aprimorar arma — 1 AP', 'SUPORTE. Escolha um operativo aliado visível e a até 6". Escolha uma arma dele para receber duas destas regras até o início da próxima ativação: Lethal 5+, Rending, Saturate ou Severe.'),
    teamAbility('Reinforce Metal', 'Reforçar metal — 1 AP', 'SUPORTE. Escolha um operativo aliado visível e a até 6". Até o início da próxima ativação, sempre que um dado de ataque causar 3 ou mais de dano nele, reduza o dano causado em 1.'),
  ] },
  { name: 'Plasmacyte Accelerator', translation: 'Plasmacita Aceleradora', profile: 'APL 2 · Movimento 7" · Salvamento 5+ · Feridas 5', weapons: [teamWeapon('Spark', 'Faísca', 'Atk 4 · Acerto 4+ · Dano 2/3', 'Alcance 4", Piercing 1'), teamWeapon('Claws', 'Garras', 'Atk 3 · Acerto 5+ · Dano 1/2')], abilities: [teamAbility('Scuttler', 'Rastejante', 'Enquanto estiver em Conceal e em cobertura, não pode ser escolhido como alvo válido, exceto se estiver a até 2". Pode realizar Fall Back por 1 AP a menos.'), teamAbility('Accelerate', 'Acelerar — 1 AP', 'Escolha um Deathmark ou Immortal aliado visível e a até 6". Até o fim da próxima ativação dele, aumente sua APL em 1.') ] },
  { name: 'Plasmacyte Reanimator', translation: 'Plasmacita Reanimadora', profile: 'APL 2 · Movimento 7" · Salvamento 5+ · Feridas 5', weapons: [teamWeapon('Atomiser beam', 'Feixe atomizador', 'Atk 4 · Acerto 4+ · Dano 3/4', 'Alcance 6", Lethal 5+'), teamWeapon('Claws', 'Garras', 'Atk 3 · Acerto 5+ · Dano 1/2')], abilities: [teamAbility('Scuttler', 'Rastejante', 'Enquanto estiver em Conceal e em cobertura, não pode ser escolhido como alvo válido, exceto se estiver a até 2". Pode realizar Fall Back por 1 AP a menos.'), teamAbility('Reanimate', 'Reanimar — 1/2 AP', 'Escolha um marcador de Reanimação visível e a até 6". Com 3+, um aliado é reanimado; gastando 1 AP adicional, a reanimação é automática.') ] },
  { name: 'Apprentek', translation: 'Aprentek', profile: 'APL 3 · Movimento 6" · Salvamento 3+ · Feridas 11', weapons: [teamWeapon('Arcane conduit (ranged)', 'Condutor arcano (à distância)', 'Atk 4 · Acerto 3+ · Dano 4/5', 'Piercing 1, Magnify'), teamWeapon('Arcane conduit (melee)', 'Condutor arcano (corpo a corpo)', 'Atk 3 · Acerto 4+ · Dano 3/5')], abilities: [teamAbility('Apprentek Assistance', 'Assistência do Aprentek', 'Este operativo possui as mesmas ações únicas do Cryptek escolhido para a batalha, mas só pode realizar uma ação única de Cryptek por Ponto de Virada.') ] },
  { name: 'Deathmark', translation: 'Deathmark', profile: 'APL 2 · Movimento 5" · Salvamento 3+ · Feridas 10', weapons: [teamWeapon('Synaptic disintegrator', 'Desintegrador sináptico', 'Atk 4 · Acerto 2+ · Dano 4/3', 'Devastating 2, Heavy (Dash only), Piercing 1, Severe'), teamWeapon('Fists', 'Punhos', 'Atk 3 · Acerto 3+ · Dano 3/4')], abilities: [teamAbility('Deathmarked', 'Marcado pela morte', 'Ao terminar Shoot, o alvo não incapacitado recebe um marcador Deathmarked. As armas de tiro de Deathmarks aliados têm Seek contra inimigos com esse marcador.'), teamAbility('Multi-dimensional Vision', 'Visão multidimensional — 1 AP', 'Até o início da próxima ativação, quando este operativo realizar Shoot, inimigos não podem estar obscured.') ] },
  { name: 'Immortal Despotek', translation: 'Despotek Immortal', profile: 'APL 2 · Movimento 5" · Salvamento 3+ · Feridas 11', weapons: [teamWeapon('Gauss blaster', 'Blaster Gauss', 'Atk 4 · Acerto 3+ · Dano 4/5', 'Piercing 1'), teamWeapon('Tesla carbine', 'Carabina Tesla', 'Atk 5 · Acerto 3+ · Dano 3/3', '2" Devastating 1'), teamWeapon('Bayonet', 'Baioneta', 'Atk 4 · Acerto 3+ · Dano 3/4')], abilities: [teamAbility('Steadfast', 'Inabalável', 'Ao determinar o controle de um marcador, você pode tratar a APL deste operativo como 3, ignorando outras alterações de APL para esse cálculo.'), teamAbility('Interstitial Command', 'Comando intersticial — 1 AP', 'SUPORTE. Um operativo HIEROTEK CIRCLE aliado elegível e visível a até 6" pode realizar uma ação de 1 AP gratuitamente.') ] },
  { name: 'Immortal Guardian', translation: 'Guardião Immortal', profile: 'APL 2 · Movimento 5" · Salvamento 3+ · Feridas 10', weapons: [teamWeapon('Gauss blaster', 'Blaster Gauss', 'Atk 4 · Acerto 3+ · Dano 4/5', 'Piercing 1'), teamWeapon('Tesla carbine', 'Carabina Tesla', 'Atk 5 · Acerto 3+ · Dano 3/3', '2" Devastating 1'), teamWeapon('Bayonet', 'Baioneta', 'Atk 4 · Acerto 3+ · Dano 3/4')], abilities: [teamAbility('Steadfast', 'Inabalável', 'Ao determinar o controle de um marcador, você pode tratar a APL deste operativo como 3, ignorando outras alterações de APL para esse cálculo.') ] },
];

const legionariesOperatives: TeamOperative[] = [
  { name: 'Aspiring Champion', translation: 'Campeão Aspirante', profile: 'APL 3 · Movimento 6" · Salvamento 3+ · Feridas 15', weapons: [teamWeapon('Plasma pistol (standard)', 'Pistola de plasma (padrão)', 'Atk 4 · Acerto 3+ · Dano 3/5', 'Alcance 8", Piercing 1'), teamWeapon('Plasma pistol (supercharge)', 'Pistola de plasma (sobrecarga)', 'Atk 4 · Acerto 3+ · Dano 4/5', 'Alcance 8", Hot, Lethal 5+, Piercing 1'), teamWeapon('Tainted bolt pistol', 'Pistola de ferrolho corrompida', 'Atk 4 · Acerto 3+ · Dano 3/5', 'Alcance 8", Rending'), teamWeapon('Power fist', 'Punho de poder', 'Atk 5 · Acerto 4+ · Dano 5/7', 'Brutal'), teamWeapon('Power maul', 'Maça de energia', 'Atk 5 · Acerto 3+ · Dano 4/6', 'Shock'), teamWeapon('Power weapon', 'Arma de energia', 'Atk 5 · Acerto 3+ · Dano 4/6', 'Lethal 5+'), teamWeapon('Tainted chainsword', 'Espada-serra corrompida', 'Atk 5 · Acerto 3+ · Dano 4/5', 'Rending')], abilities: [teamAbility('In the Eyes of the Gods', 'Aos olhos dos deuses', 'Uma vez durante a ativação, se este operativo incapacitar um inimigo, aumente sua APL em 1 até o fim da ativação.') ] },
  { name: 'Chosen', translation: 'Escolhido', profile: 'APL 3 · Movimento 6" · Salvamento 3+ · Feridas 15', weapons: [teamWeapon('Plasma pistol (standard)', 'Pistola de plasma (padrão)', 'Atk 4 · Acerto 3+ · Dano 3/5', 'Alcance 8", Piercing 1'), teamWeapon('Plasma pistol (supercharge)', 'Pistola de plasma (sobrecarga)', 'Atk 4 · Acerto 3+ · Dano 4/5', 'Alcance 8", Hot, Lethal 5+, Piercing 1'), teamWeapon('Tainted bolt pistol', 'Pistola de ferrolho corrompida', 'Atk 4 · Acerto 3+ · Dano 3/5', 'Alcance 8", Rending'), teamWeapon('Daemon blade', 'Lâmina demoníaca', 'Atk 5 · Acerto 3+ · Dano 4/7', 'Lethal 5+')], abilities: [teamAbility('Daemonic Aura', 'Aura demoníaca', 'Quando um inimigo realizar Fall Back dentro do alcance de controle deste operativo, role 1D6. Com 3+, ele não pode realizar a ação e recupera o AP gasto.'), teamAbility('Soul Gorge', 'Garganta da alma', 'Após Fight ou Retaliate, se este operativo tiver incapacitado um inimigo e continuar vivo, ele recupera D3+1 Feridas.') ] },
  { name: 'Anointed', translation: 'Ungido', profile: 'APL 3 · Movimento 6" · Salvamento 3+ · Feridas 14', weapons: [teamWeapon('Bolt pistol', 'Pistola de ferrolho', 'Atk 4 · Acerto 3+ · Dano 3/4', 'Alcance 8"'), teamWeapon('Daemonic claw', 'Garra demoníaca', 'Atk 5 · Acerto 3+ · Dano 4/5', 'Rending')], abilities: [teamAbility('Unleash Daemon', 'Liberar demônio', 'Uma vez por batalha, até o fim da batalha, este operativo não pode realizar Pick Up ou ações de missão (exceto Operate Hatch); se carregar um marcador, pode colocá-lo como ação gratuita. Dano Normal e Crítico de 4+ causado a ele é reduzido em 1. A garra recebe Ceaseless e Lethal 5+.'), teamAbility('Daemonic Aura', 'Aura demoníaca', 'Este operativo pode ignorar a restrição de sair do alcance de controle ao realizar Fall Back, conforme indicado pela sua regra.') ] },
  { name: 'Balefire Acolyte', translation: 'Acólito de Balefire', profile: 'APL 3 · Movimento 6" · Salvamento 3+ · Feridas 14', weapons: [teamWeapon('Bolt pistol', 'Pistola de ferrolho', 'Atk 4 · Acerto 3+ · Dano 3/4', 'Alcance 8"'), teamWeapon('Fireblast', 'Explosão ígnea', 'Atk 4 · Acerto 3+ · Dano 3/4', 'PSYCHIC, Blast 2", 1" Devastating 1, Saturate'), teamWeapon('Life siphon', 'Dreno vital', 'Atk 5 · Acerto 3+ · Dano 3/3', 'PSYCHIC, Saturate, Siphon Life'), teamWeapon('Fell dagger', 'Adaga macabra', 'Atk 5 · Acerto 3+ · Dano 3/4', 'PSYCHIC, Rending, Siphon Life')], abilities: [teamAbility('Siphon Life', 'Dreno vital', 'Ao escolher esta arma, você pode ativar esta regra. No início da resolução dos dados de ataque, escolha um LEGIONARY aliado visível e a até 6". Cada dado que causar dano faz esse aliado recuperar 1 Ferida, ou D3 se for um crítico. Uma vez por Ponto de Virada.') ] },
  { name: 'Butcher', translation: 'Açougueiro', profile: 'APL 3 · Movimento 6" · Salvamento 3+ · Feridas 14', weapons: [teamWeapon('Bolt pistol', 'Pistola de ferrolho', 'Atk 4 · Acerto 3+ · Dano 3/4', 'Alcance 8"'), teamWeapon('Double-handed chainaxe', 'Machado-serra de duas mãos', 'Atk 5 · Acerto 4+ · Dano 5/7', 'Brutal')], abilities: [teamAbility('Devastating Onslaught', 'Investida devastadora', 'Enquanto luta ou retalia, inimigos não podem prestar assistência. Ao fim da ativação ou contra-ação de cada inimigo, este operativo pode realizar uma Charge gratuita de até 2", terminando dentro do alcance de controle do inimigo escolhido.') ] },
  { name: 'Gunner', translation: 'Artilheiro', profile: 'APL 3 · Movimento 6" · Salvamento 3+ · Feridas 14', weapons: [teamWeapon('Bolt pistol', 'Pistola de ferrolho', 'Atk 4 · Acerto 3+ · Dano 3/4', 'Alcance 8"'), teamWeapon('Flamer', 'Lança-chamas', 'Atk 4 · Acerto 2+ · Dano 3/3', 'Alcance 8", Saturate, Torrent 2"'), teamWeapon('Meltagun', 'Fuzil de fusão', 'Atk 4 · Acerto 3+ · Dano 6/3', 'Alcance 6", Devastating 4, Piercing 2'), teamWeapon('Plasma gun (standard)', 'Fuzil de plasma (padrão)', 'Atk 4 · Acerto 3+ · Dano 4/6', 'Piercing 1'), teamWeapon('Plasma gun (supercharge)', 'Fuzil de plasma (sobrecarga)', 'Atk 4 · Acerto 3+ · Dano 5/6', 'Hot, Lethal 5+, Piercing 1'), teamWeapon('Fists', 'Punhos', 'Atk 4 · Acerto 3+ · Dano 3/4')] },
  { name: 'Heavy Gunner', translation: 'Artilheiro Pesado', profile: 'APL 3 · Movimento 6" · Salvamento 3+ · Feridas 14', weapons: [teamWeapon('Bolt pistol', 'Pistola de ferrolho', 'Atk 4 · Acerto 3+ · Dano 3/4', 'Alcance 8"'), teamWeapon('Heavy bolter (focused)', 'Heavy bolter (focado)', 'Atk 5 · Acerto 3+ · Dano 4/5', 'Heavy (Reposition only), Piercing Crits 1'), teamWeapon('Heavy bolter (sweeping)', 'Heavy bolter (varredura)', 'Atk 4 · Acerto 3+ · Dano 4/5', 'Heavy (Reposition only), Piercing Crits 1, Torrent 1"'), teamWeapon('Missile launcher (frag)', 'Lançador de mísseis (frag)', 'Atk 4 · Acerto 3+ · Dano 3/5', 'Blast 2", Heavy (Reposition only)'), teamWeapon('Missile launcher (krak)', 'Lançador de mísseis (krak)', 'Atk 4 · Acerto 3+ · Dano 5/7', 'Heavy (Reposition only), Piercing 1'), teamWeapon('Reaper chaincannon (focused)', 'Canhão-serra Reaper (focado)', 'Atk 5 · Acerto 3+ · Dano 3/4', 'Ceaseless, Heavy (Reposition only), Punishing'), teamWeapon('Reaper chaincannon (sweeping)', 'Canhão-serra Reaper (varredura)', 'Atk 4 · Acerto 3+ · Dano 3/4', 'Ceaseless, Heavy (Reposition only), Punishing, Torrent 2"'), teamWeapon('Fists', 'Punhos', 'Atk 4 · Acerto 3+ · Dano 3/4')] },
  { name: 'Icon Bearer', translation: 'Portador do Ícone', profile: 'APL 3 · Movimento 6" · Salvamento 3+ · Feridas 14', weapons: [teamWeapon('Bolt pistol', 'Pistola de ferrolho', 'Atk 4 · Acerto 3+ · Dano 3/4', 'Alcance 8"'), teamWeapon('Boltgun', 'Bolter', 'Atk 4 · Acerto 3+ · Dano 3/4'), teamWeapon('Chainsword', 'Espada-serra', 'Atk 5 · Acerto 3+ · Dano 4/5'), teamWeapon('Fists', 'Punhos', 'Atk 4 · Acerto 3+ · Dano 3/4')], abilities: [teamAbility('Icon Bearer', 'Portador do Ícone', 'Ao determinar o controle de um marcador, trate a APL deste operativo como 1 maior.'), teamAbility('Favoured of the Dark Gods', 'Favorito dos Deuses Sombrios', 'Na etapa Ready de cada fase de Estratégia, se este operativo controlar um marcador de objetivo não corrompido, corrompa-o e ganhe 1 CP.') ] },
  { name: 'Shrivetalon', translation: 'Talhador', profile: 'APL 3 · Movimento 6" · Salvamento 3+ · Feridas 14', weapons: [teamWeapon('Bolt pistol', 'Pistola de ferrolho', 'Atk 4 · Acerto 3+ · Dano 3/4', 'Alcance 8"'), teamWeapon('Flensing blades', 'Lâminas de esfolamento', 'Atk 5 · Acerto 3+ · Dano 3/5', 'Lethal 5+')], abilities: [teamAbility('Vicious Reflexes', 'Reflexos ferozes', 'Quando este operativo retalia, o primeiro dado de ataque é resolvido pelo defensor, em vez do atacante.'), teamAbility('Horrifying Dismemberment', 'Desmembramento horripilante', 'Quando incapacitar um inimigo em Fight ou Retaliate, escolha um inimigo visível a até 3"; ele perde 1 APL até o início da próxima ativação.') ] },
  { name: 'Warrior', translation: 'Guerreiro', profile: 'APL 3 · Movimento 6" · Salvamento 3+ · Feridas 14', weapons: [teamWeapon('Bolt pistol', 'Pistola de ferrolho', 'Atk 4 · Acerto 3+ · Dano 3/4', 'Alcance 8"'), teamWeapon('Boltgun', 'Bolter', 'Atk 4 · Acerto 3+ · Dano 3/4'), teamWeapon('Chainsword', 'Espada-serra', 'Atk 5 · Acerto 3+ · Dano 4/5'), teamWeapon('Fists', 'Punhos', 'Atk 4 · Acerto 3+ · Dano 3/4')] },
];

const plagueMarinesOperatives: TeamOperative[] = [
  { name: 'Champion', translation: 'Campeão Plague Marine', profile: 'APL 3 · Movimento 5" · Salvamento 3+ · Feridas 15', weapons: [teamWeapon('Plasma pistol (standard)', 'Pistola de plasma (padrão)', 'Atk 4 · Acerto 3+ · Dano 3/5', 'Alcance 8", Piercing 1'), teamWeapon('Plasma pistol (supercharge)', 'Pistola de plasma (sobrecarga)', 'Atk 4 · Acerto 3+ · Dano 4/5', 'Alcance 8", Hot, Lethal 5+, Piercing 1'), teamWeapon('Plague sword', 'Espada da peste', 'Atk 5 · Acerto 3+ · Dano 4/5', 'Severe, Poison')], abilities: [teamAbility('Grandfather’s Blessing', 'Bênção do Avô', 'Quando um inimigo com um marcador Poison perder Feridas a até 7" deste operativo, ele recupera a mesma quantidade perdida, até 3 Feridas por Ponto de Virada. A regra Toxic da espada aumenta em 1 o Dano Normal e Crítico contra inimigos com Poison.') ] },
  { name: 'Bombardier', translation: 'Bombardeiro', profile: 'APL 3 · Movimento 5" · Salvamento 3+ · Feridas 14', weapons: [teamWeapon('Boltgun', 'Bolter', 'Atk 4 · Acerto 3+ · Dano 3/4'), teamWeapon('Fists', 'Punhos', 'Atk 4 · Acerto 3+ · Dano 3/4')], abilities: [teamAbility('Grenadier', 'Granadeiro', 'Pode usar granadas blight e krak sem consumir os usos limitados. Ao fazer isso, melhore o Acerto da arma em 1; as granadas blight também têm Toxic.') ] },
  { name: 'Fighter', translation: 'Combatente', profile: 'APL 3 · Movimento 5" · Salvamento 3+ · Feridas 14', weapons: [teamWeapon('Bolt pistol', 'Pistola de ferrolho', 'Atk 4 · Acerto 3+ · Dano 3/4', 'Alcance 8"'), teamWeapon('Flail of Corruption', 'Mangual da Corrupção', 'Atk 5 · Acerto 3+ · Dano 4/5', 'Brutal, Severe, Shock, Poison')], abilities: [teamAbility('Flail', 'Mangual — 1 AP', 'Cause D3+2 de dano a cada outro operativo visível e a até 2". Para cada um, role 1D3; com 3, ele recebe Poison. Esta ação conta como Fight e este operativo não pode estar em Conceal para realizá-la.') ] },
  { name: 'Heavy Gunner', translation: 'Artilheiro Pesado', profile: 'APL 3 · Movimento 5" · Salvamento 3+ · Feridas 14', weapons: [teamWeapon('Bolt pistol', 'Pistola de ferrolho', 'Atk 4 · Acerto 3+ · Dano 3/4', 'Alcance 8"'), teamWeapon('Plague spewer', 'Lança-pragas', 'Atk 5 · Acerto 2+ · Dano 3/3', 'Alcance 7", Saturate, Severe, Torrent 2", Poison'), teamWeapon('Fists', 'Punhos', 'Atk 4 · Acerto 3+ · Dano 3/4')] },
  { name: 'Icon Bearer', translation: 'Portador do Ícone', profile: 'APL 3 · Movimento 5" · Salvamento 3+ · Feridas 14', weapons: [teamWeapon('Bolt pistol', 'Pistola de ferrolho', 'Atk 4 · Acerto 3+ · Dano 3/4', 'Alcance 8"'), teamWeapon('Plague knife', 'Faca da peste', 'Atk 5 · Acerto 3+ · Dano 3/4', 'Severe, Poison')], abilities: [teamAbility('Icon Bearer', 'Portador do Ícone', 'Ao determinar o controle de um marcador, trate a APL deste operativo como 1 maior.'), teamAbility('Icon of Contagion', 'Ícone do contágio', 'Enquanto estiver no território inimigo, a Strategic Ploy Contagion custa 0 CP.') ] },
  { name: 'Malignant Plaguecaster', translation: 'Plaguecaster Maligno', profile: 'APL 3 · Movimento 5" · Salvamento 3+ · Feridas 14', weapons: [teamWeapon('Entropy', 'Entropia', 'Atk 4 · Acerto 3+ · Dano 3/7', 'PSYCHIC, Alcance 7", Saturate, Severe, Poison'), teamWeapon('Plague wind', 'Vento da peste', 'Atk 6 · Acerto 3+ · Dano 2/3', 'PSYCHIC, Saturate, Severe, Torrent 1", Poison'), teamWeapon('Corrupted staff', 'Cajado corrompido', 'Atk 4 · Acerto 3+ · Dano 3/4', 'PSYCHIC, Severe, Shock, Stun, Poison')], abilities: [teamAbility('Poisonous Miasma — 1 AP', 'Miasma venenoso — 1 AP', 'Escolha um inimigo visível e a até 7". Ele recebe um marcador Poison; se já tiver um, sofre 3 de dano. Não pode ser usado dentro do alcance de controle de um inimigo.'), teamAbility('Putrescent Vitality — 1 AP', 'Vitalidade pútrida — 1 AP', 'Escolha um aliado visível e a até 3" para recuperar Feridas. Role 2D6: com total 7, recupera 7; caso contrário, recupera o maior resultado. Uma vez por Ponto de Virada.') ] },
  { name: 'Warrior', translation: 'Guerreiro', profile: 'APL 3 · Movimento 5" · Salvamento 3+ · Feridas 14', weapons: [teamWeapon('Boltgun', 'Bolter', 'Atk 4 · Acerto 3+ · Dano 3/4', 'Poison'), teamWeapon('Plague knife', 'Faca da peste', 'Atk 4 · Acerto 3+ · Dano 3/4', 'Severe, Poison')], abilities: [teamAbility('Repulsive Fortitude', 'Fortitude repulsiva', 'Quando este operativo for alvo de Shoot, resultados 5+ nos dados de defesa são críticos.') ] },
];

const warpcovenOperatives: TeamOperative[] = [
  { name: 'Sorcerer of Destiny', translation: 'Feiticeiro do Destino', profile: 'APL 3 · Movimento 6" · Salvamento 3+ · Feridas 15', weapons: [teamWeapon('Doombolt', 'Raio da perdição', 'Atk 4 · Acerto 3+ · Dano 4/2', 'PSYCHIC, Devastating 2, Lethal 5+'), teamWeapon('Inferno bolt pistol', 'Pistola de ferrolho inferno', 'Atk 4 · Acerto 3+ · Dano 3/4', 'Alcance 8", Piercing 1'), teamWeapon('Warpflame pistol', 'Pistola de fogo do Warp', 'Atk 4 · Acerto 2+ · Dano 3/3', 'Alcance 6", Piercing 1, Torrent 1"'), teamWeapon('Force stave', 'Cajado de força', 'Atk 4 · Acerto 3+ · Dano 4/6', 'PSYCHIC, Shock'), teamWeapon('Prosperine khopesh', 'Khopesh prosperino', 'Atk 5 · Acerto 3+ · Dano 4/6', 'Lethal 5+')], abilities: [teamAbility('Protected by Fate', 'Protegido pelo destino', 'Uma vez por Ponto de Virada, quando este operativo seria incapacitado, você pode rolar 1D6. Com 4+, ele não é incapacitado e permanece com 1 Ferida.'), teamAbility('Ravage Destiny', 'Devastar o destino', 'Uma vez por batalha, durante a ativação, este operativo pode repetir um dado de ataque e um dado de defesa em cada sequência que realizar.') ] },
  { name: 'Sorcerer of Tempyrion', translation: 'Feiticeiro do Tempyrion', profile: 'APL 3 · Movimento 6" · Salvamento 3+ · Feridas 14', weapons: [teamWeapon('Fluxblast', 'Explosão de fluxo', 'Atk 4 · Acerto 3+ · Dano 3/4', 'PSYCHIC, Blast 2", Rending'), teamWeapon('Inferno bolt pistol', 'Pistola de ferrolho inferno', 'Atk 4 · Acerto 3+ · Dano 3/4', 'Alcance 8", Piercing 1'), teamWeapon('Warpflame pistol', 'Pistola de fogo do Warp', 'Atk 4 · Acerto 2+ · Dano 3/3', 'Alcance 6", Piercing 1, Torrent 1"'), teamWeapon('Force stave', 'Cajado de força', 'Atk 4 · Acerto 3+ · Dano 4/6', 'PSYCHIC, Shock'), teamWeapon('Prosperine khopesh', 'Khopesh prosperino', 'Atk 5 · Acerto 3+ · Dano 4/6', 'Lethal 5+')], abilities: [teamAbility('Temporal Flux', 'Fluxo temporal', 'Uma vez por ativação, depois de realizar uma ação, este operativo pode mudar sua ordem para Engage ou Conceal, conforme permitido pelas regras.'), teamAbility('Reconstitution Ritual', 'Ritual de reconstituição', 'SUPORTE. Escolha um RUBRIC MARINE aliado visível e a até 6" para recuperar até 2D3 Feridas.') ] },
  { name: 'Sorcerer of Warpfire', translation: 'Feiticeiro do Fogo do Warp', profile: 'APL 3 · Movimento 6" · Salvamento 3+ · Feridas 14', weapons: [teamWeapon('Firestorm', 'Tempestade de fogo', 'Atk 5 · Acerto 4+ · Dano 2/3', 'PSYCHIC, Saturate, Seek, Light, Torrent 2"'), teamWeapon('Inferno bolt pistol', 'Pistola de ferrolho inferno', 'Atk 4 · Acerto 3+ · Dano 3/4', 'Alcance 8", Piercing 1'), teamWeapon('Mindburn', 'Queima-mente', 'Atk 5 · Acerto 4+ · Dano 1/1', 'PSYCHIC, Lethal 5+, Saturate, Seek'), teamWeapon('Warpflame pistol', 'Pistola de fogo do Warp', 'Atk 4 · Acerto 2+ · Dano 3/3', 'Alcance 6", Piercing 1, Torrent 1"'), teamWeapon('Force stave', 'Cajado de força', 'Atk 4 · Acerto 3+ · Dano 4/6', 'PSYCHIC, Shock'), teamWeapon('Prosperine khopesh', 'Khopesh prosperino', 'Atk 5 · Acerto 3+ · Dano 4/6', 'Lethal 5+')], abilities: [teamAbility('Alight', 'Em chamas', 'Quando um inimigo for atingido por Firestorm ou Mindburn, ele recebe um marcador de Fogo. No fim da ativação dele, sofre 2 de dano e o marcador é removido.') ] },
  { name: 'Rubric Marine Gunner', translation: 'Artilheiro Rubric Marine', profile: 'APL 3 · Movimento 5" · Salvamento 2+ · Feridas 14', weapons: [teamWeapon('Soulreaper cannon (focused)', 'Canhão ceifador de almas (focado)', 'Atk 5 · Acerto 3+ · Dano 4/5', 'Piercing 1'), teamWeapon('Soulreaper cannon (sweeping)', 'Canhão ceifador de almas (varredura)', 'Atk 4 · Acerto 3+ · Dano 4/5', 'Piercing 1, Torrent 1"'), teamWeapon('Warpflamer', 'Lança-chamas do Warp', 'Atk 4 · Acerto 2+ · Dano 4/4', 'Alcance 8", Saturate, Piercing 1, Torrent 2"'), teamWeapon('Fists', 'Punhos', 'Atk 3 · Acerto 3+ · Dano 3/4')], abilities: [teamAbility('Sorcerous Automata', 'Autômatos feiticeiros', 'Durante a ativação, subtraia 1 da APL deste operativo, a menos que um Sorcerer aliado esteja a até 9".') ] },
  { name: 'Rubric Marine Icon Bearer', translation: 'Portador do Ícone Rubric Marine', profile: 'APL 3 · Movimento 5" · Salvamento 2+ · Feridas 14', weapons: [teamWeapon('Inferno boltgun', 'Bolter inferno', 'Atk 4 · Acerto 3+ · Dano 3/4', 'Piercing 1'), teamWeapon('Fists', 'Punhos', 'Atk 3 · Acerto 3+ · Dano 3/4')], abilities: [teamAbility('Sorcerous Automata', 'Autômatos feiticeiros', 'Durante a ativação, subtraia 1 da APL deste operativo, a menos que um Sorcerer aliado esteja a até 9".'), teamAbility('Icon Bearer', 'Portador do Ícone', 'Ao determinar o controle de um marcador, trate a APL deste operativo como 1 maior.') ] },
  { name: 'Rubric Marine Warrior', translation: 'Guerreiro Rubric Marine', profile: 'APL 3 · Movimento 5" · Salvamento 2+ · Feridas 14', weapons: [teamWeapon('Inferno boltgun', 'Bolter inferno', 'Atk 4 · Acerto 3+ · Dano 3/4', 'Piercing 1'), teamWeapon('Fists', 'Punhos', 'Atk 3 · Acerto 3+ · Dano 3/4')], abilities: [teamAbility('Sorcerous Automata', 'Autômatos feiticeiros', 'Durante a ativação, subtraia 1 da APL deste operativo, a menos que um Sorcerer aliado esteja a até 9".'), teamAbility('Slow and Purposeful', 'Lento e determinado', 'As armas de tiro deste operativo têm Ceaseless se ele não tiver realizado Charge, Reposition ou Counteract durante a ativação.') ] },
  { name: 'Tzaangor Champion', translation: 'Campeão Tzaangor', profile: 'APL 2 · Movimento 6" · Salvamento 5+ · Feridas 10', weapons: [teamWeapon('Greataxe', 'Grande machado', 'Atk 4 · Acerto 3+ · Dano 4/5', 'Brutal, Lethal 5+'), teamWeapon('Greatblade', 'Grande lâmina', 'Atk 4 · Acerto 3+ · Dano 4/5', 'Lethal 5+, Rending')], abilities: [teamAbility('Savage Brutality', 'Brutalidade selvagem', 'Uma vez por ativação, depois de realizar a primeira ação Fight, este operativo pode realizar Fight novamente gratuitamente.') ] },
  { name: 'Tzaangor Horn Bearer', translation: 'Portador do Chifre Tzaangor', profile: 'APL 2 · Movimento 6" · Salvamento 5+ · Feridas 9', weapons: [teamWeapon('Dagger', 'Adaga', 'Atk 4 · Acerto 4+ · Dano 3/5')], abilities: [teamAbility('Brayhorn', 'Chifre de brado — 0 AP', 'Até a próxima etapa Ready, adicione 1" ao Movimento dos Tzaangors aliados.') ] },
  { name: 'Tzaangor Icon Bearer', translation: 'Portador do Ícone Tzaangor', profile: 'APL 2 · Movimento 6" · Salvamento 5+ · Feridas 9', weapons: [teamWeapon('Dagger', 'Adaga', 'Atk 4 · Acerto 4+ · Dano 3/5')], abilities: [teamAbility('Herd Banner', 'Estandarte do rebanho', 'Se um dado de ataque causar 3 ou mais de dano a um Tzaangor aliado a até 3", subtraia 1 do dano causado.'), teamAbility('Icon Bearer', 'Portador do Ícone', 'Ao determinar o controle de um marcador, trate a APL deste operativo como 1 maior.') ] },
  { name: 'Tzaangor Warrior', translation: 'Guerreiro Tzaangor', profile: 'APL 2 · Movimento 6" · Salvamento 5+ · Feridas 9', weapons: [teamWeapon('Autopistol', 'Autopistola', 'Atk 4 · Acerto 4+ · Dano 2/3'), teamWeapon('Chainsword', 'Espada-serra', 'Atk 4 · Acerto 4+ · Dano 4/5'), teamWeapon('Tzaangor blade and shield', 'Lâmina e escudo Tzaangor', 'Atk 4 · Acerto 4+ · Dano 3/4', 'Shield'), teamWeapon('Tzaangor blades', 'Lâminas Tzaangor', 'Atk 4 · Acerto 4+ · Dano 4/5', 'Balanced')], abilities: [teamAbility('Relic Hunters', 'Caçadores de relíquias', 'Uma vez por turno, quando estiver no território inimigo, este operativo pode realizar Pick Up, Place Marker ou uma ação de missão por 1 AP a menos.'), teamAbility('Shield', 'Escudo', 'O Salvamento deste operativo é 4+ e, ao lutar ou retaliar com esta arma, cada bloqueio pode bloquear 2 sucessos.') ] },
];

function TeamOperativeCard({ operative, isOpen, onToggle }: { operative: TeamOperative; isOpen: boolean; onToggle: () => void }) {
  const [openWeapon, setOpenWeapon] = useState<string | null>(null);

  return <article className={`team-operative-card ${isOpen ? 'is-open' : ''}`}>
    <button type="button" className="team-operative-card-toggle" aria-expanded={isOpen} onClick={onToggle}>
      <div className="team-operative-card-heading"><div><h5>{operative.translation}</h5><span>{operative.name}</span></div><strong>{operative.profile}</strong></div>
      <b aria-hidden="true">{isOpen ? '−' : '+'}</b>
    </button>
    {isOpen ? <div className="team-operative-card-content">
      <div className="team-operative-block"><p className="operative-block-label">ARMAS · CLIQUE PARA ABRIR</p><div className="operative-weapon-list">{operative.weapons.map((weapon) => { const isWeaponOpen = openWeapon === weapon.name; return <div className={`operative-weapon-row ${isWeaponOpen ? 'is-open' : ''}`} key={weapon.name}>
        <button type="button" className="operative-weapon-toggle" aria-expanded={isWeaponOpen} onClick={() => setOpenWeapon(isWeaponOpen ? null : weapon.name)}><span><strong>{weapon.translation}</strong><em>{weapon.name}</em></span><b aria-hidden="true">{isWeaponOpen ? '−' : '+'}</b></button>
        {isWeaponOpen ? <p className="operative-weapon-profile">{weapon.profile}{weapon.rules ? <> · {renderWeaponRuleTerms(weapon.rules)}</> : null}</p> : null}
      </div>; })}</div></div>
      {operative.abilities?.length ? <div className="team-operative-block operative-abilities"><p className="operative-block-label">REGRAS ESPECIAIS</p>{operative.abilities.map((ability) => <div className="operative-ability" key={ability.name}><h6>{ability.translation} <span>{ability.name}</span></h6><p>{renderWeaponRuleTerms(ability.effect)}</p></div>)}</div> : null}
    </div> : null}
  </article>;
}

function AngelsOfDeathOperatives() {
  const [openOperative, setOpenOperative] = useState<string | null>(null);

  return <section className="team-ploy-content" aria-labelledby="angels-operatives-title">
    <div className="team-ploy-heading"><p className="eyebrow">OPERATIVOS · ANGELS OF DEATH</p><h4 id="angels-operatives-title">Nove fichas de operativo</h4><p>Clique em um operativo para abrir sua ficha. As armas também podem ser abertas individualmente. A composição legal da equipe será adicionada depois.</p></div>
    <div className="team-operative-list">{angelsOperatives.map((operative) => <TeamOperativeCard operative={operative} isOpen={openOperative === operative.name} onToggle={() => setOpenOperative(openOperative === operative.name ? null : operative.name)} key={operative.name} />)}</div>
  </section>;
}

function TeamOperativesGuide({ teamName, headingId, operatives }: { teamName: string; headingId: string; operatives: TeamOperative[] }) {
  const [openOperative, setOpenOperative] = useState<string | null>(null);

  return <section className="team-ploy-content" aria-labelledby={headingId}>
    <div className="team-ploy-heading"><p className="eyebrow">OPERATIVOS · {teamName.toUpperCase()}</p><h4 id={headingId}>{operatives.length} fichas de operativo</h4><p>Clique em um operativo para abrir sua ficha. As armas também podem ser abertas individualmente. A composição legal da equipe será adicionada depois.</p></div>
    <div className="team-operative-list">{operatives.map((operative) => <TeamOperativeCard operative={operative} isOpen={openOperative === operative.name} onToggle={() => setOpenOperative(openOperative === operative.name ? null : operative.name)} key={operative.name} />)}</div>
  </section>;
}

function KillTeamsHub() {
  const [selectedTeamId, setSelectedTeamId] = useState('kommandos');
  const [openSection, setOpenSection] = useState<string | null>(null);
  const selectedTeam = killTeams.find((team) => team.id === selectedTeamId) ?? killTeams[0];
  const sections = ['Regra da equipe', 'Operativos', 'Armas e equipamentos', 'Strategic Ploys', 'Firefight Ploys'];
  const isAngelsOfDeath = selectedTeam.id === 'angels-of-death';
  const isHierotekCircle = selectedTeam.id === 'hierotek-circle';
  const isLegionaries = selectedTeam.id === 'legionaries';
  const isPlagueMarines = selectedTeam.id === 'plague-marines';
  const isWarpcoven = selectedTeam.id === 'warpcoven';

  useEffect(() => {
    setOpenSection(null);
  }, [selectedTeam.id]);

  return <section className="kill-teams-hub">
    <div className="guide-intro"><p className="eyebrow">REGRAS DOS TIMES</p><h2>Escolha seu Kill Team</h2><p>Selecione um dos seus times para consultar suas regras, operativos, armas, equipamentos e ploys em português.</p></div>
    <div className="kill-teams-layout"><label className="team-selector" htmlFor="kill-team-select"><span className="eyebrow">SELECIONE O TIME</span><select id="kill-team-select" value={selectedTeam.id} onChange={(event) => setSelectedTeamId(event.target.value)}>{killTeams.map((team) => <option key={team.id} value={team.id}>{team.name} — {team.faction}</option>)}</select></label><article className="team-detail"><div className="team-detail-heading"><div><p className="eyebrow">{selectedTeam.accent.toUpperCase()}</p><h3>{selectedTeam.name}</h3><p>{selectedTeam.faction}</p></div><span>{selectedTeam.short}</span></div><div className="team-sections">{sections.map((section, index) => { const isOpen = openSection === section; const contentId = `team-section-${selectedTeam.id}-${index}`; const sectionContent = isAngelsOfDeath && index === 0 ? <AngelsOfDeathFactionRules /> : isAngelsOfDeath && index === 1 ? <AngelsOfDeathOperatives /> : isAngelsOfDeath && index === 2 ? <FactionEquipmentGuide teamName="Angels of Death" equipment={angelsEquipment} /> : isAngelsOfDeath && index === 3 ? <AngelsOfDeathPloys type="strategic" /> : isAngelsOfDeath && index === 4 ? <AngelsOfDeathPloys type="firefight" /> : isHierotekCircle && index === 0 ? <HierotekCircleFactionRules /> : isHierotekCircle && index === 1 ? <TeamOperativesGuide teamName="Hierotek Circle" headingId="hierotek-operatives-title" operatives={hierotekOperatives} /> : isHierotekCircle && index === 2 ? <FactionEquipmentGuide teamName="Hierotek Circle" equipment={hierotekEquipment} /> : isHierotekCircle && index === 3 ? <HierotekCirclePloys type="strategic" /> : isHierotekCircle && index === 4 ? <HierotekCirclePloys type="firefight" /> : isLegionaries && index === 0 ? <LegionariesFactionRules /> : isLegionaries && index === 1 ? <TeamOperativesGuide teamName="Legionaries" headingId="legionaries-operatives-title" operatives={legionariesOperatives} /> : isLegionaries && index === 2 ? <FactionEquipmentGuide teamName="Legionaries" equipment={legionaryEquipment} /> : isLegionaries && index === 3 ? <LegionariesPloys type="strategic" /> : isLegionaries && index === 4 ? <LegionariesPloys type="firefight" /> : isPlagueMarines && index === 0 ? <PlagueMarinesFactionRules /> : isPlagueMarines && index === 1 ? <TeamOperativesGuide teamName="Plague Marines" headingId="plague-operatives-title" operatives={plagueMarinesOperatives} /> : isPlagueMarines && index === 2 ? <FactionEquipmentGuide teamName="Plague Marines" equipment={plagueEquipment} /> : isPlagueMarines && index === 3 ? <PlagueMarinesPloys type="strategic" /> : isPlagueMarines && index === 4 ? <PlagueMarinesPloys type="firefight" /> : isWarpcoven && index === 0 ? <WarpcovenFactionRules /> : isWarpcoven && index === 1 ? <TeamOperativesGuide teamName="Warpcoven" headingId="warpcoven-operatives-title" operatives={warpcovenOperatives} /> : isWarpcoven && index === 2 ? <FactionEquipmentGuide teamName="Warpcoven" equipment={warpcovenEquipment} /> : isWarpcoven && index === 3 ? <WarpcovenPloys type="strategic" /> : isWarpcoven && index === 4 ? <WarpcovenPloys type="firefight" /> : <p>O conteúdo traduzido de <strong>{section}</strong> para o time {selectedTeam.name} será adicionado aqui.</p>; return <div key={section} className={`team-section-accordion ${isOpen ? 'is-open' : ''}`}><button type="button" className="team-section-toggle" aria-expanded={isOpen} aria-controls={contentId} onClick={() => setOpenSection(isOpen ? null : section)}><span>{String(index + 1).padStart(2, '0')}</span><strong>{section} — {selectedTeam.name}</strong><b aria-hidden="true">{isOpen ? '−' : '+'}</b></button>{isOpen && <div id={contentId} className="team-section-content">{sectionContent}</div>}</div>; })}</div><aside className="guide-note"><p className="eyebrow">PRÓXIMO PASSO</p><p>Escolha uma categoria acima para abrir o conteúdo. As Tac Ops específicas continuam na aba de Tac Ops.</p></aside></article></div>
  </section>;
}

type MatchMode = '1v1' | '2v2';

function MatchLobby({ pack, selectedMission, selectedTacOp }: { pack: Pack | null; selectedMission: Card | null; selectedTacOp: Card | null }) {
  const [mode, setMode] = useState<MatchMode>('1v1');
  const [lobbyOpen, setLobbyOpen] = useState(false);
  const [missionPickerOpen, setMissionPickerOpen] = useState(false);
  const [showMissionDetails, setShowMissionDetails] = useState(false);
  const [missionId, setMissionId] = useState<string | null>(selectedMission?.id ?? null);
  const [teamIds, setTeamIds] = useState(['angels-of-death', 'legionaries', 'kommandos', 'death-korps']);
  const [tacOpIds, setTacOpIds] = useState<Array<string | null>>([selectedTacOp?.id ?? null, null, null, null]);
  const [revealed, setRevealed] = useState<Record<number, boolean>>({});

  const missions = pack?.cards.filter((card) => card.kind === 'crit_op') ?? [];
  const tacOps = pack?.cards.filter((card) => card.kind === 'tac_op') ?? [];
  const activeMission = missions.find((card) => card.id === missionId) ?? null;
  const playerCount = mode === '1v1' ? 2 : 4;
  const players = Array.from({ length: playerCount }, (_, index) => index);

  useEffect(() => { if (selectedMission?.id) setMissionId(selectedMission.id); }, [selectedMission?.id]);
  useEffect(() => { if (selectedTacOp?.id) setTacOpIds((current) => [selectedTacOp.id, ...current.slice(1)]); }, [selectedTacOp?.id]);
  useEffect(() => { setRevealed({}); }, [mode]);

  function updateTeam(index: number, teamId: string) { setTeamIds((current) => current.map((value, itemIndex) => itemIndex === index ? teamId : value)); }
  function updateTacOp(index: number, tacOpId: string) { setTacOpIds((current) => current.map((value, itemIndex) => itemIndex === index ? (tacOpId || null) : value)); }

  return <section className="match-hub">
    <div className="guide-intro"><p className="eyebrow">ENTRAR NA PARTIDA</p><h2>Monte o lobby</h2><p>Escolha os times e as Tac Ops. A missão principal é compartilhada; cada jogador mantém sua Tac Op oculta até o momento de revelá-la.</p></div>
    {!lobbyOpen ? <>
      <section className="match-setup-card" aria-labelledby="match-setup-title"><div className="match-card-heading"><div><p className="eyebrow">PREPARAÇÃO RÁPIDA</p><h3 id="match-setup-title">Como será a partida?</h3></div><span className="match-status">PASSO 01</span></div><div className="match-mode-grid" role="radiogroup" aria-label="Formato da partida"><button type="button" className={mode === '1v1' ? 'is-selected' : ''} onClick={() => setMode('1v1')} aria-pressed={mode === '1v1'}><strong>1 × 1</strong><span>Dois jogadores, uma kill team para cada lado.</span></button><button type="button" className={mode === '2v2' ? 'is-selected' : ''} onClick={() => setMode('2v2')} aria-pressed={mode === '2v2'}><strong>2 × 2</strong><span>Quatro jogadores, dois de cada lado.</span></button></div><div className="match-setup-note"><strong>O essencial fica aqui.</strong><span>A pontuação, os ferimentos e o rastreamento continuam manuais nesta primeira versão.</span></div></section>
      <section className="match-setup-card" aria-labelledby="match-teams-title"><div className="match-card-heading"><div><p className="eyebrow">JOGADORES</p><h3 id="match-teams-title">Escolha os Kill Teams</h3></div><span className="match-status">PASSO 02</span></div><div className="match-player-grid">{players.map((index) => <article className="match-player-card" key={index}><div className="match-player-heading"><strong>Jogador {index + 1}</strong><span>{index === 0 ? 'VOCÊ' : mode === '2v2' && index === 2 ? 'SUA DUPLA' : 'OPONENTE'}</span></div><label className="match-field"><span>Kill Team</span><select value={teamIds[index]} onChange={(event) => updateTeam(index, event.target.value)}>{killTeams.map((team) => <option key={team.id} value={team.id}>{team.name}</option>)}</select></label><label className="match-field"><span>Tac Op selecionada</span><select value={tacOpIds[index] ?? ''} onChange={(event) => updateTacOp(index, event.target.value)}><option value="">Escolha a Tac Op</option>{tacOps.map((card) => <option key={card.id} value={card.id}>{card.name}</option>)}</select></label><p className="match-private-note">A carta ficará oculta depois que o lobby for montado.</p></article>)}</div></section>
      <section className="match-setup-card" aria-labelledby="match-mission-title"><div className="match-card-heading"><div><p className="eyebrow">MISSÃO PRINCIPAL</p><h3 id="match-mission-title">Escolham a missão da partida</h3></div><span className="match-status">PASSO 03</span></div>{activeMission ? <div className="match-mission-selected"><div><span className="tag">CRIT OP · #{String(activeMission.number).padStart(2, '0')}</span><h4>{activeMission.name}</h4><p>{activeMission.source.name_en}</p></div><button type="button" className="match-secondary-button" onClick={() => setMissionPickerOpen((current) => !current)}>{missionPickerOpen ? 'Fechar missões' : 'Trocar missão'}</button></div> : <button type="button" className="match-primary-button" onClick={() => setMissionPickerOpen(true)}>Selecionar missão principal</button>}{missionPickerOpen && <div className="match-mission-picker" aria-label="Missões principais">{missions.map((mission) => <button type="button" className={mission.id === missionId ? 'is-selected' : ''} key={mission.id} onClick={() => { setMissionId(mission.id); setMissionPickerOpen(false); }}><span>#{String(mission.number).padStart(2, '0')}</span><strong>{mission.name}</strong></button>)}</div>}{activeMission && <button type="button" className="match-text-button" onClick={() => setShowMissionDetails((current) => !current)}>{showMissionDetails ? 'Ocultar carta da missão' : 'Ver carta da missão'}</button>}{showMissionDetails && activeMission && <div className="match-card-copy">{contentBlocks(activeMission.content_markdown)}</div>}</section>
      <button type="button" className="match-launch-button" disabled={!pack || !activeMission || players.some((index) => !tacOpIds[index])} onClick={() => setLobbyOpen(true)}>Montar lobby e entrar na partida <span aria-hidden="true">→</span></button>{players.some((index) => !tacOpIds[index]) && <p className="match-validation">Escolha uma Tac Op para cada jogador antes de montar o lobby.</p>}
    </> : <>
      <section className="match-live-header"><div><p className="eyebrow">LOBBY DA PARTIDA</p><h3>{activeMission?.name ?? 'Missão não selecionada'}</h3><p>{mode === '1v1' ? '1 × 1' : '2 × 2'} · missão principal compartilhada</p></div><button type="button" className="match-secondary-button" onClick={() => setLobbyOpen(false)}>Voltar à preparação</button></section>
      <section className="match-mission-live"><div><p className="eyebrow">MISSÃO PRINCIPAL</p><h3>{activeMission?.name ?? 'Nenhuma missão escolhida'}</h3><p>{activeMission?.source.name_en}</p></div>{activeMission && <button type="button" className="match-text-button" onClick={() => setShowMissionDetails((current) => !current)}>{showMissionDetails ? 'Ocultar carta' : 'Abrir carta da missão'}</button>}{showMissionDetails && activeMission && <div className="match-card-copy">{contentBlocks(activeMission.content_markdown)}</div>}</section>
      <div className="match-player-grid match-live-grid">{players.map((index) => { const team = killTeams.find((item) => item.id === teamIds[index]) ?? killTeams[0]; const tacOp = tacOps.find((card) => card.id === tacOpIds[index]) ?? null; const isRevealed = Boolean(revealed[index]); return <article className="match-player-live" key={index}><div className="match-player-heading"><strong>Jogador {index + 1}</strong><span>{team.short} · {team.name}</span></div><div className="match-team-badge"><b>{team.short}</b><div><strong>{team.name}</strong><span>{team.faction}</span></div></div>{!isRevealed ? <div className="match-hidden-tac"><span>TAC OP OCULTA</span><strong>Revele quando a carta mandar</strong><button type="button" className="match-reveal-button" onClick={() => setRevealed((current) => ({ ...current, [index]: true }))} disabled={!tacOp}>Revelar Tac Op</button></div> : tacOp ? <div className="match-revealed-tac"><div className="match-revealed-label"><span>TAC OP REVELADA</span><strong>{tacOp.archetype}</strong></div><h4>{tacOp.name}</h4><p className="original-name">{tacOp.source.name_en}</p><div className="match-card-copy">{contentBlocks(tacOp.content_markdown)}</div></div> : <p className="match-validation">Nenhuma Tac Op foi selecionada.</p>}</article>; })}</div><aside className="match-manual-note"><p className="eyebrow">RASTREAMENTO MANUAL</p><p>Use a mesa ou papel para marcar pontos, ferimentos, ativações, CP e outros estados da partida. Esta tela fica concentrada apenas na missão, nos times e na revelação das Tac Ops.</p></aside>
    </>}
  </section>;
}

function MatchLobbyFlow({ pack, selectedMission, selectedTacOp }: { pack: Pack | null; selectedMission: Card | null; selectedTacOp: Card | null }) {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [mode, setMode] = useState<MatchMode>('1v1');
  const [teamId, setTeamId] = useState('angels-of-death');
  const [tacOpId, setTacOpId] = useState(selectedTacOp?.id ?? '');
  const [missionId, setMissionId] = useState<string | null>(selectedMission?.id ?? null);
  const [missionPickerOpen, setMissionPickerOpen] = useState(false);
  const [showMissionDetails, setShowMissionDetails] = useState(false);
  const [revealed, setRevealed] = useState(false);

  const missions = pack?.cards.filter((card) => card.kind === 'crit_op') ?? [];
  const tacOps = pack?.cards.filter((card) => card.kind === 'tac_op') ?? [];
  const team = killTeams.find((item) => item.id === teamId) ?? killTeams[0];
  const tacOp = tacOps.find((card) => card.id === tacOpId) ?? null;
  const mission = missions.find((card) => card.id === missionId) ?? null;
  const totalPlayers = mode === '1v1' ? 2 : 4;

  useEffect(() => { if (selectedMission?.id) setMissionId(selectedMission.id); }, [selectedMission?.id]);
  useEffect(() => { if (selectedTacOp?.id) setTacOpId(selectedTacOp.id); }, [selectedTacOp?.id]);

  return <section className="match-hub">
    <div className="guide-intro"><p className="eyebrow">ENTRAR NA PARTIDA</p><h2>Monte o lobby</h2><p>Primeiro você prepara sua própria kill team. Depois entra no lobby e o anfitrião cria a partida com a missão principal.</p></div>
    <div className="match-stepper" aria-label="Etapas da partida">{[['01', 'Sua seleção'], ['02', 'Entrar no lobby'], ['03', 'Criar lobby']].map(([number, label], index) => <div className={step >= index + 1 ? 'is-done' : ''} key={number}><span>{number}</span><strong>{label}</strong></div>)}</div>
    {step === 1 && <section className="match-setup-card" aria-labelledby="match-player-setup-title"><div className="match-card-heading"><div><p className="eyebrow">PASSO 01 · JOGADOR</p><h3 id="match-player-setup-title">Escolha seu Kill Team e sua Tac Op</h3></div><span className="match-status">SUA SELEÇÃO</span></div><article className="match-player-card match-own-selection"><div className="match-player-heading"><strong>Seu exército</strong><span>FICA COM VOCÊ</span></div><label className="match-field"><span>Kill Team</span><select value={teamId} onChange={(event) => setTeamId(event.target.value)}>{killTeams.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label><label className="match-field"><span>Tac Op selecionada</span><select value={tacOpId} onChange={(event) => setTacOpId(event.target.value)}><option value="">Escolha a Tac Op</option>{tacOps.map((card) => <option key={card.id} value={card.id}>{card.name}</option>)}</select></label><p className="match-private-note">Sua Tac Op será levada para o lobby, mas permanecerá oculta até você decidir revelá-la.</p></article><div className="match-action-row"><button type="button" className="match-secondary-button" disabled={!tacOp} onClick={() => setStep(3)}>Criar lobby</button><button type="button" className="match-launch-button" disabled={!tacOp} onClick={() => setStep(2)}>Entrar no lobby <span aria-hidden="true">→</span></button></div>{!tacOp && <p className="match-validation">Escolha uma Tac Op para continuar.</p>}</section>}
    {step === 2 && <section className="match-setup-card" aria-labelledby="match-join-title"><div className="match-card-heading"><div><p className="eyebrow">PASSO 02 · LOBBY</p><h3 id="match-join-title">Você entrou no lobby</h3></div><span className="match-status">TAC OP OCULTA</span></div><div className="match-lobby-summary"><div className="match-team-badge"><b>{team.short}</b><div><strong>{team.name}</strong><span>{team.faction}</span></div></div><div className="match-hidden-tac"><span>TAC OP OCULTA</span><strong>{tacOp ? 'Selecionada e protegida' : 'Nenhuma Tac Op selecionada'}</strong><p>O nome e o conteúdo da carta não aparecem para os outros jogadores.</p></div></div><div className="match-setup-note"><strong>Agora aguarde o anfitrião.</strong><span>O próximo passo é criar o lobby, definir o formato e escolher a missão principal.</span></div><div className="match-action-row"><button type="button" className="match-secondary-button" onClick={() => setStep(1)}>Voltar</button><button type="button" className="match-launch-button" onClick={() => setStep(3)}>Continuar para criar o lobby <span aria-hidden="true">→</span></button></div></section>}
    {step === 3 && <section className="match-setup-card" aria-labelledby="match-create-title"><div className="match-card-heading"><div><p className="eyebrow">PASSO 03 · ANFITRIÃO</p><h3 id="match-create-title">Crie o lobby da partida</h3></div><span className="match-status">CONFIGURAÇÃO</span></div><p className="match-section-intro">Defina quantos jogadores participarão e selecione a missão principal compartilhada.</p><div className="match-mode-grid" role="radiogroup" aria-label="Formato da partida"><button type="button" className={mode === '1v1' ? 'is-selected' : ''} onClick={() => setMode('1v1')} aria-pressed={mode === '1v1'}><strong>1 × 1</strong><span>Dois jogadores, uma kill team para cada lado.</span></button><button type="button" className={mode === '2v2' ? 'is-selected' : ''} onClick={() => setMode('2v2')} aria-pressed={mode === '2v2'}><strong>2 × 2</strong><span>Quatro jogadores, dois de cada lado.</span></button></div><div className="match-mission-live match-create-mission"><div><p className="eyebrow">MISSÃO PRINCIPAL</p><h3>{mission?.name ?? 'Nenhuma missão escolhida'}</h3><p>{mission?.source.name_en ?? 'Selecione uma Crit Op para a partida.'}</p></div><button type="button" className="match-secondary-button" onClick={() => setMissionPickerOpen((current) => !current)}>{missionPickerOpen ? 'Fechar missões' : 'Selecionar missão'}</button></div>{missionPickerOpen && <div className="match-mission-picker" aria-label="Missões principais">{missions.map((item) => <button type="button" className={item.id === missionId ? 'is-selected' : ''} key={item.id} onClick={() => { setMissionId(item.id); setMissionPickerOpen(false); }}><span>#{String(item.number).padStart(2, '0')}</span><strong>{item.name}</strong></button>)}</div>}{mission && <button type="button" className="match-text-button" onClick={() => setShowMissionDetails((current) => !current)}>{showMissionDetails ? 'Ocultar carta da missão' : 'Ver carta da missão'}</button>}{showMissionDetails && mission && <div className="match-card-copy">{contentBlocks(mission.content_markdown)}</div>}<div className="match-action-row"><button type="button" className="match-secondary-button" onClick={() => setStep(2)}>Voltar</button><button type="button" className="match-launch-button" disabled={!mission} onClick={() => setStep(4)}>Criar lobby <span aria-hidden="true">→</span></button></div>{!mission && <p className="match-validation">Selecione a missão principal para criar o lobby.</p>}</section>}
    {step === 4 && <><section className="match-live-header"><div><p className="eyebrow">LOBBY CRIADO</p><h3>{mission?.name ?? 'Partida pronta'}</h3><p>{mode === '1v1' ? '1 × 1' : '2 × 2'} · aguardando {totalPlayers - 1} jogador{totalPlayers - 1 === 1 ? '' : 'es'}</p></div><button type="button" className="match-secondary-button" onClick={() => setStep(3)}>Editar lobby</button></section><section className="match-mission-live"><div><p className="eyebrow">MISSÃO PRINCIPAL</p><h3>{mission?.name}</h3><p>{mission?.source.name_en}</p></div>{mission && <button type="button" className="match-text-button" onClick={() => setShowMissionDetails((current) => !current)}>{showMissionDetails ? 'Ocultar carta' : 'Abrir carta da missão'}</button>}{showMissionDetails && mission && <div className="match-card-copy">{contentBlocks(mission.content_markdown)}</div>}</section><div className="match-player-grid match-live-grid"><article className="match-player-live"><div className="match-player-heading"><strong>Você</strong><span>{team.short} · {team.name}</span></div><div className="match-team-badge"><b>{team.short}</b><div><strong>{team.name}</strong><span>{team.faction}</span></div></div>{!revealed ? <div className="match-hidden-tac"><span>TAC OP OCULTA</span><strong>Revele quando a carta mandar</strong><button type="button" className="match-reveal-button" onClick={() => setRevealed(true)}>Revelar Tac Op</button></div> : tacOp && <div className="match-revealed-tac"><div className="match-revealed-label"><span>TAC OP REVELADA</span><strong>{tacOp.archetype}</strong></div><h4>{tacOp.name}</h4><p className="original-name">{tacOp.source.name_en}</p><div className="match-card-copy">{contentBlocks(tacOp.content_markdown)}</div></div>}</article>{Array.from({ length: totalPlayers - 1 }, (_, index) => <article className="match-waiting-slot" key={index}><span>{index + 2}</span><strong>Aguardando jogador</strong><p>O jogador entra com o próprio Kill Team e sua Tac Op oculta.</p></article>)}</div><aside className="match-manual-note"><p className="eyebrow">RASTREAMENTO MANUAL</p><p>Use a mesa ou papel para marcar pontos, ferimentos, ativações, CP e outros estados da partida. Esta tela fica concentrada apenas na missão, nos times e na revelação das Tac Ops.</p></aside></>}
  </section>;
}

function RulesHub({ section, onSectionChange }: { section: 'weapons' | 'movement' | 'fight' | 'orders'; onSectionChange: (section: 'weapons' | 'movement' | 'fight' | 'orders') => void }) {
  return <section className="rules-hub">
    <div className="guide-intro"><p className="eyebrow">CONSULTA DE REGRAS</p><h2>Regras</h2><p>Escolha uma categoria para consultar as regras traduzidas durante a partida.</p></div>
    <nav className="guide-switcher rules-switcher" aria-label="Categorias de regras">
      <button className={section === 'weapons' ? 'active' : ''} onClick={() => onSectionChange('weapons')}>Regras de Armas</button>
      <button className={section === 'movement' ? 'active' : ''} onClick={() => onSectionChange('movement')}>Regras de Movimento</button>
      <button className={section === 'fight' ? 'active' : ''} onClick={() => onSectionChange('fight')}>Regras de Lutar e Retaliar</button>
      <button className={section === 'orders' ? 'active' : ''} onClick={() => onSectionChange('orders')}>Conceal, Engage e Cobertura</button>
    </nav>
    {section === 'weapons' ? <WeaponRulesGuide /> : section === 'movement' ? <MovementRulesGuide /> : section === 'fight' ? <FightRulesGuide /> : <OrdersVisibilityGuide />}
  </section>;
}

export default function Home() {
  const [pack, setPack] = useState<Pack | null>(null);
  const [workspaceMode, setWorkspaceMode] = useState<WorkspaceMode>('missions');
  const [ruleSection, setRuleSection] = useState<'weapons' | 'movement' | 'fight' | 'orders'>('weapons');
  const [activeTab, setActiveTab] = useState<Tab>('selection');
  const [guideSection, setGuideSection] = useState<GuideSection>('selection');
  const [filter, setFilter] = useState<(typeof archetypes)[number]>('Todas');
  const [missionTeamFilter, setMissionTeamFilter] = useState('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedMissionId, setSelectedMissionId] = useState<string | null>(null);
  const [selectedTacOpId, setSelectedTacOpId] = useState<string | null>(null);
  const [online, setOnline] = useState(true);

  useEffect(() => {
    fetch('data/approved-ops-2025-pt-BR.json').then((response) => response.json()).then((data: Pack) => {
      setPack(data); setSelectedId(data.cards.find((card) => card.kind === 'crit_op')?.id ?? null);
      setSelectedMissionId(localStorage.getItem('kill-team-ops-selected-mission'));
      setSelectedTacOpId(localStorage.getItem('kill-team-ops-selected-tac-op'));
    });
    setOnline(navigator.onLine);
    const updateConnection = () => setOnline(navigator.onLine);
    addEventListener('online', updateConnection); addEventListener('offline', updateConnection);
    if ('serviceWorker' in navigator) {
      const isLocalDevelopment = location.hostname === 'localhost' || location.hostname === '127.0.0.1';
      if (isLocalDevelopment) navigator.serviceWorker.getRegistrations().then((registrations) => registrations.forEach((registration) => registration.unregister()));
      else navigator.serviceWorker.register('sw.js');
    }
    return () => { removeEventListener('online', updateConnection); removeEventListener('offline', updateConnection); };
  }, []);

  const isCardsTab = activeTab === 'missions' || activeTab === 'tacops';
  const selectedTeamArchetypes = missionTeamFilter === 'all' ? archetypes.slice(1) : killTeamArchetypes[missionTeamFilter] ?? [];
  const availableArchetypeOptions = ['Todas', ...selectedTeamArchetypes] as const;
  const visibleCards = useMemo(() => {
    if (!pack || !isCardsTab) return [];
    const kind = activeTab === 'missions' ? 'crit_op' : 'tac_op';
    return pack.cards.filter((card) => card.kind === kind && (filter === 'Todas' || card.archetype === filter) && (activeTab !== 'tacops' || missionTeamFilter === 'all' || selectedTeamArchetypes.includes(card.archetype as (typeof archetypes)[number])));
  }, [activeTab, filter, isCardsTab, missionTeamFilter, pack, selectedTeamArchetypes]);
  const selected = visibleCards.find((card) => card.id === selectedId) ?? visibleCards[0] ?? null;
  const selectedMission = pack?.cards.find((card) => card.id === selectedMissionId) ?? null;
  const selectedTacOp = pack?.cards.find((card) => card.id === selectedTacOpId) ?? null;

  function switchTab(tab: Tab) {
    setActiveTab(tab); setFilter('Todas');
    if (tab === 'selection') setGuideSection('selection');
    if (tab === 'missions' || tab === 'tacops') setSelectedId(pack?.cards.find((card) => card.kind === (tab === 'missions' ? 'crit_op' : 'tac_op'))?.id ?? null);
  }
  function chooseFilter(nextFilter: (typeof archetypes)[number]) {
    setFilter(nextFilter);
    setSelectedId(pack?.cards.find((card) => card.kind === 'tac_op' && (nextFilter === 'Todas' || card.archetype === nextFilter))?.id ?? null);
  }
  function chooseMissionTeam(teamId: string) {
    setMissionTeamFilter(teamId);
    setFilter('Todas');
    const available = teamId === 'all' ? null : killTeamArchetypes[teamId];
    setSelectedId(pack?.cards.find((card) => card.kind === 'tac_op' && (!available || available.includes(card.archetype as (typeof archetypes)[number])))?.id ?? null);
  }
  function selectForMatch(card: Card) {
    if (card.kind === 'crit_op') { setSelectedMissionId(card.id); localStorage.setItem('kill-team-ops-selected-mission', card.id); }
    else { setSelectedTacOpId(card.id); localStorage.setItem('kill-team-ops-selected-tac-op', card.id); }
  }
  function clearMatchSelection(kind: 'mission' | 'tacop') {
    if (kind === 'mission') { setSelectedMissionId(null); localStorage.removeItem('kill-team-ops-selected-mission'); }
    else { setSelectedTacOpId(null); localStorage.removeItem('kill-team-ops-selected-tac-op'); }
  }

  return <main>
    <header className="masthead"><div className="brand-mark" aria-hidden="true">KT</div><div><p className="eyebrow">COMPANHEIRO DE JOGO</p><h1>Kill Team Ops</h1></div><div className={`connection ${online ? 'connection-online' : 'connection-offline'}`}><span aria-hidden="true" />{online ? 'Pronto para offline' : 'Modo offline'}</div></header>
    <div className="shell">
      <section className="intro"><div className="intro-label-row"><p className="eyebrow">APPROVED OPS 2025</p><div className="primary-switcher" role="tablist" aria-label="Área do aplicativo"><button className={workspaceMode === 'missions' ? 'active' : ''} onClick={() => setWorkspaceMode('missions')} role="tab" aria-selected={workspaceMode === 'missions'}>Missões</button><button className={workspaceMode === 'rules' ? 'active' : ''} onClick={() => setWorkspaceMode('rules')} role="tab" aria-selected={workspaceMode === 'rules'}>Regras</button><button className={workspaceMode === 'teams' ? 'active' : ''} onClick={() => setWorkspaceMode('teams')} role="tab" aria-selected={workspaceMode === 'teams'}>Kill Teams</button><button className={workspaceMode === 'match' ? 'active' : ''} onClick={() => setWorkspaceMode('match')} role="tab" aria-selected={workspaceMode === 'match'}>Partida</button></div></div><h2>{workspaceMode === 'missions' ? 'Missões na mesa, em português.' : workspaceMode === 'rules' ? 'Regras na mesa, em português.' : workspaceMode === 'teams' ? 'Seu Kill Team, em português.' : 'Prepare a partida em português.'}</h2><p>Regras e objetivos organizados para consulta rápida durante a partida.</p></section>
      {workspaceMode === 'missions' ? <div className="mode-content">
      <nav className="tabs" aria-label="Conteúdo do app">
        <button className={activeTab === 'selection' ? 'active' : ''} onClick={() => switchTab('selection')}>Guia de Missões</button>
        <button className={activeTab === 'missions' ? 'active' : ''} onClick={() => switchTab('missions')}>Missões da partida <span>9</span></button>
        <button className={activeTab === 'tacops' ? 'active' : ''} onClick={() => switchTab('tacops')}>Tac Ops <span>12</span></button>
        <button className={activeTab === 'selected' ? 'active' : ''} onClick={() => switchTab('selected')}>Missões Selecionadas</button>
      </nav>
      {activeTab === 'selection' && <>
        <nav className="guide-switcher" aria-label="Seções do Guia de Missões">
          <button className={guideSection === 'selection' ? 'active' : ''} onClick={() => setGuideSection('selection')}>Seleção de Missões</button>
          <button className={guideSection === 'tacops' ? 'active' : ''} onClick={() => setGuideSection('tacops')}>Guia de Tac Ops</button>
          <button className={guideSection === 'killops' ? 'active' : ''} onClick={() => setGuideSection('killops')}>Guia de Kill Op</button>
        </nav>
        {guideSection === 'selection' && <MissionSelectionGuide />}
        {guideSection === 'tacops' && <TacOpsGuide />}
        {guideSection === 'killops' && <KillOpsGuide />}
      </>}
      {activeTab === 'selected' && <SelectedMissions mission={selectedMission} tacOp={selectedTacOp} onClearMission={() => clearMatchSelection('mission')} onClearTacOp={() => clearMatchSelection('tacop')} />}
      {activeTab === 'tacops' && <section className="filter-area team-filter-area" aria-label="Filtrar Tac Ops por Kill Team"><div className="team-filter-heading"><p className="eyebrow">KILL TEAM</p><h2>Mostre as Tac Ops disponíveis</h2><p>Selecione seu time para ver apenas os arquétipos que ele pode usar.</p></div><label className="mission-team-select"><span>Selecione o time</span><select value={missionTeamFilter} onChange={(event) => chooseMissionTeam(event.target.value)}><option value="all">Todos os Kill Teams</option>{killTeams.map((team) => <option key={team.id} value={team.id}>{team.name}</option>)}</select></label><div className="filter-chips">{availableArchetypeOptions.map((archetype) => <button className={filter === archetype ? 'selected' : ''} key={archetype} onClick={() => chooseFilter(archetype)}>{archetype}</button>)}</div></section>}
      {isCardsTab && (!pack ? <section className="loading" aria-live="polite">Carregando as operações…</section> : <section className="content-layout"><div className="cards-area"><div className="section-heading"><div><p className="eyebrow">{activeTab === 'missions' ? 'OPERAÇÕES CRÍTICAS' : filter === 'Todas' ? 'TODOS OS ARQUÉTIPOS' : filter.toUpperCase()}</p><h2>{activeTab === 'missions' ? 'Escolha a missão' : 'Escolha sua Tac Op'}</h2></div><p>{visibleCards.length} cartas</p></div><div className="cards-grid">{visibleCards.map((card) => <button className={`mission-card ${selected?.id === card.id ? 'is-selected' : ''}`} key={card.id} onClick={() => setSelectedId(card.id)} aria-pressed={selected?.id === card.id}><span className="card-number">{String(card.number).padStart(2, '0')}</span>{card.archetype && <span className="tag">{card.archetype}</span>}<strong>{card.name}</strong><small>{card.source.name_en}</small><span className="open-card">Ler carta <b aria-hidden="true">→</b></span></button>)}</div></div>{selected && <aside className="detail-card" aria-live="polite"><div className="detail-topline"><span>{selected.kind === 'crit_op' ? 'MISSÃO DA PARTIDA' : selected.archetype}</span><span>#{String(selected.number).padStart(2, '0')}</span></div><h2>{selected.name}</h2><p className="original-name">{selected.source.name_en}</p><div className="rules-copy">{contentBlocks(selected.content_markdown)}</div><button className={`select-match-button ${selected.kind === 'crit_op' ? selectedMissionId === selected.id ? 'is-saved' : '' : selectedTacOpId === selected.id ? 'is-saved' : ''}`} onClick={() => selectForMatch(selected)}>{(selected.kind === 'crit_op' ? selectedMissionId : selectedTacOpId) === selected.id ? 'Selecionada para a partida' : 'Selecionar para a partida'}</button></aside>}</section>)}
      </div> : workspaceMode === 'rules' ? <RulesHub section={ruleSection} onSectionChange={setRuleSection} /> : workspaceMode === 'teams' ? <KillTeamsHub /> : <MatchLobbyFlow pack={pack} selectedMission={selectedMission} selectedTacOp={selectedTacOp} />}
      <footer><span>Tradução de referência para jogo casual.</span><span>Erratas oficiais consideradas até abril de 2026.</span></footer>
    </div>
  </main>;
}
