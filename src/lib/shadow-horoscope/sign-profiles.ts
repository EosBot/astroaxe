/**
 * Dicionário autoral de sombras por signo para o Horóscopo Sombrio.
 *
 * Estas frases NÃO são cópia de nenhuma obra. São síntese original do projeto
 * AstroAxe, derivada da função estrutural de cada arquétipo e escrita para a
 * voz sarcástica do módulo. Cada signo recebe um perfil de defeitos recorrentes
 * que a camada composicional combina com planeta, casa e aspecto do mapa real.
 */

export interface SignShadowProfile {
  readonly sign: string;
  readonly socialVersion: string;
  readonly problem: string;
  readonly ego: string;
  readonly communication: string;
  readonly emotional: string;
  readonly love: string;
  readonly anger: string;
  readonly relationship: string;
  readonly selfSabotage: string;
  readonly virtueShadow: string;
  readonly redFlags: readonly string[];
}

export const SIGN_SHADOW_PROFILES: Readonly<Record<string, SignShadowProfile>> = {
  Áries: {
    sign: "Áries",
    socialVersion:
      "Você se apresenta como quem tem iniciativa, coragem e zero paciência para gente parada. Só que iniciativa também tem um nome técnico: começar antes de entender.",
    problem:
      "O problema não é a coragem. É que seu senso de urgência transforma qualquer demora em conspiração pessoal contra o seu tempo.",
    ego:
      "Seu ego não pede desculpa; ele produz um relatório explicando por que a briga era necessária e por que o outro deveria agradecer.",
    communication:
      "Você chama de sinceridade o que tecnicamente é um foguete com opinião e sem freio.",
    emotional:
      "Emoção para você dura o tempo de uma discussão: nasce, explode e vira outra coisa antes que o corpo alcance.",
    love:
      "Você se apaixona rápido. E quando a pessoa demora a responder, conclui que ela entrou em greve de afeto.",
    anger:
      "Sua raiva não é guardada; ela é terceirizada para o primeiro ambiente disponível.",
    relationship:
      "Você gosta de parceria, desde que a pessoa entenda que 'juntos' significa 'você lidera e eu concordo depois'.",
    selfSabotage:
      "Você sabota prometendo calma enquanto a perna já balança para iniciar a próxima briga.",
    virtueShadow: "Coragem vira imprudência; liberdade vira incapacidade de esperar.",
    redFlags: [
      "🚩 chama de proatividade o que o grupo chama de atropelamento.",
      "🚩 termina a frase dos outros e depois cobra o enredo.",
      "🚩 acredita que pedir desculpa é uma forma de atraso.",
    ],
  },
  Touro: {
    sign: "Touro",
    socialVersion:
      "Você parece estável, paciente e dono de um apetite admirável. Estável é só o nome educado para difícil de mover.",
    problem:
      "O problema é que segurança, para você, frequentemente significa que nada pode mudar — inclusive você.",
    ego:
      "Seu orgulho não se exibe; ele senta, espera e faz você continuar exatamente onde está até o outro desistir.",
    communication:
      "Você não argumenta muito. Repete a mesma posição com entonações diferentes até a outra pessoa cansar.",
    emotional:
      "Você sente devagar, mas quando sente compra a emoção, mobilia e não quer devolver.",
    love:
      "Você ama com presença e com inventário: se escolheu alguém, considera que a pessoa entrou no seu patrimônio emocional.",
    anger:
      "Demora para explodir. O problema é que a explosão parece ter sido planejada com meses de antecedência.",
    relationship:
      "Você é fiel, estável e perigosamente apegado ao conforto. O outro pode confundir carinho com dependência de rotina.",
    selfSabotage: "Você sabota esperando tanto a hora certa que ela passa sem avisar.",
    virtueShadow: "Persistência vira teimosia; segurança vira possessividade.",
    redFlags: [
      "🚩 chama de preservar a paz o que é não aceitar mudança de cardápio.",
      "🚩 resolve conflito oferecendo comida e mudando de assunto.",
      "🚩 acha que ciúme é só cuidado com bom estoque afetivo.",
    ],
  },
  Gêmeos: {
    sign: "Gêmeos",
    socialVersion:
      "Você se apresenta como curioso, ágil e dono de uma conversa excelente. A conversa é excelente, mas costuma ter três autores dentro da sua cabeça.",
    problem:
      "O problema é que você sabe argumentar a favor, contra e em cima do muro antes do café terminar.",
    ego: "Seu ego precisa ser lembrado de que entender tudo não é o mesmo que decidir algo.",
    communication:
      "Você chama de diálogo o que é uma entrevista com você mesmo em tempo real.",
    emotional:
      "Sua emoção vira dado, vira piada, vira curiosidade. Ela raramente vira permanência.",
    love:
      "Você se apaixona pela conversa e depois descobre que o relacionamento também exige silêncio.",
    anger:
      "Sua raiva parece leve, mas é rápida: comenta, ironiza, corrige o pronome e sai.",
    relationship:
      "Você quer liberdade e companhia, preferencialmente ao mesmo tempo e com sinal de internet.",
    selfSabotage: "Você sabota transformando decisão em pesquisa de opinião.",
    virtueShadow: "Curiosidade vira dispersão; inteligência vira racionalização.",
    redFlags: [
      "🚩 chama de mente aberta o que é não escolher nem o jantar.",
      "🚩 responde uma pergunta séria com 'depende'.",
      "🚩 acha que visualizou e não respondeu é uma resposta.",
    ],
  },
  Câncer: {
    sign: "Câncer",
    socialVersion:
      "Você se apresenta como quem cuida, acolhe e lembra de tudo. Lembra tanto que às vezes esquece de perdoar.",
    problem:
      "O problema é que sua memória emocional é um arquivo vivo, indexado por quem feriu, quando e qual foi a entonação.",
    ego: "Seu ego não quer trono; quer cozinha, quarto e a certeza de que ninguém vai embora.",
    communication:
      "Você não diz o que sente. Espera que a pessoa perceba pela temperatura do 'oi'.",
    emotional: "Sua emoção é profunda, mas usa indiretas para evitar exposição.",
    love: "Você ama cuidando. E cobra o cuidado de volta com juros emocionais.",
    anger:
      "Sua raiva se disfarça de silêncio e depois vira frase passivo-agressiva em dia de família.",
    relationship:
      "Você quer intimidade total, mas frequentemente constrói uma fortaleza com campainha e espera que o outro entre sozinho.",
    selfSabotage: "Você sabota acumulando ressentimento sem contar o que feriu.",
    virtueShadow: "Cuidado vira controle; sensibilidade vira chantagem emocional.",
    redFlags: [
      "🚩 chama de proteger o que é vigiar quem curtiu a foto.",
      "🚩 diz que está bem com uma voz de enterro.",
      "🚩 cobra lealdade por algo que nunca pediu em voz alta.",
    ],
  },
  Leão: {
    sign: "Leão",
    socialVersion:
      "Você se apresenta como confiante, generoso e feito para brilhar. O brilho é real; a necessidade de plateia também.",
    problem: "O problema é que reconhecimento, para você, não é vaidade: é oxigênio.",
    ego: "Seu ego pode transformar um elogio atrasado em uma ferida histórica.",
    communication:
      "Você narra sua vida com trilha sonora e espera que o público acompanhe a temporada.",
    emotional: "Sua emoção é quente, leal e ofendida quando não vira centro.",
    love:
      "Você ama com pompa. Se a pessoa não demonstra do jeito esperado, conclui que ela não entendeu a grandiosidade.",
    anger:
      "Sua raiva é teatral, mas real. Quanto mais diz 'não ligo', mais ensaia a próxima fala.",
    relationship: "Você quer ser adorado sem parecer que pediu adoração.",
    selfSabotage: "Você sabota acreditando que ser substituível é a pior das ofensas.",
    virtueShadow: "Autoconfiança vira necessidade de aplauso; generosidade vira pagamento por validação.",
    redFlags: [
      "🚩 chama de humildade aceitar elogio só até a terceira frase.",
      "🚩 fica magoado se ninguém pergunta da apresentação.",
      "🚩 usa 'meu bem' enquanto brilha sozinho na conversa.",
    ],
  },
  Virgem: {
    sign: "Virgem",
    socialVersion:
      "Você se apresenta como útil, detalhista e competente. Detalhista é o nome diplomático para revisor da vida alheia.",
    problem:
      "O problema é que você não aponta defeito por maldade: aponta por vocação e depois fica ofendido se ninguém agradece.",
    ego: "Seu ego se esconde em estar certo e em ser indispensável.",
    communication:
      "Você chama de feedback o que o outro chama de lista de falhas com nota e referência.",
    emotional: "Sua emoção vira tarefa. Sentir, para você, costuma ser uma pendência que precisa de método.",
    love:
      "Você demonstra amor organizando. Depois sofre porque a pessoa não percebeu o estoque de carinho nas planilhas.",
    anger: "Sua raiva é silenciosa, precisa e manifestada em observações muito bem escritas.",
    relationship: "Você quer entrega, consistência e ordem, e chama isso de básico.",
    selfSabotage: "Você sabota esperando perfeição antes de começar.",
    virtueShadow: "Praticidade vira frieza; discernimento vira crítica infinita.",
    redFlags: [
      "🚩 chama de ajudar o que é reorganizar a bolsa dos outros.",
      "🚩 responde 'eu só perguntei' depois de uma auditoria completa.",
      "🚩 ama mais o processo do que o resultado.",
    ],
  },
  Libra: {
    sign: "Libra",
    socialVersion:
      "Você se apresenta como educado, justo e ótimo para mediar. Justo, até a decisão envolver você.",
    problem:
      "O problema é que agradar todo mundo é uma estratégia que termina com você concordando com dois lados opostos.",
    ego: "Seu ego precisa parecer razoável, mesmo quando está sendo evasivo.",
    communication:
      "Você chama de ponderação o que às vezes é incapacidade de dizer não.",
    emotional: "Sua emoção procura equilíbrio, mas pode virar diplomacia exaustiva.",
    love:
      "Você se apaixona pela ideia da relação e demora para aceitar que a pessoa real faz barulho.",
    anger: "Sua raiva aparece com sorriso, indireta elegante e um 'não é nada' que é muita coisa.",
    relationship: "Você quer harmonia e evita conflito até o conflito morar na sala.",
    selfSabotage: "Você sabota consultando tanta gente que esquece o que queria.",
    virtueShadow: "Diplomacia vira covardia relacional; senso estético vira frieza de julgamento.",
    redFlags: [
      "🚩 chama de consenso fazer reunião para escolher onde almoçar.",
      "🚩 diz 'não sei' quando já decidiu que não.",
      "🚩 confunde paz com enterrar o assunto.",
    ],
  },
  Escorpião: {
    sign: "Escorpião",
    socialVersion:
      "Você se apresenta como reservado, intenso e capaz de ler qualquer ambiente. Lê, registra e às vezes abre investigação.",
    problem:
      "O problema é que você não confia fácil. E quando confia, cria um contrato invisível que a outra pessoa não assinou.",
    ego: "Seu ego não precisa de atenção; precisa de profundidade, poder e certeza.",
    communication:
      "Você fala pouco, observa muito e guarda a frase decisiva para o pior momento.",
    emotional: "Sua emoção não é rasa; é uma correnteza com biografia.",
    love: "Você ama com intensidade e quer exclusividade quase forense.",
    anger:
      "Sua raiva é silenciosa, transformadora e capaz de durar décadas com a mesma qualidade.",
    relationship: "Você quer entrega absoluta, mas só mostra a senha depois de testar a pessoa.",
    selfSabotage: "Você sabota transformando vínculo em prova de resistência.",
    virtueShadow: "Profundidade vira obsessão; poder vira controle.",
    redFlags: [
      "🚩 chama de pesquisa ler anos de curtidas antigas.",
      "🚩 perdoa, mas não esquece nem o que não aconteceu.",
      "🚩 diz 'está tudo bem' enquanto investiga o significado do silêncio.",
    ],
  },
  Sagitário: {
    sign: "Sagitário",
    socialVersion:
      "Você se apresenta como livre, otimista e sincero. A sinceridade às vezes chega antes do contexto.",
    problem:
      "O problema é que sua liberdade precisa de horizonte, e qualquer rotina parece uma gaiola com Wi-Fi.",
    ego: "Seu ego acredita que toda opinião sua é uma missão educativa.",
    communication:
      "Você chama de verdade o que o outro chama de atropelo com risada.",
    emotional: "Sua emoção é rápida e prefere viagem a permanência.",
    anger: "Sua raiva é barulhenta, filosófica e termina em frase de autoajuda.",
    love:
      "Você ama com entusiasmo e some quando a relação começa a pedir agenda.",
    relationship: "Você quer aventura e fidelidade, desde que a aventura seja a prioridade.",
    selfSabotage: "Você sabota prometendo futuro enquanto foge do presente.",
    virtueShadow: "Otimismo vira negação; liberdade vira fuga.",
    redFlags: [
      "🚩 chama de flexibilidade não confirmar nada.",
      "🚩 faz piada quando a conversa pede escuta.",
      "🚩 diz 'a gente vê' e desaparece.",
    ],
  },
  Capricórnio: {
    sign: "Capricórnio",
    socialVersion:
      "Você se apresenta como responsável, estratégico e sóbrio. Sóbrio é a palavra que você usa para não admitir que sente.",
    problem: "O problema é que controle vira objetivo, e tudo vira meta, inclusive o amor.",
    ego: "Seu ego se alimenta de resultado, título e da sensação de que você aguentou mais.",
    communication:
      "Você fala por entregas. Às vezes entrega um silêncio e chama de gestão.",
    emotional: "Sua emoção é arquivada até ter utilidade estratégica.",
    love:
      "Você demonstra afeto construindo segurança. Depois fica surpreso quando a pessoa queria conversa.",
    anger:
      "Sua raiva é fria e administrativa: define consequência, prazo e segue a vida.",
    relationship: "Você quer compromisso sério, mas frequentemente trata o vínculo como um cargo.",
    selfSabotage: "Você sabota adiando descanso e chamando de disciplina.",
    virtueShadow: "Responsabilidade vira rigidez; ambição vira frieza.",
    redFlags: [
      "🚩 chama de planejamento controlar o fim de semana.",
      "🚩 responde 'ok' e depois envia planilha.",
      "🚩 confunde vulnerabilidade com desorganização.",
    ],
  },
  Aquário: {
    sign: "Aquário",
    socialVersion:
      "Você se apresenta como autônomo, visionário e acima de dramas. Acima é uma palavra que usa para não ficar perto.",
    problem:
      "O problema é que você quer revolucionar o mundo, mas acha reunião de condomínio uma perda de tempo.",
    ego:
      "Seu ego se orgulha de não ser igual, mesmo quando isso é só teimosia com nome futurista.",
    communication:
      "Você explica sentimentos como se fossem teoria e depois pergunta por que ninguém se emocionou.",
    emotional: "Sua emoção vira conceito. É profunda, mas tem dificuldade de aterrissar.",
    love: "Você ama à sua distância, e chama de espaço o que o outro chama de frio.",
    anger: "Sua raiva é intelectualizada e sai com argumento, nunca com lágrima.",
    relationship:
      "Você quer conexão e independência; o outro frequentemente recebe só a independência.",
    selfSabotage: "Você sabota transformando intimidade em projeto.",
    virtueShadow: "Originalidade vira contrarianismo; autonomia vira distanciamento.",
    redFlags: [
      "🚩 chama de pensar fora da caixa o que é ignorar o problema.",
      "🚩 responde 'interessante' quando era uma confissão.",
      "🚩 some para 'processar' e volta com um manifesto.",
    ],
  },
  Peixes: {
    sign: "Peixes",
    socialVersion:
      "Você se apresenta como sensível, criativo e conectado com o todo. O todo inclui também o que não foi dito, o que não existe e o que você imaginou.",
    problem:
      "O problema é que a fronteira entre intuição e fantasia é mal sinalizada no seu mapa.",
    ego: "Seu ego se dissolve e, quando volta, quer que alguém o salve com delicadeza.",
    communication:
      "Você comunica por atmosfera. Depois cobra resposta de uma pergunta que não fez.",
    emotional:
      "Sua emoção é um oceano; o problema é que às vezes você esquece de voltar para a praia.",
    love: "Você ama a versão idealizada da pessoa e se decepciona com o ser humano.",
    anger: "Sua raiva vira tristeza, vira poesia e raramente vira frase clara.",
    relationship: "Você quer fusão, mas confunde entrega com desaparecer no outro.",
    selfSabotage: "Você sabota adiando limites porque dói dizer não.",
    virtueShadow: "Sensibilidade vira fuga; imaginação vira autoengano.",
    redFlags: [
      "🚩 chama de empatia absorver o problema e ficar pior que a pessoa.",
      "🚩 termina antes de começar para não sofrer.",
      "🚩 responde 'senti uma energia' e espera que isso resolva.",
    ],
  },
};

export function signShadowProfile(sign: string): SignShadowProfile {
  const profile = SIGN_SHADOW_PROFILES[sign];
  if (profile !== undefined) return profile;
  return {
    sign,
    socialVersion: "Seu mapa apresenta uma configuração difícil de resumir em arquétipo único.",
    problem: "A dificuldade começa justamente aí: muita coisa pedindo atenção ao mesmo tempo.",
    ego: "O ego desta combinação costuma se defender mantendo o controle da narrativa.",
    communication: "A comunicação tende a ser mais elaborada do que direta.",
    emotional: "A base emocional reage antes de conferir se o perigo é real.",
    love: "No afeto, há tendência a idealizar antes de observar.",
    anger: "A irritação aparece quando o controle da narrativa é ameaçado.",
    relationship: "Os vínculos pedem clareza que o mapa ainda hesita em oferecer.",
    selfSabotage: "A sabotagem aparece quando adiar parece mais seguro do que decidir.",
    virtueShadow: "Qualidade e defeito compartilham a mesma raiz neste mapa.",
    redFlags: [
      "🚩 chama de sensatez o que é simplesmente protelação.",
      "🚩 confunde silêncio com maturidade.",
    ],
  };
}
