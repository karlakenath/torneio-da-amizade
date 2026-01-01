document.addEventListener('DOMContentLoaded', () => {
    // --- HELPERS ---
    const getTeamById = (id) => state.teams.find(t => t.id === id);
    const GROUP_NAMES = Array.from({ length: configTorneio.grupos }, (_, i) => String.fromCharCode(65 + i));

    // --- ESTADO INICIAL E ESTRUTURA DE DADOS ---
    const getInitialState = () => ({
        teams: [],
        groupStageGames: [],
        playoffMatches: {}, // Estrutura de playoffs agora é totalmente dinâmica
        teamsLocked: false,
        playoffsGenerated: false,
    });
    // Usar uma nova chave no localStorage para evitar conflitos com a versão antiga
    let state = JSON.parse(localStorage.getItem('tournamentState_v4')) || getInitialState();

    // --- FUNÇÕES DE LÓGICA PRINCIPAL ---
    const saveState = () => localStorage.setItem('tournamentState_v4', JSON.stringify(state));
    const saveAndRender = () => { saveState(); render(); };

    const addTeam = (name, color, group) => {
        if (!name.trim()) { alert("O nome da equipe não pode ser vazio."); return; }
        if (state.teams.some(t => t.name.toLowerCase() === name.toLowerCase())) { alert(`A equipe "${name}" já existe.`); return; }
        state.teams.push({ id: self.crypto.randomUUID(), name, color, group, p: 0, v: 0, d: 0, pm: 0, ps: 0, saldo: 0 });
        saveAndRender();
    };

    const deleteTeam = (teamId) => {
        state.teams = state.teams.filter(t => t.id !== teamId);
        saveAndRender();
    };

    const generateBalancedGroupGames = (teams, group) => {
        const allGames = [];
        const teamIds = teams.map(t => t.id);
        for (let i = 0; i < teamIds.length; i++) {
            for (let j = i + 1; j < teamIds.length; j++) {
                allGames.push({ id: self.crypto.randomUUID(), t1: teamIds[i], t2: teamIds[j], s1: null, s2: null, group });
            }
        }
        if (allGames.length === 0) return [];
        let availableGames = [...allGames];
        const orderedGames = [];
        orderedGames.push(availableGames.shift());
        while (availableGames.length > 0) {
            const lastGame = orderedGames[orderedGames.length - 1];
            const teamsToAvoid = new Set([lastGame.t1, lastGame.t2]);
            let nextGameIndex = availableGames.findIndex(g => !teamsToAvoid.has(g.t1) && !teamsToAvoid.has(g.t2));
            if (nextGameIndex === -1) nextGameIndex = 0;
            orderedGames.push(availableGames.splice(nextGameIndex, 1)[0]);
        }
        return orderedGames;
    };
    
    const generateGroupStageGames = () => {
        const minTeams = configTorneio.equipesPorGrupo === 'dinamico' ? 2 : configTorneio.equipesPorGrupo;
        const hasEnoughTeams = GROUP_NAMES.every(g => state.teams.filter(t => t.group === g).length >= minTeams);
        if (!hasEnoughTeams) {
            alert(`É necessário ter pelo menos ${minTeams} equipes em cada grupo para gerar os jogos.`);
            return;
        }
        if (!confirm("Tem certeza? Os times serão bloqueados e os jogos da fase de grupos serão gerados.")) return;

        state.teamsLocked = true;
        let allGames = [];
        GROUP_NAMES.forEach(group => {
            const groupTeams = state.teams.filter(t => t.group === group);
            const groupGames = generateBalancedGroupGames(groupTeams, group);
            allGames = allGames.concat(groupGames);
        });
        state.groupStageGames = allGames;
        saveAndRender();
    };

    const addMatchResult = (gameId, s1, s2, elementToFlash) => {
        const game = state.groupStageGames.find(g => g.id === gameId);
        if (game) {
            game.s1 = s1;
            game.s2 = s2;
        } else if (state.playoffMatches[gameId]) {
            const match = state.playoffMatches[gameId];
            match.scores = [s1, s2];
            const [t1Id, t2Id] = match.teams;
            match.winner = s1 > s2 ? t1Id : t2Id;
            updateExistingPlayoffs(); // Verifica se o resultado preenche o próximo estágio
        }

        if (elementToFlash) {
            elementToFlash.classList.add('score-saved');
            setTimeout(() => elementToFlash.classList.remove('score-saved'), 400);
        }

        recalculateTeamStats();
        if (state.groupStageGames.every(g => g.s1 !== null) && !state.playoffsGenerated) {
            generatePlayoffs();
        }
        saveAndRender();
    };

    const recalculateTeamStats = () => {
        state.teams.forEach(t => { t.p = 0; t.v = 0; t.d = 0; t.pm = 0; t.ps = 0; t.saldo = 0; });
        state.groupStageGames.forEach(g => {
            if (g.s1 === null) return;
            const t1 = getTeamById(g.t1);
            const t2 = getTeamById(g.t2);
            t1.pm += g.s1; t1.ps += g.s2;
            t2.pm += g.s2; t2.ps += g.s1;
            if (g.s1 > g.s2) { t1.v++; t2.d++; t1.p += configTorneio.faseGrupos.vitoria; t2.p += configTorneio.faseGrupos.derrota; } 
            else { t2.v++; t1.d++; t2.p += configTorneio.faseGrupos.vitoria; t1.p += configTorneio.faseGrupos.derrota; }
        });
        state.teams.forEach(t => t.saldo = t.pm - t.ps);
    };

    const generatePlayoffs = () => {
        if (state.playoffsGenerated) {
            updateExistingPlayoffs();
            return;
        }

        const rankedGroups = {};
        GROUP_NAMES.forEach(g => {
            rankedGroups[g] = state.teams.filter(t => t.group === g).sort(sortTeams);
        });

        const newPlayoffMatches = {};
        const phases = Object.keys(configTorneio.fasesFinais).filter(p => configTorneio.fasesFinais[p]);

        phases.forEach(phase => {
            const cruzamentos = configTorneio.classificacao.cruzamentos[phase];
            if (!cruzamentos) return;
            
            cruzamentos.forEach(matchConfig => {
                const teams = matchConfig.jogo.map(placeholder => {
                    if (placeholder.startsWith("vencedor_") || placeholder.startsWith("perdedor_")) {
                        return null; // Será preenchido depois
                    }
                    const group = placeholder.slice(-1);
                    const pos = parseInt(placeholder.slice(0, -1)) - 1;
                    return rankedGroups[group][pos]?.id || null;
                });
                newPlayoffMatches[matchConfig.id] = {
                    id: matchConfig.id,
                    name: matchConfig.nome,
                    teams: teams,
                    phase: phase,
                    source: matchConfig.jogo // ex: ["1A", "vencedor_qf2"]
                };
            });
        });
        
                state.playoffMatches = newPlayoffMatches;
        
                state.playoffsGenerated = true;
        
                
        
                // A lógica de final e terceiro lugar é melhor tratada na atualização
        
                updateExistingPlayoffs();
        
            };
        
        
        
            const updateExistingPlayoffs = () => {
        
                Object.values(state.playoffMatches).forEach(match => {
        
                    if (match.teams.every(t => t !== null)) return;
        
        
        
                    const newTeams = match.teams.map((teamId, index) => {
        
                        if (teamId !== null) return teamId;
        
        
        
                        const placeholder = match.source[index];
        
                        if (!placeholder) return null;
        
        
        
                        const [type, sourceMatchId] = placeholder.split('_');
        
                        const sourceMatch = state.playoffMatches[sourceMatchId];
        
        
        
                        if (sourceMatch && sourceMatch.winner) {
        
                            if (type === 'vencedor') return sourceMatch.winner;
        
                            if (type === 'perdedor') return sourceMatch.teams.find(id => id !== sourceMatch.winner);
        
                        }
        
                        return null;
        
                    });
        
                    match.teams = newTeams;
        
                });
        
            };
    };

    const sortTeams = (a, b) => b.v - a.v || (b.saldo - a.saldo) || (b.pm - a.pm) || (a.ps - b.ps) || 0;

    // --- COMPONENTES DE RENDERIZAÇÃO ---
    
    const CardEquipe = (team) => `
        <li class="team-list-item">
            <span class="team-list-name"><span class="team-color-badge" style="background-color:${team.color};"></span>${team.name}</span>
            <button class="delete-team-btn" data-team-id="${team.id}">X</button>
        </li>`;
    
    const CardJogo = (game) => {
        const t1 = getTeamById(game.t1 || game.teams?.[0]);
        const t2 = getTeamById(game.t2 || game.teams?.[1]);
        const s1 = game.s1 ?? game.scores?.[0];
        const s2 = game.s2 ?? game.scores?.[1];

        const teamInfo = (team, side) => !team ? `<span class="placeholder-team ${side}">Aguardando...</span>` : `
            <span class="team-info team-${side}">
                ${side === 'left' ? `<span class="team-color-badge" style="background-color:${team.color};"></span>` : ''}
                <span class="team-name">${team.name}</span>
                ${side === 'right' ? `<span class="team-color-badge" style="background-color:${team.color};"></span>` : ''}
            </span>`;

        if (!t1 || !t2) {
            return `<div class="match-card waiting">${teamInfo(t1, 'left')}<span class="score-info">vs</span>${teamInfo(t2, 'right')}</div>`;
        }

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
    };

    const CardFase = (groupName) => {
        const teams = state.teams.filter(t => t.group === groupName);
        return `
            <div class="group-container" id="group-${groupName}-container">
                <h3>GRUPO ${groupName}</h3>
                <div class="team-management-controls">
                    <ul class="team-management-list" id="team-list-${groupName.toLowerCase()}">
                        ${teams.map(CardEquipe).join('')}
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
    };

    const CardPodio = (winner, runnerUp, thirdPlace) => {
        const renderTeamHTML = (team) => `<span class="team-color-badge" style="background-color:${team.color};"></span><span class="team-name">${team.name}</span>`;
        document.querySelector('#podium-1st .podium-team').innerHTML = renderTeamHTML(winner);
        document.querySelector('#podium-2nd .podium-team').innerHTML = renderTeamHTML(runnerUp);
        document.querySelector('#podium-3rd .podium-team').innerHTML = renderTeamHTML(thirdPlace);
    };


    // --- FUNÇÕES DE RENDERIZAÇÃO ---
    const render = () => {
        renderTeamManagementAndTables();
        renderGroupStageGames();
        renderBracket();
        renderPodium();
        updateUIMode();
    };

    const renderTeamManagementAndTables = () => {
        const container = document.getElementById('groups-section-content');
        container.innerHTML = GROUP_NAMES.map(CardFase).join('');
        container.className = `groups-layout-${GROUP_NAMES.length > 2 ? 'grid' : GROUP_NAMES.length}`; // Adiciona classe para layout
        
        // Renderiza tabelas separadamente após criar a estrutura
        GROUP_NAMES.forEach(group => {
            const teams = state.teams.filter(t => t.group === group).sort(sortTeams);
            const tableBody = document.querySelector(`#table-group-${group.toLowerCase()} tbody`);
            if (tableBody) {
                tableBody.innerHTML = teams.map((t, i) => {
                    let rank;
                    if (i === 0) rank = '<span class="rank-badge gold">1º</span>';
                    else if (i === 1) rank = '<span class="rank-badge silver">2º</span>';
                    else if (i === 2) rank = '<span class="rank-badge bronze">3º</span>';
                    else rank = `${i + 1}º`;
                    return `<tr><td>${rank}</td><td><span class="team-color-badge" style="background-color:${t.color};"></span><span class="team-name">${t.name}</span></td><td>${t.p}</td><td>${t.v}</td><td>${t.d}</td><td>${t.pm}</td><td>${t.ps}</td><td>${t.saldo}</td></tr>`;
                }).join('');
            }
        });
    };

    const renderGroupStageGames = () => {
        const container = document.getElementById('group-games-display-content');
        container.innerHTML = GROUP_NAMES.map(group => `
            <div id="group-${group.toLowerCase()}-games">
                <h3>GRUPO ${group}</h3>
                <ul>${state.groupStageGames.filter(g => g.group === group).map(g => `<li>${CardJogo(g)}</li>`).join('')}</ul>
            </div>
        `).join('');
    };
    
    const renderBracket = () => {
        const container = document.getElementById('bracket-container');
        container.innerHTML = ''; // Limpa antes de renderizar

        // Agrupa partidas por fase
        const matchesByPhase = Object.values(state.playoffMatches).reduce((acc, match) => {
            if (!acc[match.phase]) acc[match.phase] = [];
            acc[match.phase].push(match);
            return acc;
        }, {});
        
        // Cria estrutura de linhas para o bracket
        const bracketLayout = {
            row1: ['pre-semifinal', 'semifinal'],
            row2: ['terceiro-lugar', 'final']
        };

        Object.values(bracketLayout).forEach(rowPhases => {
            const rowEl = document.createElement('div');
            rowEl.className = 'bracket-row';
            rowPhases.forEach(phaseKey => {
                if (configTorneio.fasesFinais[phaseKey] && matchesByPhase[phaseKey]) {
                    const roundEl = document.createElement('div');
                    roundEl.className = 'round';
                    roundEl.id = phaseKey;
                    
                    const titleEl = document.createElement('div');
                    titleEl.className = 'round-title';
                    titleEl.textContent = matchesByPhase[phaseKey][0]?.name.replace(/\s\d+$/, '') || phaseKey;
                    roundEl.appendChild(titleEl);

                    matchesByPhase[phaseKey].forEach(match => {
                        const wrapper = document.createElement('div');
wrapper.className = 'match-wrapper';
                        wrapper.id = `${match.id}-wrapper`;
                        wrapper.innerHTML = CardJogo(match);
                        roundEl.appendChild(wrapper);
                    });
                    rowEl.appendChild(roundEl);
                }
            });
            container.appendChild(rowEl);
        });
    };

    const renderPodium = () => {
        const finalMatch = Object.values(state.playoffMatches).find(m => m.phase === 'final');
        const thirdPlaceMatch = Object.values(state.playoffMatches).find(m => m.phase === 'terceiroLugar');
        const podiumSection = document.getElementById('podium-section');

        if (finalMatch?.winner && thirdPlaceMatch?.winner) {
            podiumSection.classList.remove('hidden');
            const winner = getTeamById(finalMatch.winner);
            const runnerUp = getTeamById(finalMatch.teams.find(id => id !== finalMatch.winner));
            const thirdPlace = getTeamById(thirdPlaceMatch.winner);
            CardPodio(winner, runnerUp, thirdPlace);
        } else {
            podiumSection.classList.add('hidden');
        }
    };

    const updateUIMode = () => {
        document.querySelectorAll('.team-management-controls').forEach(el => el.classList.toggle('hidden', state.teamsLocked));
        document.getElementById('generate-games-container').classList.toggle('hidden', state.teamsLocked);
        document.getElementById('group-games-section').classList.toggle('hidden', !state.teamsLocked);
        document.getElementById('playoffs').classList.toggle('hidden', !state.playoffsGenerated);
        
        // Controla seções extras
        document.getElementById('votacao-section').classList.toggle('hidden', !configTorneio.votacao.ativa);
        document.getElementById('premios-section').classList.toggle('hidden', !configTorneio.premiosIndividuais);
    };

    // --- EVENT LISTENERS ---
    document.getElementById('main-content').addEventListener('submit', (e) => {
        if (e.target.classList.contains('inline-result-form')) {
            e.preventDefault();
            const form = e.target;
            const gameId = form.dataset.gameId;
            const s1 = parseInt(form.s1.value);
            const s2 = parseInt(form.s2.value);
            if (isNaN(s1) || isNaN(s2)) { alert("Placar inválido."); return; }
            const cardElement = form.closest('li, .match-wrapper');
            addMatchResult(gameId, s1, s2, cardElement);
        } else if (e.target.classList.contains('add-team-form')) {
            e.preventDefault();
            addTeam(e.target.elements[0].value, e.target.elements[1].value, e.target.dataset.group);
            e.target.reset();
        }
    });

    document.getElementById('main-content').addEventListener('click', (e) => {
        if (e.target.classList.contains('delete-team-btn')) {
            deleteTeam(e.target.dataset.teamId);
        }
    });

    document.getElementById('generate-games-button').onclick = generateGroupStageGames;
    document.getElementById('reset-button').onclick = () => { if (confirm("Tem certeza? TODO o progresso será perdido.")) { localStorage.removeItem('tournamentState_v4'); state = getInitialState(); saveAndRender(); location.reload() } };

    // --- INICIALIZAÇÃO ---
    render();
});