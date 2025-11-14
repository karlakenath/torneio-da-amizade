document.addEventListener('DOMContentLoaded', () => {

    // --- ESTADO INICIAL DINÂMICO ---
    const getInitialState = () => ({
        teams: [],
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
        isGroupStageFinalized: false,
    });

    let state = JSON.parse(localStorage.getItem('tournamentState')) || getInitialState();

    // --- FUNÇÕES DE LÓGICA ---
    const saveState = () => localStorage.setItem('tournamentState', JSON.stringify(state));

    const addTeam = (name, color, group) => {
        if (state.teams.some(t => t.name.toLowerCase() === name.toLowerCase())) {
            alert(`A equipe "${name}" já existe.`);
            return;
        }
        const newTeam = {
            id: name.toLowerCase().replace(/\s+/g, '-'),
            name, color, group,
            p: 0, v: 0, d: 0, pm: 0, ps: 0, saldo: 0, gamesPlayed: 0
        };
        state.teams.push(newTeam);
        saveState();
        render();
    };

    const addMatchResult = (team1Id, score1, team2Id, score2) => {
        const team1 = state.teams.find(t => t.id === team1Id);
        const team2 = state.teams.find(t => t.id === team2Id);
        if (!team1 || !team2) return;

        const isPlayoff = state.isGroupStageFinalized;
        const pointSystem = isPlayoff ? { w: 0, l: 0 } : { w: 2, l: 1 };

        team1.pm += score1; team1.ps += score2;
        team2.pm += score2; team2.ps += score1;
        team1.saldo = team1.pm - team1.ps;
        team2.saldo = team2.pm - team2.ps;

        const winner = score1 > score2 ? team1 : team2;
        const loser = score1 > score2 ? team2 : team1;

        winner.v += 1; loser.d += 1;
        winner.p += pointSystem.w; loser.p += pointSystem.l;
        
        if (!isPlayoff) {
            team1.gamesPlayed++; team2.gamesPlayed++;
        } else {
            const matchId = findPlayoffMatchId(team1Id, team2Id);
            if (matchId) {
                state.playoffMatches[matchId].scores = [score1, score2];
                state.playoffMatches[matchId].winner = winner.id;
                updatePlayoffs();
            }
        }
        saveState();
        render();
    };

    const finalizeGroupStage = () => {
        if (!confirm("Tem certeza? Após finalizar, não será possível adicionar mais times ou jogos na fase de grupos.")) return;
        
        state.isGroupStageFinalized = true;
        const groupA = state.teams.filter(t => t.group === 'A').sort(sortTeams);
        const groupB = state.teams.filter(t => t.group === 'B').sort(sortTeams);

        if (groupA.length < 4 || groupB.length < 4) {
            alert("Ambos os grupos precisam de pelo menos 4 equipes para gerar o chaveamento.");
            state.isGroupStageFinalized = false;
            return;
        }

        state.playoffMatches.qf1.teams = [groupA[0].id, groupB[3].id]; // 1A x 4B
        state.playoffMatches.qf2.teams = [groupA[1].id, groupB[2].id]; // 2A x 3B
        state.playoffMatches.qf3.teams = [groupB[0].id, groupA[3].id]; // 1B x 4A
        state.playoffMatches.qf4.teams = [groupB[1].id, groupA[2].id]; // 2B x 3A
        
        saveState();
        render();
    };

    const updatePlayoffs = () => {
        const { qf1, qf2, qf3, qf4, sf1, sf2 } = state.playoffMatches;
        if (qf1.winner && qf2.winner && !sf1.teams[0]) sf1.teams = [qf1.winner, qf2.winner];
        if (qf3.winner && qf4.winner && !sf2.teams[0]) sf2.teams = [qf3.winner, qf4.winner];
        if (sf1.winner && sf2.winner && !state.playoffMatches.final.teams[0]) {
            state.playoffMatches.final.teams = [sf1.winner, sf2.winner];
            const sf1Loser = sf1.teams.find(id => id !== sf1.winner);
            const sf2Loser = sf2.teams.find(id => id !== sf2.winner);
            state.playoffMatches.thirdPlace.teams = [sf1Loser, sf2Loser];
        }
    };

    const findPlayoffMatchId = (t1, t2) => Object.keys(state.playoffMatches).find(id => state.playoffMatches[id].teams.includes(t1) && state.playoffMatches[id].teams.includes(t2));
    const sortTeams = (a, b) => b.v - a.v || (b.saldo - a.saldo) || (b.pm - a.pm) || (a.ps - b.ps) || 0;

    // --- FUNÇÕES DE RENDERIZAÇÃO ---
    const render = () => {
        renderTables();
        populateSelectors();
        renderBracket();
        updateUIOnFinalize();
    };

    const renderTables = () => {
        const renderGroup = (group) => {
            const teams = state.teams.filter(t => t.group === group).sort(sortTeams);
            const tableBody = document.querySelector(`#table-group-${group.toLowerCase()} tbody`);
            tableBody.innerHTML = teams.map((team, i) => `
                <tr>
                    <td>${i + 1}º</td>
                    <td><span class="team-color-badge" style="background-color: ${team.color};"></span>${team.name}</td>
                    <td>${team.p}</td><td>${team.v}</td><td>${team.d}</td>
                    <td>${team.pm}</td><td>${team.ps}</td><td>${team.saldo}</td>
                </tr>`).join('');
        };
        renderGroup('A');
        renderGroup('B');
    };

    const populateSelectors = () => {
        const teamOptions = state.teams.map(team => `<option value="${team.id}" style="background-color:${team.color}; color:${isColorLight(team.color) ? '#000' : '#FFF'};">${team.name}</option>`).join('');
        const selects = [document.getElementById('team1'), document.getElementById('team2')];
        selects.forEach(s => {
            const val = s.value;
            s.innerHTML = '<option value="" disabled selected>Selecione</option>' + teamOptions;
            s.value = val;
        });
    };

    const renderBracket = () => {
        Object.keys(state.playoffMatches).forEach(matchId => {
            const matchEl = document.getElementById(matchId);
            const matchData = state.playoffMatches[matchId];
            matchEl.innerHTML = generateMatchHTML(matchData, matchId);
        });
    };

    const generateMatchHTML = (matchData, matchId) => {
        const [id1, id2] = matchData.teams;
        if (!id1 || !id2) {
            const placeholders = { qf1: '1º A vs 4º B', qf2: '2º A vs 3º B', qf3: '1º B vs 4º A', qf4: '2º B vs 3º A', sf1: 'Vencedor QF1/QF2', sf2: 'Vencedor QF3/QF4', final: 'Vencedor SF1/SF2', thirdPlace: 'Perdedor SF1/SF2' };
            return `<div class="placeholder">${placeholders[matchId]}</div>`;
        }
        const team1 = state.teams.find(t => t.id === id1);
        const team2 = state.teams.find(t => t.id === id2);
        const [s1, s2] = matchData.scores;

        const getTeamHTML = (team, score, opponentScore) => {
            let status = score > opponentScore ? 'winner' : (score < opponentScore ? 'loser' : '');
            return `<div class="match-team ${status}">
                        <span class="team-name"><span class="team-color-badge" style="background-color: ${team.color};"></span>${team.name}</span>
                        <span class="team-score">${score ?? ''}</span>
                    </div>`;
        };
        return getTeamHTML(team1, s1, s2) + getTeamHTML(team2, s2, s1);
    };

    const updateUIOnFinalize = () => {
        const isFinalized = state.isGroupStageFinalized;
        document.querySelectorAll('.add-team-form button, .add-team-form input').forEach(el => el.disabled = isFinalized);
        document.getElementById('finalize-groups-button').disabled = isFinalized;
    };

    const isColorLight = (hexColor) => {
        const r = parseInt(hexColor.substr(1, 2), 16);
        const g = parseInt(hexColor.substr(3, 2), 16);
        const b = parseInt(hexColor.substr(5, 2), 16);
        return (r * 299 + g * 587 + b * 114) / 1000 > 150;
    };

    // --- EVENT LISTENERS ---
    document.querySelectorAll('.add-team-form').forEach(form => {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const group = form.dataset.group;
            const nameInput = form.querySelector('input[type="text"]');
            const colorInput = form.querySelector('input[type="color"]');
            addTeam(nameInput.value, colorInput.value, group);
            form.reset();
        });
    });

    document.getElementById('result-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const form = e.target;
        if (form.team1.value === form.team2.value) {
            alert("Uma equipe não pode jogar contra si mesma."); return;
        }
        addMatchResult(form.team1.value, parseInt(form.score1.value), form.team2.value, parseInt(form.score2.value));
        form.reset();
    });

    document.getElementById('finalize-groups-button').addEventListener('click', finalizeGroupStage);
    document.getElementById('reset-button').addEventListener('click', () => {
        if (confirm("Tem certeza? TODO o progresso será perdido.")) {
            localStorage.removeItem('tournamentState');
            state = getInitialState();
            render();
        }
    });

    // --- INICIALIZAÇÃO ---
    render();
});