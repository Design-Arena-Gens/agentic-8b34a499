export async function POST(request) {
  try {
    const body = await request.json();
    const code = buildMql5(body || {});
    return new Response(JSON.stringify({ code }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err?.message || err) }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }
}

function buildMql5(raw) {
  const params = sanitizeParams(raw);
  const header = headerBlock(params);
  const common = commonBlock(params);
  const strategy = strategyBlock(params);
  const footer = footerBlock();
  return [header, common, strategy, footer].join('\n\n');
}

function sanitizeParams(p) {
  const s = (v, d) => (typeof v === 'string' && v.trim() ? v.trim() : d);
  const n = (v, d) => (isFinite(Number(v)) ? Number(v) : d);
  const strategy = s(p.strategy, 'MA_CROSS');
  return {
    strategy,
    symbol: s(p.symbol, '_Symbol'),
    symbolLiteral: s(p.symbol, 'EURUSD'),
    timeframe: mapTimeframe(s(p.timeframe, 'M15')),
    lotSize: n(p.lotSize, 0.10),
    stopLossPoints: n(p.stopLossPoints, 300),
    takeProfitPoints: n(p.takeProfitPoints, 600),
    magic: n(p.magic, 880034),
    comment: s(p.comment, 'EA_Gerado'),
    maFast: n(p.maFast, 9),
    maSlow: n(p.maSlow, 21),
    rsiPeriod: n(p.rsiPeriod, 14),
    rsiOverbought: n(p.rsiOverbought, 70),
    rsiOversold: n(p.rsiOversold, 30),
    macdFast: n(p.macdFast, 12),
    macdSlow: n(p.macdSlow, 26),
    macdSignal: n(p.macdSignal, 9),
    bbPeriod: n(p.bbPeriod, 20),
    bbDeviation: n(p.bbDeviation, 2.0),
  };
}

function mapTimeframe(tf) {
  const map = {
    M1: 'PERIOD_M1',
    M5: 'PERIOD_M5',
    M15: 'PERIOD_M15',
    M30: 'PERIOD_M30',
    H1: 'PERIOD_H1',
    H4: 'PERIOD_H4',
    D1: 'PERIOD_D1',
  };
  return map[tf] || 'PERIOD_M15';
}

function headerBlock(p) {
  return `//+------------------------------------------------------------------+\n//|                                                   EA Gerado MT5   |\n//|                                  https://agentic-8b34a499.vercel.app |\n//+------------------------------------------------------------------+\n#property strict\n#include <Trade/Trade.mqh>\n\ninput string InpSymbol = "${escapeStr(p.symbolLiteral)}";\ninput ENUM_TIMEFRAMES InpTimeframe = ${p.timeframe};\ninput double InpLotSize = ${p.lotSize.toFixed(2)};\ninput int InpStopLossPoints = ${p.stopLossPoints};\ninput int InpTakeProfitPoints = ${p.takeProfitPoints};\ninput long InpMagic = ${p.magic};\ninput string InpComment = "${escapeStr(p.comment)}";\n`;
}

function commonBlock(p) {
  return `CTrade trade;\nint maFastHandle = -1;\nint maSlowHandle = -1;\nint rsiHandle = -1;\nint macdHandle = -1;\nint bbHandle = -1;\n\nint OnInit() {\n  trade.SetExpertMagicNumber((ulong)InpMagic);\n  // Aloca indicadores conforme a estrat?gia\n  if (${p.strategy === 'MA_CROSS' ? 'true' : 'false'}) {\n    maFastHandle = iMA(InpSymbol, InpTimeframe, ${p.maFast}, 0, MODE_EMA, PRICE_CLOSE);\n    maSlowHandle = iMA(InpSymbol, InpTimeframe, ${p.maSlow}, 0, MODE_EMA, PRICE_CLOSE);\n    if (maFastHandle == INVALID_HANDLE || maSlowHandle == INVALID_HANDLE) return(INIT_FAILED);\n  }\n  if (${p.strategy === 'RSI' ? 'true' : 'false'}) {\n    rsiHandle = iRSI(InpSymbol, InpTimeframe, ${p.rsiPeriod}, PRICE_CLOSE);\n    if (rsiHandle == INVALID_HANDLE) return(INIT_FAILED);\n  }\n  if (${p.strategy === 'MACD' ? 'true' : 'false'}) {\n    macdHandle = iMACD(InpSymbol, InpTimeframe, ${p.macdFast}, ${p.macdSlow}, ${p.macdSignal}, PRICE_CLOSE);\n    if (macdHandle == INVALID_HANDLE) return(INIT_FAILED);\n  }\n  if (${p.strategy === 'BB_BREAKOUT' ? 'true' : 'false'}) {\n    bbHandle = iBands(InpSymbol, InpTimeframe, ${p.bbPeriod}, ${p.bbDeviation.toFixed(1)}, 0, PRICE_CLOSE);\n    if (bbHandle == INVALID_HANDLE) return(INIT_FAILED);\n  }\n  return(INIT_SUCCEEDED);\n}\n\nvoid OnDeinit(const int reason) {\n  if (maFastHandle != -1) IndicatorRelease(maFastHandle);\n  if (maSlowHandle != -1) IndicatorRelease(maSlowHandle);\n  if (rsiHandle != -1) IndicatorRelease(rsiHandle);\n  if (macdHandle != -1) IndicatorRelease(macdHandle);\n  if (bbHandle != -1) IndicatorRelease(bbHandle);\n}\n\nbool hasOpenPosition(string symbol) {\n  if (PositionSelect(symbol)) return true;\n  return false;\n}\n\nvoid placeOrder(bool isBuy) {\n  MqlTick tick;\n  if (!SymbolInfoTick(InpSymbol, tick)) return;\n  double sl = 0.0;\n  double tp = 0.0;\n  if (isBuy) {\n    sl = tick.bid - InpStopLossPoints * _Point;\n    tp = tick.bid + InpTakeProfitPoints * _Point;\n    trade.Buy(InpLotSize, InpSymbol, tick.ask, sl, tp, InpComment);\n  } else {\n    sl = tick.ask + InpStopLossPoints * _Point;\n    tp = tick.ask - InpTakeProfitPoints * _Point;\n    trade.Sell(InpLotSize, InpSymbol, tick.bid, sl, tp, InpComment);\n  }\n}\n`; 
}

function strategyBlock(p) {
  if (p.strategy === 'MA_CROSS') {
    return `void OnTick() {\n  if (hasOpenPosition(InpSymbol)) return;\n  double fast[2], slow[2];\n  if (CopyBuffer(maFastHandle, 0, 0, 2, fast) < 2) return;\n  if (CopyBuffer(maSlowHandle, 0, 0, 2, slow) < 2) return;\n  bool crossUp = (fast[1] <= slow[1]) && (fast[0] > slow[0]);\n  bool crossDn = (fast[1] >= slow[1]) && (fast[0] < slow[0]);\n  if (crossUp) placeOrder(true);\n  if (crossDn) placeOrder(false);\n}`;
  }
  if (p.strategy === 'RSI') {
    return `void OnTick() {\n  if (hasOpenPosition(InpSymbol)) return;\n  double rsi[1];\n  if (CopyBuffer(rsiHandle, 0, 0, 1, rsi) < 1) return;\n  if (rsi[0] < ${p.rsiOversold}) placeOrder(true);\n  else if (rsi[0] > ${p.rsiOverbought}) placeOrder(false);\n}`;
  }
  if (p.strategy === 'MACD') {
    return `void OnTick() {\n  if (hasOpenPosition(InpSymbol)) return;\n  double macdMain[2];\n  double macdSignal[2];\n  if (CopyBuffer(macdHandle, 0, 0, 2, macdMain) < 2) return;\n  if (CopyBuffer(macdHandle, 1, 0, 2, macdSignal) < 2) return;\n  bool crossUp = (macdMain[1] <= macdSignal[1]) && (macdMain[0] > macdSignal[0]);\n  bool crossDn = (macdMain[1] >= macdSignal[1]) && (macdMain[0] < macdSignal[0]);\n  if (crossUp) placeOrder(true);\n  if (crossDn) placeOrder(false);\n}`;
  }
  // BB_BREAKOUT
  return `void OnTick() {\n  if (hasOpenPosition(InpSymbol)) return;\n  double upper[1], middle[1], lower[1];\n  if (CopyBuffer(bbHandle, 0, 0, 1, upper) < 1) return;\n  if (CopyBuffer(bbHandle, 1, 0, 1, middle) < 1) return;\n  if (CopyBuffer(bbHandle, 2, 0, 1, lower) < 1) return;\n  MqlTick tick; if (!SymbolInfoTick(InpSymbol, tick)) return;\n  if (tick.bid > upper[0]) placeOrder(true);\n  else if (tick.bid < lower[0]) placeOrder(false);\n}`;
}

function footerBlock() {
  return `//+------------------------------------------------------------------+`;
}

function escapeStr(s) {
  return String(s || '').replaceAll('"', '\\"');
}
