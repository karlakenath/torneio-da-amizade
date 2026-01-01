const configTorneio = {
  // Configuração geral do torneio
  grupos: 2, // Número de grupos (ex: 2 para 'A' e 'B')
  equipesPorGrupo: "dinamico", // "dinamico" ou um número fixo

  // Fase de Grupos
  faseGrupos: {
    tipo: "round-robin", // Todos contra todos dentro do grupo
    pontosPorJogo: 15, // Pontuação máxima em um jogo de grupo (não implementado ainda, mas preparado)
    vitoria: 2, // Pontos por vitória
    derrota: 1, // Pontos por derrota
  },

  // Classificação e cruzamentos
  classificacao: {
    // Define como as equipes avançam de cada grupo
    regras: [
      {
        posicao: 1, // 1º lugar do grupo
        avancaPara: "semifinal", // Avança direto para a semifinal
      },
      {
        posicao: 2, // 2º lugar
        avancaPara: "pre-semifinal", // Joga uma pré-semifinal
      },
      {
        posicao: 3, // 3º lugar
        avancaPara: "pre-semifinal", // Joga uma pré-semifinal
      },
    ],
    // Define os confrontos da fase de mata-mata inicial
    cruzamentos: {
      "pre-semifinal": [
        {
          id: "psf1",
          nome: "Pré-Semi 1",
          jogo: ["2A", "3B"], // 2º do Grupo A vs 3º do Grupo B
        },
        {
          id: "psf2",
          nome: "Pré-Semi 2",
          jogo: ["2B", "3A"], // 2º do Grupo B vs 3º do Grupo A
        },
      ],
      semifinal: [
        {
          id: "sf1",
          nome: "Semi 1",
          jogo: ["1A", "vencedor_psf2"], // 1º do A vs Vencedor da Pré-Semi 2
        },
        {
          id: "sf2",
          nome: "Semi 2",
          jogo: ["1B", "vencedor_psf1"], // 1º do B vs Vencedor da Pré-Semi 1
        },
      ],
      final: [
        {
            id: "final",
            nome: "Final",
            jogo: ["vencedor_sf1", "vencedor_sf2"]
        }
      ],
      terceiroLugar: [
        {
            id: "terceiro",
            nome: "Disputa 3º Lugar",
            jogo: ["perdedor_sf1", "perdedor_sf2"]
        }
      ]
    },
    eliminaAPartirDoQuarto: true, // 4º lugar em diante é eliminado
  },

  // Fases Finais (Mata-mata)
  fasesFinais: {
    "pre-semifinal": true, // Ativa a fase de pré-semifinal
    quartas: false, // Não há quartas de final neste formato
    semifinal: true, // Há semifinal
    final: true, // Há final
    terceiroLugar: true, // Há disputa de 3º lugar
  },

  // Pontuação nos jogos de mata-mata
  pontuacao: {
    quartas: 18,
    semifinal: 21,
    final: 21,
    "pre-semifinal": 18, // Pontuação para a pré-semifinal
    "terceiro-lugar": 18,
  },

  // Funcionalidades extras
  votacao: {
    ativa: false, // Votação de "craque da galera" (ainda não implementado)
    tipo: "craque-da-galera",
  },
  premiosIndividuais: false, // Prêmios para destaques individuais (ainda não implementado)
};
