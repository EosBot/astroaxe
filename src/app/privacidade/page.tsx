import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacidade e dados",
  description:
    "Entenda quais dados o AstroAxe usa, onde eles circulam e quais controles já estão disponíveis.",
  alternates: { canonical: "/privacidade" },
  openGraph: {
    type: "website",
    title: "Privacidade e dados — AstroAxe",
    description:
      "Um retrato factual dos dados usados pelo AstroAxe e dos controles disponíveis na conta.",
    url: "/privacidade",
  },
};

const dataGroups = [
  [
    "Conta e acesso",
    "Email normalizado, senha protegida por hash, sessões opacas e tokens de uso único para confirmação e recuperação.",
  ],
  [
    "Dados natais",
    "Nome ou apelido, data, hora opcional, precisão da hora, cidade, coordenadas e fuso necessários para calcular e apresentar o mapa.",
  ],
  [
    "Mapas e histórico",
    "Resultados calculados, versões do motor e revisões anteriores para rastrear o que mudou após um recálculo.",
  ],
  [
    "Diário privado",
    "Reflexões e versões substituídas, vinculadas ao perfil e acessíveis somente pela conta proprietária.",
  ],
  [
    "Feedback de Regências",
    "As sete respostas do questionário que antecede a Tríade são cálculo-apenas: usadas somente na requisição que gera o resultado e nunca guardadas por si só. Com consentimento explícito e separado, respostas dirigidas, tríade calculada, correções conhecidas e origem da confirmação são guardadas para calibrar o método e podem ser retiradas individualmente sem apagar o mapa. Podem revelar informação religiosa sensível.",
  ],
  [
    "Declaração de maioridade",
    "Sua data de nascimento, a data em que você declarou e a versão do texto que leu. Pedimos isso só quando você abre o planejador cerimonial — quem não o usa nunca é perguntado. É declaração sua: não verificamos documentos e não temos como saber se é verdadeira. Não se confunde com a data de nascimento de um mapa, que pode ser de outra pessoa.",
  ],
  [
    "Planos e sessões cerimoniais",
    "Título, intenção, entidades escolhidas, horário, notas, observações e desfechos. Tudo cifrado, e a cifra é amarrada a você, ao registro e ao campo: um envelope movido de lugar não abre. Podem revelar convicção religiosa. Apagar um plano leva as sessões dele junto. Sem a chave configurada no servidor, o recurso se declara indisponível em vez de gravar em claro.",
  ],
] as const;

export default function PrivacyPage(): React.JSX.Element {
  return (
    <main id="conteudo-principal" className="observatory-shell methodology-shell">
      <article className="methodology-document">
        <header className="methodology-hero">
          <div>
            <p className="eyebrow">Privacidade por arquitetura</p>
            <h1>Seus dados servem à sua leitura — não a um perfil oculto.</h1>
          </div>
          <p>
            Esta página descreve o comportamento implementado no AstroAxe hoje. Ela mostra quais
            informações entram, por que são necessárias, onde circulam e como você pode exportá-las
            ou apagá-las.
          </p>
        </header>

        <section className="methodology-section" aria-labelledby="privacy-data-title">
          <p className="eyebrow">Dados utilizados</p>
          <h2 id="privacy-data-title">O mínimo necessário para calcular e guardar seu céu.</h2>
          <div className="methodology-columns">
            {dataGroups.map(([title, description]) => (
              <div key={title}>
                <h3>{title}</h3>
                <p>{description}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="methodology-section methodology-columns" aria-label="Fluxos de dados">
          <div>
            <p className="eyebrow">O que não acontece</p>
            <h2>Seu nascimento e seu diário não alimentam IA ou analytics.</h2>
            <p>
              Não há integração ativa com LLM, plataforma de analytics ou Stripe. O feedback de
              Regências alimenta somente o conjunto interno e versionado de calibração; não é
              enviado automaticamente a um modelo externo. O conteúdo do diário, data e hora de
              nascimento, localização precisa, cookies e tokens não entram nos logs públicos nem nas
              métricas agregadas.
            </p>
          </div>
          <div>
            <p className="eyebrow">Serviços necessários</p>
            <h2>Algumas tarefas atravessam fronteiras específicas.</h2>
            <p>
              A busca de cidade envia apenas o texto da consulta ao serviço de geocodificação. O
              envio de emails transacionais recebe o endereço e a mensagem necessária. Banco e Redis
              permanecem internos na operação containerizada.
            </p>
          </div>
        </section>

        <section className="methodology-section" aria-labelledby="privacy-controls-title">
          <p className="eyebrow">Seus controles</p>
          <h2 id="privacy-controls-title">Consultar, corrigir, exportar e excluir.</h2>
          <ul>
            <li>Atualize dados natais e preserve a revisão anterior para auditoria.</li>
            <li>Exporte conta, mapas, diário e feedbacks de calibração em JSON.</li>
            <li>Exclua um perfil com seus mapas, revisões, reflexões e feedbacks vinculados.</li>
            <li>Exclua integralmente conta, sessões e perfis mediante confirmação e senha.</li>
          </ul>
        </section>

        <section className="methodology-section" aria-labelledby="privacy-scope-title">
          <p className="eyebrow">Escopo atual</p>
          <h2 id="privacy-scope-title">Produção exige compromissos adicionais.</h2>
          <p>
            Antes de uma operação pública, ainda precisam ser publicados a identidade e o contato do
            controlador, bases legais, prazos definitivos por categoria, tratamento de backups e
            subprocessadores contratados. O AstroAxe não apresenta essas decisões pendentes como se
            já estivessem concluídas.
          </p>
        </section>

        <footer className="methodology-footer">
          <p>Retrato técnico do sistema local · atualizado em 25 de agosto de 2026.</p>
          <Link href="/conta#configuracoes">Abrir controles da conta</Link>
        </footer>
      </article>
    </main>
  );
}
