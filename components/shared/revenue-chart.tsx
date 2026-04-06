"use client";

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";

interface RevenueChartProps {
  data: { month: string; receita: number; despesas: number }[];
}

function CustomTooltip({ active, payload, label }: {
  active?: boolean;
  payload?: { name: string; value: number; color: string }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: "var(--background)", border: "1px solid var(--border)",
      borderRadius: "10px", padding: "10px 14px", boxShadow: "0 4px 16px rgba(0,0,0,0.1)",
    }}>
      <p style={{ fontSize: "12px", fontWeight: 700, color: "var(--app-text)", marginBottom: "6px" }}>{label}</p>
      {payload.map((p) => (
        <div key={p.name} style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px" }}>
          <div style={{ width: "8px", height: "8px", borderRadius: "2px", background: p.color }} />
          <span style={{ color: "var(--app-text-muted)" }}>{p.name === "receita" ? "Receita" : "Despesas"}:</span>
          <span style={{ fontWeight: 600, color: "var(--app-text)" }}>
            {new Intl.NumberFormat("pt-PT", { style: "currency", currency: "EUR" }).format(p.value)}
          </span>
        </div>
      ))}
    </div>
  );
}

export function RevenueChart({ data }: RevenueChartProps) {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data} barGap={4} barCategoryGap="30%">
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
        <XAxis
          dataKey="month"
          tick={{ fontSize: 11, fill: "var(--app-text-muted)" }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 11, fill: "var(--app-text-muted)" }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) => `€${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`}
          width={40}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: "var(--gray-50)" }} />
        <Bar dataKey="receita" fill="var(--brand-500)" radius={[4, 4, 0, 0]} />
        <Bar dataKey="despesas" fill="var(--brand-200)" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
