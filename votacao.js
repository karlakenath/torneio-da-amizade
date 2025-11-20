document.addEventListener('DOMContentLoaded', () => {
    const votacaoFormContainer = document.getElementById('votacao-form-container');
    const votacaoMensagem = document.getElementById('votacao-mensagem');
    const submitVoteButton = document.getElementById('submit-vote-button');

    // Load state from localStorage
    const tournamentState = JSON.parse(localStorage.getItem('tournamentState_v3'));
    let votacaoCraque = JSON.parse(localStorage.getItem('votacaoCraqueState_v1')) || {};
    let userHasVoted = localStorage.getItem('userHasVoted_v1') === 'true';
    const votacaoEncerrada = localStorage.getItem('votacaoEncerrada_v1') === 'true';

    if (!tournamentState || !tournamentState.teamsLocked) {
        votacaoMensagem.innerHTML = 'A votação ainda não foi iniciada ou os times não foram finalizados no sistema principal.';
        submitVoteButton.disabled = true;
        return;
    }

    if (votacaoEncerrada) {
        votacaoMensagem.innerHTML = 'A votação já foi encerrada.';
        submitVoteButton.disabled = true;
        return;
    }

    if (userHasVoted) {
        votacaoMensagem.innerHTML = 'Você já votou. Obrigada!';
        submitVoteButton.disabled = true;
        return;
    }

    const teams = tournamentState.teams;
    let playersForVoting = [];

    teams.forEach(team => {
        const baseTeamName = team.name.split('/')[0].trim(); // Extract base team name
        const playerNames = team.name.split('/').map(name => name.trim());
        playerNames.forEach((playerName, index) => {
            const atletaId = `${team.id}-${index + 1}`;
            playersForVoting.push({
                id: atletaId,
                teamId: team.id,
                baseTeamName: baseTeamName, // Store the base team name
                playerName: playerName,
                color: team.color
            });
            // Ensure votacaoCraque has an entry for this player, initialize if not present
            if (!(atletaId in votacaoCraque)) {
                votacaoCraque[atletaId] = 0;
            }
        });
    });

    // Render player cards
    if (playersForVoting.length > 0) {
        votacaoFormContainer.innerHTML = playersForVoting.map(player => `
            <div class="votacao-atleta-item">
                <input type="radio" id="${player.id}" name="craque" value="${player.id}" required>
                <label for="${player.id}" class="votacao-atleta-label">
                    <span class="team-color-badge" style="background-color:${player.color};"></span>
                    <span class="team-name">${player.baseTeamName} – ${player.playerName}</span>
                </label>
            </div>
        `).join('');
    } else {
        votacaoMensagem.innerHTML = 'Nenhuma atleta disponível para votação.';
        submitVoteButton.disabled = true;
    }

    // Handle form submission
    document.getElementById('votacao-form').addEventListener('submit', (e) => {
        e.preventDefault();

        if (userHasVoted || votacaoEncerrada) {
            votacaoMensagem.innerHTML = userHasVoted ? 'Você já votou. Obrigada!' : 'A votação já foi encerrada.';
            submitVoteButton.disabled = true;
            return;
        }

        const selectedPlayerId = document.querySelector('input[name="craque"]:checked')?.value;

        if (selectedPlayerId) {
            if (votacaoCraque.hasOwnProperty(selectedPlayerId)) {
                votacaoCraque[selectedPlayerId]++;
                localStorage.setItem('votacaoCraqueState_v1', JSON.stringify(votacaoCraque));
                localStorage.setItem('userHasVoted_v1', 'true');
                window.location.href = 'voto-confirmado.html';
            } else {
                votacaoMensagem.innerHTML = 'Erro: Atleta selecionada não encontrada na lista de votação.';
            }
        } else {
            votacaoMensagem.innerHTML = 'Por favor, selecione uma atleta para votar.';
        }
    });
});
