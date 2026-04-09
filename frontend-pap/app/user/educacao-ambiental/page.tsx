"use client";

import { useState } from "react";
import { useLanguage } from "@/app/components/LanguageProvider";

type Article = {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  category: string;
  readTime: number;
};

type Category = {
  id: string;
  label: string;
  icon: string;
};

export default function EducacaoAmbientalPage() {
  const { t } = useLanguage();
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>("all");

  const articles: Article[] = [
    {
      id: "1",
      title: t("O que é Pegada de Carbono?"),
      excerpt: t("Entenda como suas ações diárias impactam o meio ambiente através da emissão de gases de efeito estufa."),
      content: `
        <h3>O que é Pegada de Carbono?</h3>
        <p>A pegada de carbono é uma medida que quantifica a quantidade total de gases de efeito estufa (GEE) emitidos direta ou indiretamente por uma pessoa, organização, evento ou produto ao longo de sua vida.</p>

        <h4>Principais fontes de emissão:</h4>
        <ul>
          <li><strong>Transporte:</strong> Carros, aviões, ônibus - representam cerca de 14% das emissões globais</li>
          <li><strong>Alimentação:</strong> Produção de carne e laticínios é responsável por 18% das emissões</li>
          <li><strong>Energia:</strong> Eletricidade e aquecimento - cerca de 25% das emissões mundiais</li>
          <li><strong>Consumo:</strong> Produção e descarte de produtos - 20% das emissões</li>
        </ul>

        <h4>Como reduzir sua pegada:</h4>
        <ol>
          <li>Use transporte público ou bicicleta</li>
          <li>Reduza o consumo de carne vermelha</li>
          <li>Economize energia em casa</li>
          <li>Compre produtos duráveis e recicle</li>
        </ol>
      `,
      category: "basico",
      readTime: 3,
    },
    {
      id: "2",
      title: t("Mudanças Climáticas: Causas e Consequências"),
      excerpt: t("As alterações climáticas estão acontecendo mais rápido do que o esperado. Saiba os impactos e o que podemos fazer."),
      content: `
        <h3>Mudanças Climáticas: Causas e Consequências</h3>
        <p>As mudanças climáticas são alterações de longo prazo nos padrões climáticos da Terra, principalmente causadas pelas atividades humanas.</p>

        <h4>Causas principais:</h4>
        <ul>
          <li>Emissões de CO₂ e outros gases de efeito estufa</li>
          <li>Desmatamento e perda de biodiversidade</li>
          <li>Queimadas e práticas agrícolas insustentáveis</li>
          <li>Poluição industrial e urbana</li>
        </ul>

        <h4>Consequências já observadas:</h4>
        <ul>
          <li>Aumento da temperatura média global (+1.1°C desde 1880)</li>
          <li>Derretimento das calotas polares</li>
          <li>Aumento do nível do mar</li>
          <li>Eventos climáticos extremos mais frequentes</li>
          <li>Perda de biodiversidade</li>
        </ul>

        <h4>O que podemos fazer:</h4>
        <p>Cada ação conta! Pequenas mudanças no dia a dia podem fazer uma grande diferença quando multiplicadas por milhões de pessoas.</p>
      `,
      category: "clima",
      readTime: 5,
    },
    {
      id: "3",
      title: t("Economia de Energia em Casa"),
      excerpt: t("Dicas práticas para reduzir o consumo de energia elétrica e contribuir para um futuro sustentável."),
      content: `
        <h3>Economia de Energia em Casa</h3>
        <p>A energia elétrica representa uma parcela significativa da pegada de carbono de uma residência. Pequenas mudanças podem gerar grandes economias.</p>

        <h4>Dicas práticas:</h4>
        <ul>
          <li><strong>Aparelhos em standby:</strong> Desligue completamente TVs, computadores e carregadores quando não usar</li>
          <li><strong>Iluminação LED:</strong> Substitua lâmpadas incandescentes por LED - economizam até 80% de energia</li>
          <li><strong>Temperatura do ar-condicionado:</strong> Ajuste para 24°C no verão e use ventiladores</li>
          <li><strong>Chuveiro elétrico:</strong> Reduza o tempo de banho e use a função econômica</li>
          <li><strong>Eletrodomésticos eficientes:</strong> Procure selo Procel de eficiência energética</li>
        </ul>

        <h4>Benefícios:</h4>
        <ul>
          <li>Redução na conta de luz</li>
          <li>Menos emissões de CO₂</li>
          <li>Contribuição para sustentabilidade</li>
        </ul>
      `,
      category: "energia",
      readTime: 4,
    },
    {
      id: "4",
      title: t("Alimentação Sustentável"),
      excerpt: t("Como suas escolhas alimentares impactam o planeta e dicas para uma dieta mais ecológica."),
      content: `
        <h3>Alimentação Sustentável</h3>
        <p>O sistema alimentar global é responsável por cerca de 30% das emissões de gases de efeito estufa. Suas escolhas fazem diferença!</p>

        <h4>Impacto da produção de alimentos:</h4>
        <ul>
          <li><strong>Carne bovina:</strong> 60kg CO₂ por kg produzido</li>
          <li><strong>Frango:</strong> 6kg CO₂ por kg</li>
          <li><strong>Arroz:</strong> 2.7kg CO₂ por kg</li>
          <li><strong>Verduras:</strong> 0.5kg CO₂ por kg</li>
        </ul>

        <h4>Dicas para uma alimentação sustentável:</h4>
        <ol>
          <li>Reduza o consumo de carne vermelha - substitua por vegetais e leguminosas</li>
          <li>Coma alimentos locais e da estação</li>
          <li>Evite alimentos processados e embalados</li>
          <li>Planeje suas refeições para reduzir desperdício</li>
          <li>Use sobras criativamente</li>
        </ol>

        <h4>Dieta do Planeta:</h4>
        <p>A dieta planetária proposta pela EAT-Lancet Commission sugere uma redução de 50% no consumo de carne e açúcares, com aumento no consumo de vegetais, frutas e grãos integrais.</p>
      `,
      category: "alimentacao",
      readTime: 6,
    },
    {
      id: "5",
      title: t("Transporte Sustentável"),
      excerpt: t("Alternativas ao carro particular para reduzir emissões e melhorar a qualidade de vida nas cidades."),
      content: `
        <h3>Transporte Sustentável</h3>
        <p>O transporte é responsável por 14% das emissões globais de CO₂. Mudar seus hábitos de mobilidade pode fazer uma grande diferença.</p>

        <h4>Alternativas sustentáveis:</h4>
        <ul>
          <li><strong>Bicicleta:</strong> Zero emissões, saudável e econômica</li>
          <li><strong>Transporte público:</strong> Reduz emissões por passageiro</li>
          <li><strong>Carpooling:</strong> Compartilhar viagens reduz emissões</li>
          <li><strong>Caminhada:</strong> Para distâncias curtas, a melhor opção</li>
          <li><strong>Veículos elétricos:</strong> Quando necessário, opte por elétricos</li>
        </ul>

        <h4>Benefícios do transporte sustentável:</h4>
        <ul>
          <li>Redução de emissões de CO₂</li>
          <li>Menos congestionamento</li>
          <li>Melhora na saúde física</li>
          <li>Economia financeira</li>
          <li>Melhor qualidade de vida</li>
        </ul>

        <h4>Dicas práticas:</h4>
        <ul>
          <li>Combine compromissos para reduzir viagens</li>
          <li>Use aplicativos de carona compartilhada</li>
          <li>Verifique rotas de transporte público</li>
          <li>Mantenha pneus calibrados e motor afinado</li>
        </ul>
      `,
      category: "transporte",
      readTime: 4,
    },
  ];

  const categories: Category[] = [
    { id: "all", label: t("Todos"), icon: "🌍" },
    { id: "basico", label: t("Básico"), icon: "📚" },
    { id: "clima", label: t("Clima"), icon: "🌡️" },
    { id: "energia", label: t("Energia"), icon: "⚡" },
    { id: "alimentacao", label: t("Alimentação"), icon: "🥗" },
    { id: "transporte", label: t("Transporte"), icon: "🚲" },
  ];

  const filteredArticles = activeCategory === "all"
    ? articles
    : articles.filter(article => article.category === activeCategory);

  const cardStyle: React.CSSProperties = {
    padding: 20,
    borderRadius: 8,
    backgroundColor: "#fff",
    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
    marginBottom: 20,
  };

  return (
    <div style={{ padding: 40, maxWidth: 1200, margin: "0 auto" }}>
      <div style={cardStyle}>
        <h1 style={{ margin: 0, marginBottom: 10 }}>{t("Educação Ambiental")}</h1>
        <p style={{ margin: 0, color: "#666" }}>
          {t("Aprenda sobre sustentabilidade, mudanças climáticas e como suas ações diárias impactam o planeta. Conhecimento é o primeiro passo para a mudança!")}
        </p>
      </div>

      {/* Categories */}
      <div style={cardStyle}>
        <h2 style={{ margin: "0 0 15px 0" }}>{t("Tópicos")}</h2>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          {categories.map(category => (
            <button
              key={category.id}
              onClick={() => setActiveCategory(category.id)}
              style={{
                padding: "8px 16px",
                borderRadius: 20,
                border: activeCategory === category.id ? "2px solid #22c55e" : "1px solid #e5e7eb",
                backgroundColor: activeCategory === category.id ? "#f0fdf4" : "#fff",
                color: activeCategory === category.id ? "#16a34a" : "#666",
                cursor: "pointer",
                fontWeight: activeCategory === category.id ? "bold" : "normal",
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <span>{category.icon}</span>
              {category.label}
            </button>
          ))}
        </div>
      </div>

      {/* Articles List or Article Detail */}
      {!selectedArticle ? (
        <div style={cardStyle}>
          <h2 style={{ margin: "0 0 20px 0" }}>{t("Artigos Disponíveis")}</h2>
          <div style={{ display: "grid", gap: 16, gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))" }}>
            {filteredArticles.map(article => (
              <div
                key={article.id}
                style={{
                  padding: 20,
                  border: "1px solid #e5e7eb",
                  borderRadius: 8,
                  backgroundColor: "#f9fafb",
                  cursor: "pointer",
                  transition: "transform 0.1s",
                }}
                onClick={() => setSelectedArticle(article)}
                onMouseOver={e => (e.currentTarget.style.transform = "scale(1.02)")}
                onMouseOut={e => (e.currentTarget.style.transform = "scale(1)")}
              >
                <h3 style={{ margin: "0 0 10px 0", fontSize: 18 }}>{article.title}</h3>
                <p style={{ margin: "0 0 10px 0", color: "#666" }}>{article.excerpt}</p>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{
                    padding: "4px 8px",
                    borderRadius: 12,
                    backgroundColor: "#e2e8f0",
                    color: "#475569",
                    fontSize: 12,
                    fontWeight: "bold",
                  }}>
                    {categories.find(c => c.id === article.category)?.label || article.category}
                  </span>
                  <span style={{ fontSize: 12, color: "#666" }}>
                    ⏱️ {article.readTime} {t("min de leitura")}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div style={cardStyle}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
            <div>
              <h2 style={{ margin: "0 0 10px 0" }}>{selectedArticle.title}</h2>
              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <span style={{
                  padding: "4px 8px",
                  borderRadius: 12,
                  backgroundColor: "#e2e8f0",
                  color: "#475569",
                  fontSize: 12,
                  fontWeight: "bold",
                }}>
                  {categories.find(c => c.id === selectedArticle.category)?.label || selectedArticle.category}
                </span>
                <span style={{ fontSize: 12, color: "#666" }}>
                  ⏱️ {selectedArticle.readTime} {t("min de leitura")}
                </span>
              </div>
            </div>
            <button
              onClick={() => setSelectedArticle(null)}
              style={{
                padding: "8px 16px",
                borderRadius: 6,
                border: "1px solid #e5e7eb",
                backgroundColor: "#fff",
                cursor: "pointer",
                fontSize: 14,
              }}
            >
              {t("← Voltar")}
            </button>
          </div>

          <div
            style={{ lineHeight: 1.6, color: "#333" }}
            dangerouslySetInnerHTML={{ __html: selectedArticle.content }}
          />
        </div>
      )}

      {/* Quick Tips */}
      <div style={cardStyle}>
        <h2 style={{ margin: "0 0 15px 0" }}>{t("Dicas Rápidas")}</h2>
        <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))" }}>
          <div style={{ padding: 16, backgroundColor: "#f0fdf4", borderRadius: 8 }}>
            <h4 style={{ margin: "0 0 8px 0", color: "#16a34a" }}>{t("Pequenas ações contam")}</h4>
            <p style={{ margin: 0, fontSize: 14, color: "#166534" }}>
              {t("Mesmo ações simples como desligar aparelhos ou usar sacolas reutilizáveis fazem diferença quando praticadas por milhões.")}
            </p>
          </div>
          <div style={{ padding: 16, backgroundColor: "#fef3c7", borderRadius: 8 }}>
            <h4 style={{ margin: "0 0 8px 0", color: "#ca8a04" }}>{t("Conheça seu impacto")}</h4>
            <p style={{ margin: 0, fontSize: 14, color: "#92400e" }}>
              {t("Use calculadoras de pegada de carbono para entender como suas escolhas afetam o planeta.")}
            </p>
          </div>
          <div style={{ padding: 16, backgroundColor: "#dbeafe", borderRadius: 8 }}>
            <h4 style={{ margin: "0 0 8px 0", color: "#2563eb" }}>{t("Faça parte da mudança")}</h4>
            <p style={{ margin: 0, fontSize: 14, color: "#1e40af" }}>
              {t("Compartilhe conhecimento e incentive amigos e família a adotarem práticas sustentáveis.")}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
