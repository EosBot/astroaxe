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
      "Seu senso de urgência transforma cada espera em um suposto sabotagem do universo contra sua agenda.",
    ego: "Seu ego não pede desculpa; elabora um relatório detalhado explicando por que o conflito foi inevitável e por que o outro deveria lhe agradecer.",
    communication:
      "Você chama de franqueza o que, tecnicamente, é um projétil de opinião lançado sem sistema de guiamento.",
    emotional:
      "Seus sentimentos têm a vida útil de uma discussão: nascem, explodem e se transformam antes que o corpo consiga acompanhar.",
    love: "Você se apaixona em velocidade de relâmpago; diante de uma resposta lenta, conclui que o outro entrou em greve de afetividade.",
    anger: "Sua ira não é arquivada; é terceirizada para o primeiro ambiente que der espaço.",
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
    problem: "Para você, segurança costuma significar que nada pode mudar, inclusive você mesmo.",
    ego: "Seu orgulho não grita; ele se assenta, espera e faz você permanecer no mesmo lugar até que o outro desista primeiro.",
    communication:
      "Você raramente entra em debate; repete a mesma posição com diferentes entonações até o interlocutor desistir.",
    emotional:
      "Seus sentimentos chegam devagar, mas quando chegam você os compra, mobila e se recusa a devolver a posse.",
    love: "Você ama com presença e com inventário de bens: ao escolher alguém, considera que a pessoa passou a fazer parte do seu patrimônio afetivo.",
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
    ego: "Seu ego precisa ser lembrado de que entender tudo não é o mesmo que decidir algo definitivo.",
    communication:
      "Você chama de diálogo o que, na prática, é uma entrevista coletiva com você mesmo em tempo real.",
    emotional:
      "Sua emoção vira dado, vira piada, vira curiosidade – raramente se instala como estado duradouro.",
    love: "Você se apaixona pelo papo e depois descobre que manter o relacionamento também exige momentos de silêncio.",
    anger:
      "Sua irritação aparece leve, mas age rápido: comenta, ironiza, corrige o pronome e some antes que alguém perceba.",
    relationship:
      "Você deseja liberdade e companhia, de preferência simultâneas e com sinal de internet garantido.",
    selfSabotage:
      "Você adianta decisões transformando‑as em intermináveis pesquisas de opinião que nunca chegam a concluir nada.",
    virtueShadow:
      "Curiosidade se espalha em dispersão; inteligência vira ferramenta de auto‑justificação.",
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
    ego: "Seu ego não almeja um trono; busca cozinha, quarto e a certeza de que ninguém vai embora sem seu consentimento.",
    communication:
      "Você não costuma declarar seus sentimentos; espera que o outro perceba pela temperatura do simples 'oi'.",
    emotional:
      "Sua emoção é profunda, porém prefere falar por meio de indiretas para evitar exposição direta.",
    love: "Você demonstra afeto cuidando do outro; em seguida cobra o retorno desse cuidado com juros emocionais.",
    anger:
      "Sua raiva se veste de silêncio e, depois, aparece como frase passivo‑agressiva nas reuniões de família.",
    relationship:
      "Você anseia por intimidade total, mas costuma erguer uma cerca com campainha, esperando que o outro entre por conta própria.",
    selfSabotage: "Você acumula mágoas sem jamais nomear o que exatamente lhe causou dor.",
    virtueShadow:
      "Cuidado pode se voltar para controle; sensibilidade pode virar chantagem emocional disfarçada.",
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
    ego: "Seu ego pode transformar um elogio atrasado em uma ferida que carregará por muito tempo.",
    communication:
      "Você narra sua própria vida como se fosse uma série com trilha sonora, esperando que a platéia acompanhe cada episódio.",
    emotional:
      "Seus sentimentos são quentes, leais e facilmente ofendidos quando não ficam no centro da atenção.",
    love: "Você ama com pompa e cerimônia; se o outro não demonstrar do jeito que você espera, conclui que ele simplesmente não compreendeu a magnitude do gesto.",
    anger:
      "Sua ira é teatral, porém genuína; quanto mais insiste que 'não liga', mais ensaia a próxima réplica para usar na disputa.",
    relationship:
      "Você deseja ser adorado, mas prefere que essa adoração pareça espontânea, não solicitada.",
    selfSabotage:
      "Você convence a si mesmo de que ser substituído seria o pior insulto possível à sua existência.",
    virtueShadow:
      "Autoconfiança pode virar sede constante de aplauso; generosidade pode se transformar em pagamento por validação externa.",
    redFlags: [
      "🚩 chama de modéstia o que é aceitar elogio apenas até a terceira frase antes de virar o rosto.",
      "🚩 fica ressentido se ninguém pergunta como foi a sua apresentação ou performance recente.",
      "🚩 usa expresões afetuosas tipo 'meu bem' enquanto segue falando sozinho, como se o outro não existisse.",
    ],
  },
  Virgem: {
    sign: "Virgem",
    socialVersion:
      "Utilidade, atenção aos detalhes e competência são sua apresentação – embora o detalhe muitas vezes seja apenas o nome diplomático para quem revisa a vida alheia.",
    problem:
      "Você não aponta falhas por malvadez; aponta por vocação e depois se sente ofendido quando ninguém agradece a observação.",
    ego: "Seu ego se esconde atrás da certeza de estar correto e da sensação de ser indispensável para o funcionamento alheio.",
    communication:
      "Você chama de feedback o que, para o outro, soa como uma lista de defeitos completa com notas e referências.",
    emotional:
      "Seu sentimento costuma se transformar em tarefa; sentir, para você, muitas vezes é uma pendência que espera um método para ser resolvida.",
    love: "Você demonstra amor organizando a vida do outro; depois sofre porque a pessoa não percebeu o estoque de carinho que você anotou em planilhas.",
    anger:
      "Sua irritação é silenciosa, precisa e se manifesta em comentários minuciosamente bem escritos.",
    relationship:
      "Você almeja entrega, consistência e ordem, considerando isso o nível básico de qualquer parceria saudável.",
    selfSabotage:
      "Você trava em espera da perfeição antes de iniciar qualquer ação, como se o mundo pudesse esperar até que tudo esteja impecável.",
    virtueShadow:
      "Praticidade pode tornar‑se frieza; discernimento pode se tornar fonte de crítica interminável.",
    redFlags: [
      "🚩 chama de ayudar o que es rearranjar el contenido de la bolsa ajena sin ser solicitado.",
      "🚩 después de una inspección detallada, responde 'eu só estava curios@' como si nada hubiera pasado.",
      "🚩 tiene mayor fascinación por el proceso de realización que por el resultado final en sí.",
    ],
  },
  Libra: {
    sign: "Libra",
    socialVersion:
      "Education, justiça e talento para mediar são sua cara – embora a justiça muitas vezes desapareça quando o assunto passa a ser você mesmo.",
    problem:
      "Tentar agradar a todos costuma terminar com você concordando simultaneamente com duas posições totalmente opostas.",
    ego: "Seu ego precisa parecer razoável, mesmo quando está sendo claramente evasivo ou incongruente.",
    communication:
      "Você chama de ponderação o que, em algumas ocasiões, nada mais é do que la incapacidad de decir un simple 'no'.",
    emotional:
      "Tu sentimento procura equilibrio, pero puede terminar siendo una diplomacia cansativa que agota a quienes están alrededor.",
    love: "Te encantas por la idea de la relación y tardas en aceptar que la persona real, con sus manías y ruidos, forma parte del paquete.",
    anger:
      "Tu irritación aparece envuelta en sonrisa, acompañada de indiretas sofisticadas y un 'no es nada' que, en la práctica, oculta mucho más.",
    relationship:
      "Buscas armonía y evitas el conflicto hasta el punto en que el propio malestar pasa a residir permanentemente en la sala de estar.",
    selfSabotage:
      "Te pierdes en consultas infinitas con terceros, terminando olvidando cuál era tu deseo original.",
    virtueShadow:
      "La diplomacia puede tornar-se covardia relacional; el sentido estético puede tornar-se frio al momento de juzgar a las personas.",
    redFlags: [
      "🚩 llama a consenso lo que es marcar una reunión solo para decidir dónde será el almuerzo del día.",
      "🚩 afirmas 'no sé' cuando, en realidad, ya decidiste que no harás nada.",
      "🚩 confunde la ausencia de pelea con la paz verdadera, enterrando el asunto en lugar de resolverlo.",
    ],
  },
  Escorpião: {
    sign: "Escorpião",
    socialVersion:
      "Reserva, intensidad y habilidad de leer ambientes son tu presentación – aunque esa lectura muchas veces se convierta en registro y, ocasionalmente, apertura de investigación particular.",
    problem:
      "No confías fácilmente; cuando finalmente confías, elaboras un contrato mental que la otra parte nunca vio ni concurdó.",
    ego: "Tu ego no clama por atención; anhelas profundidad, poder y la sensación de control absoluto sobre lo que importa.",
    communication:
      "Hablas poco, observas mucho y guardas la frase decisiva exactamente para el momento en que causará mayor daño.",
    emotional:
      "Tu emoción no es superficial; es una corriente fuerte, cargada de historias que raramente contamos en voz alta.",
    love: "Amás con intensidad y exige exclusividad casi que con rigor de perícia forense.",
    anger:
      "Tu ira es silenciosa, transformadora y capaz de permanecer con la misma intensidad por décadas seguidas.",
    relationship:
      "Deseas entrega total, pero solo revelas la senha de acceso después de someter al compañero a una batería de pruebas de confianza.",
    selfSabotage:
      "Transformas el vínculo afectivo en una prueba de resistencia, midiendo hasta dónde el otro puede aguantar antes de quebrar.",
    virtueShadow:
      "La profundidad puede fácilmente tornar-se obsesión; el poder puede convertirse en control absoluto sobre el otro.",
    redFlags: [
      "🚩 llama a investigación lo que es pasar horas analizando 'me gusta' antiguos como si fueran pruebas de un crimen.",
      "🚩 perdonas en voz alta, pero guardas rencor tanto por lo que sucedió quanto por lo que ni siquiera llegó a ocurrir.",
      "🚩 afirmas que 'todo está bien' mientras, en realidad, estás descifrando el significado detrás de cada silencio.",
    ],
  },
  Sagitário: {
    sign: "Sagitário",
    socialVersion:
      "Libertad, optimismo y sinceridad directa son tu marca – aunque esa sinceridad muchas veces llegue antes mesmo de que se explique el contexto.",
    problem:
      "Tu necesidad de libertad requiere horizontes amplios; cualquier rutina, por más inofensiva que sea, parece una jaula decorada con señal de Wi‑Fi.",
    ego: "Tu ego está convencido de que toda opinión tuya es una misión de iluminación ajena, casi una cruzada educativa.",
    communication:
      "Llamas de verdad lo que, para el oyente, suena como un avance directo sin aviso, acompañado de risada nervosa.",
    emotional:
      "Tus sentimientos son rápidos y prefieren un cambio de paisaje a cualquier intento de fijarse en un lugar.",
    anger:
      "Tu irritación es bulliciosa, trae discusiones filosóficas y suele terminar en una frase típica de libro de autoayuda.",
    love: "Te involucras con entusiasmo y desapareces assim que la relación comienza a exigir algún tipo de planificación o agenda compartida.",
    relationship:
      "Sueñas con aventura y fidelidad, siempre que la aventura mantenga el primer lugar en tus prioridades.",
    selfSabotage:
      "Prometes un futuro brillante mientras, en la práctica, huyes del presente como si éste pudiera desaparecer si le prestaras demasiada atención.",
    virtueShadow:
      "El optimismo puede tornar-se recusa ante evidencias; la libertad puede tornar-se huida constante de compromisos.",
    redFlags: [
      "🚩 llama a flexibilidad lo que es negarse a comprometerse con cualquier plan, por más simple que sea.",
      "🚩 sueltas una broma en el momento en que la conversación pide atención seria y escucha atenta.",
      "🚩 dices que 'vas a ver' y desapareces, dejando a los demás en el vacío mientras sigues tu propio rumo.",
    ],
  },
  Capricórnio: {
    sign: "Capricórnio",
    socialVersion:
      "Responsabilidad, estrategia y postura seria son tu tarjeta – aunque la seriedad muchas veces sea simplemente la palabra que usas para evitar admitir que sientes algo.",
    problem:
      "El control se convierte en objetivo de vida; todo pasa a tratarse como meta, incluyendo los sentimientos que deberían vivirse.",
    ego: "Tu ego se alimenta de resultados concretos, títulos pomposos y la sensación de que aguantaste más que la mayoría podría lograr.",
    communication:
      "Sueles hablar solo cuando hay algo entregable; a veces ofreces silencio y lo llamas 'gestión eficiente'.",
    emotional:
      "Tu afectividad está archivada hasta que pueda servir a algún propósito estratégico posteriormente.",
    love: "Demuestras cariño construyendo seguridad alrededor del otro; luego te sorprendes al descubrir que la persona simplemente quería conversar.",
    anger:
      "Tu ira es fría y burocrática: define la consecuencia, establece el plazo y continúas adelante como si nada hubiera ocurrido.",
    relationship:
      "Aspiras a un compromiso serio, pero muchas veces tratas el vínculo afectivo como si fuera simplemente otro cargo a desempeñar.",
    selfSabotage:
      "Postergas el descanso indispensable y aún lo llamas disciplina, como si el cuerpo pudiera funcionar indefinidamente sin recarga.",
    virtueShadow:
      "La responsabilidad puede tornar‑se rigidez excesiva; la ambición puede voltar‑se contra el prójimo como frialdad emocional.",
    redFlags: [
      "🚩 llama a planificación lo que es intentar determinar cómo será tu fin de semana antes siquiera de que llegue.",
      "🚩 respondes con un breve 'ok' y, poco después, envías una hoja de cálculo detallada como prueba de que 'todo está bajo control'.",
      "🚩 confundes la capacidad de mostrar vulnerabilidad con la falta de organización o preparación previa.",
    ],
  },
  Aquário: {
    sign: "Aquário",
    socialVersion:
      "Autonomía, visión de futuro y postura por encima de los conflictos son tu presentación – aunque 'encima' muchas veces sea simplemente la excusa para mantener distancia emocional.",
    problem:
      "Quieres revolucionar el mundo, pero crees que perder tiempo en una reunión de condominio es un lujo que no puedes permitirte.",
    ego: "Tu ego se enorgullece de ser diferente, incluso cuando esa diferencia nada más es terquedad vestida de ropa futurista.",
    communication:
      "Explicas sentimientos como si fueran teoría académica y, después, preguntas por qué nadie se emocionó con tu exposición.",
    emotional:
      "Tu afectividad tiende a tornar‑se un concepto abstracto; es profunda, pero enfrenta dificultad al momento de conectar‑se con la realidad concreta.",
    love: "Amás a tu manera de distancia y llamas de 'espacio' lo que el otro interpreta como frío o desinterés.",
    anger:
      "Tu irritación es excesivamente intelectualizada y sale del cuerpo en forma de argumentos fríos, nunca acompañada de lágrima o manifestación visceral.",
    relationship:
      "Anhelas una conexión genuína, pero insistes en mantener tu independencia – el compañero frecuentemente queda solo con la segunda parte de esa petición.",
    selfSabotage:
      "Transformas la intimidad afectiva en un proyecto a gestionar, completo con metas, cronogramas y entregas esperadas.",
    virtueShadow:
      "La originalidad puede fácilmente tornar‑se contrarianismo sistemático; la autonomía puede tornar‑se distanciamiento emocional crónico.",
    redFlags: [
      "🚩 llama a pensar fuera de la caja lo que es simplemente ignorar el problema existente con la esperanza de que desaparezca solo.",
      "🚩 respondes con un neutral 'interesante' cuando, en realidad, alguien acaba de hacerte una confesión profunda.",
      "🚩 te alejas diciendo que estás 'procesando' información y regresas trayendo un manifiesto totalmente nuevo como si nada hubiera ocurrido antes.",
    ],
  },
  Peixes: {
    sign: "Peixes",
    socialVersion:
      "Sensibilidad, criatividad y sensación de unidad con el todo son tu cara – aunque ese 'todo' incluya también lo que no fue dicho, lo que no existe y lo que solo imaginaste.",
    problem:
      "La línea que separa intuición legítima de fantasía desenfrenada está mal trazada en tu mapa astral, causando confusión constante.",
    ego: "Tu ego tiende a disolverse en las situaciones; cuando regresa, tiende a pedir que alguien te salve con la máxima delicadeza posible.",
    communication:
      "Te expresas a través de atmosferas y sensaciones; después de eso, esperas una respuesta para una pregunta que ni siquiera llegaste a formular.",
    emotional:
      "Tu afectividad es un océano vasto; el problema surge cuando olvidas, por distracción, que necesitas regresar a la orilla en algún momento.",
    love: "Te encantas por la versión idealizada de la persona y te frustras al descubrir que el ser humano real está lejos de ese patrón de perfección.",
    anger:
      "Tu irritación suele tornar‑se tristeza, después poesía y rara vez se transforma en una declaración directa y objetiva.",
    relationship:
      "Deseas una fusión íntima, pero muchas veces confundes el acto de entregarte con el simple desaparecimiento dentro de la otra persona.",
    selfSabotage:
      "Postergas la definición de límites personales porque decir 'no' duele demasiado y, mientras lo postpones, la situación se complica aún más.",
    virtueShadow:
      "La sensibilidad puede fácilmente tornar‑se fuga evitativa; la imaginación puede tornar‑se fuente de autoengaño persistente.",
    redFlags: [
      "🚩 llama a empatía lo que es absorber el problema ajeno hasta el punto de salir aún más afectado que la persona que originalmente lo vivió.",
      "🚩 abandonas el empeño antes incluso de comenzar, con el temor de que el esfuerzo pueda resultar en sufrimiento futuro.",
      "🚩 respondes diciendo que 'sientes una energía' y esperas que esa sensación, por sí sola, sea suficiente para resolver cualquier cuestión.",
    ],
  },
};

export function signShadowProfile(sign: string): SignShadowProfile {
  const profile = SIGN_SHADOW_PROFILES[sign];
  if (profile !== undefined) return profile;
  return {
    sign,
    socialVersion:
      "Seu mapa apresenta uma configuração de difícil redução a um único arquétipo clássico.",
    problem:
      "A dificuldade começa exatamente aí: muitos elementos distintos pedindo atenção simultaneamente.",
    ego: "O ego desta combinação costuma se defender agarrando‑se ao controle da narrativa como forma de proteção.",
    communication:
      "A comunicação tende a ser mais elaborada do que direta, preferindo circuitos indiretos.",
    emotional: "A base emocional reage antes de checar se o suposto perigo realmente existe.",
    love: "No campo afetivo, há propensão a idealizar antes de observar a realidade como ela se apresenta.",
    anger:
      "A irritação surge sempre que a percepção de controle sobre a narrativa é ameaçada ou questionada.",
    relationship:
      "Os vínculos afetivos solicitam clareza que o mapa ainda hesita em oferecer de forma clara.",
    selfSabotage:
      "A sabotagem aparece quando adianta‑se parece mais seguro do que enfrentar a decisão de frente.",
    virtueShadow:
      "Qualidade e defeito compartilham a mesma raiz neste mapa, tornando‑se difíceis de separar.",
    redFlags: [
      "🚩 chama de bom senso o que é simplesmente procrastinar sob outra denominación.",
      "🚩 confunde silêncio contemplativo com maturidade emocional alcançada.",
    ],
  };
}
