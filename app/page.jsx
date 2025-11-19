"use client";

import { useMemo, useState } from "react";

const defaultParams = {
  strategy: "MA_CROSS",
  symbol: "EURUSD",
  timeframe: "M15",
  lotSize: 0.10,
  stopLossPoints: 300,
  takeProfitPoints: 600,
  magic: 880034,
  comment: "EA_Gerado",
  maFast: 9,
  maSlow: 21,
  rsiPeriod: 14,
  rsiOverbought: 70,
  rsiOversold: 30,
  macdFast: 12,
  macdSlow: 26,
  macdSignal: 9,
  bbPeriod: 20,
  bbDeviation: 2.0,
};

const TF_OPTIONS = [
  "M1",
  "M5",
  "M15",
  "M30",
  "H1",
  "H4",
  "D1",
];

const STRATEGIES = [
  { value: "MA_CROSS", label: "Cruzamento de M?dias (MA)" },
  { value: "RSI", label: "RSI" },
  { value: "MACD", label: "MACD" },
  { value: "BB_BREAKOUT", label: "Rompimento das Bandas de Bollinger" },
];

export default function HomePage() {
  const [params, setParams] = useState(defaultParams);
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const filename = useMemo(() => {
    const date = new Date().toISOString().slice(0, 10).replaceAll("-", "");
    return `${params.strategy}_${params.symbol}_${params.timeframe}_${date}.mq5`;
  }, [params.strategy, params.symbol, params.timeframe]);

  async function handleGenerate(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setCode("");
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
      });
      if (!res.ok) throw new Error(`Falha ao gerar c?digo: ${res.status}`);
      const json = await res.json();
      setCode(json.code || "");
    } catch (err) {
      setError(err.message || String(err));
    } finally {
      setLoading(false);
    }
  }

  function handleCopy() {
    if (!code) return;
    navigator.clipboard.writeText(code);
  }

  function handleDownload() {
    if (!code) return;
    const blob = new Blob([code], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  function update(field, value) {
    setParams((p) => ({ ...p, [field]: value }));
  }

  return (
    <main style={{
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      padding: "32px 16px",
      gap: 24,
    }}>
      <section style={{
        width: "100%",
        maxWidth: 1100,
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: 24,
      }}>
        <div style={{ background: "white", padding: 24, borderRadius: 12, boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
          <h1 style={{ margin: 0, fontSize: 28 }}>Gerador de Rob?s EA para MT5</h1>
          <p style={{ marginTop: 8, color: "#334155" }}>
            Escolha a estrat?gia, defina par?metros e gere o c?digo MQL5 pronto para compilar no MetaEditor.
          </p>
          <form onSubmit={handleGenerate} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 12 }}>
            <label style={{ display: "grid", gap: 6 }}>
              <span>Estrat?gia</span>
              <select value={params.strategy} onChange={(e) => update("strategy", e.target.value)}>
                {STRATEGIES.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </label>

            <label style={{ display: "grid", gap: 6 }}>
              <span>Ativo (s?mbolo)</span>
              <input value={params.symbol} onChange={(e) => update("symbol", e.target.value.toUpperCase())} />
            </label>

            <label style={{ display: "grid", gap: 6 }}>
              <span>Timeframe</span>
              <select value={params.timeframe} onChange={(e) => update("timeframe", e.target.value)}>
                {TF_OPTIONS.map((tf) => (
                  <option key={tf} value={tf}>{tf}</option>
                ))}
              </select>
            </label>

            <label style={{ display: "grid", gap: 6 }}>
              <span>Lote</span>
              <input type="number" step="0.01" value={params.lotSize} onChange={(e) => update("lotSize", Number(e.target.value))} />
            </label>

            <label style={{ display: "grid", gap: 6 }}>
              <span>Stop Loss (pontos)</span>
              <input type="number" value={params.stopLossPoints} onChange={(e) => update("stopLossPoints", Number(e.target.value))} />
            </label>

            <label style={{ display: "grid", gap: 6 }}>
              <span>Take Profit (pontos)</span>
              <input type="number" value={params.takeProfitPoints} onChange={(e) => update("takeProfitPoints", Number(e.target.value))} />
            </label>

            <label style={{ display: "grid", gap: 6 }}>
              <span>Magic Number</span>
              <input type="number" value={params.magic} onChange={(e) => update("magic", Number(e.target.value))} />
            </label>

            <label style={{ display: "grid", gap: 6 }}>
              <span>Coment?rio</span>
              <input value={params.comment} onChange={(e) => update("comment", e.target.value)} />
            </label>

            {params.strategy === "MA_CROSS" && (
              <div style={{ gridColumn: "1 / -1", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <label style={{ display: "grid", gap: 6 }}>
                  <span>MA R?pida</span>
                  <input type="number" value={params.maFast} onChange={(e) => update("maFast", Number(e.target.value))} />
                </label>
                <label style={{ display: "grid", gap: 6 }}>
                  <span>MA Lenta</span>
                  <input type="number" value={params.maSlow} onChange={(e) => update("maSlow", Number(e.target.value))} />
                </label>
              </div>
            )}

            {params.strategy === "RSI" && (
              <div style={{ gridColumn: "1 / -1", display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
                <label style={{ display: "grid", gap: 6 }}>
                  <span>Per?odo RSI</span>
                  <input type="number" value={params.rsiPeriod} onChange={(e) => update("rsiPeriod", Number(e.target.value))} />
                </label>
                <label style={{ display: "grid", gap: 6 }}>
                  <span>Sobrecompra</span>
                  <input type="number" value={params.rsiOverbought} onChange={(e) => update("rsiOverbought", Number(e.target.value))} />
                </label>
                <label style={{ display: "grid", gap: 6 }}>
                  <span>Sobrevenda</span>
                  <input type="number" value={params.rsiOversold} onChange={(e) => update("rsiOversold", Number(e.target.value))} />
                </label>
              </div>
            )}

            {params.strategy === "MACD" && (
              <div style={{ gridColumn: "1 / -1", display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
                <label style={{ display: "grid", gap: 6 }}>
                  <span>R?pida</span>
                  <input type="number" value={params.macdFast} onChange={(e) => update("macdFast", Number(e.target.value))} />
                </label>
                <label style={{ display: "grid", gap: 6 }}>
                  <span>Lenta</span>
                  <input type="number" value={params.macdSlow} onChange={(e) => update("macdSlow", Number(e.target.value))} />
                </label>
                <label style={{ display: "grid", gap: 6 }}>
                  <span>Sinal</span>
                  <input type="number" value={params.macdSignal} onChange={(e) => update("macdSignal", Number(e.target.value))} />
                </label>
              </div>
            )}

            {params.strategy === "BB_BREAKOUT" && (
              <div style={{ gridColumn: "1 / -1", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <label style={{ display: "grid", gap: 6 }}>
                  <span>Per?odo</span>
                  <input type="number" value={params.bbPeriod} onChange={(e) => update("bbPeriod", Number(e.target.value))} />
                </label>
                <label style={{ display: "grid", gap: 6 }}>
                  <span>Desvio</span>
                  <input type="number" step="0.1" value={params.bbDeviation} onChange={(e) => update("bbDeviation", Number(e.target.value))} />
                </label>
              </div>
            )}

            <div style={{ gridColumn: "1 / -1", display: "flex", gap: 12, marginTop: 8 }}>
              <button type="submit" disabled={loading} style={{
                background: "#0ea5e9",
                color: "white",
                border: 0,
                padding: "10px 14px",
                borderRadius: 8,
                cursor: "pointer",
              }}>{loading ? "Gerando..." : "Gerar C?digo"}</button>
              <button type="button" onClick={handleCopy} disabled={!code} style={{ padding: "10px 14px", borderRadius: 8, border: "1px solid #cbd5e1" }}>Copiar</button>
              <button type="button" onClick={handleDownload} disabled={!code} style={{ padding: "10px 14px", borderRadius: 8, border: "1px solid #cbd5e1" }}>Baixar .mq5</button>
            </div>

            {error && (
              <div style={{ gridColumn: "1 / -1", color: "#b91c1c", background: "#fee2e2", padding: 12, borderRadius: 8 }}>{error}</div>
            )}
          </form>
        </div>

        <div style={{ background: "white", padding: 24, borderRadius: 12, boxShadow: "0 1px 3px rgba(0,0,0,0.1)", minHeight: 300 }}>
          <h2 style={{ marginTop: 0 }}>Pr?via do C?digo</h2>
          <div style={{
            background: "#0b1220",
            color: "#e2e8f0",
            borderRadius: 8,
            padding: 12,
            whiteSpace: "pre",
            overflowX: "auto",
            maxHeight: 500,
          }}>
            {code ? code : "O c?digo MQL5 aparecer? aqui ap?s a gera??o."}
          </div>
        </div>
      </section>

      <section style={{ width: "100%", maxWidth: 1100, color: "#334155" }}>
        <div style={{ fontSize: 12 }}>
          <strong>Aviso:</strong> exemplo educacional. Teste no Strategy Tester e em conta demo.
        </div>
      </section>
    </main>
  );
}
