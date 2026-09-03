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
      "Iniciativa, coragem e impaciência são seu cartão de visitas – embora a iniciativa muitas vezes seja apenas o ato de começar antes de entender o jogo.",
    problem:
      "Seu senso de urgência transforma cada espera em uma suposta sabotagem do universo contra sua agenda.",
    ego:
      "Seu ego não pede desculpa; elabora um relatório detalhado explicando por que o conflito foi inevitável e por que o outro deveria lhe agradecer.",
    communication:
      "Você chama de franqueza o que, tecnicamente, é um projétil de opinião lançado sem sistema de guiamento.",
    emotional:
      "Seus sentimentos têm a vida útil de uma discussão: nascem, explodem e se transformam antes que o corpo consiga acompanhar.",
    love:
      "Você se apaixona em velocidade de relâmpago; diante de uma resposta lenta, conclui que o outro entrou em greve de afetividade.",
    anger:
      "Sua ira não é arquivada; é terceirizada para o primeiro ambiente que der espaço.",
    relationship:
      "Você valoriza parceria, desde que o parceiro compreenda que 'juntos' significa 'você conduz, eu acompanho depois'.",
    selfSabotage:
      "Você promete tranquilidade enquanto o pé já bate o chão para a próxima troca de acusações.",
    virtueShadow: "Coragem vira imprudência; liberdade vira incapacidade de aguardar.",
    redFlags: [
      "🚩 chama de ação preventiva o que o grupo chama de interrompê‑los antes de terminarem a frase.",
      "🚩 termina suas frases e depois cobra o resumo do que você acabou de dizer.",
      "🚩 acredita que pedir perdão é apenas mais um item na lista de atrasos.",
    ],
  },
  Touro: {
    sign: "Touro",
    socialVersion:
      "Estabilidade, paciência e um apetite à prova de crises são seu estilo – embora a estabilidade frequentemente seja apenas resistência ao movimento.",
    problem:
      "Para você, segurança costuma significar que nada pode mudar, inclusive você mesmo.",
    ego:
      "Seu orgulho não grita; ele se assenta, espera e faz você permanecer no mesmo lugar até que o outro desista primeiro.",
    communication:
      "Você raramente entra em debate; repete a mesma posição com diferentes entonações até o interlocutor desistir.",
    emotional:
      "Seus sentimentos chegam devagar, mas quando chegam você os compra, mobila e se recusa a devolver a posse.",
    love:
      "Você ama com presença e com inventário de bens: ao escolher alguém, considera que a pessoa passou a fazer parte do seu patrimônio afetivo.",
    anger:
      "Sua explosão é lenta de acender, mas quando ocorre parece ter sido planejada com antecedência meticulosa.",
    relationship:
      "Fiel, estável e apegado ao conforto, você pode ser confundido como alguém cujo carinho depende da manutenção da rotina.",
    selfSabotage:
      "Você deixa a oportunidade passar esperando o momento perfeito que nunca chega exatamente quando você acha que deve.",
    virtueShadow: "Teimosia nasce da persistência; possessividade nasce da busca por segurança.",
    redFlags: [
      "🚩 chama de preservar a harmonia o que é recusar mudar o cardápio mesmo quando todos já pediram outra coisa.",
      "🚩 resolve o desconforto oferecendo lanche e desviando o assunto para algo totalmente diferente.",
      "🚩 interpreta ciúme como prova de que está cuidando bem do estoque afetivo.",
    ],
  },
  Gêmeos: {
    sign: "Gêmeos",
    socialVersion:
      "Curiosidade, agilidade e facilidade de conversa são seu cartão – embora essa conversa muitas vezes tenha três autores diferentes dentro da sua cabeça.",
    problem:
      "Você consegue argumentar a favor, contra e até pelo meio‑do‑caminho antes mesmo de terminar o primeiro copo de café.",
    ego:
      "Seu ego precisa ser lembrado de que entender tudo não é o mesmo que decidir algo definitivo.",
    communication:
      "Você chama de diálogo o que, na prática, é uma entrevista coletiva com você mesmo em tempo real.",
    emotional:
      "Sua emoção vira dado, vira piada, vira curiosidade – raramente se instala como estado duradouro.",
    love:
      "Você se apaixona pelo papo e depois descobre que manter o relacionamento também exige momentos de silêncio.",
    anger:
      "Sua irritação aparece leve, mas age rápido: comenta, ironiza, corrige o pronome e some antes que alguém perceba.",
    relationship:
      "Você deseja liberdade e companhia, de preferência simultâneas e com sinal de internet garantido.",
    selfSabotage:
      "Você adianta decisões transformando‑as em intermináveis pesquisas de opinião que nunca chegam a concluir nada.",
    virtueShadow: "Curiosidade se espalha em dispersão; inteligência vira ferramenta de auto‑justificação.",
    redFlags: [
      "🚩 chama de mente aberta o que é não conseguir escolher nem o prato do almoço.",
      "🚩 responde a qualquer questão séria com um evasivo 'depende'.",
      "🚩 considera que ter visto a mensagem e não ter respondido já conta como resposta.",
    ],
  },
  Câncer: {
    sign: "Câncer",
    socialVersion:
      "Você se apresenta como quem acolhe, lembra de tudo e zela pelos outros – embora essa memória às vezes se transforme em ressentimento arquivado.",
    problem:
      "Sua memória emocional funciona como um banco de dados vivo, indexado por quem feriu, quando e com que tom de voz.",
    ego:
      "Seu ego não almeja um trono; busca cozinha, quarto e a certeza de que ninguém vai embora sem seu consentimento.",
    communication:
      "Você não costuma declarar seus sentimentos; espera que o outro perceba pela temperatura do simples 'oi'.",
    emotional:
      "Sua emoção é profunda, porém prefere falar por meio de indiretas para evitar exposição direta.",
    love:
      "Você demonstra afeto cuidando do outro; em seguida cobra o retorno desse cuidado com juros emocionais.",
    anger:
      "Sua raiva se veste de silêncio e, depois, aparece como frase passivo‑agressiva nas reuniões de família.",
    relationship:
      "Você anseia por intimidade total, mas costuma erguer uma cerca com campainha, esperando que o outro entre por conta própria.",
    selfSabotage:
      "Você acumula mágoas sem jamais nomear o que exatamente lhe causou dor.",
    virtueShadow: "Cuidado pode se voltar para controle; sensibilidade pode virar chantagem emocional disfarçada.",
    redFlags: [
      "🚩 chama de proteção o que é vigiar quem curtiu a foto do seu parceiro nas redes sociais.",
      "🚩 afirma que está bem enquanto a voz soa como se estivesse em um velório.",
      "🚩 exige lealdade por algo que nunca foi pedido explícita ou diretamente.",
    ],
  },
  Leão: {
    sign: "Leão",
    socialVersion:
      "Confiança, generosidade e sede de holofote são sua marca – embora o holofote seja real e a necessidade de plateia também.",
    problem:
      "Para você, reconhecimento não é vaidade; é o oxigênio que mantém seu motor funcionando.",
    ego:
      "Seu ego pode transformar um elogio atrasado em uma ferida que carregará por muito tempo.",
    communication:
      "Você narra sua própria vida como se fosse uma série com trilha sonora, esperando que a platéia acompanhe cada episódio.",
    emotional:
      "Seus sentimentos são quentes, leais e facilmente ofendidos quando não ficam no centro da atenção.",
    love:
      "Você ama com pompa e cerimônia; se o outro não demonstrar do jeito que você espera, conclui que ele simplesmente não compreendeu a magnitude do gesto.",
    anger:
      "Sua ira é teatral, porém genuína; quanto mais insiste que 'não liga', mais ensaia a próxima réplica para usar na disputa.",
    relationship:
      "Você deseja ser adorado, mas prefere que essa adoração pareça espontânea, não solicitada.",
    selfSabotage:
      "Você convence a si mesmo de que ser substituído seria o pior insulto possível à sua existência.",
    virtueShadow: "Autoconfiança pode virar sede constante de aplauso; generosidade pode se transformar em pagamento por validação externa.",
    redFlags: [
      "🚩 chama de modéstia o que é aceitar elogio apenas até a terceira frase antes de virar o rosto.",
      "🚩 fica ressentido se ninguém pergunta como foi a sua apresentação ou performance recente.",
      "🚩 usa expressões afetuosas como 'meu bem' enquanto segue falando sozinho, como se o outro não existisse.",
    ],
  },
  Virgem: {
    sign: "Virgem",
    socialVersion:
      "Utilidade, atenção aos detalhes e competência são sua apresentação – embora o detalhe muitas vezes seja apenas o nome diplomático para quem revisa a vida alheia.",
    problem:
      "Você não aponta falhas por malvadez; aponta por vocação e depois se sente ofendido quando ninguém agradece a observação.",
    ego:
      "Seu ego se esconde atrás da certeza de estar correto e da sensação de ser indispensável para o funcionamento alheio.",
    communication:
      "Você chama de feedback o que, para o outro, soa como uma lista de defeitos completa com notas e referências.",
    emotional:
      "Seu sentimento costuma se transformar em tarefa; sentir, para você, muitas vezes é uma pendência que espera um método para ser resolvida.",
    love:
      "Você demonstra amor organizando a vida do outro; depois sofre porque a pessoa não percebeu o estoque de carinho que você anotou em planilhas.",
    anger:
      "Sua irritação é silenciosa, precisa e se manifesta em comentários minuciosamente bem escritos.",
    relationship:
      "Você almeja entrega, consistência e ordem, considerando isso o nível básico de qualquer parceria saudável.",
    selfSabotage:
      "Você trava em espera da perfeição antes de iniciar qualquer ação, como se o mundo pudesse esperar até que tudo esteja impecável.",
    virtueShadow: "Praticidade pode tornar‑se frieza; discernimento pode se tornar fonte de crítica interminável.",
    redFlags: [
      "🚩 chama de ajudar o que é rearranjar o conteúdo da bolsa alheia sem ser solicitado.",
      "🚩 após uma vistoria detalhada, responde 'eu só estava curios@' como se nada tivesse acontecido.",
      "🚩 tem maior fascinação pelo processo de realização do que pelo resultado final em si.",
    ],
  },
  Libra: {
    sign: "Libra",
    socialVersion:
      "Diplomacia, justiça e talento para mediar são sua cara – embora a justiça muitas vezes desapareça quando o assunto passa a ser você mesmo.",
    problem:
      "Tentar agradar a todos costuma terminar com você concordando simultaneamente com duas posições totalmente opostas.",
    ego:
      "Seu ego precisa parecer razoável, mesmo quando está sendo claramente evasivo ou incongruente.",
    communication:
      "Você chama de ponderação o que, em algumas ocasiões, nada mais é do que a incapacidade de dizer um simples 'não'.",
    emotional:
      "Seu sentimento procura equilíbrio, mas pode acabar virando uma diplomacia cansativa que esgota quem está ao redor.",
    love:
      "Você se encanta pela ideia do relacionamento e leva tempo para aceitar que a pessoa real, com suas manias e barulhos, faz parte do pacote.",
    anger:
      "Sua irritação aparece envolta em sorriso, acompanhada de indiretas sofisticadas e um 'não é nada' que, na prática, esconde muita coisa.",
    relationship:
      "Você busca harmonia e evita o conflito até o ponto em que o próprio desconforto passa a morar permanentemente na sala de estar.",
    selfSabotage:
      "Você se perde em consultas infinitas com terceiros, terminando por esquecer qual era o seu desejo original.",
    virtueShadow: "Diplomacia pode se tornar covardia relacional; senso estético pode virar frio na hora de julgar as pessoas.",
    redFlags: [
      "🚩 chama de consenso o que é marcar reunião apenas para decidir onde vai ser o almoço do dia.",
      "🚩 afirma 'não sei' quando, na verdade, já decidiu que não vai fazer nada.",
      "🚩 confunde a ausência de briga com a paz verdadeira, enterrando o assunto em vez de resolvê‑lo.",
    ],
  },
  Escorpião: {
    sign: "Escorpião",
    socialVersion:
      "Reserva, intensidade e habilidade de ler ambientes são sua apresentação – embora essa leitura muitas vezes vire registro e, ocasionalmente, abertura de investigação particular.",
    problem:
      "Você não confia facilmente; quando finalmente confia, elabora um contrato mental que a outra parte nunca viu nem concordou.",
    ego:
      "Seu ego não clama por atenção; ele anseia por profundidade, poder e a sensação de controle absoluto sobre o que importa.",
    communication:
      "Você fala pouco, observa bastante e guarda a frase decisiva exatamente para o momento em que ela causará maior dano.",
    emotional:
      "Sua emoção não é superficial; ela é uma correnteza forte, carregada de histórias que raramente contamos em voz alta.",
    love:
      "Você ama com intensidade e exige exclusividade quase que com rigor de perícia forense.",
    anger:
      "Sua ira é silenciosa, transformadora e capaz de permanecer com a mesma intensidade por décadas seguidas.",
    relationship:
      "Você deseja entrega total, mas só revela a senha de acesso depois de submeter o parceiro a bateria de testes de confiança.",
    selfSabotage:
      "Você transforma o vínculo afetivo em uma prova de resistência, medindo até onde o outro consegue aguentar antes de quebrar.",
    virtueShadow: "Profundidade pode facilmente virar obsessão; poder pode se converter em controle absoluto sobre o outro.",
    redFlags: [
      "🚩 chama de investigação o que é passar horas analisando curtidas antigas como se fossem provas de um crime.",
      "🚩 perdoa em voz alta, mas guarda rancor tanto pelo que aconteceu quanto pelo que nem chegou a ocorrer.",
      "🚩 afirma que 'tudo está bem' enquanto, na verdade, está decifrando o significado por trás de cada silêncio.",
    ],
  },
  Sagitário: {
    sign: "Sagitário",
    socialVersion:
      "Liberdade, otimismo e sinceridade direta são sua marca – embora essa sinceridade muitas vezes chegue antes mesmo de o contexto ser explicado.",
    problem:
      "Sua necessidade de liberdade exige horizontes largos; qualquer rotina, por mais benigna, parece uma gaiola decorada com sinal de Wi‑Fi.",
    ego:
      "Seu ego está convencido de que toda opinião sua é uma missão de iluminação alheia, quase uma cruzada educativa.",
    communication:
      "Você chama de verdade o que, para o ouvinte, soa como um avanço direto sem aviso, acompanhado de risada nervosa.",
    emotional:
      "Seus sentimentos são rápidos e preferem uma mudança de cenário a qualquer tentativa de se fixar em um lugar.",
    anger:
      "Sua irritação é barulhenta, traz discussões filosóficas e costuma terminar em uma frase típica de livro de autoajuda.",
    love:
      "Você se envolve com entusiasmo e some assim que a relação começa a exigir algum tipo de planejamento ou agenda compartilhada.",
    relationship:
      "Você sonha com aventura e fidelidade, desde que a aventura mantenha sempre o primeiro lugar nas suas prioridades.",
    selfSabotage:
      "Você promete um futuro brilhante enquanto, na prática, foge do presente como se ele pudesse desaparecer se você prestasse atenção demais.",
    virtueShadow: "Otimismo pode se tornar recusa diante de evidências; liberdade pode virar fuga constante de compromissos.",
    redFlags: [
      "🚩 chama de flexibilidade o que é recusar comprometer‑se com qualquer plano, por mais simples que seja.",
      "🚩 solta uma piada no momento em que a conversa pede atenção séria e escuta atenta.",
      "🚩 diz que 'vai ver' e some, deixando os outros no vácuo enquanto você segue seu próprio rumo.",
    ],
  },
  Capricórnio: {
    sign: "Capricórnio",
    socialVersion:
      "Responsabilidade, estratégia e postura séria são seu cartão – embora a seriedade muitas vezes seja apenas a palavra que você usa para evitar admitir que sente algo.",
    problem:
      "Controle vira objetivo de vida; tudo passa a ser tratado como meta, inclusive os sentimentos que deveriam ser vividos.",
    ego:
      "Seu ego se alimenta de resultados concretos, títulos pomposos e da sensação de que você aguentou mais do que a maioria conseguiria.",
    communication:
      "Você costuma falar apenas quando há algo entregável; às vezes oferece silêncio e chama aquilo de 'gestão eficiente'.",
    emotional:
      "Sua afetividade é arquivada até que possa servir a algum propósito estratégico posteriormente.",
    love:
      "Você demonstra carinho construindo segurança ao redor do outro; depois se admira ao descobrir que a pessoa simplesmente queria conversar.",
    anger:
      "Sua ira é fria e burocrática: define a consequência, estabelece o prazo e segue em frente como se nada tivesse acontecido.",
    relationship:
      "Você almeja um compromisso sério, porém muitas vezes trata o vínculo afetivo como se fosse apenas mais um cargo a ser desempenhado.",
    selfSabotage:
      "Você adia o descanso indispensável e ainda chama aquilo de disciplina, como se o corpo pudesse funcionar indefinidamente sem recarga.",
    virtueShadow: "Responsabilidade pode se tornar rigidez excessiva; ambição pode se voltar contra o próximo como frieza emocional.",
    redFlags: [
      "🚩 chama de planejamento o que é tentar determinar como será o seu fim de semana antes mesmo de ele chegar.",
      "🚩 responde com um curto 'ok' e, logo depois, envia uma planilha detalhada como prova de que 'está tudo sob controle'.",
      "🚩 confunde a capacidade de mostrar vulnerabilidade com a falta de organização ou preparação prévia.",
    ],
  },
  Aquário: {
    sign: "Aquário",
    socialVersion:
      "Autonomia, visão de futuro e postura acima dos conflitos são sua apresentação – embora 'acima' muitas vezes seja apenas a desculpa para manter distância emocional.",
    problem:
      "Você quer revolucionar o mundo, mas acha que perder tempo em reunião de condomínio é um luxo que não pode se permitir.",
    ego:
      "Seu ego se orgulha de ser diferente, mesmo quando essa diferença nada mais é do que teimosia vestida de roupas futuristas.",
    communication:
      "Você explica sentimentos como se fossem teoria acadêmica e, depois, pergunta por que ninguém se emocionou com a sua exposição.",
    emotional:
      "Sua afetividade tende a virar conceito abstrato; é profunda, porém enfrenta dificuldade quando chega o momento de conectar‑se com a realidade concreta.",
    love:
      "Você ama à sua maneira de distância e chama de 'espaço' aquilo que o outro interpreta como frio ou desinteresse.",
    anger:
      "Sua irritação é intelectualizada demais e sai do corpo na forma de argumentos frios, nunca acompanhada de lágrima ou demonstração visceral.",
    relationship:
      "Você anseia por conexão genuína, mas insiste em manter sua independência – o parceiro frequentemente fica apenas com a segunda parte desse pedido.",
    selfSabotage:
      "Você transforma a intimidade afetiva em um projeto a ser gerido, completo com metas, cronogramas e entregas esperadas.",
    virtueShadow: "Originalidade pode facilmente tornar‑se contrarianismo sistemático; autonomia pode virar distanciamento emocional crônico.",
    redFlags: [
      "🚩 chama de pensar fora da caixa o que é simplesmente ignorar o problema existente na esperança de que ele desapareça sozinho.",
      "🚩 responde com um neutro 'interessante' quando, na verdade, alguém acabou de lhe fazer uma confissão profunda.",
      "🚩 some para dizer que está 'processando' informações e retorna trazendo um manifesto totalmente novo como se nada tivesse acontecido antes.",
    ],
  },
  Peixes: {
    sign: "Peixes",
    socialVersion:
      "Sensibilidade, criatividade e sensação de unidade com o todo são sua cara – embora esse 'todo' inclua também o que não foi dito, o que não existe e o que você apenas imaginou.",
    problem:
      "A linha que separa intuição legítima de fantasia desenfreada está mal desenhada no seu mapa astral, causando confusão constante.",
    ego:
      "Seu ego tende a se dissolver nas situações; quando retorna, costuma pedir que alguém o salve com o máximo de delicadeza possível.",
    communication:
      "Você se expressa por meio de atmosferas e sensações; depois disso, espera uma resposta para uma pergunta que você nem chegou a formular.",
    emotional:
      "Sua afetividade é um oceano vasto; o problema surge quando você esquece, por distração, que precisa voltar à margem em algum momento.",
    love:
      "Você se encanta pela versão idealizada da pessoa e se frustra ao descobrir que o ser humano real está longe desse padrão de perfeição.",
    anger:
      "Sua irritação costuma virar tristeza, depois poesia e rara vez se transforma em uma declaração direta e objetiva.",
    relationship:
      "Você deseja uma fusão íntima, mas muitas vezes confunde o ato de se entregar com o simples desaparecimento dentro da outra pessoa.",
    selfSabotage:
      "Você adia a definição de limites pessoais porque dizer 'não' dói demais e, enquanto adia, a situação se complica ainda mais.",
    virtueShadow: "Sensibilidade pode facilmente virar fuga evitativa; imaginação pode se tornar fonte de autoengano persistente.",
    redFlags: [
      "🚩 chama de empatia o que é absorver o problema alheio até o ponto de sair ainda mais afetado do que a pessoa que originalmente o vivenciou.",
      "🚩 abandona a empreitada antes mesmo de começar, com o medo de que o esforço possa resultar em sofrimento futuro.",
      "🚩 responde dizendo que 'sente uma energia' e espera que essa sensação, por si só, seja suficiente para resolver qualquer questão.",
    ],
  },
};

export function signShadowProfile(sign: string): SignShadowProfile {
  const profile = SIGN_SHADOW_PROFILES[sign];
  if (profile !== undefined) return profile;
  return {
    sign,
    socialVersion: "Seu mapa apresenta uma configuração de difícil redução a um único arquétipo clássico.",
    problem: "A dificuldade começa exatamente aí: muitos elementos distintos pedindo atenção simultaneamente.",
    ego: "O ego desta combinação costuma se defender agarrando‑se ao controle da narrativa como forma de proteção.",
    communication: "A comunicação tende a ser mais elaborada do que direta, preferindo circuitos indiretos.",
    emotional: "A base emocional reage antes de checar se o suposto perigo realmente existe.",
    love: "No campo afetivo, há propensão a idealizar antes de observar a realidade como ela se apresenta.",
    anger: "A irritação surge sempre que a percepção de controle sobre a narrativa é ameaçada ou questionada.",
    relationship: "Os vínculos afetivos solicitam clareza que o mapa ainda hesita em oferecer de forma clara.",
    selfSabotage: "A sabotagem aparece quando adiar parece mais seguro do que enfrentar a decisão de frente.",
    virtueShadow: "Qualidade e defeito compartilham a mesma raiz neste mapa, tornando‑se difíceis de separar.",
    redFlags: [
      "🚩 chama de bom senso o que é simplesmente procrastinar sob outra denominação.",
      "🚩 confunde silêncio contemplativo com maturidade emocional alcançada.",
    ],
  };
}
