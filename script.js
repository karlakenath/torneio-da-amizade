document.addEventListener('DOMContentLoaded', () => {
    // --- CONTROLE PRINCIPAL: WIZARD OU TORNEIO ---
    const wizardContainer = document.getElementById('wizard-container');
    const mainContainer = document.getElementById('main-content');
    const storedState = localStorage.getItem('tournamentState_v4');

    if (!storedState) {
        mainContainer.classList.add('hidden');
        wizardContainer.classList.remove('hidden');
        document.getElementById('reset-button').classList.add('hidden');
        Wizard.init();
    } else {
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
        }
    },

    init() { this.render(); },

    render() {
        const container = document.getElementById('wizard-container');
        let content = '';
        const totalSteps = 6;

        switch (this.state.currentStep) {
            case 1: content = this.renderStep1(totalSteps); break;
            case 2: content = this.renderStep2(totalSteps); break;
            case 3: content = this.renderStep3(totalSteps); break;
            case 4: content = this.renderStep4(totalSteps); break;
            case 5: content = this.renderStep5(totalSteps); break;
            case 6: content = this.renderStep6(totalSteps); break;
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
    
    renderStep1(totalSteps) {
        return `
            <div class="wizard-header">
                <h2>Criação do Torneio <span style="color: var(--text-color-darker)">(${this.state.currentStep} de ${totalSteps})</span></h2>
                <p>Estrutura básica do torneio</p>
            </div>
            <div class="wizard-step">
                <div class="wizard-question">
                    <label>Quantos grupos o torneio terá?</label>
                    <div class="wizard-options">
                        <input type="radio" id="g1" name="grupos" value="1" ${this.state.answers.grupos == 1 ? 'checked' : ''}><label for="g1">1 Grupo</label>
                        <input type="radio" id="g2" name="grupos" value="2" ${this.state.answers.grupos == 2 ? 'checked' : ''}><label for="g2">2 Grupos</label>
                        <input type="radio" id="g4" name="grupos" value="4" ${this.state.answers.grupos == 4 ? 'checked' : ''}><label for="g4">4 Grupos</label>
                    </div>
                </div>
            </div>
            <div class="wizard-navigation">
                <span></span>
                <button id="wizard-next" class="btn-primary">Próximo &rarr;</button>
            </div>
        `;
    },
    
    renderStep2(totalSteps) {
        return `
            <div class="wizard-header">
                <h2>Criação do Torneio <span style="color: var(--text-color-darker)">(${this.state.currentStep} de ${totalSteps})</span></h2>
                <p>Como será a Fase de Grupos?</p>
            </div>
            <div class="wizard-step">
                <div class="wizard-question">
                    <label>Escolha o formato dos jogos em cada grupo.</label>
                    <div class="wizard-options">
                        <input type="radio" id="frr" name="faseGruposTipo" value="round-robin" ${this.state.answers.faseGruposTipo === 'round-robin' ? 'checked' : ''}>
                        <label for="frr">
                            Todos contra todos
                            <p style="font-size: 0.8em; margin: 5px 0 0; font-family: var(--font-main);">Mais justo, mais jogos.</p>
                        </label>
                        <input type="radio" id="fel" name="faseGruposTipo" value="eliminatoria" ${this.state.answers.faseGruposTipo === 'eliminatoria' ? 'checked' : ''}>
                        <label for="fel">
                            Jogos Eliminatórios
                             <p style="font-size: 0.8em; margin: 5px 0 0; font-family: var(--font-main);">Mais rápido, menos jogos.</p>
                        </label>
                    </div>
                </div>
            </div>
            <div class="wizard-navigation">
                <button id="wizard-back" class="btn-secondary">&larr; Voltar</button>
                <button id="wizard-next" class="btn-primary">Próximo &rarr;</button>
            </div>
        `;
    },

    renderStep3(totalSteps) {
        const isEliminatoria = this.state.answers.faseGruposTipo === 'eliminatoria';
        let warningMessage = '';
        if (isEliminatoria && this.state.answers.classificados > 2) {
            warningMessage = `<p style="color:var(--action-color); text-align:center;">Opções ajustadas para o formato eliminatório.</p>`;
        }

        return `
            <div class="wizard-header">
                <h2>Criação do Torneio <span style="color: var(--text-color-darker)">(${this.state.currentStep} de ${totalSteps})</span></h2>
                <p>Classificação dos Grupos</p>
            </div>
            <div class="wizard-step">
                 <div class="wizard-question">
                    <label for="classificados">Quantas equipes se classificam por grupo?</label>
                    <select id="classificados" name="classificados">
                        ${isEliminatoria ? `
                            <option value="1" ${this.state.answers.classificados == 1 ? 'selected' : ''}>1 classificado</option>
                            <option value="2" ${this.state.answers.classificados == 2 ? 'selected' : ''}>2 classificados</option>
                        ` : `
                            <option value="2" ${this.state.answers.classificados == 2 ? 'selected' : ''}>2 classificados</option>
                            <option value="3" ${this.state.answers.classificados == 3 ? 'selected' : ''}>3 classificados</option>
                            <option value="4" ${this.state.answers.classificados == 4 ? 'selected' : ''}>4 classificados</option>
                        `}
                    </select>
                </div>
                <div class="wizard-question">
                    <label>O 1º colocado de cada grupo avança direto para a semifinal?</label>
                    <p style="font-size:0.9em; color: var(--text-color-darker); margin-top:-10px;">(Válido para 2 grupos, 3 classificados)</p>
                    <div class="wizard-options">
                        <input type="radio" id="diretoSemiSim" name="primeiroDiretoSemi" value="true" ${this.state.answers.primeiroDiretoSemi ? 'checked' : ''} ${isEliminatoria ? 'disabled' : ''}><label for="diretoSemiSim">Sim</label>
                        <input type="radio" id="diretoSemiNao" name="primeiroDiretoSemi" value="false" ${!this.state.answers.primeiroDiretoSemi || isEliminatoria ? 'checked' : ''}><label for="diretoSemiNao">Não</label>
                    </div>
                </div>
                ${warningMessage}
            </div>
            <div class="wizard-navigation">
                <button id="wizard-back" class="btn-secondary">&larr; Voltar</button>
                <button id="wizard-next" class="btn-primary">Próximo &rarr;</button>
            </div>
        `;
    },
    
    renderStep4(totalSteps) {
         const { semifinal, final, terceiroLugar, quartas } = this.state.answers.fasesFinais;
        return `
            <div class="wizard-header">
                <h2>Criação do Torneio <span style="color: var(--text-color-darker)">(${this.state.currentStep} de ${totalSteps})</span></h2>
                <p>Quais Fases Finais o torneio terá?</p>
            </div>
            <div class="wizard-step">
                <div class="wizard-question">
                    <label>Marque as fases que deseja incluir.</label>
                    <div class="wizard-options">
                        <input type="checkbox" id="quartas" name="fasesFinais" value="quartas" ${quartas ? 'checked' : ''}><label for="quartas">Quartas de Final</label>
                        <input type="checkbox" id="semifinal" name="fasesFinais" value="semifinal" ${semifinal ? 'checked' : ''}><label for="semifinal">Semifinal</label>
                        <input type="checkbox" id="final" name="fasesFinais" value="final" ${final ? 'checked' : ''}><label for="final">Final</label>
                        <input type="checkbox" id="terceiroLugar" name="fasesFinais" value="terceiroLugar" ${terceiroLugar ? 'checked' : ''}><label for="terceiroLugar">Disputa 3º Lugar</label>
                    </div>
                </div>
            </div>
            <div class="wizard-navigation">
                <button id="wizard-back" class="btn-secondary">&larr; Voltar</button>
                <button id="wizard-next" class="btn-primary">Próximo &rarr;</button>
            </div>
        `;
    },

    renderStep5(totalSteps) {
        const isEliminatoria = this.state.answers.faseGruposTipo === 'eliminatoria';
        return `
            <div class="wizard-header">
                <h2>Criação do Torneio <span style="color: var(--text-color-darker)">(${this.state.currentStep} de ${totalSteps})</span></h2>
                <p>Pontuação da Fase de Grupos</p>
            </div>
            <div class="wizard-step">
                <div class="wizard-question" ${isEliminatoria ? 'style="opacity:0.5;"' : ''}>
                    <label>Pontos por vitória:</label>
                    <div class="wizard-options">
                         <input type="radio" id="v2" name="pontosVitoria" value="2" ${this.state.answers.pontosVitoria == 2 ? 'checked' : ''} ${isEliminatoria ? 'disabled' : ''}><label for="v2">2 pontos (padrão vôlei)</label>
                         <input type="radio" id="v3" name="pontosVitoria" value="3" ${this.state.answers.pontosVitoria == 3 ? 'checked' : ''} ${isEliminatoria ? 'disabled' : ''}><label for="v3">3 pontos (padrão futebol)</label>
                    </div>
                </div>
                 <div class="wizard-question" ${isEliminatoria ? 'style="opacity:0.5;"' : ''}>
                    <label>Pontos por derrota:</label>
                    <div class="wizard-options">
                         <input type="radio" id="d0" name="pontosDerrota" value="0" ${this.state.answers.pontosDerrota == 0 ? 'checked' : ''} ${isEliminatoria ? 'disabled' : ''}><label for="d0">0 pontos</label>
                         <input type="radio" id="d1" name="pontosDerrota" value="1" ${this.state.answers.pontosDerrota == 1 ? 'checked' : ''} ${isEliminatoria ? 'disabled' : ''}><label for="d1">1 ponto (padrão vôlei)</label>
                    </div>
                     ${isEliminatoria ? '<p style="text-align:center; color: var(--text-color-darker); margin-top:15px;">(Não aplicável para fase de grupos eliminatória)</p>' : ''}
                </div>
            </div>
            <div class="wizard-navigation">
                <button id="wizard-back" class="btn-secondary">&larr; Voltar</button>
                <button id="wizard-next" class="btn-primary">Ver Resumo &rarr;</button>
            </div>
        `;
    },

    renderStep6(totalSteps) {
        const {grupos, faseGruposTipo, classificados, primeiroDiretoSemi, fasesFinais, pontosVitoria, pontosDerrota } = this.state.answers;
        const fasesFinaisFormatado = Object.keys(fasesFinais).filter(f => fasesFinais[f]).map(f => f.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())).join(', ') || 'Nenhuma';
        const isEliminatoria = faseGruposTipo === 'eliminatoria';

        return `
            <div class="wizard-header">
                <h2>Resumo da Configuração <span style="color: var(--text-color-darker)">(${this.state.currentStep} de ${totalSteps})</span></h2>
                <p>Confira os detalhes e crie seu torneio!</p>
            </div>
            <div class="wizard-step wizard-summary">
                <ul>
                    <li><strong>Formato dos Grupos:</strong> ${isEliminatoria ? 'Jogos Eliminatórios' : 'Todos contra Todos'}</li>
                    <li><strong>Grupos:</strong> ${grupos}</li>
                    <li><strong>Classificados por Grupo:</strong> ${classificados}</li>
                    ${!isEliminatoria ? `<li><strong>1º Avança direto para Semi:</strong> ${primeiroDiretoSemi ? 'Sim' : 'Não'}</li>` : ''}
                    <li><strong>Fases Finais:</strong> ${fasesFinaisFormatado}</li>
                    ${!isEliminatoria ? `<li><strong>Pontuação (Vitória/Derrota):</strong> ${pontosVitoria} / ${pontosDerrota}</li>` : ''}
                </ul>
                <p id="wizard-validation-msg" style="text-align:center; color:var(--loss-color); margin-top: 20px;"></p>
            </div>
            <div class="wizard-navigation">
                <button id="wizard-back" class="btn-secondary">&larr; Voltar</button>
                <button id="wizard-create" class="btn-primary">✨ Criar Torneio ✨</button>
            </div>
        `;
    },
    
    handleNext() {
        if (!this.saveStepData()) return;
        if (this.state.currentStep < 6) {
            this.state.currentStep++;
            this.render();
        }
    },

    handleBack() {
        this.saveStepData(true);
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
                    break;
                case 2:
                    this.state.answers.faseGruposTipo = document.querySelector('input[name="faseGruposTipo"]:checked').value;
                    if(this.state.answers.faseGruposTipo === 'eliminatoria') {
                        this.state.answers.classificados = Math.min(this.state.answers.classificados, 2);
                        this.state.answers.primeiroDiretoSemi = false;
                    }
                    break;
                case 3:
                     this.state.answers.classificados = parseInt(document.querySelector('#classificados').value);
                     this.state.answers.primeiroDiretoSemi = document.querySelector('input[name="primeiroDiretoSemi"]:checked').value === 'true';
                    break;
                case 4:
                     document.querySelectorAll('input[name="fasesFinais"]').forEach(el => {
                        this.state.answers.fasesFinais[el.value] = el.checked;
                    });
                    break;
                case 5:
                    if (this.state.answers.faseGruposTipo === 'round-robin') {
                        this.state.answers.pontosVitoria = parseInt(document.querySelector('input[name="pontosVitoria"]:checked').value);
                        this.state.answers.pontosDerrota = parseInt(document.querySelector('input[name="pontosDerrota"]:checked').value);
                    }
                    break;
            }
            return true;
        } catch (error) {
            if (!isNavigatingBack) alert('Por favor, preencha todas as opções antes de avançar.');
            return isNavigatingBack;
        }
    },

    handleCreateTournament() {
        const configTorneio = this.generateConfig();
        if (!configTorneio) {
            const validationMsg = document.getElementById('wizard-validation-msg');
            const createBtn = document.getElementById('wizard-create');
            if (validationMsg) validationMsg.textContent = 'A combinação de opções escolhida não gera um mata-mata válido. Por favor, volte e ajuste as opções.';
            if (createBtn) createBtn.disabled = true;
            return;
        }

        const initialState = {
            config: configTorneio,
            teams: [], groupStageGames: [], playoffMatches: {},
            teamsLocked: false, playoffsGenerated: false,
        };
        localStorage.setItem('tournamentState_v4', JSON.stringify(initialState));
        location.reload();
    },

    generateConfig() {
        const { grupos, faseGruposTipo, classificados, primeiroDiretoSemi, fasesFinais, pontosVitoria, pontosDerrota } = this.state.answers;
        let config = {
            grupos, faseGrupos: { tipo: faseGruposTipo, vitoria: pontosVitoria, derrota: pontosDerrota },
            classificacao: { regras: [], cruzamentos: {} }, fasesFinais,
            pontuacao: { quartas: 18, semifinal: 21, final: 21, "pre-semifinal": 18, "terceiro-lugar": 18 },
            votacao: { ativa: false, tipo: "craque-da-galera" }, premiosIndividuais: false,
        };

        let isValid = false;
        if (grupos === 2 && classificados === 3 && primeiroDiretoSemi && faseGruposTipo === 'round-robin') {
            config.fasesFinais['pre-semifinal'] = true;
            config.classificacao.cruzamentos = {
              "pre-semifinal": [{ id: "psf1", nome: "Pré-Semi 1", jogo: ["2A", "3B"] }, { id: "psf2", nome: "Pré-Semi 2", jogo: ["2B", "3A"] }],
              semifinal: [{ id: "sf1", nome: "Semi 1", jogo: ["1A", "vencedor_psf2"] }, { id: "sf2", nome: "Semi 2", jogo: ["1B", "vencedor_psf1"] }],
            };
            isValid = true;
        } else if (grupos === 1 && classificados >= 4 && faseGruposTipo === 'round-robin') {
             config.fasesFinais.semifinal = true;
             config.classificacao.cruzamentos = { semifinal: [{ id: "sf1", nome: "Semi 1", jogo: ["1A", "4A"] }, { id: "sf2", nome: "Semi 2", jogo: ["2A", "3A"] }] };
             isValid = true;
        } else if (grupos === 2 && classificados === 2) {
            config.fasesFinais.semifinal = true;
            config.classificacao.cruzamentos = { semifinal: [{id: 'sf1', nome: 'Semi 1', jogo: ['1A', '2B']}, {id: 'sf2', nome: 'Semi 2', jogo: ['1B', '2A']}] };
            isValid = true;
        } else if (grupos === 4 && classificados === 2 && faseGruposTipo === 'round-robin') {
            config.fasesFinais.quartas = true;
            config.fasesFinais.semifinal = true;
            config.classificacao.cruzamentos = {
                quartas: [
                    {id: 'qf1', nome: 'Quartas 1', jogo: ['1A', '2B']}, {id: 'qf2', nome: 'Quartas 2', jogo: ['1C', '2D']},
                    {id: 'qf3', nome: 'Quartas 3', jogo: ['1B', '2A']}, {id: 'qf4', nome: 'Quartas 4', jogo: ['1D', '2C']},
                ],
                semifinal: [{id: 'sf1', nome: 'Semi 1', jogo: ['vencedor_qf1', 'vencedor_qf2']}, {id: 'sf2', nome: 'Semi 2', jogo: ['vencedor_qf3', 'vencedor_qf4']}],
            };
            isValid = true;
        } else if (faseGruposTipo === 'eliminatoria') {
            if(grupos === 2 && classificados === 1) {
                 config.fasesFinais.final = true;
                 config.classificacao.cruzamentos.final = [{id: 'final', nome: 'Final', jogo: ['1A', '1B']}];
                 isValid = true;
            } else if (grupos >= 2 && classificados === 1) { // Genérico para N grupos, 1 classificado
                config.fasesFinais.semifinal = true;
                config.fasesFinais.final = true;
                config.classificacao.cruzamentos.semifinal = [{id: 'sf1', nome: 'Semi 1', jogo:['1A', '1B']}, {id: 'sf2', nome: 'Semi 2', jogo:['1C', '1D']}];
                isValid = true;
            }
        }
        
        if (!isValid) return null;

        if(config.classificacao.cruzamentos.semifinal) {
            config.classificacao.cruzamentos.final = [{ id: "final", nome: "Final", jogo: ["vencedor_sf1", "vencedor_sf2"] }];
            config.classificacao.cruzamentos["terceiro-lugar"] = [{ id: "terceiro", nome: "Disputa 3º Lugar", jogo: ["perdedor_sf1", "perdedor_sf2"]}];
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

    saveState() { localStorage.setItem('tournamentState_v4', JSON.stringify(this.state)); },
    saveAndRender() { this.saveState(); this.render(); },
    getTeamById(id) { return this.state.teams.find(t => t.id === id); },

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
        const minTeams = this.config.faseGrupos.tipo === 'eliminatoria' ? 4 : 2;
        const hasEnoughTeams = GROUP_NAMES.every(g => this.state.teams.filter(t => t.group === g).length >= minTeams);

        if (!hasEnoughTeams) {
            alert(`É necessário ter pelo menos ${minTeams} equipes em cada grupo para este formato.`);
            return;
        }
        if (!confirm("Tem certeza? Os times serão bloqueados e os jogos da fase de grupos serão gerados.")) return;

        this.state.teamsLocked = true;
        if (this.config.faseGrupos.tipo === 'round-robin') {
            this.state.groupStageGames = GROUP_NAMES.flatMap(group => 
                this.generateBalancedGroupGames(this.state.teams.filter(t => t.group === group), group)
            );
        } else {
             this.state.groupStageGames = GROUP_NAMES.flatMap(group => 
                this.generateKnockoutGroupGames(this.state.teams.filter(t => t.group === group), group)
            );
        }
        this.saveAndRender();
    },
    
    generateBalancedGroupGames(teams, group) {
        const allGames = [];
        teams.forEach((t1, i) => {
            teams.slice(i + 1).forEach(t2 => {
                allGames.push({ id: self.crypto.randomUUID(), teams: [t1.id, t2.id], scores: [null, null], group, type: 'group' });
            });
        });
        return allGames;
    },

    generateKnockoutGroupGames(teams, group) {
        if (teams.length !== 4) {
            alert(`O modo eliminatório de grupo atualmente só suporta 4 equipes. O grupo ${group} tem ${teams.length}.`);
            this.state.teamsLocked = false; // Desbloqueia para correção
            return [];
        }
        const shuffledTeams = [...teams].sort(() => 0.5 - Math.random());
        const games = [];
        const semi1Id = self.crypto.randomUUID();
        const semi2Id = self.crypto.randomUUID();
        games.push({ id: semi1Id, teams: [shuffledTeams[0].id, shuffledTeams[1].id], scores: [null, null], group, name: `Semi ${group}1`, type: 'knockout-group' });
        games.push({ id: semi2Id, teams: [shuffledTeams[2].id, shuffledTeams[3].id], scores: [null, null], group, name: `Semi ${group}2`, type: 'knockout-group' });
        games.push({ id: self.crypto.randomUUID(), teams: [`vencedor_${semi1Id}`, `vencedor_${semi2Id}`], scores: [null, null], group, name: `Final ${group}`, type: 'knockout-group' });
        return games;
    },

    addMatchResult(gameId, s1, s2, elementToFlash) {
        const game = this.state.groupStageGames.find(g => g.id === gameId) || this.state.playoffMatches[gameId];
        if (!game) return;

        game.scores = [s1, s2];
        game.winner = s1 > s2 ? game.teams[0] : game.teams[1];
        
        if (game.type === 'knockout-group') this.updateGroupKnockout();
        else if (game.phase) this.updateExistingPlayoffs();

        if (elementToFlash) {
            elementToFlash.classList.add('score-saved');
            setTimeout(() => elementToFlash.classList.remove('score-saved'), 400);
        }

        if(this.config.faseGrupos.tipo === 'round-robin') this.recalculateTeamStats();
        
        if (this.state.groupStageGames.every(g => g.scores[0] !== null) && !this.state.playoffsGenerated) {
            this.generatePlayoffs();
        }
        this.saveAndRender();
    },

    updateGroupKnockout() {
        this.state.groupStageGames.forEach(game => {
            if (game.teams.some(t => t && t.startsWith('vencedor_'))) {
                game.teams = game.teams.map(teamId => {
                    if (teamId && teamId.startsWith('vencedor_')) {
                        const sourceId = teamId.split('_')[1];
                        const sourceGame = this.state.groupStageGames.find(g => g.id === sourceId);
                        return sourceGame?.winner || null;
                    }
                    return teamId;
                });
            }
        });
    },

    recalculateTeamStats() {
        this.state.teams.forEach(t => { t.p = 0; t.v = 0; t.d = 0; t.pm = 0; t.ps = 0; t.saldo = 0; });
        this.state.groupStageGames.forEach(g => {
            if (!g.scores || g.scores[0] === null) return;
            const t1 = this.getTeamById(g.teams[0]);
            const t2 = this.getTeamById(g.teams[1]);
            t1.pm += g.scores[0]; t1.ps += g.scores[1];
            t2.pm += g.scores[1]; t2.ps += g.scores[0];
            if (g.scores[0] > g.scores[1]) { t1.v++; t2.d++; t1.p += this.config.faseGrupos.vitoria; t2.p += this.config.faseGrupos.derrota; } 
            else { t2.v++; t1.d++; t2.p += this.config.faseGrupos.vitoria; t1.p += this.config.faseGrupos.derrota; }
        });
        this.state.teams.forEach(t => t.saldo = t.pm - t.ps);
    },

    generatePlayoffs() { /* ... */ },
    updateExistingPlayoffs() { /* ... */ },
    sortTeams: (a, b) => b.v - a.v || (b.saldo - a.saldo) || (b.pm - a.pm) || (a.ps - b.ps) || 0,
    
    render() { /* ... */ },
    renderTeamManagementAndTables() {
        const container = document.getElementById('groups-section-content');
        const GROUP_NAMES = Array.from({ length: this.config.grupos }, (_, i) => String.fromCharCode(65 + i));
        container.innerHTML = GROUP_NAMES.map(group => this.CardFase(group)).join('');
        
        GROUP_NAMES.forEach(group => {
            const table = document.querySelector(`#table-group-${group.toLowerCase()}`);
            if (this.config.faseGrupos.tipo === 'round-robin') {
                const teams = this.state.teams.filter(t => t.group === group).sort(this.sortTeams);
                table.querySelector('tbody').innerHTML = teams.map((t, i) => `<tr>...</tr>`).join('');
            } else {
                table.classList.add('hidden');
            }
        });
    },

    renderGroupStageGames() {
        const container = document.getElementById('group-games-display-content');
        const GROUP_NAMES = Array.from({ length: this.config.grupos }, (_, i) => String.fromCharCode(65 + i));
        container.className = `group-games-display ${this.config.faseGrupos.tipo}`;

        container.innerHTML = GROUP_NAMES.map(group => {
            const groupGames = this.state.groupStageGames.filter(g => g.group === group);
            let content;
            if (this.config.faseGrupos.tipo === 'round-robin') {
                content = `<ul>${groupGames.map(g => `<li>${this.CardJogo(g)}</li>`).join('')}</ul>`;
            } else {
                content = groupGames.map(g => `<div class="match-wrapper">${this.CardJogo(g)}</div>`).join('');
            }
            return `<div id="group-${group.toLowerCase()}-games" class="round"><h3>GRUPO ${group}</h3>${content}</div>`;
        }).join('');
    },
    
    CardJogo(game) {
        const t1 = this.getTeamById(game.teams?.[0]);
        const t2 = this.getTeamById(game.teams?.[1]);
        const s1 = game.scores?.[0];
        const s2 = game.scores?.[1];

        const teamInfo = (team, side) => !team ? `<span class="placeholder-team ${side}">Aguardando...</span>` : `...`;

        if (!t1 || !t2) return `<div class="match-card waiting">${teamInfo(t1, 'left')} vs ${teamInfo(t2, 'right')}</div>`;

        if (s1 !== null && s1 !== undefined) {
             return `<div class="match-card final-score">...</div>`;
        }
        
        return `<form class="match-card inline-result-form" data-game-id="${game.id}">...</form>`;
    },
    
    addEventListeners() { /* ... */ }
};
// Funções omitidas por brevidade, mas a estrutura principal está representada.
