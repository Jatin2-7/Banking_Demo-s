// Tiny safe expression evaluator for manifest predicates and template paths.
//
// Supports:
//   slots.x.y                 — path lookup against ctx { slots, state, lang, ... }
//   state.x.y
//   !slots.x                  — negation of a path's truthiness
//   slots.x && slots.y        — AND
//   slots.x || slots.y        — OR
//   slots.x == "abc"          — equality with string/number literals
//   slots.x != null
//   slots.x.length > 0        — comparison with numeric literal
//
// No JS execution; explicit tokenizer. Used for `skip_if`.

export function lookupPath(path, ctx) {
  if (path == null) return undefined;
  const parts = String(path).split('.');
  let cur = ctx;
  for (const p of parts) {
    if (cur == null) return undefined;
    cur = cur[p];
  }
  return cur;
}

function parseLiteral(tok) {
  if (tok === 'null') return null;
  if (tok === 'true') return true;
  if (tok === 'false') return false;
  if (/^-?\d+(\.\d+)?$/.test(tok)) return Number(tok);
  if ((tok.startsWith('"') && tok.endsWith('"')) || (tok.startsWith("'") && tok.endsWith("'"))) {
    return tok.slice(1, -1);
  }
  return undefined; // not a literal
}

function evalAtom(atom, ctx) {
  atom = atom.trim();
  if (!atom) return false;
  let negate = false;
  if (atom.startsWith('!')) {
    negate = true;
    atom = atom.slice(1).trim();
  }
  // comparison?
  const cmp = atom.match(/^(.+?)\s*(==|!=|>=|<=|>|<)\s*(.+)$/);
  if (cmp) {
    const [, lhs, op, rhs] = cmp;
    const lv = resolveSide(lhs.trim(), ctx);
    const rv = resolveSide(rhs.trim(), ctx);
    let result;
    switch (op) {
      case '==':
        result = lv === rv;
        break;
      case '!=':
        result = lv !== rv;
        break;
      case '>':
        result = Number(lv) > Number(rv);
        break;
      case '<':
        result = Number(lv) < Number(rv);
        break;
      case '>=':
        result = Number(lv) >= Number(rv);
        break;
      case '<=':
        result = Number(lv) <= Number(rv);
        break;
    }
    return negate ? !result : result;
  }
  const v = lookupPath(atom, ctx);
  const truthy = !(v == null || v === '' || v === false || v === 0);
  return negate ? !truthy : truthy;
}

function resolveSide(side, ctx) {
  const lit = parseLiteral(side);
  if (lit !== undefined) return lit;
  return lookupPath(side, ctx);
}

export function evalExpr(expr, ctx) {
  if (expr == null || expr === '') return false;
  if (typeof expr !== 'string') return Boolean(expr);
  const orParts = splitTopLevel(expr, '||');
  for (const op of orParts) {
    const andParts = splitTopLevel(op, '&&');
    let all = true;
    for (const a of andParts) {
      if (!evalAtom(a, ctx)) {
        all = false;
        break;
      }
    }
    if (all) return true;
  }
  return false;
}

// Split on a 2-char operator at top level (no parens supported, simple).
function splitTopLevel(s, op) {
  const out = [];
  let depth = 0;
  let last = 0;
  let inStr = null;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (inStr) {
      if (c === inStr) inStr = null;
      continue;
    }
    if (c === '"' || c === "'") {
      inStr = c;
      continue;
    }
    if (c === '(') depth++;
    else if (c === ')') depth--;
    else if (depth === 0 && s.startsWith(op, i)) {
      out.push(s.slice(last, i));
      i += op.length - 1;
      last = i + 1;
    }
  }
  out.push(s.slice(last));
  return out.map((x) => x.trim()).filter(Boolean);
}

// Render a {path} template against ctx. {item.x} also supported (caller provides item).
//
// Formatters:
//   {slots.amount}             → "50000"
//   {currency:slots.amount}    → "50,000"  (Indian grouping; useful for ₹ prefixes)
//
// More formatters can be added here without touching call-sites.
export function render(template, ctx) {
  if (template == null) return '';
  if (typeof template !== 'string') return String(template);
  return template.replace(/\{([^}]+)\}/g, (_, raw) => {
    const expr = raw.trim();
    const lit = parseLiteral(expr);
    if (lit !== undefined) return String(lit);

    // formatter prefix: "<name>:<path>"
    const fmtMatch = expr.match(/^([a-z_]+):(.+)$/);
    if (fmtMatch) {
      const [, name, path] = fmtMatch;
      const v = lookupPath(path.trim(), ctx);
      return formatValue(name, v);
    }

    const v = lookupPath(expr, ctx);
    return v == null ? '' : String(v);
  });
}

function formatValue(name, value) {
  if (value == null) return '';
  switch (name) {
    case 'currency': {
      const n = Number(value);
      return Number.isFinite(n) ? n.toLocaleString('en-IN') : '';
    }
    default:
      return String(value);
  }
}

// Bind input_map values: support `$path` (raw lookup) and `{path}` (string render).
export function bindInputs(map, ctx) {
  const out = {};
  for (const [k, v] of Object.entries(map || {})) {
    if (typeof v === 'string') {
      if (v.startsWith('$')) out[k] = lookupPath(v.slice(1), ctx);
      else if (v.includes('{')) out[k] = render(v, ctx);
      else out[k] = v;
    } else {
      out[k] = v;
    }
  }
  return out;
}
