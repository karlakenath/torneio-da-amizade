document.addEventListener('DOMContentLoaded', () => {
    // --- CONTROLE PRINCIPAL: WIZARD OU TORNEIO ---
    const wizardContainer = document.getElementById('wizard-container');
    const mainContainer = document.getElementById('main-content');
    const storedState = localStorage.getItem('tournamentState_v4');

    // Nenhuma configuração encontrada, iniciar o Wizard.
    if (!storedState) {
        mainContainer.classList.add('hidden');
        wizardContainer.classList.remove('hidden');
        document.getElementById('reset-button').classList.add('hidden'); // Esconde o botão de reset
        Wizard.init();
    } 
    // Configuração encontrada, carregar o Torneio.
    else {
        mainContainer.classList.remove('hidden');
        wizardContainer.classList.add('hidden');
        Tournament.init(JSON.parse(storedState));
    }
});


/* ==========================================================================
   WIZARD DE CONFIGURAÇÃO
   ========================================================================== */
const Wizard = {
    state: {
        currentStep: 1,
        answers: {
            grupos: 2,
            faseGruposTipo: 'round-robin',
            pontosVitoria: 2,
            pontosDerrota: 1,
            classificados: 3,
            primeiroDiretoSemi: true,
            fasesFinais: {
                quartas: false,
                semifinal: true,
                final: true,
                terceiroLugar: true,
            },
            votacao: false,
        }
    },

    init() {
        this.render();
    },

    render() {
        const container = document.getElementById('wizard-container');
        let content = '';

        switch (this.state.currentStep) {
            case 1: content = this.renderStep1(); break;
            case 2: content = this.renderStep2(); break;
            case 3: content = this.renderStep3(); break;
            case 4: content = this.renderStep4(); break;
            case 5: content = this.renderStepFinal(); break;
        }
        container.innerHTML = content;
        this.addEventListeners();
    },

    addEventListeners() {
        const nextButton = document.getElementById('wizard-next');
        const backButton = document.getElementById('wizard-back');
        const createButton = document.getElementById('wizard-create');

        if (nextButton) nextButton.onclick = () => this.handleNext();
        if (backButton) backButton.onclick = () => this.handleBack();
        if (createButton) createButton.onclick = () => this.handleCreateTournament();
    },

    // --- RENDERIZAÇÃO DAS ETAPAS ---

    renderStep1() {
        return `
            <div class="wizard-header">
                <h2>Criação do Torneio <span style="color: var(--text-color-darker)">(1 de 4)</span></h2>
                <p>Estrutura básica do torneio</p>
            </div>
            <div class="wizard-step">
                <div class="wizard-question">
                    <label for="grupos">Quantos grupos o torneio terá?</label>
                    <div class="wizard-options">
                        <input type="radio" id="g1" name="grupos" value="1" ${this.state.answers.grupos == 1 ? 'checked' : ''}><label for="g1">1 Grupo</label>
                        <input type="radio" id="g2" name="grupos" value="2" ${this.state.answers.grupos == 2 ? 'checked' : ''}><label for="g2">2 Grupos</label>
                        <input type="radio" id="g4" name="grupos" value="4" ${this.state.answers.grupos == 4 ? 'checked' : ''}><label for="g4">4 Grupos</label>
                    </div>
                </div>
                 <div class="wizard-question">
                    <label for="classificados">Quantas equipes se classificam por grupo?</label>
                    <select id="classificados" name="classificados">
                        <option value="2" ${this.state.answers.classificados == 2 ? 'selected' : ''}>2 classificados</option>
                        <option value="3" ${this.state.answers.classificados == 3 ? 'selected' : ''}>3 classificados</option>
                        <option value="4" ${this.state.answers.classificados == 4 ? 'selected' : ''}>4 classificados</option>
                    </select>
                </div>
            </div>
            <div class="wizard-navigation">
                <span></span>
                <button id="wizard-next" class="btn-primary">Próximo &rarr;</button>
            </div>
        `;
    },

    renderStep2() {
        const { semifinal, final, terceiroLugar, quartas } = this.state.answers.fasesFinais;
        return `
            <div class="wizard-header">
                <h2>Criação do Torneio <span style="color: var(--text-color-darker)">(2 de 4)</span></h2>
                <p>Fases Finais e Classificação</p>
            </div>
            <div class="wizard-step">
                <div class="wizard-question">
                    <label>Quais fases o torneio terá?</label>
                    <div class="wizard-options">
                        <input type="checkbox" id="quartas" name="fasesFinais" value="quartas" ${quartas ? 'checked' : ''}><label for="quartas">Quartas de Final</label>
                        <input type="checkbox" id="semifinal" name="fasesFinais" value="semifinal" ${semifinal ? 'checked' : ''}><label for="semifinal">Semifinal</label>
                        <input type="checkbox" id="final" name="fasesFinais" value="final" ${final ? 'checked' : ''}><label for="final">Final</label>
                        <input type="checkbox" id="terceiroLugar" name="fasesFinais" value="terceiroLugar" ${terceiroLugar ? 'checked' : ''}><label for="terceiroLugar">Disputa 3º Lugar</label>
                    </div>
                </div>
                <div class="wizard-question">
                    <label>O 1º colocado de cada grupo avança direto para a semifinal?</label>
                    <p style="font-size:0.9em; color: var(--text-color-darker); margin-top:-10px;">(Requer 2+ classificados por grupo)</p>
                    <div class="wizard-options">
                        <input type="radio" id="diretoSemiSim" name="primeiroDiretoSemi" value="true" ${this.state.answers.primeiroDiretoSemi ? 'checked' : ''} ${this.state.answers.classificados < 2 ? 'disabled' : ''}><label for="diretoSemiSim">Sim</label>
                        <input type="radio" id="diretoSemiNao" name="primeiroDiretoSemi" value="false" ${!this.state.answers.primeiroDiretoSemi ? 'checked' : ''}><label for="diretoSemiNao">Não</label>
                    </div>
                </div>
            </div>
            <div class="wizard-navigation">
                <button id="wizard-back" class="btn-secondary">&larr; Voltar</button>
                <button id="wizard-next" class="btn-primary">Próximo &rarr;</button>
            </div>
        `;
    },
    
    renderStep3() {
        return `
            <div class="wizard-header">
                <h2>Criação do Torneio <span style="color: var(--text-color-darker)">(3 de 4)</span></h2>
                <p>Pontuação da Fase de Grupos</p>
            </div>
            <div class="wizard-step">
                <div class="wizard-question">
                    <label>Pontos por vitória:</label>
                    <div class="wizard-options">
                         <input type="radio" id="v2" name="pontosVitoria" value="2" ${this.state.answers.pontosVitoria == 2 ? 'checked' : ''}><label for="v2">2 pontos (padrão vôlei)</label>
                         <input type="radio" id="v3" name="pontosVitoria" value="3" ${this.state.answers.pontosVitoria == 3 ? 'checked' : ''}><label for="v3">3 pontos (padrão futebol)</label>
                    </div>
                </div>
                 <div class="wizard-question">
                    <label>Pontos por derrota:</label>
                    <div class="wizard-options">
                         <input type="radio" id="d0" name="pontosDerrota" value="0" ${this.state.answers.pontosDerrota == 0 ? 'checked' : ''}><label for="d0">0 pontos</label>
                         <input type="radio" id="d1" name="pontosDerrota" value="1" ${this.state.answers.pontosDerrota == 1 ? 'checked' : ''}><label for="d1">1 ponto (padrão vôlei)</label>
                    </div>
                </div>
            </div>
            <div class="wizard-navigation">
                <button id="wizard-back" class="btn-secondary">&larr; Voltar</button>
                <button id="wizard-next" class="btn-primary">Próximo &rarr;</button>
            </div>
        `;
    },

    renderStep4() {
        return `
            <div class="wizard-header">
                <h2>Criação do Torneio <span style="color: var(--text-color-darker)">(4 de 4)</span></h2>
                <p>Funcionalidades Extras</p>
            </div>
            <div class="wizard-step">
                <div class="wizard-question">
                    <label>Ativar votação de "Craque da Galera"?</label>
                     <div class="wizard-options">
                        <input type="radio" id="votacaoSim" name="votacao" value="true" ${this.state.answers.votacao ? 'checked' : ''}><label for="votacaoSim">Sim</label>
                        <input type="radio" id="votacaoNao" name="votacao" value="false" ${!this.state.answers.votacao ? 'checked' : ''}><label for="votacaoNao">Não</label>
                    </div>
                </div>
            </div>
             <div class="wizard-navigation">
                <button id="wizard-back" class="btn-secondary">&larr; Voltar</button>
                <button id="wizard-next" class="btn-primary">Ver Resumo &rarr;</button>
            </div>
        `;
    },

    renderStepFinal() {
        const {grupos, classificados, primeiroDiretoSemi, fasesFinais, pontosVitoria, pontosDerrota, votacao} = this.state.answers;
        const fasesFinaisFormatado = Object.keys(fasesFinais).filter(f => fasesFinais[f]).map(f => f.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())).join(', ') || 'Nenhuma';

        return `
            <div class="wizard-header">
                <h2>Resumo da Configuração</h2>
                <p>Confira os detalhes e crie seu torneio!</p>
            </div>
            <div class="wizard-step wizard-summary">
                <ul>
                    <li><strong>Grupos:</strong> ${grupos}</li>
                    <li><strong>Classificados por Grupo:</strong> ${classificados}</li>
                    <li><strong>1º Avança direto para Semi:</strong> ${this.state.answers.classificados < 2 ? 'Não aplicável' : (primeiroDiretoSemi ? 'Sim' : 'Não')}</li>
                    <li><strong>Fases Finais:</strong> ${fasesFinaisFormatado}</li>
                    <li><strong>Pontuação (Vitória/Derrota):</strong> ${pontosVitoria} / ${pontosDerrota}</li>
                    <li><strong>Votação Ativa:</strong> ${votacao ? 'Sim' : 'Não'}</li>
                </ul>
                <p style="text-align:center; color: var(--text-color-darker); margin-top: 20px;">Ao criar o torneio, esta configuração será definitiva.</p>
            </div>
            <div class="wizard-navigation">
                <button id="wizard-back" class="btn-secondary">&larr; Voltar</button>
                <button id="wizard-create" class="btn-primary">✨ Criar Torneio ✨</button>
            </div>
        `;
    },
    
    // --- LÓGICA DE NAVEGAÇÃO E COLETA DE DADOS ---

    handleNext() {
        if (!this.saveStepData()) return; // Não avança se a validação falhar
        if (this.state.currentStep < 5) {
            this.state.currentStep++;
            this.render();
        }
    },

    handleBack() {
        this.saveStepData(true); // Salva sem validar ao voltar
        if (this.state.currentStep > 1) {
            this.state.currentStep--;
            this.render();
        }
    },
    
    saveStepData(isNavigatingBack = false) {
        try {
            switch(this.state.currentStep) {
                case 1:
                    this.state.answers.grupos = parseInt(document.querySelector('input[name="grupos"]:checked').value);
                    this.state.answers.classificados = parseInt(document.querySelector('#classificados').value);
                    if (this.state.answers.classificados < 2) this.state.answers.primeiroDiretoSemi = false;
                    break;
                case 2:
                    document.querySelectorAll('input[name="fasesFinais"]').forEach(el => {
                        this.state.answers.fasesFinais[el.value] = el.checked;
                    });
                    this.state.answers.primeiroDiretoSemi = document.querySelector('input[name="primeiroDiretoSemi"]:checked').value === 'true';
                    break;
                case 3:
                     this.state.answers.pontosVitoria = parseInt(document.querySelector('input[name="pontosVitoria"]:checked').value);
                     this.state.answers.pontosDerrota = parseInt(document.querySelector('input[name="pontosDerrota"]:checked').value);
                    break;
                case 4:
                    this.state.answers.votacao = document.querySelector('input[name="votacao"]:checked').value === 'true';
                    break;
            }
            return true;
        } catch (error) {
            if (!isNavigatingBack) alert('Por favor, preencha todas as opções antes de avançar.');
            return isNavigatingBack; // Permite voltar mesmo com erro
        }
    },

    handleCreateTournament() {
        const configTorneio = this.generateConfig();
        if (!configTorneio) return; // Se a geração da config falhar

        const initialState = {
            config: configTorneio,
            teams: [],
            groupStageGames: [],
            playoffMatches: {},
            teamsLocked: false,
            playoffsGenerated: false,
        };
        localStorage.setItem('tournamentState_v4', JSON.stringify(initialState));
        location.reload();
    },

    generateConfig() {
        const { grupos, classificados, primeiroDiretoSemi, fasesFinais, pontosVitoria, pontosDerrota, votacao } = this.state.answers;
        let config = {
            grupos: grupos,
            equipesPorGrupo: "dinamico",
            faseGrupos: { tipo: "round-robin", vitoria: pontosVitoria, derrota: pontosDerrota },
            classificacao: { regras: [], cruzamentos: {} },
            fasesFinais: fasesFinais,
            pontuacao: { quartas: 18, semifinal: 21, final: 21, "pre-semifinal": 18, "terceiro-lugar": 18 },
            votacao: { ativa: votacao, tipo: "craque-da-galera" },
            premiosIndividuais: false,
        };

        // Lógica de Geração de Cruzamentos
        // Formato Padrão: 2 grupos, 3 classificados, 1º na semi
        if (grupos === 2 && classificados === 3 && primeiroDiretoSemi) {
            config.fasesFinais['pre-semifinal'] = true;
            config.classificacao.cruzamentos = {
              "pre-semifinal": [
                { id: "psf1", nome: "Pré-Semi 1", jogo: ["2A", "3B"] },
                { id: "psf2", nome: "Pré-Semi 2", jogo: ["2B", "3A"] },
              ],
              semifinal: [
                { id: "sf1", nome: "Semi 1", jogo: ["1A", "vencedor_psf2"] },
                { id: "sf2", nome: "Semi 2", jogo: ["1B", "vencedor_psf1"] },
              ],
               final: [{ id: "final", nome: "Final", jogo: ["vencedor_sf1", "vencedor_sf2"] }],
               "terceiro-lugar": [{ id: "terceiro", nome: "Disputa 3º Lugar", jogo: ["perdedor_sf1", "perdedor_sf2"]}]
            };
        } 
        // Formato: 1 grupo, 4 classificados -> Semifinais diretas
        else if (grupos === 1 && classificados === 4) {
             config.fasesFinais.semifinal = true;
             config.classificacao.cruzamentos = {
                semifinal: [
                    { id: "sf1", nome: "Semi 1", jogo: ["1A", "4A"] },
                    { id: "sf2", nome: "Semi 2", jogo: ["2A", "3A"] },
                ],
                final: [{ id: "final", nome: "Final", jogo: ["vencedor_sf1", "vencedor_sf2"] }],
                "terceiro-lugar": [{ id: "terceiro", nome: "Disputa 3º Lugar", jogo: ["perdedor_sf1", "perdedor_sf2"]}]
             };
        }
        // Formato: 2 grupos, 2 classificados -> Quartas/Semi diretas
        else if (grupos === 2 && classificados === 2) {
            config.fasesFinais.quartas = false; // Garante que não haja quartas
            config.fasesFinais.semifinal = true;
            config.classificacao.cruzamentos = {
                semifinal: [
                    {id: 'sf1', nome: 'Semi 1', jogo: ['1A', '2B']},
                    {id: 'sf2', nome: 'Semi 2', jogo: ['1B', '2A']},
                ],
                final: [{ id: "final", nome: "Final", jogo: ["vencedor_sf1", "vencedor_sf2"] }],
                "terceiro-lugar": [{ id: "terceiro", nome: "Disputa 3º Lugar", jogo: ["perdedor_sf1", "perdedor_sf2"]}]
            };
        }
         // Formato: 4 grupos, 2 classificados -> Quartas de final
        else if (grupos === 4 && classificados === 2) {
            config.fasesFinais.quartas = true;
            config.fasesFinais.semifinal = true;
            config.classificacao.cruzamentos = {
                quartas: [
                    {id: 'qf1', nome: 'Quartas 1', jogo: ['1A', '2B']},
                    {id: 'qf2', nome: 'Quartas 2', jogo: ['1C', '2D']},
                    {id: 'qf3', nome: 'Quartas 3', jogo: ['1B', '2A']},
                    {id: 'qf4', nome: 'Quartas 4', jogo: ['1D', '2C']},
                ],
                semifinal: [
                    {id: 'sf1', nome: 'Semi 1', jogo: ['vencedor_qf1', 'vencedor_qf2']},
                    {id: 'sf2', nome: 'Semi 2', jogo: ['vencedor_qf3', 'vencedor_qf4']},
                ],
                final: [{ id: "final", nome: "Final", jogo: ["vencedor_sf1", "vencedor_sf2"] }],
                "terceiro-lugar": [{ id: "terceiro", nome: "Disputa 3º Lugar", jogo: ["perdedor_sf1", "perdedor_sf2"]}]
            };
        }
        else {
            alert('A combinação de grupos e classificados escolhida não possui um formato de mata-mata pré-definido. Por favor, ajuste as opções.');
            return null; // Retorna nulo para indicar falha
        }
        return config;
    }
};

/* ==========================================================================
   LÓGICA DO TORNEIO (ADAPTADA)
   ========================================================================== */
const Tournament = {
    state: {},
    config: {},

    init(storedState) {
        this.state = storedState;
        this.config = storedState.config;
        this.addEventListeners();
        this.render();
    },

    saveState() {
        localStorage.setItem('tournamentState_v4', JSON.stringify(this.state));
    },

    saveAndRender() {
        this.saveState();
        this.render();
    },

    getTeamById(id) {
        return this.state.teams.find(t => t.id === id);
    },

    // --- LÓGICA PRINCIPAL ---
    addTeam(name, color, group) {
        if (!name.trim()) { alert("O nome da equipe não pode ser vazio."); return; }
        if (this.state.teams.some(t => t.name.toLowerCase() === name.toLowerCase())) { alert(`A equipe "${name}" já existe.`); return; }
        this.state.teams.push({ id: self.crypto.randomUUID(), name, color, group, p: 0, v: 0, d: 0, pm: 0, ps: 0, saldo: 0 });
        this.saveAndRender();
    },

    deleteTeam(teamId) {
        this.state.teams = this.state.teams.filter(t => t.id !== teamId);
        this.saveAndRender();
    },

    generateGroupStageGames() {
        const GROUP_NAMES = Array.from({ length: this.config.grupos }, (_, i) => String.fromCharCode(65 + i));
        const minTeams = 2;
        const hasEnoughTeams = GROUP_NAMES.every(g => this.state.teams.filter(t => t.group === g).length >= minTeams);
        if (!hasEnoughTeams) {
            alert(`É necessário ter pelo menos ${minTeams} equipes em cada grupo para gerar os jogos.`);
            return;
        }
        if (!confirm("Tem certeza? Os times serão bloqueados e os jogos da fase de grupos serão gerados.")) return;

        this.state.teamsLocked = true;
        this.state.groupStageGames = GROUP_NAMES.flatMap(group => 
            this.generateBalancedGroupGames(this.state.teams.filter(t => t.group === group), group)
        );
        this.saveAndRender();
    },
    
    generateBalancedGroupGames(teams, group) {
        const allGames = [];
        const teamIds = teams.map(t => t.id);
        for (let i = 0; i < teamIds.length; i++) {
            for (let j = i + 1; j < teamIds.length; j++) {
                allGames.push({ id: self.crypto.randomUUID(), t1: teamIds[i], t2: teamIds[j], s1: null, s2: null, group });
            }
        }
        if (allGames.length === 0) return [];
        let availableGames = [...allGames];
        const orderedGames = [availableGames.shift()];
        while (availableGames.length > 0) {
            const lastGame = orderedGames[orderedGames.length - 1];
            const teamsToAvoid = new Set([lastGame.t1, lastGame.t2]);
            let nextGameIndex = availableGames.findIndex(g => !teamsToAvoid.has(g.t1) && !teamsToAvoid.has(g.t2));
            if (nextGameIndex === -1) nextGameIndex = 0;
            orderedGames.push(availableGames.splice(nextGameIndex, 1)[0]);
        }
        return orderedGames;
    },

    addMatchResult(gameId, s1, s2, elementToFlash) {
        const game = this.state.groupStageGames.find(g => g.id === gameId);
        if (game) {
            game.s1 = s1; game.s2 = s2;
        } else if (this.state.playoffMatches[gameId]) {
            const match = this.state.playoffMatches[gameId];
            match.scores = [s1, s2];
            match.winner = s1 > s2 ? match.teams[0] : match.teams[1];
            this.updateExistingPlayoffs();
        }

        if (elementToFlash) {
            elementToFlash.classList.add('score-saved');
            setTimeout(() => elementToFlash.classList.remove('score-saved'), 400);
        }

        this.recalculateTeamStats();
        if (this.state.groupStageGames.every(g => g.s1 !== null) && !this.state.playoffsGenerated) {
            this.generatePlayoffs();
        }
        this.saveAndRender();
    },

    recalculateTeamStats() {
        this.state.teams.forEach(t => { t.p = 0; t.v = 0; t.d = 0; t.pm = 0; t.ps = 0; t.saldo = 0; });
        this.state.groupStageGames.forEach(g => {
            if (g.s1 === null) return;
            const t1 = this.getTeamById(g.t1);
            const t2 = this.getTeamById(g.t2);
            t1.pm += g.s1; t1.ps += g.s2;
            t2.pm += g.s2; t2.ps += g.s1;
            if (g.s1 > g.s2) { t1.v++; t2.d++; t1.p += this.config.faseGrupos.vitoria; t2.p += this.config.faseGrupos.derrota; } 
            else { t2.v++; t1.d++; t2.p += this.config.faseGrupos.vitoria; t1.p += this.config.faseGrupos.derrota; }
        });
        this.state.teams.forEach(t => t.saldo = t.pm - t.ps);
    },

    generatePlayoffs() {
        if (this.state.playoffsGenerated) { this.updateExistingPlayoffs(); return; }
        
        const GROUP_NAMES = Array.from({ length: this.config.grupos }, (_, i) => String.fromCharCode(65 + i));
        const rankedGroups = {};
        GROUP_NAMES.forEach(g => {
            rankedGroups[g] = this.state.teams.filter(t => t.group === g).sort(this.sortTeams);
        });

        const newPlayoffMatches = {};
        const phases = Object.keys(this.config.fasesFinais).filter(p => this.config.fasesFinais[p]);

        phases.forEach(phase => {
            const cruzamentos = this.config.classificacao.cruzamentos[phase];
            if (!cruzamentos) return;
            
            cruzamentos.forEach(matchConfig => {
                const teams = matchConfig.jogo.map(placeholder => {
                    if (placeholder.startsWith("vencedor_") || placeholder.startsWith("perdedor_")) return null;
                    const group = placeholder.slice(-1);
                    const pos = parseInt(placeholder.slice(0, -1)) - 1;
                    return rankedGroups[group]?.[pos]?.id || null;
                });
                newPlayoffMatches[matchConfig.id] = { ...matchConfig, teams, phase };
            });
        });
        
        this.state.playoffMatches = newPlayoffMatches;
        this.state.playoffsGenerated = true;
        this.updateExistingPlayoffs();
    },

    updateExistingPlayoffs() {
        Object.values(this.state.playoffMatches).forEach(match => {
            if (match.teams.every(t => t !== null)) return;
            const newTeams = match.teams.map((teamId, index) => {
                if (teamId !== null) return teamId;
                const placeholder = match.jogo[index];
                if (!placeholder) return null;
                const [type, sourceMatchId] = placeholder.split('_');
                const sourceMatch = this.state.playoffMatches[sourceMatchId];
                if (sourceMatch?.winner) {
                    if (type === 'vencedor') return sourceMatch.winner;
                    if (type === 'perdedor') return sourceMatch.teams.find(id => id !== sourceMatch.winner);
                }
                return null;
            });
            match.teams = newTeams;
        });
    },

    sortTeams: (a, b) => b.v - a.v || (b.saldo - a.saldo) || (b.pm - a.pm) || (a.ps - b.ps) || 0,

    // --- FUNÇÕES DE RENDERIZAÇÃO E COMPONENTES ---
    render() {
        this.renderTeamManagementAndTables();
        this.renderGroupStageGames();
        this.renderBracket();
        this.renderPodium();
        this.updateUIMode();
    },

    renderTeamManagementAndTables() {
        const container = document.getElementById('groups-section-content');
        const GROUP_NAMES = Array.from({ length: this.config.grupos }, (_, i) => String.fromCharCode(65 + i));
        container.innerHTML = GROUP_NAMES.map(group => this.CardFase(group)).join('');
        container.className = `groups-layout-${GROUP_NAMES.length > 2 ? 'grid' : GROUP_NAMES.length}`;
        
        GROUP_NAMES.forEach(group => {
            const teams = this.state.teams.filter(t => t.group === group).sort(this.sortTeams);
            const tableBody = document.querySelector(`#table-group-${group.toLowerCase()} tbody`);
            if (tableBody) {
                tableBody.innerHTML = teams.map((t, i) => {
                        const rank = i < 3 ? ['gold', 'silver', 'bronze'][i] : null;
                        return `<tr><td><span class="rank-badge ${rank || ''}">${i + 1}º</span></td><td><span class="team-color-badge" style="background-color:${t.color};"></span><span class="team-name">${t.name}</span></td><td>${t.p}</td><td>${t.v}</td><td>${t.d}</td><td>${t.pm}</td><td>${t.ps}</td><td>${t.saldo}</td></tr>`;
                }).join('');
            }
        });
    },

    renderGroupStageGames() {
        const container = document.getElementById('group-games-display-content');
        const GROUP_NAMES = Array.from({ length: this.config.grupos }, (_, i) => String.fromCharCode(65 + i));
        container.innerHTML = GROUP_NAMES.map(group => `
            <div id="group-${group.toLowerCase()}-games">
                <h3>GRUPO ${group}</h3>
                <ul>${this.state.groupStageGames.filter(g => g.group === group).map(g => `<li>${this.CardJogo(g)}</li>`).join('')}</ul>
            </div>
        `).join('');
    },

    renderBracket() {
        const container = document.getElementById('bracket-container');
        container.innerHTML = '';
        const matchesByPhase = Object.values(this.state.playoffMatches).reduce((acc, match) => {
            (acc[match.phase] = acc[match.phase] || []).push(match);
            return acc;
        }, {});
        
        const bracketLayout = { row1: ['pre-semifinal', 'quartas', 'semifinal'], row2: ['terceiro-lugar', 'final'] };

        Object.values(bracketLayout).forEach(rowPhases => {
            const rowEl = document.createElement('div');
            rowEl.className = 'bracket-row';
            let rowHasContent = false;
            rowPhases.forEach(phaseKey => {
                if (this.config.fasesFinais[phaseKey] && matchesByPhase[phaseKey]) {
                    rowHasContent = true;
                    const roundEl = document.createElement('div');
                    roundEl.className = 'round';
                    roundEl.id = phaseKey;
                    roundEl.innerHTML = `
                        <div class="round-title">${matchesByPhase[phaseKey][0]?.nome.replace(/\s\d+$/, '') || phaseKey}</div>
                        ${matchesByPhase[phaseKey].map(match => `<div class="match-wrapper" id="${match.id}-wrapper">${this.CardJogo(match)}</div>`).join('')}
                    `;
                    rowEl.appendChild(roundEl);
                }
            });
            if(rowHasContent) container.appendChild(rowEl);
        });
    },

    renderPodium() {
        const finalMatch = this.state.playoffMatches['final'];
        const thirdPlaceMatch = this.state.playoffMatches['terceiro'];
        const podiumSection = document.getElementById('podium-section');

        if (finalMatch?.winner && thirdPlaceMatch?.winner) {
            podiumSection.classList.remove('hidden');
            const winner = this.getTeamById(finalMatch.winner);
            const runnerUp = this.getTeamById(finalMatch.teams.find(id => id !== finalMatch.winner));
            const thirdPlace = this.getTeamById(thirdPlaceMatch.winner);
            this.CardPodio(winner, runnerUp, thirdPlace);
        } else {
            podiumSection.classList.add('hidden');
        }
    },

    updateUIMode() {
        document.querySelectorAll('.team-management-controls').forEach(el => el.classList.toggle('hidden', this.state.teamsLocked));
        document.getElementById('generate-games-container').classList.toggle('hidden', this.state.teamsLocked);
        document.getElementById('group-games-section').classList.toggle('hidden', !this.state.teamsLocked);
        document.getElementById('playoffs').classList.toggle('hidden', !this.state.playoffsGenerated);
        document.getElementById('votacao-section').classList.toggle('hidden', !this.config.votacao.ativa);
    },

    CardFase(groupName) {
        const teams = this.state.teams.filter(t => t.group === groupName);
        return `
            <div class="group-container" id="group-${groupName}-container">
                <h3>GRUPO ${groupName}</h3>
                <div class="team-management-controls">
                    <ul class="team-management-list" id="team-list-${groupName.toLowerCase()}">
                        ${teams.map(t => this.CardEquipe(t)).join('')}
                    </ul>
                    <form class="add-team-form" data-group="${groupName}">
                        <input type="text" placeholder="Nome da Equipe" required>
                        <input type="color" value="#${Math.floor(Math.random()*16777215).toString(16).padStart(6, '0')}">
                        <button type="submit">Adicionar</button>
                    </form>
                </div>
                <table id="table-group-${groupName.toLowerCase()}">
                    <thead><tr><th>Pos</th><th>Equipe</th><th>P</th><th>V</th><th>D</th><th>PM</th><th>PS</th><th>Saldo</th></tr></thead>
                    <tbody></tbody>
                </table>
            </div>
        `;
    },

    CardEquipe(team) {
        return `
            <li class="team-list-item">
                <span class="team-list-name"><span class="team-color-badge" style="background-color:${team.color};"></span>${team.name}</span>
                <button class="delete-team-btn" data-team-id="${team.id}">X</button>
            </li>`;
    },

    CardJogo(game) {
        const t1 = this.getTeamById(game.teams?.[0]);
        const t2 = this.getTeamById(game.teams?.[1]);
        const s1 = game.scores?.[0];
        const s2 = game.scores?.[1];

        const teamInfo = (team, side) => !team ? `<span class="placeholder-team ${side}">Aguardando...</span>` : `
            <span class="team-info team-${side}">
                ${side === 'left' ? `<span class="team-color-badge" style="background-color:${team.color};"></span>` : ''}
                <span class="team-name">${team.name}</span>
                ${side === 'right' ? `<span class="team-color-badge" style="background-color:${team.color};"></span>` : ''}
            </span>`;

        if (!t1 || !t2) return `<div class="match-card waiting">${teamInfo(t1, 'left')}<span class="score-info">vs</span>${teamInfo(t2, 'right')}</div>`;

        if (s1 !== null && s1 !== undefined) {
            const winnerClass = s1 > s2 ? 'winner-left' : 'winner-right';
            return `<div class="match-card final-score ${winnerClass}">
                        ${teamInfo(t1, 'left')}
                        <span class="score-info"><span class="score-value">${s1}</span><span class="score-separator">x</span><span class="score-value">${s2}</span></span>
                        ${teamInfo(t2, 'right')}
                    </div>`;
        }
        
        return `<form class="match-card inline-result-form" data-game-id="${game.id}">
                    ${teamInfo(t1, 'left')}
                    <span class="score-info-form">
                        <input type="number" name="s1" placeholder="0" required min="0" value="">
                        <span class="score-separator">x</span>
                        <input type="number" name="s2" placeholder="0" required min="0" value="">
                    </span>
                    ${teamInfo(t2, 'right')}
                    <button type="submit">✔️</button>
                </form>`;
    },

    CardPodio(winner, runnerUp, thirdPlace) {
        const renderTeamHTML = (team) => `<span class="team-color-badge" style="background-color:${team.color};"></span><span class="team-name">${team.name}</span>`;
        document.querySelector('#podium-1st .podium-team').innerHTML = renderTeamHTML(winner);
        document.querySelector('#podium-2nd .podium-team').innerHTML = renderTeamHTML(runnerUp);
        document.querySelector('#podium-3rd .podium-team').innerHTML = renderTeamHTML(thirdPlace);
    },

    // --- EVENT LISTENERS ---
    addEventListeners() {
        const mainContent = document.getElementById('main-content');
        
        mainContent.addEventListener('submit', (e) => {
            if (e.target.classList.contains('inline-result-form')) {
                e.preventDefault();
                const form = e.target;
                const gameId = form.dataset.gameId;
                const s1 = parseInt(form.s1.value);
                const s2 = parseInt(form.s2.value);
                if (isNaN(s1) || isNaN(s2)) { alert("Placar inválido."); return; }
                const cardElement = form.closest('li, .match-wrapper');
                this.addMatchResult(gameId, s1, s2, cardElement);
            } else if (e.target.classList.contains('add-team-form')) {
                e.preventDefault();
                this.addTeam(e.target.elements[0].value, e.target.elements[1].value, e.target.dataset.group);
                e.target.reset();
            }
        });

        mainContent.addEventListener('click', (e) => {
            if (e.target.classList.contains('delete-team-btn')) {
                this.deleteTeam(e.target.dataset.teamId);
            }
        });

        document.getElementById('generate-games-button').onclick = () => this.generateGroupStageGames();
        document.getElementById('reset-button').onclick = () => { if (confirm("Tem certeza? TODO o progresso será perdido e o torneio reiniciado.")) { localStorage.removeItem('tournamentState_v4'); location.reload() } };
    }
};