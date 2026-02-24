export type LegalPageKey =
  | "fees"
  | "terms"
  | "privacy"
  | "riskDisclosure"
  | "resolutionRules";

export type LegalSection = {
  title: string;
  paragraphs: string[];
  bullets?: string[];
};

export type LegalPageContent = {
  title: string;
  subtitle: string;
  updatedAt: string;
  sections: LegalSection[];
};

export const LEGAL_PAGE_CONTENT: Record<LegalPageKey, LegalPageContent> = {
  fees: {
    title: "Política de taxas",
    subtitle:
      "Entenda quando cobramos taxas, por que elas existem e onde consultar os valores vigentes antes de confirmar uma operação. Valores atuais: depósito 4,99% e saque 7,99%.",
    updatedAt: "22 de fevereiro de 2026",
    sections: [
      {
        title: "1. Visão geral",
        paragraphs: [
          "A Predizer cobra taxas operacionais para manter o funcionamento da plataforma, incluindo custos de pagamento, prevenção a fraudes, liquidação, suporte e infraestrutura.",
          "Sempre que houver cobrança de taxa, a informação é exibida de forma clara antes da confirmação da operação. Você decide prosseguir somente após visualizar o custo total.",
          "As taxas vigentes nesta data são: depósito 4,99% e saque 7,99%. Esses valores podem ser atualizados conforme custos operacionais e regras de provedores.",
        ],
      },
      {
        title: "2. Tipos de taxas que podem existir",
        paragraphs: [
          "As taxas podem incidir conforme o fluxo e o serviço utilizado. Alguns exemplos comuns estão abaixo.",
        ],
        bullets: [
          "Depósito: taxa fixa atual de 4,99%, exibida antes da confirmação do depósito.",
          "Saque: taxa fixa atual de 7,99%, exibida antes do envio da solicitação de saque.",
          "Negociação (compra/venda): quando aplicável, taxa por execução/negociação exibida no momento da ordem.",
          "Serviços financeiros adicionais: quando existirem, são informados diretamente no fluxo antes da confirmação.",
        ],
      },
      {
        title: "3. Onde consultar os valores vigentes",
        paragraphs: [
          "Os valores atualizados são exibidos nos fluxos de depósito, saque e negociação, e também nas páginas oficiais da plataforma quando aplicável.",
          "Se houver alteração relevante de taxas, a Predizer pode atualizar esta política e/ou comunicar mudanças em áreas visíveis do produto, respeitando prazos razoáveis quando possível.",
        ],
      },
      {
        title: "4. Custos de terceiros e variações",
        paragraphs: [
          "Alguns custos podem ser definidos por terceiros (por exemplo, provedores de pagamento) e podem variar por indisponibilidade, risco transacional, volume e regras do método de pagamento.",
          "A Predizer pode repassar custos de terceiros de forma transparente, sempre exibindo o valor final antes da confirmação da operação.",
        ],
      },
      {
        title: "5. Estornos, cancelamentos e divergências",
        paragraphs: [
          "Quando houver estorno/cancelamento permitido pelas regras do método de pagamento e do caso concreto, o tratamento de taxas pode variar conforme custos já incorridos e regras do provedor.",
          "Se você identificar divergência, pode solicitar revisão pelos canais oficiais. Ao avaliar, podemos solicitar dados adicionais para auditoria e prevenção a fraudes.",
        ],
      },
    ],
  },

  terms: {
    title: "Termos de uso",
    subtitle:
      "Regras objetivas para uso da plataforma, responsabilidades do usuário e condições de acesso aos serviços.",
    updatedAt: "22 de fevereiro de 2026",
    sections: [
      {
        title: "1. Aceite e finalidade do serviço",
        paragraphs: [
          "Ao acessar ou usar a Predizer, você declara que leu e concorda com estes Termos, com a Política de Privacidade, Aviso de Risco, Política de Taxas e Regras de Resolução.",
          "A Predizer oferece um ambiente digital para negociação de contratos de previsão, com critérios e regras definidos previamente em cada mercado.",
          "Você opera por sua conta e risco e é responsável por avaliar se o serviço é adequado ao seu perfil e objetivos.",
        ],
      },
      {
        title: "2. Elegibilidade, cadastro e veracidade",
        paragraphs: [
          "Para usar funcionalidades da plataforma, você pode precisar criar conta e fornecer informações verdadeiras, completas e atualizadas.",
          "Podemos solicitar validações adicionais (ex.: verificação de identidade) para segurança, prevenção a fraudes, cumprimento de obrigações e liberação de limites.",
        ],
        bullets: [
          "Manter dados cadastrais atualizados (nome, contato e informações necessárias).",
          "Não criar múltiplas contas para burlar regras, limites, auditorias ou sanções.",
          "Não usar dados de terceiros sem autorização.",
        ],
      },
      {
        title: "3. Regras básicas de conduta",
        paragraphs: [
          "Para manter a plataforma segura, estável e justa, você deve usar a conta de forma responsável e respeitar as regras de mercado e de resolução.",
        ],
        bullets: [
          "Proteger senha, dispositivos e métodos de autenticação.",
          "Não tentar explorar falhas, automações abusivas, scraping agressivo ou ataques.",
          "Não manipular preços, liquidez, resolução, fontes ou qualquer mecanismo do sistema.",
          "Não usar a plataforma para fins ilícitos, fraudes, lavagem de dinheiro ou violação de direitos de terceiros.",
        ],
      },
      {
        title: "4. Operações, disponibilidade e limites",
        paragraphs: [
          "A Predizer pode definir limites operacionais por segurança (ex.: limites de depósito/saque, volume, horários e verificações adicionais).",
          "A disponibilidade do serviço pode variar por manutenção, incidentes, dependências de terceiros e condições de rede. Trabalhamos para minimizar interrupções, mas não garantimos funcionamento ininterrupto.",
        ],
      },
      {
        title: "5. Suspensão, restrição e encerramento",
        paragraphs: [
          "Podemos restringir funcionalidades, suspender ou encerrar contas em casos de uso indevido, tentativa de fraude, violação destes Termos, risco operacional, exigência legal ou proteção do ecossistema.",
          "Quando aplicável, registramos evidências e motivos para auditoria e cumprimento de obrigações legais e de segurança.",
        ],
      },
      {
        title: "6. Propriedade intelectual e uso de conteúdo",
        paragraphs: [
          "A marca, identidade visual, interfaces, textos e demais componentes da plataforma são protegidos por direitos de propriedade intelectual.",
          "Você pode usar o serviço para fins pessoais, respeitando estes Termos, sem copiar, revender ou explorar comercialmente partes da plataforma sem autorização.",
        ],
      },
    ],
  },

  privacy: {
    title: "Política de privacidade",
    subtitle:
      "Explicação direta sobre quais dados tratamos, por que tratamos e quais são seus direitos.",
    updatedAt: "22 de fevereiro de 2026",
    sections: [
      {
        title: "1. Quais dados podemos tratar",
        paragraphs: [
          "Tratamos dados necessários para criar e manter sua conta, operar a plataforma e cumprir obrigações legais e de segurança.",
          "As categorias podem incluir dados cadastrais (ex.: nome, e-mail e telefone), dados de autenticação, registros de acesso e histórico operacional (depósitos, saques, operações e eventos de segurança).",
          "Em alguns casos, podemos tratar dados para verificação e prevenção a fraudes, inclusive dados exigidos por provedores de pagamento e regras de compliance, quando aplicável.",
        ],
      },
      {
        title: "2. Finalidades do tratamento",
        paragraphs: [
          "Usamos dados para fornecer o serviço, manter a integridade das operações e reduzir riscos de fraudes e incidentes.",
        ],
        bullets: [
          "Criar e gerenciar sua conta, autenticação e sessões.",
          "Processar depósitos, saques, negociações e registros de operação.",
          "Prevenir fraude, abuso, acesso indevido e incidentes de segurança.",
          "Atender suporte, comunicações operacionais e solicitações do usuário.",
          "Cumprir obrigações legais, regulatórias e solicitações válidas de autoridades.",
        ],
      },
      {
        title: "3. Bases legais e compartilhamento",
        paragraphs: [
          "O tratamento pode ocorrer por necessidade de execução de contrato, cumprimento de obrigação legal/regulatória, legítimo interesse (como segurança e prevenção a fraudes) e/ou consentimento, quando aplicável.",
          "Podemos compartilhar dados com provedores essenciais (ex.: pagamento, infraestrutura, antifraude e comunicação) somente na medida necessária para prestar o serviço e proteger a plataforma.",
          "Não vendemos seus dados. O compartilhamento ocorre com finalidade específica, segurança e controles apropriados.",
        ],
      },
      {
        title: "4. Segurança, retenção e armazenamento",
        paragraphs: [
          "Adotamos medidas técnicas e organizacionais para proteger dados contra acesso não autorizado, perda e uso indevido.",
          "Mantemos registros e logs pelo tempo necessário para segurança, auditoria, prevenção a fraudes, obrigações legais e melhoria do serviço.",
          "O tempo de retenção pode variar conforme o tipo de dado, obrigação aplicável e necessidade legítima de segurança.",
        ],
      },
      {
        title: "5. Cookies e tecnologias semelhantes",
        paragraphs: [
          "Podemos utilizar cookies e tecnologias semelhantes para manter sessão, autenticar acessos, prevenir fraudes e melhorar a experiência.",
          "Você pode controlar cookies pelo navegador, mas certas funcionalidades podem depender deles para operar corretamente.",
        ],
      },
      {
        title: "6. Seus direitos e contato",
        paragraphs: [
          "Você pode solicitar acesso, correção, atualização, portabilidade, anonimização ou exclusão, quando aplicável, além de informações sobre o tratamento.",
          "Solicitações podem exigir validação de identidade para proteger sua conta e evitar fraudes. Responderemos dentro de prazos legais e razoáveis.",
        ],
      },
    ],
  },

  riskDisclosure: {
    title: "Aviso de risco",
    subtitle:
      "Resumo direto dos principais riscos ao operar mercados de previsão. Leia com atenção antes de negociar.",
    updatedAt: "22 de fevereiro de 2026",
    sections: [
      {
        title: "1. Risco de perda total",
        paragraphs: [
          "Ao operar, você pode perder 100% do valor investido em uma posição.",
          "Se o resultado do mercado for contrário à sua posição, o contrato pode liquidar em R$ 0,00 (lado perdedor) na resolução.",
          "Não há garantia de lucro. Operações passadas não asseguram resultados futuros.",
        ],
      },
      {
        title: "2. Volatilidade e mudanças de consenso",
        paragraphs: [
          "Preços podem variar rapidamente por novas informações, mudanças de expectativa, eventos inesperados e liquidez do mercado.",
          "Mesmo com análise e acompanhamento, eventos reais podem contrariar previsões e gerar perdas relevantes.",
        ],
      },
      {
        title: "3. Liquidez, spread e slippage",
        paragraphs: [
          "Nem sempre haverá liquidez suficiente para encerrar posições no momento desejado.",
          "Em mercados com baixa liquidez, pode haver spread maior e execução a preços diferentes do esperado (slippage). Isso pode aumentar custos e perdas.",
        ],
      },
      {
        title: "4. Riscos operacionais e tecnológicos",
        paragraphs: [
          "Como qualquer serviço digital, podem ocorrer indisponibilidades, atrasos, falhas de terceiros e eventos técnicos que impactem a experiência de operação.",
          "A Predizer adota medidas de segurança, mas nenhum sistema é totalmente imune a incidentes.",
        ],
      },
      {
        title: "5. Uso responsável",
       paragraphs: [
          "Opere com valores que não comprometam seu orçamento e evite decisões impulsivas.",
          "Defina limite de aporte e limite de perda antes de abrir posições e considere diversificação e disciplina como práticas essenciais.",
        ],
      },
    ],
  },

  resolutionRules: {
    title: "Regras de resolução",
    subtitle:
      "Como definimos o resultado de cada mercado, quais fontes são usadas e como ocorre a liquidação após a resolução.",
    updatedAt: "22 de fevereiro de 2026",
    sections: [
      {
        title: "1. Definições e regra publicada",
        paragraphs: [
          "Todo mercado possui uma pergunta objetiva, prazo (ou condição de encerramento) e critério de resultado definidos antes do início das negociações.",
          "A resolução segue exatamente a regra publicada na página do mercado. O que vale é o critério previamente definido — não interpretações posteriores.",
        ],
      },
      {
        title: "2. Fontes de verificação e hierarquia",
        paragraphs: [
          "A verificação utiliza fontes públicas e previamente indicadas no mercado. Quando houver mais de uma fonte, a regra do mercado pode estabelecer uma hierarquia (fonte primária e alternativa).",
        ],
        bullets: [
          "Comunicados e dados oficiais (quando aplicável ao tema).",
          "Fontes públicas reconhecidas e verificáveis indicadas no mercado.",
          "Registros verificáveis citados no enunciado ou critérios do mercado.",
        ],
      },
      {
        title: "3. Momento da resolução e janela de confirmação",
        paragraphs: [
          "A resolução pode ocorrer após o prazo/condição do mercado e dentro de uma janela de verificação, quando necessário, para confirmar dados e evitar inconsistências.",
          "Em casos de atualização tardia de dados (ex.: revisões oficiais), a regra do mercado indicará se e como a atualização é considerada.",
        ],
      },
      {
        title: "4. Liquidação padrão",
        paragraphs: [
          "Após a resolução, o lado vencedor liquida em R$ 1,00 por contrato e o lado perdedor em R$ 0,00, conforme a regra de pagamento do mercado.",
          "A liquidação é aplicada aos saldos/posições conforme registros operacionais do sistema, com logs para auditoria e transparência.",
        ],
      },
      {
        title: "5. Eventos excepcionais, ambiguidades e medidas extraordinárias",
        paragraphs: [
          "Se ocorrer evento excepcional que torne o critério original impraticável (ex.: fonte indisponível permanentemente, mudança estrutural do evento, inconsistência insanável), a Predizer pode aplicar procedimento extraordinário.",
          "Quando isso ocorrer, adotaremos medidas com registro, rastreabilidade e transparência, buscando a interpretação mais fiel possível ao objetivo original do mercado e às regras publicadas.",
        ],
      },
      {
        title: "6. Contestação e revisão (quando aplicável)",
        paragraphs: [
          "Quando previsto nas regras do mercado, pode existir um processo de revisão baseado em evidências e no cumprimento estrito do critério publicado.",
          "A contestação avalia fatos verificáveis e a aplicação das regras — não preferências pessoais ou expectativas do operador.",
        ],
      },
    ],
  },
};