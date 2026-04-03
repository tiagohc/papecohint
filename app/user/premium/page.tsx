"use client";

import { useState } from "react";

export default function PremiumPage() {
  const [selectedPlan, setSelectedPlan] = useState<string>("monthly");

  const cardStyle: React.CSSProperties = {
    padding: 20,
    borderRadius: 8,
    backgroundColor: "#fff",
    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
    marginBottom: 20,
  };

  const premiumCardStyle: React.CSSProperties = {
    ...cardStyle,
    border: "2px solid #22c55e",
    background: "linear-gradient(135deg, #f0fdf4 0%, #ffffff 100%)",
  };

  const featureStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: 12,
    marginBottom: 12,
  };

  const plans = [
    {
      id: "monthly",
      name: "Mensal",
      price: 9.99,
      period: "mês",
      popular: false,
    },
    {
      id: "yearly",
      name: "Anual",
      price: 89.99,
      period: "ano",
      savings: "Economia de 25%",
      popular: true,
    },
  ];

  const handleUpgrade = (planId: string) => {
    // TODO: Implementar integração com sistema de pagamento
    alert(`Funcionalidade de pagamento será implementada em breve!\nPlano selecionado: ${planId}`);
  };

  return (
    <div style={{ padding: 40, maxWidth: 1000, margin: "0 auto" }}>
      {/* Header */}
      <div style={cardStyle}>
        <div style={{ textAlign: "center", marginBottom: 20 }}>
          <h1 style={{ margin: "0 0 10px 0", fontSize: 32, color: "#22c55e" }}>
            EcoHint Premium
          </h1>
          <p style={{ margin: 0, fontSize: 18, color: "#666" }}>
            Potencialize seu impacto ambiental com ferramentas avançadas e benefícios exclusivos
          </p>
        </div>
      </div>

      {/* Planos */}
      <div style={{ display: "grid", gap: 20, gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", marginBottom: 30 }}>
        {plans.map(plan => (
          <div
            key={plan.id}
            style={{
              ...cardStyle,
              ...(plan.popular ? premiumCardStyle : {}),
              position: "relative",
              cursor: "pointer",
            }}
            onClick={() => setSelectedPlan(plan.id)}
          >
            {plan.popular && (
              <div style={{
                position: "absolute",
                top: -10,
                right: 20,
                backgroundColor: "#22c55e",
                color: "white",
                padding: "4px 12px",
                borderRadius: 12,
                fontSize: 12,
                fontWeight: "bold",
              }}>
                MAIS POPULAR
              </div>
            )}

            <div style={{ textAlign: "center", marginBottom: 20 }}>
              <h3 style={{ margin: "0 0 8px 0", fontSize: 24 }}>{plan.name}</h3>
              <div style={{ fontSize: 32, fontWeight: "bold", color: "#22c55e", marginBottom: 4 }}>
                €{plan.price}
              </div>
              <div style={{ color: "#666" }}>por {plan.period}</div>
              {plan.savings && (
                <div style={{
                  color: "#16a34a",
                  fontSize: 14,
                  fontWeight: "bold",
                  marginTop: 8,
                  padding: "4px 8px",
                  backgroundColor: "#dcfce7",
                  borderRadius: 6,
                  display: "inline-block",
                }}>
                  {plan.savings}
                </div>
              )}
            </div>

            <button
              onClick={(e) => {
                e.stopPropagation();
                handleUpgrade(plan.id);
              }}
              style={{
                width: "100%",
                padding: "12px",
                borderRadius: 8,
                border: "none",
                backgroundColor: plan.popular ? "#22c55e" : "#3b82f6",
                color: "white",
                fontSize: 16,
                fontWeight: "bold",
                cursor: "pointer",
                marginBottom: 20,
              }}
            >
              Escolher Plano
            </button>
          </div>
        ))}
      </div>

      {/* Benefícios Premium */}
      <div style={cardStyle}>
        <h2 style={{ margin: "0 0 20px 0", textAlign: "center" }}>
          Benefícios Premium
        </h2>

        <div style={{ display: "grid", gap: 16, gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))" }}>
          <div>
            <h3 style={{ margin: "0 0 16px 0", color: "#22c55e" }}>Análises Avançadas</h3>
            <div style={featureStyle}>
              <span>Relatórios detalhados de impacto ambiental</span>
            </div>
            <div style={featureStyle}>
              <span>Gráficos interativos de progresso</span>
            </div>
            <div style={featureStyle}>
              <span>Análise preditiva de economia de CO₂</span>
            </div>
            <div style={featureStyle}>
              <span>Comparativo com outros usuários</span>
            </div>
          </div>

          <div>
            <h3 style={{ margin: "0 0 16px 0", color: "#22c55e" }}>Missões Exclusivas</h3>
            <div style={featureStyle}>
              <span>Missões premium com maior pontuação</span>
            </div>
            <div style={featureStyle}>
              <span>Desafios personalizados</span>
            </div>
            <div style={featureStyle}>
              <span>Recompensas exclusivas</span>
            </div>
            <div style={featureStyle}>
              <span>Missões sazonais especiais</span>
            </div>
          </div>

          <div>
            <h3 style={{ margin: "0 0 16px 0", color: "#22c55e" }}>Loja Premium</h3>
            <div style={featureStyle}>
              <span>Produtos exclusivos na loja</span>
            </div>
            <div style={featureStyle}>
              <span>Descontos em parcerias ambientais</span>
            </div>
            <div style={featureStyle}>
              <span>Frete grátis em compras</span>
            </div>
            <div style={featureStyle}>
              <span>Acesso antecipado a novos produtos</span>
            </div>
          </div>

          <div>
            <h3 style={{ margin: "0 0 16px 0", color: "#22c55e" }}>Educação Premium</h3>
            <div style={featureStyle}>
              <span>Cursos avançados sobre sustentabilidade</span>
            </div>
            <div style={featureStyle}>
              <span>Webinars com especialistas</span>
            </div>
            <div style={featureStyle}>
              <span>Certificados de conclusão</span>
            </div>
            <div style={featureStyle}>
              <span>Comunidade exclusiva de aprendizado</span>
            </div>
          </div>
        </div>
      </div>

      {/* Comparativo Gratuito vs Premium */}
      <div style={cardStyle}>
        <h2 style={{ margin: "0 0 20px 0", textAlign: "center" }}>
          Gratuito vs Premium
        </h2>

        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ backgroundColor: "#f8fafc" }}>
                <th style={{ padding: "12px", textAlign: "left", border: "1px solid #e2e8f0" }}>
                  Funcionalidade
                </th>
                <th style={{ padding: "12px", textAlign: "center", border: "1px solid #e2e8f0" }}>
                  Gratuito
                </th>
                <th style={{ padding: "12px", textAlign: "center", border: "1px solid #e2e8f0", backgroundColor: "#f0fdf4" }}>
                  Premium
                </th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ padding: "12px", border: "1px solid #e2e8f0" }}>Missões básicas</td>
                <td style={{ padding: "12px", textAlign: "center", border: "1px solid #e2e8f0" }}>Sim</td>
                <td style={{ padding: "12px", textAlign: "center", border: "1px solid #e2e8f0", backgroundColor: "#f0fdf4" }}>Sim</td>
              </tr>
              <tr>
                <td style={{ padding: "12px", border: "1px solid #e2e8f0" }}>Missões premium</td>
                <td style={{ padding: "12px", textAlign: "center", border: "1px solid #e2e8f0" }}>Não</td>
                <td style={{ padding: "12px", textAlign: "center", border: "1px solid #e2e8f0", backgroundColor: "#f0fdf4" }}>Sim</td>
              </tr>
              <tr>
                <td style={{ padding: "12px", border: "1px solid #e2e8f0" }}>Relatórios básicos</td>
                <td style={{ padding: "12px", textAlign: "center", border: "1px solid #e2e8f0" }}>Sim</td>
                <td style={{ padding: "12px", textAlign: "center", border: "1px solid #e2e8f0", backgroundColor: "#f0fdf4" }}>Sim</td>
              </tr>
              <tr>
                <td style={{ padding: "12px", border: "1px solid #e2e8f0" }}>Análises avançadas</td>
                <td style={{ padding: "12px", textAlign: "center", border: "1px solid #e2e8f0" }}>Não</td>
                <td style={{ padding: "12px", textAlign: "center", border: "1px solid #e2e8f0", backgroundColor: "#f0fdf4" }}>Sim</td>
              </tr>
              <tr>
                <td style={{ padding: "12px", border: "1px solid #e2e8f0" }}>Loja básica</td>
                <td style={{ padding: "12px", textAlign: "center", border: "1px solid #e2e8f0" }}>Sim</td>
                <td style={{ padding: "12px", textAlign: "center", border: "1px solid #e2e8f0", backgroundColor: "#f0fdf4" }}>Sim</td>
              </tr>
              <tr>
                <td style={{ padding: "12px", border: "1px solid #e2e8f0" }}>Produtos premium</td>
                <td style={{ padding: "12px", textAlign: "center", border: "1px solid #e2e8f0" }}>Não</td>
                <td style={{ padding: "12px", textAlign: "center", border: "1px solid #e2e8f0", backgroundColor: "#f0fdf4" }}>Sim</td>
              </tr>
              <tr>
                <td style={{ padding: "12px", border: "1px solid #e2e8f0" }}>Educação básica</td>
                <td style={{ padding: "12px", textAlign: "center", border: "1px solid #e2e8f0" }}>Sim</td>
                <td style={{ padding: "12px", textAlign: "center", border: "1px solid #e2e8f0", backgroundColor: "#f0fdf4" }}>Sim</td>
              </tr>
              <tr>
                <td style={{ padding: "12px", border: "1px solid #e2e8f0" }}>Cursos premium</td>
                <td style={{ padding: "12px", textAlign: "center", border: "1px solid #e2e8f0" }}>Não</td>
                <td style={{ padding: "12px", textAlign: "center", border: "1px solid #e2e8f0", backgroundColor: "#f0fdf4" }}>Sim</td>
              </tr>
              <tr>
                <td style={{ padding: "12px", border: "1px solid #e2e8f0" }}>Suporte prioritário</td>
                <td style={{ padding: "12px", textAlign: "center", border: "1px solid #e2e8f0" }}>Não</td>
                <td style={{ padding: "12px", textAlign: "center", border: "1px solid #e2e8f0", backgroundColor: "#f0fdf4" }}>Sim</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* FAQ */}
      <div style={cardStyle}>
        <h2 style={{ margin: "0 0 20px 0", textAlign: "center" }}>
          Perguntas Frequentes
        </h2>

        <div style={{ display: "grid", gap: 16, gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))" }}>
          <div>
            <h4 style={{ margin: "0 0 8px 0", color: "#22c55e" }}>
              Posso cancelar a qualquer momento?
            </h4>
            <p style={{ margin: 0, color: "#666", lineHeight: 1.5 }}>
              Sim! Você pode cancelar sua assinatura premium a qualquer momento.
              O acesso continua até o final do período pago.
            </p>
          </div>

          <div>
            <h4 style={{ margin: "0 0 8px 0", color: "#22c55e" }}>
              Há período de teste gratuito?
            </h4>
            <p style={{ margin: 0, color: "#666", lineHeight: 1.5 }}>
              Oferecemos 7 dias de teste gratuito para novos usuários premium.
              Sem compromisso e sem cartão de crédito necessário.
            </p>
          </div>

          <div>
            <h4 style={{ margin: "0 0 8px 0", color: "#22c55e" }}>
              Como funciona o reembolso?
            </h4>
            <p style={{ margin: 0, color: "#666", lineHeight: 1.5 }}>
              Se não estiver satisfeito, oferecemos reembolso total dentro dos
              primeiros 30 dias após a contratação.
            </p>
          </div>

          <div>
            <h4 style={{ margin: "0 0 8px 0", color: "#22c55e" }}>
              Posso mudar de plano?
            </h4>
            <p style={{ margin: 0, color: "#666", lineHeight: 1.5 }}>
              Claro! Você pode fazer upgrade ou downgrade do seu plano a
              qualquer momento. As mudanças entram em vigor no próximo ciclo.
            </p>
          </div>
        </div>
      </div>

      {/* Call to Action */}
      <div style={{
        ...cardStyle,
        textAlign: "center",
        background: "linear-gradient(135deg, #22c55e 0%, #16a34a 100%)",
        color: "white",
      }}>
        <h2 style={{ margin: "0 0 16px 0" }}>
          Faça a Diferença Hoje!
        </h2>
        <p style={{ margin: "0 0 20px 0", fontSize: 18 }}>
          Junte-se a milhares de usuários que já estão transformando o mundo com o EcoHint Premium
        </p>
        <button
          onClick={() => handleUpgrade(selectedPlan)}
          style={{
            padding: "16px 32px",
            borderRadius: 8,
            border: "none",
            backgroundColor: "white",
            color: "#22c55e",
            fontSize: 18,
            fontWeight: "bold",
            cursor: "pointer",
            boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
          }}
        >
          Começar Teste Gratuito
        </button>
        <p style={{ margin: "16px 0 0 0", fontSize: 14, opacity: 0.9 }}>
          7 dias grátis • Cancele quando quiser • Sem cartão necessário
        </p>
      </div>
    </div>
  );
}
