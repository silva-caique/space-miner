export const fmt = n => Math.floor(n).toLocaleString('pt-BR');
export const fmtStat = (def, v) => def.unit.replace('{v}', v);
