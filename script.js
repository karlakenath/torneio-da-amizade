document.addEventListener('DOMContentLoaded', () => {

    // --- ESTADO INICIAL E ESTRUTURA DE DADOS ---
    const getInitialState = () => ({
        teams: [],
        groupStageGames: [],
        playoffMatches: { qf1: {}, qf2: {}, qf3: {}, qf4: {}, sf1: {}, sf2: {}, final: {}, 'third-place': {} },
        teamsLocked: false,
        playoffsGenerated: false,
        // Novas propriedades para a votação
        votacaoCraque: null, // Será inicializado após a criação dos times
        userHasVoted: localStorage.getItem('userHasVoted_v1') === 'true',
        votacaoEncerrada: localStorage.getItem('votacaoEncerrada_v1') === 'true',
    });
    let state = JSON.parse(localStorage.getItem('tournamentState_v3')) || getInitialState();
    // Recupera o estado da votação separadamente para não resetar com o torneio
    state.votacaoCraque = JSON.parse(localStorage.getItem('votacaoCraqueState_v1')) || null;
    state.userHasVoted = localStorage.getItem('userHasVoted_v1') === 'true';
    state.votacaoEncerrada = localStorage.getItem('votacaoEncerrada_v1') === 'true';

    // --- FUNÇÕES DE LÓGICA PRINCIPAL ---
    const saveState = () => {
        // Salva o estado do torneio
        const tournamentState = { ...state, votacaoCraque: null, userHasVoted: undefined, votacaoEncerrada: undefined };
        localStorage.setItem('tournamentState_v3', JSON.stringify(tournamentState));
        
        // Salva o estado da votação separadamente
        if (state.votacaoCraque) {
            localStorage.setItem('votacaoCraqueState_v1', JSON.stringify(state.votacaoCraque));
        }
        localStorage.setItem('userHasVoted_v1', state.userHasVoted);
        localStorage.setItem('votacaoEncerrada_v1', state.votacaoEncerrada);
    };
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

        // 1. Generate all unique pairings
        for (let i = 0; i < teamIds.length; i++) {
            for (let j = i + 1; j < teamIds.length; j++) {
                allGames.push({ id: self.crypto.randomUUID(), t1: teamIds[i], t2: teamIds[j], s1: null, s2: null, group });
            }
        }

        if (allGames.length === 0) return [];

        // 2. Reorder the games with the new rule
        const orderedGames = [];
        let availableGames = [...allGames];
        
        orderedGames.push(availableGames.shift());

        while (availableGames.length > 0) {
            const lastGame = orderedGames[orderedGames.length - 1];
            const teamsToAvoid = new Set([lastGame.t1, lastGame.t2]);

            let nextGameIndex = -1;
            
            for (let i = 0; i < availableGames.length; i++) {
                const candidateGame = availableGames[i];
                if (!teamsToAvoid.has(candidateGame.t1) && !teamsToAvoid.has(candidateGame.t2)) {
                    nextGameIndex = i;
                    break;
                }
            }

            if (nextGameIndex === -1) {
                nextGameIndex = 0;
            }
            
            orderedGames.push(availableGames.splice(nextGameIndex, 1)[0]);
        }

        return orderedGames;
    };

    const generateGroupStageGames = () => {
        if (state.teams.filter(t=>t.group === 'A').length < 2 || state.teams.filter(t=>t.group === 'B').length < 2) {
            alert("É necessário ter pelo menos 2 equipes em cada grupo para gerar os jogos."); return;
        }
        if (!confirm("Tem certeza? Os times serão bloqueados e os jogos da fase de grupos serão gerados.")) return;

        state.teamsLocked = true;
        let allGames = [];
        ['A', 'B'].forEach(group => {
            const groupTeams = state.teams.filter(t => t.group === group);
            const groupGames = generateBalancedGroupGames(groupTeams, group);
            allGames = allGames.concat(groupGames);
        });
        state.groupStageGames = allGames;
        
        // Inicializa a votação aqui
        if (!state.votacaoCraque) {
            initializeVotacao();
        }

        saveAndRender();
    };
    
        const addMatchResult = (gameId, s1, s2, elementToFlash) => {
    
            const game = state.groupStageGames.find(g => g.id === gameId);
    
            if (game) {
    
                game.s1 = s1; game.s2 = s2;
    
            } else {
    
                const matchId = Object.keys(state.playoffMatches).find(id => id === gameId);
    
                if (matchId) {
    
                    const match = state.playoffMatches[matchId];
    
                    match.scores = [s1, s2];
    
                    const [t1Id, t2Id] = match.teams;
    
                    match.winner = s1 > s2 ? t1Id : t2Id;
    
                    updateExistingPlayoffs(); // Re-check for next stage
    
                }
    
            }
    
            
    
            if (elementToFlash) {
    
                elementToFlash.classList.add('score-saved');
    
                setTimeout(() => {
    
                    elementToFlash.classList.remove('score-saved');
    
                }, 400);
    
            }
    
    
    
            recalculateTeamStats();
    
            if (state.groupStageGames.every(g => g.s1 !== null) && !state.playoffsGenerated) generatePlayoffs();
    
            saveAndRender();
    
        };
    
    
    
        const recalculateTeamStats = () => {
    
            state.teams.forEach(t => { t.p = 0; t.v = 0; t.d = 0; t.pm = 0; t.ps = 0; t.saldo = 0; });
    
            state.groupStageGames.forEach(g => {
    
                if (g.s1 === null) return;
    
                const t1 = state.teams.find(t => t.id === g.t1);
    
                const t2 = state.teams.find(t => t.id === g.t2);
    
                t1.pm += g.s1; t1.ps += g.s2;
    
                t2.pm += g.s2; t2.ps += g.s1;
    
                if (g.s1 > g.s2) { t1.v++; t2.d++; t1.p += 2; t2.p += 1; } 
    
                else { t2.v++; t1.d++; t2.p += 2; t1.p += 1; }
    
            });
    
            state.teams.forEach(t => t.saldo = t.pm - t.ps);
    
        };
    
    
    
        const generatePlayoffs = () => {
    
            // A lógica de atualização foi movida para uma função separada para maior clareza.
    
            if (state.playoffsGenerated) {
    
                updateExistingPlayoffs();
    
                return;
    
            }
    
    
    
            const groupA = state.teams.filter(t => t.group === 'A').sort(sortTeams);
    
            const groupB = state.teams.filter(t => t.group === 'B').sort(sortTeams);
    
            
    
            if (groupA.length < 3 || groupB.length < 3) {
    
                alert("São necessárias pelo menos 3 equipes em cada grupo que tenham jogado para gerar a fase final.");
    
                return;
    
            }
    
            
    
            // Nova estrutura de playoffs
    
            state.playoffMatches = {
    
                // Pré-Semifinais
    
                psf1: { teams: [groupA[1].id, groupB[2].id], name: "Pré-Semi 1" }, // 2A vs 3B
    
                psf2: { teams: [groupA[2].id, groupB[1].id], name: "Pré-Semi 2" }, // 3A vs 2B
    
                // Semifinais (os primeiros colocados já estão aqui)
    
                sf1: { teams: [groupA[0].id, null], name: "Semi 1" }, // 1A vs Vencedor PSF2
    
                sf2: { teams: [groupB[0].id, null], name: "Semi 2" }, // 1B vs Vencedor PSF1
    
                // Final e 3º Lugar
    
                final: { name: "Final" },
    
                'third-place': { name: "Disputa 3º Lugar" }
    
            };
    
            state.playoffsGenerated = true;
    
        };
    
    
    
        const updateExistingPlayoffs = () => {
    
            const { psf1, psf2, sf1, sf2, final } = state.playoffMatches;
    
    
    
            // Preenche as semifinais com os vencedores das pré-semifinais
    
            if (psf1.winner && sf2.teams[1] === null) {
    
                sf2.teams[1] = psf1.winner;
    
            }
    
            if (psf2.winner && sf1.teams[1] === null) {
    
                sf1.teams[1] = psf2.winner;
    
            }
    
    
    
            // Preenche a final e a disputa de 3º lugar com os resultados das semifinais
    
            if (sf1.winner && sf2.winner && !final.teams) {
    
                final.teams = [sf1.winner, sf2.winner];
    
                state.playoffMatches['third-place'].teams = [sf1.teams.find(id => id !== sf1.winner), sf2.teams.find(id => id !== sf2.winner)];
    
            }
    
        };
    
        const sortTeams = (a, b) => b.v - a.v || (b.saldo - a.saldo) || (b.pm - a.pm) || (a.ps - b.ps) || 0;



        // --- FUNÇÕES DE LÓGICA DA VOTAÇÃO ---
        const initializeVotacao = () => {
            const votacao = {};
            state.teams.forEach(team => {
                // Cada time tem 2 atletas
                const atleta1Id = `${team.id}-1`;
                const atleta2Id = `${team.id}-2`;
                votacao[atleta1Id] = 0;
                votacao[atleta2Id] = 0;
            });
            state.votacaoCraque = votacao;
        };

        const submitVote = (atletaId) => {
            if (!atletaId || state.userHasVoted || state.votacaoEncerrada) return;

            if (state.votacaoCraque.hasOwnProperty(atletaId)) {
                state.votacaoCraque[atletaId]++;
                state.userHasVoted = true;
                saveAndRender();
            }
        };

        const encerrarVotacao = () => {
            if (confirm("Tem certeza que deseja encerrar a votação? Esta ação não pode ser desfeita.")) {
                state.votacaoEncerrada = true;
                saveAndRender();
            }
        };
    
    
    
        // --- FUNÇÕES DE RENDERIZAÇÃO ---
    
        const render = () => {
    
            renderTeamManagement();
    
            renderTables();
    
            renderGroupStageGames();
    
            renderBracket();
    
            renderPodium();

            renderVotacao();
    
            updateUIMode();
    
        };
    
    
    
        const renderTeamManagement = () => {
    
            ['A', 'B'].forEach(group => {
    
                const list = document.getElementById(`team-list-${group.toLowerCase()}`);
    
                list.innerHTML = state.teams.filter(t => t.group === group).map(t => `
    
                    <li class="team-list-item">
    
                        <span class="team-list-name"><span class="team-color-badge" style="background-color:${t.color};"></span>${t.name}</span>
    
                        <button class="delete-team-btn" data-team-id="${t.id}">X</button>
    
                    </li>`).join('');
    
            });
    
        };
    
    
    
        const renderTables = () => {
            ['A', 'B'].forEach(group => {
                const teams = state.teams.filter(t => t.group === group).sort(sortTeams);
                document.querySelector(`#table-group-${group.toLowerCase()} tbody`).innerHTML = teams.map((t, i) => {
                    let rank;
                    if (i === 0) rank = '<span class="rank-badge gold">1º</span>';
                    else if (i === 1) rank = '<span class="rank-badge silver">2º</span>';
                    else if (i === 2) rank = '<span class="rank-badge bronze">3º</span>';
                    else rank = `${i + 1}º`;
    
                    return `<tr><td>${rank}</td><td><span class="team-color-badge" style="background-color:${t.color};"></span><span class="team-name">${t.name}</span></td><td>${t.p}</td><td>${t.v}</td><td>${t.d}</td><td>${t.pm}</td><td>${t.ps}</td><td>${t.saldo}</td></tr>`;
                }).join('');
            });
        };
    
    
    
        const renderGroupStageGames = () => {
    
            ['A', 'B'].forEach(group => {
    
                const list = document.querySelector(`#group-${group.toLowerCase()}-games ul`);
    
                list.innerHTML = state.groupStageGames.filter(g => g.group === group).map(g => `<li>${renderGame(g)}</li>`).join('');
    
            });
    
        };
    
    
    
        const renderBracket = () => {
    
            Object.keys(state.playoffMatches).forEach(id => {
    
                const wrapper = document.getElementById(`${id}-wrapper`);
    
                if (!wrapper) return;
    
    
    
                const matchData = state.playoffMatches[id] || {};
    
                
    
                // Lida com semifinais antes de estarem completas
    
                if ((id === 'sf1' || id === 'sf2') && matchData.teams && !matchData.teams[1]) {
    
                     wrapper.innerHTML = renderGame({ id, ...matchData });
    
                     return;
    
                }
    
    
    
                if (!matchData.teams) {
    
                    let placeholderText = matchData.name || id.toUpperCase();
    
                    wrapper.innerHTML = `<div class="match placeholder">${placeholderText}</div>`;
    
                    return;
    
                }
    
                wrapper.innerHTML = renderGame({ id, ...matchData });
    
            });
    
        };
    
    
    
        const renderPodium = () => {
    
            const finalMatch = state.playoffMatches.final;
    
            const thirdPlaceMatch = state.playoffMatches['third-place'];
    
            const podiumSection = document.getElementById('podium-section');
    
    
    
            if (finalMatch.winner && thirdPlaceMatch.winner) {
    
                podiumSection.classList.remove('hidden');
    
    
    
                const winnerId = finalMatch.winner;
    
                const runnerUpId = finalMatch.teams.find(id => id !== winnerId);
    
                const thirdPlaceId = thirdPlaceMatch.winner;
    
    
    
                const winner = state.teams.find(t => t.id === winnerId);
    
                const runnerUp = state.teams.find(t => t.id === runnerUpId);
    
                const thirdPlace = state.teams.find(t => t.id === thirdPlaceId);
    
    
    
                const renderTeamHTML = (team) => `<span class="team-color-badge" style="background-color:${team.color};"></span><span class="team-name">${team.name}</span>`;
    
    
    
                document.querySelector('#podium-1st .podium-team').innerHTML = renderTeamHTML(winner);
    
                document.querySelector('#podium-2nd .podium-team').innerHTML = renderTeamHTML(runnerUp);
    
                document.querySelector('#podium-3rd .podium-team').innerHTML = renderTeamHTML(thirdPlace);
    
    
    
            } else {
    
                podiumSection.classList.add('hidden');
    
            }
    
        };
    
    
    
        const renderGame = (game) => {
    
            const t1 = state.teams.find(t => t.id === (game.t1 || game.teams[0]));
    
            const t2 = state.teams.find(t => t.id === (game.t2 || game.teams[1]));
    
            const s1 = game.s1 ?? game.scores?.[0];
    
            const s2 = game.s2 ?? game.scores?.[1];
    
    
    
            const teamInfoLeft = (team) => `
    
                <span class="team-info team-left">
    
                    <span class="team-color-badge" style="background-color:${team.color};"></span>
    
                    <span class="team-name">${team.name}</span>
    
                </span>`;
    
    
    
            const teamInfoRight = (team) => `
    
                <span class="team-info team-right">
    
                    <span class="team-name">${team.name}</span>
    
                    <span class="team-color-badge" style="background-color:${team.color};"></span>
    
                </span>`;
    
            
    
            if (!t1 || !t2) {
    
                const definedTeam = t1 || t2;
    
                return `<div class="match-card waiting">
    
                            ${teamInfoLeft(definedTeam)}
    
                            <span class="score-info"><span class="placeholder-team">Aguardando...</span></span>
    
                            <span class="team-info team-right"></span>
    
                        </div>`;
    
            }
    
    
    
            if (s1 !== null && s1 !== undefined) {
    
                return `<div class="match-card final-score">
    
                            ${teamInfoLeft(t1)}
    
                            <span class="score-info">
    
                                <span class="score-value">${s1}</span>
    
                                <span class="score-separator">x</span>
    
                                <span class="score-value">${s2}</span>
    
                            </span>
    
                            ${teamInfoRight(t2)}
    
                        </div>`;
    
            } else {
    
                return `<form class="match-card inline-result-form" data-game-id="${game.id}">
    
                            ${teamInfoLeft(t1)}
    
                            <span class="score-info-form">
    
                                <input type="number" name="s1" placeholder="0" required min="0">
    
                                <span class="score-separator">x</span>
    
                                <input type="number" name="s2" placeholder="0" required min="0">
    
                            </span>
    
                            ${teamInfoRight(t2)}
    
                            <button type="submit">✔️</button>
    
                        </form>`;
    
            }
    
        };


        const renderVotacao = () => {
            if (!state.teamsLocked) return;

            if (state.votacaoEncerrada) {
                renderCraqueFinalCard();
                renderResultadoCraque();
                return;
            }

            renderVotacaoForm();
            renderResultadoCraque();
        };

        const renderVotacaoForm = () => {
            const form = document.getElementById('votacao-craque-form');
            const mensagemContainer = document.getElementById('votacao-craque-mensagem');
            form.innerHTML = '';
            mensagemContainer.innerHTML = '';

            if (state.userHasVoted || state.votacaoEncerrada) {
                mensagemContainer.innerHTML = state.votacaoEncerrada ? 'Votação encerrada!' : 'Voto registrado! Obrigada por participar 💛';
                // Hide the form and button if user has voted or voting is closed
                const button = document.getElementById('enviar-voto-button');
                if(button) button.classList.add('hidden');
                return;
            }

            let content = '';
            state.teams.forEach(team => {
                for (let i = 1; i <= 2; i++) {
                    const atletaId = `${team.id}-${i}`;
                    const atletaNome = `${team.name} – Jogadora ${i}`;
                    content += `
                        <div class="votacao-atleta-item">
                            <input type="radio" id="${atletaId}" name="craque" value="${atletaId}" required>
                            <label for="${atletaId}" class="votacao-atleta-label">
                                <span class="team-color-badge" style="background-color:${team.color};"></span>
                                <span class="team-name">${atletaNome}</span>
                            </label>
                        </div>
                    `;
                }
            });
            form.innerHTML = content;

            // Add submit button if it doesn't exist
            if (!document.getElementById('enviar-voto-button')) {
                const button = document.createElement('button');
                button.id = 'enviar-voto-button';
                button.type = 'submit';
                button.textContent = 'Enviar Voto';
                button.setAttribute('form', 'votacao-craque-form');
                document.getElementById('votacao-craque-container').appendChild(button);
            } else {
                document.getElementById('enviar-voto-button').classList.remove('hidden');
            }
        };

        const renderResultadoCraque = () => {
            if (!state.votacaoCraque) return;
            const container = document.getElementById('resultado-craque-container');
            
            const atletas = Object.keys(state.votacaoCraque).map(atletaId => {
                const [teamId, jogadorNum] = atletaId.split('-');
                const team = state.teams.find(t => t.id === teamId);
                if (!team) return null; // Handle case where team might be deleted after voting started
                return {
                    id: atletaId,
                    nome: `${team.name} – Jogadora ${jogadorNum}`,
                    votos: state.votacaoCraque[atletaId],
                    color: team.color,
                };
            }).filter(Boolean).sort((a, b) => b.votos - a.votos);

            const totalVotos = atletas.reduce((sum, a) => sum + a.votos, 0);

            container.innerHTML = atletas.map((atleta, index) => {
                const progresso = totalVotos > 0 ? (atleta.votos / totalVotos) * 100 : 0;
                return `
                    <div class="resultado-atleta-item">
                        <div class="resultado-rank">${index + 1}º</div>
                        <div class="resultado-info">
                            <div class="resultado-nome">
                                <span class="team-color-badge" style="background-color:${atleta.color};"></span>
                                ${atleta.nome}
                            </div>
                            <div class="resultado-progresso">
                                <div class="progresso-barra" style="width: ${progresso}%; background-color:${atleta.color};"></div>
                            </div>
                        </div>
                        <div class="resultado-votos">${atleta.votos}</div>
                    </div>
                `;
            }).join('');
        };

        const renderCraqueFinalCard = () => {
            if (!state.votacaoEncerrada || !state.votacaoCraque) return;

            const atletas = Object.keys(state.votacaoCraque).map(atletaId => {
                const [teamId, jogadorNum] = atletaId.split('-');
                const team = state.teams.find(t => t.id === teamId);
                if (!team) return null;
                return {
                    id: atletaId,
                    votos: state.votacaoCraque[atletaId],
                    team: team,
                    jogadorNum: jogadorNum
                };
            }).filter(Boolean).sort((a, b) => b.votos - a.votos);

            const winner = atletas[0];
            if (!winner || winner.votos === 0) {
                 document.getElementById('craque-final-card').innerHTML = `<div class="craque-final-content"><h2>👑 CRAQUE DA GALERA 👑</h2><p>Nenhum voto foi registrado.</p></div>`;
                return;
            };

            const winnerName = `${winner.team.name} – Jogadora ${winner.jogadorNum}`;

            const card = document.getElementById('craque-final-card');
            card.innerHTML = `
                <div class="craque-final-content">
                    <h2>👑 CRAQUE DA GALERA 👑</h2>
                    <div class="craque-final-nome">
                        <span class="team-color-badge" style="background-color:${winner.team.color}; width: 30px; height: 30px;"></span>
                        ${winnerName}
                    </div>
                    <div class="craque-final-votos">Com ${winner.votos} voto(s)!</div>
                </div>
            `;
        };
    
    
    
        const updateUIMode = () => {
    
            document.querySelectorAll('.team-management-controls').forEach(el => el.classList.toggle('hidden', state.teamsLocked));
    
            document.getElementById('generate-games-container').classList.toggle('hidden', state.teamsLocked);
    
            document.getElementById('group-games-section').classList.toggle('hidden', !state.teamsLocked);
    
            document.getElementById('playoffs').classList.toggle('hidden', !state.playoffsGenerated);
    
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
    
        document.getElementById('reset-button').onclick = () => { if (confirm("Tem certeza? TODO o progresso será perdido.")) { localStorage.removeItem('tournamentState_v3'); state = getInitialState(); saveAndRender(); } };
    
    
    
        // --- INICIALIZAÇÃO ---
    
        render();
    
    });
    
    