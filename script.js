document.addEventListener('DOMContentLoaded', () => {

    // --- ESTADO INICIAL E ESTRUTURA DE DADOS ---
    const getInitialState = () => ({
        teams: [],
        groupStageGames: [],
        playoffMatches: { qf1: {}, qf2: {}, qf3: {}, qf4: {}, sf1: {}, sf2: {}, final: {}, thirdPlace: {} },
        teamsLocked: false,
        playoffsGenerated: false,
    });
    let state = JSON.parse(localStorage.getItem('tournamentState_v3')) || getInitialState();

    // --- FUNÇÕES DE LÓGICA PRINCIPAL ---
    const saveState = () => localStorage.setItem('tournamentState_v3', JSON.stringify(state));
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

    const generateGroupStageGames = () => {
        if (state.teams.filter(t=>t.group === 'A').length < 2 || state.teams.filter(t=>t.group === 'B').length < 2) {
            alert("É necessário ter pelo menos 2 equipes em cada grupo para gerar os jogos."); return;
        }
        if (!confirm("Tem certeza? Os times serão bloqueados e os jogos da fase de grupos serão gerados.")) return;

        state.teamsLocked = true;
        const games = [];
        ['A', 'B'].forEach(group => {
            const groupTeams = state.teams.filter(t => t.group === group);
            for (let i = 0; i < groupTeams.length; i++) {
                for (let j = i + 1; j < groupTeams.length; j++) {
                    games.push({ id: self.crypto.randomUUID(), t1: groupTeams[i].id, t2: groupTeams[j].id, s1: null, s2: null, group });
                }
            }
        });
        state.groupStageGames = games;
        saveAndRender();
    };
    
    const addMatchResult = (gameId, s1, s2) => {
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
                generatePlayoffs(); // Re-check for next stage
            }
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
        if (state.playoffsGenerated) { // Update existing playoffs
            const { qf1, qf2, qf3, qf4, sf1, sf2 } = state.playoffMatches;
            if (qf1.winner && qf2.winner && !sf1.teams) sf1.teams = [qf1.winner, qf2.winner];
            if (qf3.winner && qf4.winner && !sf2.teams) sf2.teams = [qf3.winner, qf4.winner];
            if (sf1.winner && sf2.winner && !state.playoffMatches.final.teams) {
                state.playoffMatches.final.teams = [sf1.winner, sf2.winner];
                state.playoffMatches.thirdPlace.teams = [sf1.teams.find(id => id !== sf1.winner), sf2.teams.find(id => id !== sf2.winner)];
            }
            return;
        }
        const groupA = state.teams.filter(t => t.group === 'A').sort(sortTeams);
        const groupB = state.teams.filter(t => t.group === 'B').sort(sortTeams);
        if (groupA.length < 4 || groupB.length < 4) { alert("São necessárias 4 equipes em cada grupo que tenham jogado para gerar a fase final."); return; }
        
        state.playoffMatches = {
            qf1: { teams: [groupA[0].id, groupB[3].id] }, qf2: { teams: [groupA[1].id, groupB[2].id] },
            qf3: { teams: [groupB[0].id, groupA[3].id] }, qf4: { teams: [groupB[1].id, groupA[2].id] },
            sf1: {}, sf2: {}, final: {}, thirdPlace: {}
        };
        state.playoffsGenerated = true;
    };
    const sortTeams = (a, b) => b.v - a.v || (b.saldo - a.saldo) || (b.pm - a.pm) || (a.ps - b.ps) || 0;

    // --- FUNÇÕES DE RENDERIZAÇÃO ---
    const render = () => {
        renderTeamManagement();
        renderTables();
        renderGroupStageGames();
        renderBracket();
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
            document.querySelector(`#table-group-${group.toLowerCase()} tbody`).innerHTML = teams.map((t, i) => `
                <tr><td>${i + 1}º</td><td><span class="team-color-badge" style="background-color:${t.color};"></span>${t.name}</td><td>${t.p}</td><td>${t.v}</td><td>${t.d}</td><td>${t.pm}</td><td>${t.ps}</td><td>${t.saldo}</td></tr>`).join('');
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
            if (!matchData.teams) { wrapper.innerHTML = `<div class="match placeholder">${id.toUpperCase()}</div>`; return; }
            wrapper.innerHTML = renderGame({ id, ...matchData });
        });
    };

    const renderGame = (game) => {
        const t1 = state.teams.find(t => t.id === (game.t1 || game.teams[0]));
        const t2 = state.teams.find(t => t.id === (game.t2 || game.teams[1]));
        const s1 = game.s1 ?? game.scores?.[0];
        const s2 = game.s2 ?? game.scores?.[1];

        const teamsHTML = `<span class="teams"><span class="team-color-badge" style="background-color:${t1.color};"></span>${t1.name} vs <span class="team-color-badge" style="background-color:${t2.color};"></span>${t2.name}</span>`;

        if (s1 !== null && s1 !== undefined) {
            return `<div class="final-score">${teamsHTML} <span class="score">${s1} - ${s2}</span></div>`;
        } else {
            return `<form class="inline-result-form" data-game-id="${game.id}">
                        ${teamsHTML}
                        <input type="number" name="s1" placeholder="0" required min="0">
                        <input type="number" name="s2" placeholder="0" required min="0">
                        <button type="submit">✔️</button>
                    </form>`;
        }
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
            addMatchResult(gameId, s1, s2);
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