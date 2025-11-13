// Aguarda o DOM carregar completamente antes de executar o script
document.addEventListener('DOMContentLoaded', () => {

    // --- ESTRUTURA DE DADOS E ESTADO INICIAL ---

    // Definição das equipes com suas cores e grupos
    const TEAMS = [
        { id: 'azul', name: 'Azul', group: 'A', color: 'var(--cor-azul)' },
        { id: 'vermelho', name: 'Vermelho', group: 'A', color: 'var(--cor-vermelho)' },
        { id: 'verde', name: 'Verde', group: 'A', color: 'var(--cor-verde)' },
        { id: 'amarelo', name: 'Amarelo', group: 'A', color: 'var(--cor-amarelo)', isLight: true }, // Texto preto para legibilidade
        { id: 'roxo', name: 'Roxo', group: 'A', color: 'var(--cor-roxo)' },
        { id: 'laranja', name: 'Laranja', group: 'B', color: 'var(--cor-laranja)' },
        { id: 'rosa', name: 'Rosa', group: 'B', color: 'var(--cor-rosa)' },
        { id: 'preto', name: 'Preto', group: 'B', color: 'var(--cor-preto)' },
        { id: 'branco', name: 'Branco', group: 'B', color: 'var(--cor-branco)', isLight: true },
        { id: 'cinza', name: 'Cinza', group: 'B', color: 'var(--cor-cinza)' }
    ];

    // Função para gerar o estado inicial do torneio
    const getInitialState = () => ({
        teams: TEAMS.map(team => ({
            ...team,
            p: 0, v: 0, d: 0, pm: 0, ps: 0, saldo: 0, gamesPlayed: 0
        })),
        groupMatches: [],
        playoffMatches: {
            qf1: { teams: [null, null], scores: [null, null], winner: null },
            qf2: { teams: [null, null], scores: [null, null], winner: null },
            qf3: { teams: [null, null], scores: [null, null], winner: null },
            qf4: { teams: [null, null], scores: [null, null], winner: null },
            sf1: { teams: [null, null], scores: [null, null], winner: null },
            sf2: { teams: [null, null], scores: [null, null], winner: null },
            final: { teams: [null, null], scores: [null, null], winner: null },
            thirdPlace: { teams: [null, null], scores: [null, null], winner: null },
        },
        isGroupStageComplete: false,
    });

    // Carrega o estado do LocalStorage ou usa o estado inicial
    let state = JSON.parse(localStorage.getItem('tournamentState')) || getInitialState();

    // --- FUNÇÕES DE LÓGICA DO TORNEIO ---

    /**
     * Salva o estado atual do torneio no LocalStorage.
     */
    const saveState = () => {
        localStorage.setItem('tournamentState', JSON.stringify(state));
    };

    /**
     * Ordena as equipes com base nos critérios de desempate.
     * 1. Pontuação (maior)
     * 2. Número de vitórias (maior)
     * 3. Saldo de pontos (maior)
     * 4. Pontos marcados (maior)
     * 5. Pontos sofridos (menor)
     */
    const sortTeams = (a, b) => {
        if (b.p !== a.p) return b.p - a.p;
        if (b.v !== a.v) return b.v - a.v;
        if (b.saldo !== a.saldo) return b.saldo - a.saldo;
        if (b.pm !== a.pm) return b.pm - a.pm;
        return a.ps - b.ps;
    };

    /**
     * Registra o resultado de um jogo, atualizando as estatísticas das equipes.
     * @param {string} team1Id - ID da equipe 1.
     * @param {number} score1 - Pontuação da equipe 1.
     * @param {string} team2Id - ID da equipe 2.
     * @param {number} score2 - Pontuação da equipe 2.
     */
    const addMatchResult = (team1Id, score1, team2Id, score2) => {
        const team1 = state.teams.find(t => t.id === team1Id);
        const team2 = state.teams.find(t => t.id === team2Id);

        if (!team1 || !team2) {
            alert("Equipe inválida.");
            return;
        }
        
        const isPlayoffMatch = state.isGroupStageComplete;

        // Atualiza pontos marcados e sofridos
        team1.pm += score1;
        team1.ps += score2;
        team2.pm += score2;
        team2.ps += score1;

        // Atualiza saldo
        team1.saldo = team1.pm - team1.ps;
        team2.saldo = team2.pm - team2.ps;

        // Determina vencedor e perdedor
        const winner = score1 > score2 ? team1 : team2;
        const loser = score1 > score2 ? team2 : team1;

        // Atualiza estatísticas de vitória/derrota e pontuação
        winner.v += 1;
        loser.d += 1;
        winner.p += 2; // 2 pontos por vitória
        loser.p += 1;  // 1 ponto por derrota
        
        if (!isPlayoffMatch) {
            team1.gamesPlayed++;
            team2.gamesPlayed++;
            state.groupMatches.push({ t1: team1.id, s1: score1, t2: team2.id, s2: score2 });
        } else {
            // Lógica para atualizar o chaveamento
            const matchId = findPlayoffMatchId(team1Id, team2Id);
            if (matchId) {
                state.playoffMatches[matchId].scores = [score1, score2];
                state.playoffMatches[matchId].winner = winner.id;
                updatePlayoffs();
            }
        }

        checkGroupStageCompletion();
        saveState();
        render();
        
        // Animação de destaque
        highlightUpdatedRows([team1Id, team2Id]);
    };
    
    /**
     * Verifica se a fase de grupos terminou e, se sim, gera o chaveamento.
     */
    const checkGroupStageCompletion = () => {
        const allTeamsPlayed4Games = state.teams.every(t => t.gamesPlayed === 4);
        if (allTeamsPlayed4Games && !state.isGroupStageComplete) {
            state.isGroupStageComplete = true;
            generatePlayoffs();
        }
    };

    /**
     * Gera as partidas das quartas de final com base na classificação dos grupos.
     */
    const generatePlayoffs = () => {
        const groupA = state.teams.filter(t => t.group === 'A').sort(sortTeams);
        const groupB = state.teams.filter(t => t.group === 'B').sort(sortTeams);

        state.playoffMatches.qf1.teams = [groupA[0].id, groupB[3].id]; // 1A x 4B
        state.playoffMatches.qf2.teams = [groupA[1].id, groupB[2].id]; // 2A x 3B
        state.playoffMatches.qf3.teams = [groupB[0].id, groupA[3].id]; // 1B x 4A
        state.playoffMatches.qf4.teams = [groupB[1].id, groupA[2].id]; // 2B x 3A
    };
    
    /**
     * Atualiza as semifinais e finais com base nos vencedores das fases anteriores.
     */
    const updatePlayoffs = () => {
        const { qf1, qf2, qf3, qf4, sf1, sf2 } = state.playoffMatches;

        // Gera Semifinais
        if (qf1.winner && qf2.winner && !sf1.teams[0]) {
            sf1.teams = [qf1.winner, qf2.winner];
        }
        if (qf3.winner && qf4.winner && !sf2.teams[0]) {
            sf2.teams = [qf3.winner, qf4.winner];
        }

        // Gera Final e 3º Lugar
        if (sf1.winner && sf2.winner && !state.playoffMatches.final.teams[0]) {
            state.playoffMatches.final.teams = [sf1.winner, sf2.winner];
            const sf1Loser = sf1.teams.find(id => id !== sf1.winner);
            const sf2Loser = sf2.teams.find(id => id !== sf2.winner);
            state.playoffMatches.thirdPlace.teams = [sf1Loser, sf2Loser];
        }
    };

    /**
     * Encontra o ID de uma partida no chaveamento com base nos times participantes.
     */
    const findPlayoffMatchId = (team1Id, team2Id) => {
        for (const matchId in state.playoffMatches) {
            const match = state.playoffMatches[matchId];
            const hasTeams = match.teams.includes(team1Id) && match.teams.includes(team2Id);
            if (hasTeams) {
                return matchId;
            }
        }
        return null;
    };

    // --- FUNÇÕES DE RENDERIZAÇÃO ---

    /**
     * Renderiza todo o estado da aplicação na tela.
     */
    const render = () => {
        renderTables();
        renderBracket();
        populateSelectors();
        renderGroupMatchesList();
    };

    /**
     * Renderiza as tabelas de classificação dos grupos.
     */
    const renderTables = () => {
        const groupA = state.teams.filter(t => t.group === 'A').sort(sortTeams);
        const groupB = state.teams.filter(t => t.group === 'B').sort(sortTeams);

        const tableA = document.querySelector('#table-group-a tbody');
        const tableB = document.querySelector('#table-group-b tbody');

        tableA.innerHTML = generateTableRows(groupA);
        tableB.innerHTML = generateTableRows(groupB);
    };

    /**
     * Gera o HTML para as linhas de uma tabela de classificação.
     */
    const generateTableRows = (teams) => {
        return teams.map((team, index) => `
            <tr data-team-id="${team.id}">
                <td>${index + 1}º</td>
                <td>
                    <span class="team-color-badge" style="background-color: ${team.color};"></span>
                    ${team.name}
                </td>
                <td>${team.p}</td>
                <td>${team.v}</td>
                <td>${team.d}</td>
                <td>${team.pm}</td>
                <td>${team.ps}</td>
                <td>${team.saldo}</td>
            </tr>
        `).join('');
    };
    
    /**
     * Renderiza a lista de jogos já realizados na fase de grupos.
     */
    const renderGroupMatchesList = () => {
        const listEl = document.getElementById('group-matches-list');
        listEl.innerHTML = state.groupMatches.map(match => {
            const t1 = findTeamById(match.t1);
            const t2 = findTeamById(match.t2);
            return `<li>${t1.name} ${match.s1} x ${match.s2} ${t2.name}</li>`;
        }).join('');
    };

    /**
     * Renderiza o chaveamento da fase final.
     */
    const renderBracket = () => {
        const { playoffMatches } = state;
        for (const matchId in playoffMatches) {
            const matchEl = document.getElementById(matchId);
            const matchData = playoffMatches[matchId];
            matchEl.innerHTML = generateMatchHTML(matchData, matchId);
        }
    };

    /**
     * Gera o HTML para uma única partida do chaveamento.
     */
    const generateMatchHTML = (matchData) => {
        const [team1Id, team2Id] = matchData.teams;
        const [score1, score2] = matchData.scores;

        if (!team1Id || !team2Id) {
            const placeholders = {
                qf1: '1º A vs 4º B', qf2: '2º A vs 3º B',
                qf3: '1º B vs 4º A', qf4: '2º B vs 3º A',
                sf1: 'Vencedor QF1 vs QF2', sf2: 'Vencedor QF3 vs QF4',
                final: 'Vencedor SF1 vs SF2', thirdPlace: 'Perdedor SF1 vs SF2'
            };
            const matchId = Object.keys(state.playoffMatches).find(key => state.playoffMatches[key] === matchData);
            return `<div class="placeholder">${placeholders[matchId] || 'Aguardando'}</div>`;
        }

        const team1 = findTeamById(team1Id);
        const team2 = findTeamById(team2Id);

        const getTeamHTML = (team, score, opponentScore) => {
            if (!team) return '';
            let teamClass = '';
            if (score !== null) {
                teamClass = score > opponentScore ? 'winner' : 'loser';
            }
            const textColor = team.isLight ? '#333' : 'white';
            return `
                <div class="match-team ${teamClass}">
                    <span class="team-name" style="color: ${textColor};">
                        <span class="team-color-badge" style="background-color: ${team.color}; border: 1px solid #fff;"></span>
                        ${team.name}
                    </span>
                    <span class="team-score">${score ?? ''}</span>
                </div>
            `;
        };
        
        return getTeamHTML(team1, score1, score2) + getTeamHTML(team2, score2, score1);
    };

    /**
     * Popula os seletores de equipe no formulário de resultados.
     */
    const populateSelectors = () => {
        // Pega os estilos computados para resolver as variáveis CSS, garantindo maior compatibilidade.
        const computedStyle = getComputedStyle(document.documentElement);

        const teamOptions = TEAMS.map(team => {
            // Resolve a variável CSS para obter o valor da cor real (ex: 'var(--cor-azul)' -> '#007bff')
            const varName = team.color.replace('var(', '').replace(')', '');
            const bgColor = computedStyle.getPropertyValue(varName).trim();
            const textColor = team.isLight ? '#000000' : '#FFFFFF';
            
            return `<option value="${team.id}" style="background-color: ${bgColor}; color: ${textColor}; font-weight: bold;">${team.name}</option>`;
        }).join('');

        const select1 = document.getElementById('team1');
        const select2 = document.getElementById('team2');
        
        const currentVal1 = select1.value;
        const currentVal2 = select2.value;

        select1.innerHTML = teamOptions;
        select2.innerHTML = teamOptions;

        // Restaura a seleção anterior ou define um padrão para evitar que a mesma equipe seja selecionada
        select1.value = currentVal1 || TEAMS[0].id;
        if (currentVal2 && currentVal1 !== currentVal2) {
            select2.value = currentVal2;
        } else {
            select2.value = TEAMS[1].id;
        }
        
        // Garante que, mesmo após a restauração, a seleção não seja de times iguais
        if (select1.value === select2.value) {
            // Se o time 1 for o primeiro da lista, seleciona o segundo para o select2. Senão, seleciona o primeiro.
            select2.value = (select1.value === TEAMS[0].id) ? TEAMS[1].id : TEAMS[0].id;
        }
    };

    /**
     * Adiciona uma classe de destaque para animar as linhas da tabela que foram atualizadas.
     */
    const highlightUpdatedRows = (teamIds) => {
        teamIds.forEach(id => {
            const row = document.querySelector(`tr[data-team-id="${id}"]`);
            if (row) {
                row.classList.add('highlight-update');
                setTimeout(() => row.classList.remove('highlight-update'), 1500);
            }
        });
    };
    
    const findTeamById = (id) => TEAMS.find(t => t.id === id);

    // --- EVENT LISTENERS ---

    // Manipulador para o envio do formulário de resultados
    document.getElementById('result-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const form = e.target;
        const team1Id = form.team1.value;
        const score1 = parseInt(form.score1.value, 10);
        const team2Id = form.team2.value;
        const score2 = parseInt(form.score2.value, 10);

        if (team1Id === team2Id) {
            alert("Uma equipe não pode jogar contra si mesma.");
            return;
        }
        if (isNaN(score1) || isNaN(score2)) {
            alert("Por favor, insira um placar válido.");
            return;
        }

        addMatchResult(team1Id, score1, team2Id, score2);
        form.reset();
        document.getElementById('team2').value = TEAMS[1].id; // Reseta a seleção
    });

    // Manipulador para o botão de reiniciar o torneio
    document.getElementById('reset-button').addEventListener('click', () => {
        if (confirm("Tem certeza que deseja reiniciar o torneio? Todos os dados serão perdidos.")) {
            localStorage.removeItem('tournamentState');
            state = getInitialState();
            render();
        }
    });

    // --- INICIALIZAÇÃO ---
    render(); // Renderiza o estado inicial na primeira carga
});
