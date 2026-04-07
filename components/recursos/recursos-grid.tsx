"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { BookOpen, FileText, ClipboardList, CheckSquare, Calculator, ExternalLink } from "lucide-react";

const TYPE_ICONS: Record<string, React.ElementType> = {
  GUIDE: BookOpen,
  TEMPLATE: FileText,
  SOP: ClipboardList,
  CHECKLIST: CheckSquare,
  CALCULATOR: Calculator,
};

const TYPE_LABELS: Record<string, string> = {
  GUIDE: "Guia",
  TEMPLATE: "Template",
  SOP: "SOP",
  CHECKLIST: "Checklist",
  CALCULATOR: "Calculadora",
};

const TYPE_COLORS: Record<string, "brand" | "info" | "default" | "success" | "warning" | "danger" | "purple"> = {
  GUIDE: "brand",
  TEMPLATE: "info",
  SOP: "purple",
  CHECKLIST: "success",
  CALCULATOR: "warning",
};

const RESOURCE_CONTENT: Record<string, string> = {
  "guide-grooming": `**Passos para montar um negócio de Grooming:**

1. **Licenciamento** — Regista a actividade junto da Câmara Municipal e obtém alvará de estabelecimento comercial.
2. **Espaço** — Mínimo 20m², com zona de banho, mesa de trabalho, secador e gaiolas. Boa ventilação e drenagem de água.
3. **Equipamento essencial** — Banheira ergonómica, secador profissional, mesa hidráulica, tesouras e máquinas de corte de qualidade.
4. **Serviços base** — Banho e secagem, corte de pelagem, aparação de unhas, limpeza de ouvidos.
5. **Preçário** — Varia por raça, porte e tipo de pelagem. Começa entre €20–€60 por sessão.
6. **Marketing** — Google My Business, Instagram com fotos de antes/depois, parceria com veterinários locais.
7. **Agenda** — Usa o PetBiz para gerir marcações e ficha de cada animal.`,

  "checklist-hotel": `**Checklist Hotel para Pets:**

**Check-in:**
- [ ] Verificar vacinas actualizadas (mínimo: raiva, esgana, parvovirose)
- [ ] Registar medicação e horários
- [ ] Documentar condições de saúde actuais
- [ ] Tirar foto do animal à chegada
- [ ] Assinar contrato de hospedagem
- [ ] Recolher contacto de emergência
- [ ] Verificar ração trazida pelo tutor

**Cuidados diários:**
- [ ] Alimentação nos horários acordados
- [ ] Passeio ou tempo de recreio (mín. 2× por dia)
- [ ] Limpeza do espaço
- [ ] Registo de comportamento e apetite

**Check-out:**
- [ ] Confirmar estado de saúde
- [ ] Entregar pertences e sobras de ração
- [ ] Enviar relatório ao tutor`,

  "template-anamnese": `**Ficha de Anamnese Veterinária:**

**Animal:**
- Nome: _____ Espécie: _____ Raça: _____
- Idade: _____ Peso: _____ Sexo: M / F
- Castrado/a: Sim / Não

**Motivo da consulta:**
________________________________________________________________

**Historial clínico:**
- Vacinas em dia? Sim / Não — Quais: _____
- Desparasitação: Interna _____ Externa _____
- Cirurgias anteriores: _____
- Medicação habitual: _____
- Alergias conhecidas: _____

**Exame físico:**
- Temperatura: _____ ºC
- FC: _____ bpm / FR: _____ rpm
- TRC: _____ s / Mucosas: _____
- Auscultação: _____
- Palpação abdominal: _____

**Diagnóstico:** ________________________________________________________________

**Plano terapêutico:** ________________________________________________________________`,

  "template-hospedagem": `**Contrato de Hospedagem de Animais**

Entre **[Nome do estabelecimento]** (doravante "Prestador") e **[Nome do tutor]** (doravante "Tutor"):

**1. Identificação do Animal**
Nome: _____ Raça: _____ Idade: _____ Microchip: _____

**2. Período de hospedagem**
Entrada: ___/___/_____ Saída prevista: ___/___/_____

**3. Responsabilidades do Prestador**
- Garantir alimentação, higiene e segurança do animal.
- Contactar o tutor em caso de emergência de saúde.
- Administrar medicação conforme indicado.

**4. Responsabilidades do Tutor**
- Declarar o estado de saúde real do animal.
- Fornecer vacinas actualizadas.
- Fornecer ração suficiente para o período.

**5. Emergências**
O Prestador poderá recorrer a cuidados veterinários urgentes se necessário, com custos a cargo do Tutor.

**Assinaturas:** Prestador _____ / Tutor _____`,

  "template-autorizacao": `**Termo de Autorização de Procedimentos**

Eu, **[Nome do tutor]**, portador do NIF _____, autorizo o **[Nome da clínica/grooming]** a realizar os seguintes procedimentos no animal:

**Animal:** [Nome] — Raça: _____ / Microchip: _____

**Procedimentos autorizados:**
- [ ] Tosquia/corte de pelo
- [ ] Anestesia geral
- [ ] Intervenção cirúrgica: _____
- [ ] Exames complementares: _____
- [ ] Medicação prescrita: _____

**Declarações:**
- Declaro que o animal se encontra em condições de saúde adequadas ao procedimento.
- Autorizo o uso de anestesia local/geral se necessário.
- Estou ciente dos riscos inerentes ao procedimento.

Data: ___/___/_____
Assinatura: _____________________`,

  "sop-checkin": `**SOP — Processo de Check-in / Check-out**

**CHECK-IN (duração estimada: 10–15 min)**

1. Receber tutor e animal na recepção.
2. Confirmar reserva no sistema (PetBiz → Agenda).
3. Verificar documentação: vacinas, contrato assinado.
4. Registar peso actual e condição corporal.
5. Fotografar o animal (referência de estado).
6. Recolher medicação, ração e pertences. Etiquetar tudo.
7. Confirmar contactos de emergência.
8. Instalar o animal no espaço designado e observar adaptação inicial.

**CHECK-OUT (duração estimada: 5–10 min)**

1. Verificar estado de saúde geral.
2. Preparar relatório de estadia (alimentação, comportamento, incidentes).
3. Reunir todos os pertences do animal.
4. Processar pagamento.
5. Entregar ao tutor com relatório verbal e/ou escrito.
6. Actualizar ficha do animal no PetBiz.`,

  "sop-emergencia": `**Protocolo de Emergência Médica**

**Sinais de emergência:**
- Dificuldade respiratória / gengivas azuladas
- Convulsões / colapso / inconsciência
- Hemorragia grave
- Vómitos ou diarreia com sangue
- Suspeita de envenenamento
- Trauma (atropelamento, queda de altura)

**Procedimento:**

1. **Manter a calma** e avaliar a situação sem pôr em risco a tua segurança.
2. **Contactar o tutor** de imediato — telefone de emergência na ficha.
3. **Ligar para o veterinário** de apoio: ___________________
4. **Primeiros socorros básicos:**
   - Não dar comida/água
   - Manter o animal aquecido e quieto
   - Não remover objectos empalados
5. **Transportar com segurança** — usar transportadora ou maca improvisada.
6. **Registar o incidente** no PetBiz com hora, sintomas e acções tomadas.
7. Após resolução, comunicar por escrito ao tutor.`,

  "calc-precificacao": `**Calculadora de Precificação de Serviços**

**Fórmula base:**
> Preço = (Custo directo + Custos fixos alocados) ÷ (1 − Margem desejada)

**Exemplo — Banho e tosquia (médio porte):**

| Item | Valor |
|------|-------|
| Produtos (champô, condicionador) | €2,50 |
| Consumíveis (toalhas, luvas) | €0,80 |
| Custo/hora × tempo médio (45 min) | €6,00 |
| Custos fixos alocados (renda, luz, seguros) | €4,00 |
| **Custo total** | **€13,30** |
| Margem desejada (40%) | — |
| **Preço mínimo sugerido** | **€22,17** |
| **Preço de mercado recomendado** | **€28–€35** |

**Dicas:**
- Aplica preços diferentes por porte (pequeno/médio/grande/gigante).
- Cobra suplemento para raças de tosa complexa (+20–30%).
- Revê os preços a cada 6 meses face à inflação e concorrência.`,

  "guide-petsitter": `**Guia de Arranque — Pet Sitter**

**1. Define os teus serviços**
- Visitas ao domicílio (30 ou 60 min)
- Passeios (individual ou grupo)
- Estadia em casa do pet sitter
- Babysitting (companhia prolongada)

**2. Documentação e seguros**
- Regista actividade nas Finanças (CAE 96092).
- Contrata seguro de responsabilidade civil.
- Prepara contrato tipo para cada cliente.

**3. Perfil e captação**
- Fotos profissionais com animais.
- Perfil no Google Maps, Rover ou Pawshake.
- Pede avaliações aos primeiros clientes.

**4. Precificação**
- Visita domicílio: €10–€18 / visita
- Passeio: €12–€20 / hora
- Estadia: €25–€45 / noite

**5. Operação diária**
- Usa o PetBiz para gerir agenda e fichas dos animais.
- Envia actualizações com fotos aos tutores.
- Regista qualquer incidente por escrito.`,

  "guide-pricing": `**Estratégia de Preços para Negócios Pet**

**1. Conhece os teus custos**
Antes de qualquer preço, calcula o custo real de cada serviço (mão-de-obra, produtos, tempo, overhead).

**2. Pesquisa o mercado local**
Verifica os preços de 3–5 concorrentes na tua área. Posiciona-te com base no teu diferencial.

**3. Estratégias de posicionamento**

| Estratégia | Quando usar |
|-----------|-------------|
| Preço premium | Serviço especializado, reputação estabelecida |
| Preço médio de mercado | Arranque, zona competitiva |
| Entrada acessível | Captar primeiros clientes, depois aumentar |

**4. Pacotes e fidelização**
- Pacote 5 banhos = paga 4.
- Cartão de cliente frequente (10ª visita gratuita).
- Desconto anual para serviços de hotel recorrentes.

**5. Quando e como aumentar preços**
- Comunica com 30 dias de antecedência.
- Explica o motivo (inflação, melhoria do serviço).
- Aplica gradualmente (+10–15% por ajuste).`,
};

interface Resource {
  id: string;
  title: string;
  description: string;
  type: string;
  category: string;
}

interface RecursosGridProps {
  categories: string[];
  resources: Resource[];
}

export function RecursosGrid({ categories, resources }: RecursosGridProps) {
  const [activeResource, setActiveResource] = useState<Resource | null>(null);

  return (
    <>
      {categories.map((cat) => {
        const catResources = resources.filter((r) => r.category === cat);
        return (
          <div key={cat}>
            <p style={{ fontSize: "11px", fontWeight: 700, color: "var(--app-text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "12px" }}>
              {cat}
            </p>
            <div className="grid-3-cols" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px" }}>
              {catResources.map((resource) => {
                const Icon = TYPE_ICONS[resource.type] ?? BookOpen;
                return (
                  <Card key={resource.id} className="card-hover">
                    <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
                      <div style={{ width: "36px", height: "36px", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "var(--radius-sm)", background: "var(--brand-50)" }}>
                        <Icon size={17} style={{ color: "var(--brand-600)" }} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ marginBottom: "6px" }}>
                          <Badge variant={TYPE_COLORS[resource.type]}>
                            {TYPE_LABELS[resource.type]}
                          </Badge>
                        </div>
                        <p style={{ fontSize: "13px", fontWeight: 600, color: "var(--app-text)", margin: "0 0 4px", lineHeight: 1.4 }}>
                          {resource.title}
                        </p>
                        <p style={{ fontSize: "12px", color: "var(--app-text-muted)", margin: "0 0 12px", lineHeight: 1.5 }}>
                          {resource.description}
                        </p>
                        <button
                          onClick={() => setActiveResource(resource)}
                          style={{ display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "12px", color: "var(--brand-600)", fontWeight: 500, background: "none", border: "none", cursor: "pointer", padding: 0 }}
                        >
                          <ExternalLink size={11} />
                          Ver recurso
                        </button>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        );
      })}

      <Modal
        open={!!activeResource}
        onClose={() => setActiveResource(null)}
        title={activeResource?.title}
        description={activeResource ? `${TYPE_LABELS[activeResource.type]} · ${activeResource.category}` : undefined}
        size="lg"
      >
        {activeResource && (
          <div style={{ fontSize: "13px", color: "var(--app-text)", lineHeight: 1.7, whiteSpace: "pre-wrap" }}>
            {RESOURCE_CONTENT[activeResource.id] ?? activeResource.description}
          </div>
        )}
      </Modal>
    </>
  );
}
