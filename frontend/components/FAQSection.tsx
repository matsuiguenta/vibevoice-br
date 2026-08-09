'use client'

export const FAQ_ITEMS = [
  {
    q: 'O que é Clonagem de Voz com IA?',
    a: 'A clonagem de voz por inteligência artificial é uma tecnologia de síntese de fala baseada em aprendizado profundo (deep learning). Ela analisa as características únicas de uma voz alvo (como timbre, formantes e padrões prosódicos) para gerar réplicas de voz altamente realistas e personalizadas. Com o modelo VibeVoice, é possível obter uma simulação precisa com apenas 10 segundos de áudio original, restaurando perfeitamente a expressão emocional do locutor e os detalhes de qualidade sonora.',
  },
  {
    q: 'Como funciona a clonagem de voz por IA?',
    a: 'O processo começa com a extração de recursos acústicos a partir de pequenas amostras de áudio, seguida pela modelagem da impressão vocal (voiceprint) e reconstrução de parâmetros via redes neurais. O VibeVoice adota uma arquitetura generativa ponta a ponta que aprende recursos no nível do fonema enquanto mantém a consistência prosódica entre idiomas, produzindo ao final uma fala sintética natural e altamente reconhecível.',
  },
  {
    q: 'Quais são as aplicações típicas da clonagem de voz com IA?',
    a: 'A clonagem de voz com IA pode ser amplamente utilizada em: geração de conteúdo de mídia multilíngue, audiobooks personalizados e customização de assistentes virtuais, dublagem em pós-produção para cinema e TV, produção de voz em lote para personagens de jogos e soluções de voz padronizadas em nível empresarial (por exemplo, voz customizada para sistemas de atendimento ao cliente).',
  },
  {
    q: 'Como devo formatar o texto para configurações de múltiplos locutores (diálogo entre várias pessoas)?',
    a: 'Para narração com apenas um locutor, basta colar o texto normalmente. Para atribuir vozes diferentes a múltiplos falantes em um diálogo, utilize o formato "Falante 1:", "Falante 2:" (ou "Speaker 1:", "Speaker 2:") no início de cada linha. Nosso sistema identificará automaticamente os falantes e atribuirá as vozes selecionadas para você.',
  },
  {
    q: 'Qual é a diferença entre o VibeVoice 1.5B e o VibeVoice 7B?',
    a: 'A principal diferença técnica está na escala do modelo, o que cria um equilíbrio claro entre eficiência computacional e fidelidade de áudio. O VibeVoice 1.5B é otimizado para velocidade, alcançando uma excelente pontuação MOS de 4.3 ± 0.1 e um RTF de ~0.2, sendo ideal para uso diário. Já o VibeVoice 7B atinge o estado da arte com MOS de 4.5 ± 0.1 e maior fidelidade sonora, mas requer mais recursos computacionais (RTF ~0.8).',
  },
  {
    q: 'O que torna a voz de IA do VibeVoice diferente?',
    a: 'Ao contrário de muitas ferramentas de TTS com som robótico e artificial, o VibeVoice se destaca na criação de saídas de voz altamente expressivas. Ele compreende o contexto para produzir entonações naturais e fluidas, tornando-se perfeito para conversações em áudio, podcasts e narrações em vídeo que exigem expressão emocional.',
  },
  {
    q: 'Posso usar o áudio gerado para fins comerciais?',
    a: 'Sim! O modelo base Microsoft VibeVoice é disponibilizado sob a licença permissiva MIT. Isso significa que qualquer áudio gerado usando nossa ferramenta de voz IA pertence a você e pode ser utilizado tanto em projetos pessoais quanto comerciais, sem necessidade de pagamento de royalties.',
  },
  {
    q: 'Para qual tipo de conteúdo essa ferramenta de TTS é mais adequada?',
    a: 'Este serviço online de texto para fala é ideal para uma ampla gama de aplicações, incluindo vídeos para o YouTube, podcasts, cursos EAD/online, audiobooks e qualquer outro projeto que necessite de áudio de alta qualidade gerado a partir de texto. Sua capacidade de processar áudios de longa duração o torna especialmente poderoso para grandes projetos.',
  },
]

export default function FAQSection() {
  return (
    <section className="section" id="faq">
      <div className="container" style={{ maxWidth: '800px' }}>
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <span className="section-eyebrow">DÚVIDAS FREQUENTES</span>
          <h2 className="section-title">Perguntas Frequentes (FAQ)</h2>
          <p className="section-desc" style={{ margin: '0 auto' }}>
            Tudo o que você precisa saber sobre síntese de voz, clonagem com IA, licença de uso e funcionamento do VibeVoice BR.
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {FAQ_ITEMS.map((item, index) => (
            <details
              key={index}
              className="card"
              style={{
                cursor: 'pointer',
                userSelect: 'none',
                transition: 'all 0.2s ease',
                border: '1px solid var(--color-border)',
                background: 'var(--color-bg-card)',
              }}
            >
              <summary style={{
                fontWeight: 700,
                fontSize: '1rem',
                color: 'var(--color-text)',
                listStyle: 'none',
                display: 'flex',
                justify: 'space-between',
                alignItems: 'center',
                padding: '0.25rem 0',
              }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <span style={{
                    fontSize: '0.8rem',
                    fontWeight: 800,
                    color: 'var(--color-blue-light)',
                    background: 'rgba(59,130,246,0.12)',
                    padding: '0.2rem 0.5rem',
                    borderRadius: '6px',
                  }}>
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  {item.q}
                </span>
                <svg width="18" height="18" fill="none" viewBox="0 0 16 16" style={{ flexShrink: 0, color: 'var(--color-blue-light)' }}>
                  <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                </svg>
              </summary>
              <p style={{
                marginTop: '1rem',
                fontSize: '0.925rem',
                color: 'var(--color-text-secondary)',
                lineHeight: 1.7,
                borderTop: '1px solid rgba(255,255,255,0.05)',
                paddingTop: '0.875rem',
              }}>
                {item.a}
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  )
}
