/* Version: #28 - Synlig distribusjons-multiplikasjon og "Trekk sammen"-knapp */

const examples =[
    { label: "2(x + 3) = 14", left: "2(x + 3)", right: "14", mode: "equation", group: "Ligninger (Parenteser)" },
    { label: "5x + 10 = 25", left: "5x + 10", right: "25", mode: "equation", group: "Ligninger (Lineære)" },
    { label: "3x - 7 = 2x + 5", left: "3x - 7", right: "2x + 5", mode: "equation", group: "Ligninger (Lineære)" },
    { label: "12/x = 4", left: "12/x", right: "4", mode: "equation", group: "Ligninger (Brøk & Potens)" },
    { label: "(x - 2)/(x^2 - 4x + 4) = 12", left: "(x - 2)/(x^2 - 4x + 4)", right: "12", mode: "equation", group: "Ligninger (Brøk & Potens)" },
    { label: "x^2 + 6^2 = 10^2", left: "x^2 + 6^2", right: "10^2", mode: "equation", group: "Ligninger (Brøk & Potens)" },
    { label: "x^2 + 4x + 4", left: "x^2 + 4x + 4", right: "0", mode: "expression", group: "Algebra (Forenkle & Faktorisere)" },
    { label: "x^2 - 25", left: "x^2 - 25", right: "0", mode: "expression", group: "Algebra (Forenkle & Faktorisere)" },
    { label: "(x^2 - 9) / (x - 3)", left: "(x^2 - 9) / (x - 3)", right: "0", mode: "expression", group: "Algebra (Forenkle & Faktorisere)" },
    { label: "256 / 64", left: "256 / 64", right: "0", mode: "expression", group: "Algebra (Forenkle & Faktorisere)" },
    { label: "10x = 33 (Svar blir brøk)", left: "10x", right: "33", mode: "equation", group: "Ligninger (Lineære)" }
];

let state = {
    lines:[], 
    currentStatus: 'IDLE', 
    currentMode: 'equation',
    manualCancelMode: false,
    cancelSelection: []
};

// === SEKSJON: Kjerne-Matematikk ===

function cleanState(poly) {
    let clean = {};
    for (let exp in poly) {
        let val = Math.round(poly[exp] * 10000) / 10000;
        if (val !== 0) clean[exp] = val;
    }
    return clean;
}

function polyAdd(p1, p2) {
    let res = {...p1};
    for (let k in p2) { res[k] = (res[k] || 0) + p2[k]; }
    return cleanState(res);
}

function polySub(p1, p2) {
    let res = {...p1};
    for (let k in p2) { res[k] = (res[k] || 0) - p2[k]; }
    return cleanState(res);
}

function polyMul(p1, p2) {
    let res = {};
    for (let k1 in p1) {
        for (let k2 in p2) {
            let newExp = parseInt(k1) + parseInt(k2);
            res[newExp] = (res[newExp] || 0) + (p1[k1] * p2[k2]);
        }
    }
    return cleanState(res);
}

function polyPow(poly, exp) {
    let keys = Object.keys(poly);
    if (keys.length === 1) {
        let k = parseInt(keys[0]);
        let res = {};
        res[k * exp] = Math.pow(poly[k], exp);
        return cleanState(res);
    }
    if (!Number.isInteger(exp) || exp < 0) throw "Kan bare opphøye i hele, positive tall.";
    if (exp === 0) return {0: 1};
    let res = {0: 1};
    for (let i = 0; i < exp; i++) res = polyMul(res, poly);
    return res;
}

function applySqrt(poly) {
    let keys = Object.keys(poly);
    if (keys.length > 1) throw "Isoler leddet før du tar kvadratrot!";
    if (keys.length === 0) return {};
    let exp = parseInt(keys[0]);
    let coef = poly[exp];
    if (coef < 0) throw "Kan ikke ta kvadratroten av et negativt tall.";
    let newExp = exp / 2;
    if (!Number.isInteger(newExp)) throw `Kan ikke ta kvadratroten av x^${exp} her.`;
    let res = {};
    res[newExp] = Math.sqrt(coef);
    return cleanState(res);
}

function polyEquals(p1, p2) {
    let k1 = Object.keys(p1), k2 = Object.keys(p2);
    if (k1.length !== k2.length) return false;
    for(let k of k1) {
        if (Math.abs((p1[k]||0) - (p2[k]||0)) > 0.0001) return false;
    }
    return true;
}

function polyDivAlg(n, d) {
    let nClean = cleanState(n);
    let dClean = cleanState(d);
    let nKeys = Object.keys(nClean).map(Number).sort((a,b)=>b-a);
    let dKeys = Object.keys(dClean).map(Number).sort((a,b)=>b-a);
    
    if (dKeys.length === 0) throw "Kan ikke dele på null.";
    
    let q = {};
    let r = { ...nClean };
    let dDeg = dKeys[0];
    
    let maxIter = 50; 
    let iter = 0;
    
    while (iter++ < maxIter) {
        let rKeys = Object.keys(r).map(Number).sort((a,b)=>b-a);
        if (rKeys.length === 0) break;
        let rDeg = rKeys[0];
        if (rDeg < dDeg) break; 
        
        let termDeg = rDeg - dDeg;
        let termCoef = r[rDeg] / dClean[dDeg];
        q[termDeg] = (q[termDeg] || 0) + termCoef;
        
        let termPoly = {}; 
        termPoly[termDeg] = termCoef;
        let subPoly = polyMul(termPoly, dClean);
        r = cleanState(polySub(r, subPoly));
    }
    return { q: cleanState(q), r: cleanState(r) };
}

function getPrimeFactors(n) {
    let factors = [];
    let d = 2;
    while (n > 1) {
        while (n % d === 0) { factors.push(d); n /= d; }
        d++;
        if (d * d > n && n > 1) { factors.push(n); break; }
    }
    return factors;
}

function buildFactorTree(factors) {
    if (factors.length === 0) return { type: 'FlatPoly', poly: {0:1}, id: uid() };
    if (factors.length === 1) return { type: 'FlatPoly', poly: {0: factors[0]}, id: uid() };
    let left = { type: 'FlatPoly', poly: {0: factors[0]}, id: uid() };
    let right = buildFactorTree(factors.slice(1));
    return { type: 'Mul', left: left, right: right, implicit: false, id: uid() };
}

function polyToText(poly) {
    let keys = Object.keys(poly).map(Number).sort((a,b)=>b-a);
    if (keys.length === 0) return '0';
    let str = '';
    for (let i = 0; i < keys.length; i++) {
        let exp = keys[i];
        let coef = poly[exp];
        let abs = Math.abs(coef);
        
        if (i > 0) str += coef < 0 ? ' - ' : ' + ';
        else if (coef < 0) str += '-';

        if (exp === 0) str += abs;
        else if (exp === 1) str += (abs === 1 ? '' : abs) + 'x';
        else str += (abs === 1 ? '' : abs) + 'x^' + exp;
    }
    return str;
}

// === SEKSJON: AST Parser & Dyp Kopi ===

function uid() { return Math.random().toString(36).substr(2, 9); }

function deepClone(node) {
    if (!node) return null;
    return JSON.parse(JSON.stringify(node));
}

function tokenize(str) {
    let tokens =[];
    let i = 0;
    let s = str.replace(/\s+/g, '');
    while (i < s.length) {
        let char = s[i];
        if (/[+\-*/^()]/.test(char)) { tokens.push({type: char, val: char}); i++; continue; }
        if (char.toLowerCase() === 'x') { tokens.push({type: 'x', val: 'x'}); i++; continue; }
        if (/\d/.test(char) || char === '.') {
            let num = '';
            while (i < s.length && (/\d/.test(s[i]) || s[i] === '.')) { num += s[i]; i++; }
            tokens.push({type: 'NUM', val: parseFloat(num)});
            continue;
        }
        throw `Ukjent tegn: ${char}`;
    }
    return tokens;
}

function parseTokens(tokens) {
    let pos = 0;
    const peek = () => tokens[pos];
    const consume = () => tokens[pos++];

    function parseExpr() {
        let elements =[];
        let firstSign = 1;
        if (peek() && peek().type === '-') { consume(); firstSign = -1; }
        else if (peek() && peek().type === '+') { consume(); }
        
        elements.push({ sign: firstSign, node: parseTerm() });

        while (peek() && (peek().type === '+' || peek().type === '-')) {
            let op = consume().type;
            elements.push({ sign: op === '+' ? 1 : -1, node: parseTerm() });
        }
        if (elements.length === 1 && elements[0].sign === 1) return elements[0].node;
        return { type: 'Expr', elements, id: uid() };
    }

    function parseTerm() {
        let node = parseFactor();
        while (peek()) {
            let p = peek();
            if (p.type === '*' || p.type === '/') {
                let op = consume().type;
                node = { type: op === '*' ? 'Mul' : 'Div', left: node, right: parseFactor(), implicit: false, id: uid() };
            } else if (p.type === 'NUM' || p.type === 'x' || p.type === '(') {
                node = { type: 'Mul', left: node, right: parseFactor(), implicit: true, id: uid() };
            } else break;
        }
        return node;
    }

    function parseFactor() {
        let node = parseBase();
        while (peek() && peek().type === '^') {
            consume();
            node = { type: 'Pow', left: node, right: parseBase(), id: uid() };
        }
        return node;
    }

    function parseBase() {
        let p = peek();
        if (!p) return { type: 'FlatPoly', poly: {0: 0}, id: uid() };
        if (p.type === '-') { consume(); return { type: 'Mul', left: { type: 'FlatPoly', poly: {0: -1}, id: uid() }, right: parseBase(), implicit: true, id: uid() }; }
        if (p.type === '+') { consume(); return parseBase(); }
        if (p.type === 'NUM') { consume(); return { type: 'FlatPoly', poly: {0: p.val}, id: uid() }; }
        if (p.type === 'x') { consume(); return { type: 'FlatPoly', poly: {1: 1}, id: uid() }; }
        if (p.type === '(') {
            consume();
            let inner = parseExpr();
            if (peek() && peek().type === ')') consume();
            else throw "Mangler sluttparentes ')'";
            return { type: 'Parens', inner: inner, id: uid() };
        }
        throw "Ugyldig uttrykk ved: " + p.val;
    }

    return parseExpr();
}

function parseSide(sideStr) {
    if (!sideStr) return { type: 'FlatPoly', poly: {0:0}, id: uid() };
    return parseTokens(tokenize(sideStr));
}

// === SEKSJON: Evaluering med BRØKBESKYTTELSE ===

function evaluateToFraction(node) {
    if (!node) return { num: {0:0}, den: {0:1} };
    if (node.type === 'FlatPoly') return { num: node.poly, den: {0:1} };
    if (node.type === 'Cancelled') return { num: {0:1}, den: {0:1} };
    if (node.type === 'Expr') {
        let resNum = {0:0};
        let resDen = {0:1};
        for (let el of node.elements) {
            let f = evaluateToFraction(el.node);
            let ad = polyMul(resNum, f.den);
            let cb = polyMul(f.num, resDen);
            if (el.sign === 1) resNum = polyAdd(ad, cb);
            else resNum = polySub(ad, cb);
            resDen = polyMul(resDen, f.den);
        }
        return { num: cleanState(resNum), den: cleanState(resDen) };
    }
    if (node.type === 'Mul') {
        let l = evaluateToFraction(node.left);
        let r = evaluateToFraction(node.right);
        return { num: polyMul(l.num, r.num), den: polyMul(l.den, r.den) };
    }
    if (node.type === 'Div') {
        let l = evaluateToFraction(node.left);
        let r = evaluateToFraction(node.right);
        return { num: polyMul(l.num, r.den), den: polyMul(l.den, r.num) };
    }
    if (node.type === 'Pow') {
        let base = evaluateToFraction(node.left);
        let expObj = evaluateToFraction(node.right);
        let expDiv = polyDivAlg(expObj.num, expObj.den);
        if (Object.keys(expDiv.r).length > 0 || Object.keys(expDiv.q).length !== 1 || expDiv.q['0'] === undefined) throw "Eksponent må være et vanlig tall.";
        let exp = expDiv.q['0'];
        return { num: polyPow(base.num, exp), den: polyPow(base.den, exp) };
    }
    if (node.type === 'Parens') return evaluateToFraction(node.inner);
    if (node.type === 'Sqrt') {
        let inner = evaluateToFraction(node.inner);
        return { num: applySqrt(inner.num), den: applySqrt(inner.den) };
    }
    return { num: {0:0}, den: {0:1} };
}

function evaluateToPoly(node) {
    let frac = evaluateToFraction(node);
    let div = polyDivAlg(frac.num, frac.den);
    if (Object.keys(div.r).length === 0) {
        let denKeys = Object.keys(frac.den);
        if (denKeys.length === 1 && denKeys[0] === '0') {
            let dVal = frac.den['0'];
            if (Math.abs(dVal) !== 1) {
                for (let k in frac.num) {
                    if (Math.abs(frac.num[k] % dVal) > 0.0001) throw "Dette er en brøk som ikke går opp flatt.";
                }
            }
        }
        return div.q;
    }
    throw "Dette er en brøk som ikke går opp flatt.";
}

function tryFactorize(poly) {
    let keys = Object.keys(poly).map(Number).sort((a,b)=>b-a);

    if (keys.length === 2 && keys.includes(2) && keys.includes(0)) {
        let a = poly[2], c = poly[0];
        if (a === 1 && c < 0) {
            let root = Math.sqrt(-c);
            if (Number.isInteger(root)) {
                let leftInner = { type: 'Expr', elements:[{sign:1, node:{type:'FlatPoly', poly:{1:1}, id:uid()}}, {sign:-1, node:{type:'FlatPoly', poly:{0:root}, id:uid()}}], id:uid() };
                let rightInner = { type: 'Expr', elements:[{sign:1, node:{type:'FlatPoly', poly:{1:1}, id:uid()}}, {sign:1, node:{type:'FlatPoly', poly:{0:root}, id:uid()}}], id:uid() };
                return { type: 'Mul', left: {type:'Parens', inner:leftInner, id:uid()}, right: {type:'Parens', inner:rightInner, id:uid()}, implicit:true, id:uid() };
            }
        }
    } 
    else if (keys.length === 3 && keys.includes(2) && keys.includes(1) && keys.includes(0)) {
        let a = poly[2], b = poly[1], c = poly[0];
        if (a === 1 && c > 0) {
            let rootC = Math.sqrt(c);
            if (Number.isInteger(rootC) && (b === 2*rootC || b === -2*rootC)) {
                let sign = b > 0 ? 1 : -1;
                let inner = { type: 'Expr', elements:[{sign:1, node:{type:'FlatPoly', poly:{1:1}, id:uid()}}, {sign:sign, node:{type:'FlatPoly', poly:{0:rootC}, id:uid()}}], id:uid() };
                return { type: 'Pow', left: {type:'Parens', inner:inner, id:uid()}, right: {type:'FlatPoly', poly:{0:2}, id:uid()}, id:uid() };
            }
        }
    }
    return null;
}

function getFactors(node) {
    if (node.type === 'Mul') return[...getFactors(node.left), ...getFactors(node.right)];
    if (node.type === 'Pow' && node.right.type === 'FlatPoly' && node.right.poly['0'] === 2) {
        return [node.left, node.left]; 
    }
    if (node.type === 'Parens') return [node.inner];
    return[node];
}

function hasCancelledNodes(n) {
    if (!n) return false;
    if (n.type === 'Cancelled') return true;
    if (n.elements) return n.elements.some(e => hasCancelledNodes(e.node));
    return hasCancelledNodes(n.left) || hasCancelledNodes(n.right) || hasCancelledNodes(n.inner);
}

function tryCancelFraction(divNode) {
    function removeCancelled(n) {
        if (n.type === 'Cancelled') return null;
        if (n.type === 'Mul') {
            let l = removeCancelled(n.left), r = removeCancelled(n.right);
            if (!l && !r) return null;
            if (!l) return r;
            if (!r) return l;
            return { ...n, left: l, right: r };
        }
        if (n.type === 'Parens') {
            let inner = removeCancelled(n.inner);
            return inner ? { ...n, inner: inner } : null;
        }
        return n;
    }
    
    if (hasCancelledNodes(divNode.left) || hasCancelledNodes(divNode.right)) {
        let newTop = removeCancelled(divNode.left) || { type: 'FlatPoly', poly: {0:1}, id: uid() };
        let newBot = removeCancelled(divNode.right) || { type: 'FlatPoly', poly: {0:1}, id: uid() };
        
        try {
            let botPoly = evaluateToPoly(newBot);
            if (Object.keys(botPoly).length === 1 && botPoly[0] === 1) return newTop;
        } catch(e) {}
        return { ...divNode, left: newTop, right: newBot };
    }
    
    let topFactors = getFactors(divNode.left).map(n => { try { return { node: n, poly: evaluateToPoly(n), flag: false }; } catch(e) { return null; } }).filter(x => x);
    let botFactors = getFactors(divNode.right).map(n => { try { return { node: n, poly: evaluateToPoly(n), flag: false }; } catch(e) { return null; } }).filter(x => x);
    
    let cancelledAny = false;
    for (let t of topFactors) {
        if (t.flag) continue;
        for (let b of botFactors) {
            if (b.flag) continue;
            if (polyEquals(t.poly, b.poly)) {
                t.flag = true;
                b.flag = true;
                cancelledAny = true;
                break;
            }
        }
    }
    
    if (!cancelledAny) {
        try { return { type: 'FlatPoly', poly: evaluateToPoly(divNode), id: uid() }; } 
        catch(e) { return divNode; } 
    }
    
    function rebuildWithCancelled(factors) {
        if(factors.length === 0) return { type: 'FlatPoly', poly: {0:1}, id: uid() };
        let res = factors[0].flag ? { type: 'Cancelled', inner: factors[0].node, id: uid() } : factors[0].node;
        for(let i=1; i<factors.length; i++) {
            let nextNode = factors[i].flag ? { type: 'Cancelled', inner: factors[i].node, id: uid() } : factors[i].node;
            res = { type: 'Mul', left: res, right: nextNode, implicit: true, id: uid() };
        }
        return res;
    }
    
    return { type: 'Div', left: rebuildWithCancelled(topFactors), right: rebuildWithCancelled(botFactors), id: uid() };
}

// === SEKSJON: Kontekstmeny & Interaktivitet ===

function findNodeById(node, id) {
    if (!node) return null;
    if (node.id === id) return node;
    if (node.type === 'Expr') {
        for (let el of node.elements) {
            let f = findNodeById(el.node, id);
            if (f) return f;
        }
    }
    if (node.type === 'Mul' || node.type === 'Div' || node.type === 'Pow') {
        return findNodeById(node.left, id) || findNodeById(node.right, id);
    }
    if (node.type === 'Parens' || node.type === 'Sqrt' || node.type === 'Cancelled') {
        return findNodeById(node.inner, id);
    }
    return null;
}

window.openNodeMenu = function(e, id) {
    e.preventDefault();
    e.stopPropagation();

    if (state.manualCancelMode) {
        let idx = state.cancelSelection.indexOf(id);
        if (idx === -1) state.cancelSelection.push(id);
        else state.cancelSelection.splice(idx, 1);
        renderWorkspace();
        return;
    }

    let lastLine = state.lines[state.lines.length - 1];
    let node = findNodeById(lastLine.mathState.lState, id) || findNodeById(lastLine.mathState.rState, id);
    if (!node) return;

    let menu = document.getElementById('math-context-menu');
    menu.innerHTML = ''; 

    let options = [];
    let poly = null;
    try { poly = evaluateToPoly(node); } catch(err) {}

    if (poly && Object.keys(poly).length === 1 && poly['0'] > 1 && Number.isInteger(poly['0'])) {
        let factors = getPrimeFactors(poly['0']);
        if (factors.length > 1) { 
            options.push({ label: 'Faktoriser tall', action: 'FACTORIZE_NUM' });
        }
    }

    if (poly) {
        let fact = null;
        try { fact = tryFactorize(poly); } catch(e){}
        if (fact) {
            options.push({ label: 'Faktoriser uttrykk (Kvadrat/Konjugat)', action: 'FACTORIZE_POLY' });
        }
    }

    if (poly && Object.keys(poly).length > 1) {
        let coefs = Object.keys(poly).map(k => Math.abs(poly[k]));
        let gcd = (a, b) => b === 0 ? a : gcd(b, a % b);
        let common = coefs.reduce((a, b) => gcd(a, b), coefs[0] || 1);
        if (common > 1) {
            options.push({ label: `Faktoriser ut ${common}`, action: 'FACTORIZE_GCD' });
        }
    }

    if (node.type === 'Div') {
        options.push({ label: 'Faktoriser teller & nevner', action: 'FACTORIZE_FRACTION' });
        options.push({ label: 'Forkort brøk automatisk', action: 'SIMPLIFY' });
    } else if (node.type === 'Mul' && (node.left.type === 'Parens' || node.right.type === 'Parens')) {
        options.push({ label: 'Multipliser inn (Løs opp parentes)', action: 'DISTRIBUTE' });
    } else if (node.type === 'Expr' && node.elements.length > 1) {
        options.push({ label: 'Trekk sammen uttrykk', action: 'EVALUATE' });
    } else {
        options.push({ label: 'Forenkle', action: 'SIMPLIFY' });
    }

    options.forEach(opt => {
        let item = document.createElement('div');
        item.className = 'menu-item';
        item.textContent = opt.label;
        item.onclick = (event) => {
            event.stopPropagation(); 
            menu.classList.add('hidden');
            executeAction(id, opt.action);
        };
        menu.appendChild(item);
    });

    menu.style.left = e.pageX + 'px';
    menu.style.top = e.pageY + 'px';
    menu.classList.remove('hidden');
};

function performLocalSimplification(node) {
    if (node.type === 'Expr' || node.type === 'FlatPoly') {
        try {
            let poly = evaluateToPoly(node);
            let factored = tryFactorize(poly);
            if (factored) return factored;
            if (node.type === 'Expr') return { type: 'FlatPoly', poly: poly, id: uid() };
        } catch(e) {}
        return node;
    }
    if (node.type === 'Pow') {
        try { return { type: 'FlatPoly', poly: evaluateToPoly(node), id: uid() }; } catch(e) {}
    }
    if (node.type === 'Mul') {
        let isRightParen = node.right.type === 'Parens' && node.right.inner.type === 'Expr';
        let isLeftParen = node.left.type === 'Parens' && node.left.inner.type === 'Expr';
        // Fiks: Bruker deepClone og setter alltid implicit: false under distribusjon (slik at vi tvinger frem prikken).
        if (isRightParen) return { type: 'Expr', elements: node.right.inner.elements.map(e => ({ sign: e.sign, node: { type: 'Mul', left: deepClone(node.left), right: deepClone(e.node), implicit: false, id: uid() } })), id: uid() };
        if (isLeftParen) return { type: 'Expr', elements: node.left.inner.elements.map(e => ({ sign: e.sign, node: { type: 'Mul', left: deepClone(e.node), right: deepClone(node.right), implicit: false, id: uid() } })), id: uid() };
        try { return { type: 'FlatPoly', poly: evaluateToPoly(node), id: uid() }; } catch(e) {}
    }
    if (node.type === 'Div') return tryCancelFraction(node);
    if (node.type === 'Parens') {
        let simP = performLocalSimplification(node.inner);
        if (simP.type === 'FlatPoly' || (simP.type === 'Expr' && simP.elements.length === 1)) return simP;
        return { ...node, inner: simP };
    }
    if (node.type === 'Sqrt') {
        try { return { type: 'FlatPoly', poly: evaluateToPoly(node), id: uid() }; } catch(e) {}
    }
    return node;
}

window.executeAction = function(id, action) {
    let lastLine = state.lines[state.lines.length - 1];
    let changed = false;

    let lClone = deepClone(lastLine.mathState.lState);
    let rClone = deepClone(lastLine.mathState.rState);

    let actionLabel = "Forenklet";
    if (action.includes('FACTORIZE')) actionLabel = "Faktoriserte uttrykk";
    if (action === 'DISTRIBUTE') actionLabel = "Løste opp parentes";

    function traverseAndReplace(node) {
        if (!node) return node;
        if (node.id === id) { 
            changed = true; 
            if (action === 'SIMPLIFY') return performLocalSimplification(node);
            if (action === 'EVALUATE') {
                try {
                    return { type: 'FlatPoly', poly: evaluateToPoly(node), id: uid() };
                } catch(e) {
                    let frac = evaluateToFraction(node);
                    return { type: 'Div', left: { type: 'FlatPoly', poly: frac.num, id: uid() }, right: { type: 'FlatPoly', poly: frac.den, id: uid() }, id: uid() };
                }
            }
            if (action === 'FACTORIZE_NUM') return buildFactorTree(getPrimeFactors(evaluateToPoly(node)['0']));
            if (action === 'FACTORIZE_POLY') return tryFactorize(evaluateToPoly(node)) || node;
            
            if (action === 'FACTORIZE_GCD') {
                let poly = evaluateToPoly(node);
                let coefs = Object.keys(poly).map(k => Math.abs(poly[k]));
                let gcd = (a, b) => b === 0 ? a : gcd(b, a % b);
                let common = coefs.reduce((a, b) => gcd(a, b), coefs[0] || 1);
                let remainder = {};
                for(let k in poly) remainder[k] = poly[k] / common;
                return {
                    type: 'Mul', left: { type: 'FlatPoly', poly: {0: common}, id: uid() },
                    right: { type: 'Parens', inner: { type: 'FlatPoly', poly: remainder, id: uid() }, id: uid() },
                    implicit: true, id: uid()
                };
            }

            if (action === 'FACTORIZE_FRACTION') {
                function factorizeNode(n) {
                    try {
                        let poly = evaluateToPoly(n);
                        if (Object.keys(poly).length === 1 && Number.isInteger(poly['0']) && poly['0'] > 1) {
                            return buildFactorTree(getPrimeFactors(poly['0']));
                        }
                        let fact = tryFactorize(poly);
                        if (fact) return fact;
                        
                        if (Object.keys(poly).length > 1) {
                            let coefs = Object.keys(poly).map(k => Math.abs(poly[k]));
                            let gcd = (a, b) => b === 0 ? a : gcd(b, a % b);
                            let common = coefs.reduce((a, b) => gcd(a, b), coefs[0] || 1);
                            if (common > 1) {
                                let remainder = {};
                                for(let k in poly) remainder[k] = poly[k] / common;
                                return {
                                    type: 'Mul', left: { type: 'FlatPoly', poly: {0: common}, id: uid() },
                                    right: { type: 'Parens', inner: { type: 'FlatPoly', poly: remainder, id: uid() }, id: uid() },
                                    implicit: true, id: uid()
                                };
                            }
                        }
                    } catch(e) {}
                    return n;
                }
                return { ...node, left: factorizeNode(node.left), right: factorizeNode(node.right) };
            }

            if (action === 'DISTRIBUTE') {
                let isRightParen = node.right.type === 'Parens' && node.right.inner.type === 'Expr';
                let isLeftParen = node.left.type === 'Parens' && node.left.inner.type === 'Expr';
                // NYTT: Tvinger fram implict: false slik at &middot; (prikken) alltid vises når man løser opp!
                if (isRightParen) return { type: 'Expr', elements: node.right.inner.elements.map(e => ({ sign: e.sign, node: { type: 'Mul', left: deepClone(node.left), right: deepClone(e.node), implicit: false, id: uid() } })), id: uid() };
                if (isLeftParen) return { type: 'Expr', elements: node.left.inner.elements.map(e => ({ sign: e.sign, node: { type: 'Mul', left: deepClone(e.node), right: deepClone(node.right), implicit: false, id: uid() } })), id: uid() };
            }
        }
        if (node.type === 'Expr') return { ...node, elements: node.elements.map(e => ({ sign: e.sign, node: traverseAndReplace(e.node) })) };
        if (node.type === 'Mul' || node.type === 'Div' || node.type === 'Pow') return { ...node, left: traverseAndReplace(node.left), right: traverseAndReplace(node.right) };
        if (node.type === 'Parens' || node.type === 'Sqrt' || node.type === 'Cancelled') return { ...node, inner: traverseAndReplace(node.inner) };
        return node;
    }

    try {
        lClone = traverseAndReplace(lClone);
        rClone = traverseAndReplace(rClone);

        if (changed) {
            let hasCancels = hasCancelledNodes(lClone) || hasCancelledNodes(rClone);

            if (!lastLine.pastAction) lastLine.pastAction = actionLabel;

            if (hasCancels) {
                state.lines.push({
                    type: 'UNSIMPLIFIED',
                    mathState: { lState: lClone, rState: rClone },
                    pastAction: 'Stryker felles faktorer'
                });

                let lClean = deepClone(lClone);
                let rClean = deepClone(rClone);
                
                function removeCancelsTraverse(node) {
                    if (!node) return null;
                    if (node.id === id) return performLocalSimplification(node); 
                    if (node.type === 'Expr') return { ...node, elements: node.elements.map(e => ({ sign: e.sign, node: removeCancelsTraverse(e.node) })) };
                    if (node.type === 'Mul' || node.type === 'Div' || node.type === 'Pow') return { ...node, left: removeCancelsTraverse(node.left), right: removeCancelsTraverse(node.right) };
                    if (node.type === 'Parens' || node.type === 'Sqrt') return { ...node, inner: removeCancelsTraverse(node.inner) };
                    return node;
                }
                
                state.lines.push({
                    type: 'READY',
                    mathState: { lState: removeCancelsTraverse(lClean), rState: removeCancelsTraverse(rClean) },
                    pastAction: null
                });
            } else {
                state.lines.push({
                    type: 'READY',
                    mathState: { lState: lClone, rState: rClone },
                    pastAction: null
                });
            }

            state.currentStatus = 'WAITING_FOR_ACTION';

            if (state.currentMode === 'equation') {
                if (isSolved(state.lines[state.lines.length-1].mathState.lState, state.lines[state.lines.length-1].mathState.rState)) {
                    state.currentStatus = 'SOLVED';
                    document.getElementById('success-message').classList.remove('hidden');
                }
            }
            renderWorkspace();
        }
    } catch(err) { alert("Kan ikke utføre handlingen: " + err); }
};

// === SEKSJON: HTML Rendering av Tre-strukturen ===

function renderFlatPoly(poly) {
    let keys = Object.keys(poly).map(Number).sort((a,b)=>b-a);
    if (keys.length === 0) return `0`;
    let html = '';
    for (let i = 0; i < keys.length; i++) {
        let exp = keys[i];
        let coef = poly[exp];
        let abs = Math.abs(coef);
        
        let sign = '';
        if (i > 0) sign = coef < 0 ? ' - ' : ' + ';
        else if (coef < 0) sign = '-';

        let term = '';
        if (exp === 0) term = abs;
        else if (exp === -1) term = `<span class="fraction"><span class="numerator">${abs}</span><span class="denominator">x</span></span>`;
        else if (exp === 1) term = `${abs === 1 ? '' : abs}x`;
        else term = `${abs === 1 ? '' : abs}x<sup>${exp}</sup>`;

        html += sign + `<span class="math-term">${term}</span>`;
    }
    return html;
}

function renderAST(node) {
    let isSelected = state.cancelSelection && state.cancelSelection.includes(node.id);
    let wrap = (inner) => `<span class="interactive-node ${isSelected ? 'manual-selected' : ''}" onclick="openNodeMenu(event, '${node.id}')" oncontextmenu="openNodeMenu(event, '${node.id}')" title="Klikk for handlinger">${inner}</span>`;
    
    if (node.type === 'FlatPoly') return wrap(renderFlatPoly(node.poly));
    if (node.type === 'Cancelled') return `<span class="cancelled">${renderAST(node.inner)}</span>`;
    if (node.type === 'Pow') return wrap(`${renderAST(node.left)}<sup>${renderAST(node.right)}</sup>`);
    if (node.type === 'Parens') return wrap(`(${renderAST(node.inner)})`);
    if (node.type === 'Sqrt') return wrap(`&radic;(${renderAST(node.inner)})`);
    if (node.type === 'Mul') return wrap(`${renderAST(node.left)}${node.implicit ? '' : ' &middot; '}${renderAST(node.right)}`);
    if (node.type === 'Div') return wrap(`<span class="fraction"><span class="numerator">${renderAST(node.left)}</span><span class="denominator">${renderAST(node.right)}</span></span>`);
    
    if (node.type === 'Expr') {
        let html = '';
        node.elements.forEach((el, i) => {
            let signStr = '';
            if (i === 0) signStr = el.sign === -1 ? '-' : '';
            else signStr = el.sign === 1 ? ' + ' : ' - ';
            html += signStr + renderAST(el.node);
        });
        return wrap(`<span class="math-term">${html}</span>`);
    }
    return '';
}

// === SEKSJON: Spill-logikk & Operasjoner ===

function isSolved(lNode, rNode) {
    if (state.currentMode === 'expression') return false; 
    let lFrac, rFrac;
    try {
        lFrac = evaluateToFraction(lNode);
        rFrac = evaluateToFraction(rNode);
    } catch(e) { return false; }
    
    const isX = (frac) => {
        let numKeys = Object.keys(frac.num);
        let denKeys = Object.keys(frac.den);
        return numKeys.length === 1 && numKeys[0] === '1' && frac.num['1'] === 1 && 
               denKeys.length === 1 && denKeys[0] === '0' && frac.den['0'] === 1;
    };
    
    const isNum = (frac) => {
        let numKeys = Object.keys(frac.num);
        let denKeys = Object.keys(frac.den);
        return (numKeys.length === 0 || (numKeys.length === 1 && numKeys[0] === '0')) &&
               (denKeys.length === 0 || (denKeys.length === 1 && denKeys[0] === '0'));
    };

    if (isX(lFrac) && isNum(rFrac)) return true;
    if (isX(rFrac) && isNum(lFrac)) return true;
    return false;
}

function startEquation(leftStr, rightStr, mode) {
    state.currentMode = mode || 'equation';
    document.getElementById('mode-select').value = state.currentMode;
    document.getElementById('mode-select').dispatchEvent(new Event('change'));

    try {
        let lParsed = parseSide(leftStr);
        let rParsed = state.currentMode === 'equation' ? parseSide(rightStr) : { type: 'FlatPoly', poly: {0:0}, id: uid() };
        
        state.lines =[{
            type: 'READY',
            mathState: { lState: lParsed, rState: rParsed },
            pastAction: null
        }];
        
        if (state.currentMode === 'equation') {
            if (isSolved(lParsed, rParsed)) {
                state.currentStatus = 'SOLVED';
                document.getElementById('success-message').classList.remove('hidden');
            } else {
                state.currentStatus = 'WAITING_FOR_ACTION';
                document.getElementById('success-message').classList.add('hidden');
            }
        }
        
        renderWorkspace();
    } catch (err) { alert("Feil under oppstart: " + err); }
}

function appendActionToAST(ast, op, actionAst) {
    if (op === '+' || op === '-') {
        let sign = op === '+' ? 1 : -1;
        if (actionAst && actionAst.type === 'Expr' && actionAst.elements.length > 1) actionAst = { type: 'Parens', inner: actionAst, id: uid() };
        if (ast.type === 'Expr') return { ...ast, elements:[...ast.elements, { sign, node: actionAst }] };
        return { type: 'Expr', elements:[{sign: 1, node: ast}, {sign, node: actionAst}], id: uid() };
    } 
    else if (op === '*' || op === '/') {
        let leftNode = ast.type === 'Expr' ? { type: 'Parens', inner: ast, id: uid() } : ast;
        if (actionAst && actionAst.type === 'Expr' && actionAst.elements.length > 1) actionAst = { type: 'Parens', inner: actionAst, id: uid() };
        return { type: op === '*' ? 'Mul' : 'Div', left: leftNode, right: actionAst, implicit: false, id: uid() };
    } 
    else if (op === '√') return { type: 'Sqrt', inner: ast, id: uid() };
}

function handleActionSubmit(operator, actionStr) {
    if (state.currentMode === 'expression') return; 
    if (operator !== '√' && (!actionStr || actionStr.trim() === '')) return;
    
    let lastLine = state.lines[state.lines.length - 1];
    
    let displayOp = operator;
    if (operator === '*') displayOp = '&middot;';
    if (operator === '/') displayOp = ':';
    
    lastLine.pastAction = operator === '√' ? '√' : `${displayOp} ${actionStr}`;

    let actionAST = operator !== '√' ? parseSide(actionStr) : null;
    let newL = appendActionToAST(lastLine.mathState.lState, operator, actionAST);
    let newR = appendActionToAST(lastLine.mathState.rState, operator, actionAST);

    state.lines.push({ type: 'UNSIMPLIFIED', mathState: { lState: newL, rState: newR } });
    state.currentStatus = 'WAITING_FOR_SIMPLIFY';
    renderWorkspace();
}

function handleSimplify() {
    let unsimplifiedLine = state.lines[state.lines.length - 1];
    try {
        function simplifyNode(node) {
            try {
                return { type: 'FlatPoly', poly: evaluateToPoly(node), id: uid() };
            } catch (e) {
                let frac = evaluateToFraction(node);
                return { type: 'Div', left: { type: 'FlatPoly', poly: frac.num, id: uid() }, right: { type: 'FlatPoly', poly: frac.den, id: uid() }, id: uid() };
            }
        }
        
        let newL = simplifyNode(unsimplifiedLine.mathState.lState);
        let newR = simplifyNode(unsimplifiedLine.mathState.rState);

        state.lines.push({
            type: 'READY',
            mathState: { lState: newL, rState: newR },
            pastAction: null
        });
        
        if (isSolved(newL, newR)) {
            state.currentStatus = 'SOLVED';
            document.getElementById('success-message').classList.remove('hidden');
        } else { state.currentStatus = 'WAITING_FOR_ACTION'; }
        
        renderWorkspace();
    } catch(err) { alert("Feil under utregning: " + err); }
}

// === SEKSJON: DOM & Rendering ===

function renderWorkspace() {
    const workspace = document.getElementById('workspace');
    workspace.innerHTML = '';

    state.lines.forEach((line, index) => {
        const isLastRow = (index === state.lines.length - 1);
        const rowDiv = document.createElement('div');
        rowDiv.className = `math-row ${state.currentMode === 'expression' ? 'expression-mode' : ''}`;
        
        const leftDiv = document.createElement('div');
        leftDiv.className = `left-side ${line.type === 'UNSIMPLIFIED' ? 'unsimplified' : ''}`;
        leftDiv.innerHTML = renderAST(line.mathState.lState);
        rowDiv.appendChild(leftDiv);
        
        const equalsDiv = document.createElement('div');
        equalsDiv.className = 'equals';
        equalsDiv.textContent = '=';
        rowDiv.appendChild(equalsDiv);
        
        const rightDiv = document.createElement('div');
        rightDiv.className = `right-side ${line.type === 'UNSIMPLIFIED' ? 'unsimplified' : ''}`;
        rightDiv.innerHTML = renderAST(line.mathState.rState);
        rowDiv.appendChild(rightDiv);
        
        const actionDiv = document.createElement('div');
        actionDiv.className = 'action-cell';

        if (line.pastAction) {
            actionDiv.innerHTML = `<span class="action-box">${line.pastAction}</span>`;
        } else if (isLastRow && state.currentMode === 'equation') {
            if (state.currentStatus === 'WAITING_FOR_ACTION' || state.currentStatus === 'SOLVED') {
                if (state.currentStatus !== 'SOLVED') {
                    // NYTT: Trekk Sammen-knappen lagt til i det aktive panelet for å spare tid
                    actionDiv.innerHTML = `
                        <div class="active-action-panel">
                            <select id="op-select">
                                <option value="+">+</option>
                                <option value="-">-</option>
                                <option value="*">&middot;</option>
                                <option value="/">:</option>
                                <option value="√">√</option>
                            </select>
                            <input type="text" id="action-input" placeholder="x" autocomplete="off">
                            <button id="btn-apply-action" class="btn-small">Utfør</button>
                            <button id="btn-auto-simplify-row" class="btn-small" style="background-color: var(--warning-color); color: #333; margin-left: 5px;">Trekk sammen</button>
                        </div>
                    `;
                    setTimeout(() => bindActionEvents(), 0);
                }
            } else if (state.currentStatus === 'WAITING_FOR_SIMPLIFY') {
                actionDiv.innerHTML = `<button id="btn-simplify" class="btn-small btn-simplify">Regn ut & Forenkle</button>`;
                setTimeout(() => document.getElementById('btn-simplify').addEventListener('click', handleSimplify), 0);
            }
        }

        rowDiv.appendChild(actionDiv);
        workspace.appendChild(rowDiv);
    });
    
    const container = document.getElementById('workspace-container');
    container.scrollTop = container.scrollHeight;

    if (state.currentMode === 'equation') {
        let maxRightWidth = 40; 
        const rightSides = workspace.querySelectorAll('.right-side');
        
        rightSides.forEach(el => {
            el.style.width = 'max-content';
            el.style.flexWrap = 'nowrap';
            let w = el.getBoundingClientRect().width;
            if (w > maxRightWidth) maxRightWidth = w;
            el.style.width = '';
            el.style.flexWrap = '';
        });
        
        container.style.setProperty('--right-width', Math.ceil(maxRightWidth) + 15 + 'px');
    }
}

function bindActionEvents() {
    const btn = document.getElementById('btn-apply-action');
    const input = document.getElementById('action-input');
    const select = document.getElementById('op-select');
    const btnAutoSimplifyRow = document.getElementById('btn-auto-simplify-row');
    
    if(btn && input && select) {
        select.addEventListener('change', () => {
            if (select.value === '√') { input.style.display = 'none'; input.value = ''; } 
            else { input.style.display = 'inline-block'; }
        });
        btn.addEventListener('click', () => handleActionSubmit(select.value, input.value));
        input.addEventListener('keypress', (e) => { if (e.key === 'Enter') btn.click(); });
        input.focus();
    }
    
    // Logikk for den nye "Trekk sammen" knappen
    if (btnAutoSimplifyRow) {
        btnAutoSimplifyRow.addEventListener('click', () => {
            let lastLine = state.lines[state.lines.length - 1];
            
            function simplifyNode(node) {
                try {
                    return { type: 'FlatPoly', poly: evaluateToPoly(node), id: uid() };
                } catch (e) {
                    let frac = evaluateToFraction(node);
                    return { type: 'Div', left: { type: 'FlatPoly', poly: frac.num, id: uid() }, right: { type: 'FlatPoly', poly: frac.den, id: uid() }, id: uid() };
                }
            }
            
            let newL = simplifyNode(lastLine.mathState.lState);
            let newR = simplifyNode(lastLine.mathState.rState);

            lastLine.pastAction = 'Trekk sammen';
            
            state.lines.push({
                type: 'READY',
                mathState: { lState: newL, rState: newR },
                pastAction: null
            });
            
            if (isSolved(newL, newR)) {
                state.currentStatus = 'SOLVED';
                document.getElementById('success-message').classList.remove('hidden');
            }
            renderWorkspace();
        });
    }
}

// === SEKSJON: Kontroller & Init ===

function initExamples() {
    const select = document.getElementById('example-select');
    if(!select) return;
    select.innerHTML = '';
    let currentGroup = '';
    let optgroup = null;
    examples.forEach((ex, index) => {
        if (ex.group !== currentGroup) {
            currentGroup = ex.group;
            optgroup = document.createElement('optgroup');
            optgroup.label = currentGroup;
            select.appendChild(optgroup);
        }
        let option = document.createElement('option');
        option.value = index;
        option.textContent = ex.label;
        optgroup.appendChild(option);
    });
}

document.getElementById('mode-select').addEventListener('change', (e) => {
    const isExpr = e.target.value === 'expression';
    document.getElementById('custom-right').style.display = isExpr ? 'none' : 'inline-block';
    document.getElementById('equals-sign').style.display = isExpr ? 'none' : 'inline';
});

document.getElementById('btn-load-example').addEventListener('click', () => {
    const eq = examples[document.getElementById('example-select').value];
    startEquation(eq.left, eq.right, eq.mode);
});

document.getElementById('btn-load-custom').addEventListener('click', () => {
    let mode = document.getElementById('mode-select').value;
    let l = document.getElementById('custom-left').value;
    let r = document.getElementById('custom-right').value;
    if (mode === 'expression') r = '0';
    if(l && r) startEquation(l, r, mode); else alert("Fyll inn feltet.");
});

document.getElementById('btn-export-png').addEventListener('click', () => {
    const container = document.getElementById('workspace-container');
    
    const titleEl = document.createElement('h2');
    titleEl.textContent = 'Oppgaveløsning';
    titleEl.style.textAlign = 'center';
    titleEl.style.margin = '0 0 5px 0';
    titleEl.style.color = '#333';
    titleEl.style.fontFamily = "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif";

    const dateStr = new Date().toLocaleDateString('no-NO');
    const subtitleEl = document.createElement('p');
    subtitleEl.textContent = `Dato: ${dateStr}`;
    subtitleEl.style.textAlign = 'center';
    subtitleEl.style.color = '#666';
    subtitleEl.style.margin = '0 0 20px 0';
    subtitleEl.style.fontFamily = "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif";

    container.insertBefore(subtitleEl, container.firstChild);
    container.insertBefore(titleEl, container.firstChild);
    
    container.classList.add('export-mode');
    
    html2canvas(container, { backgroundColor: '#ffffff', scale: 2 }).then(canvas => {
        let link = document.createElement('a');
        let safeDateStr = dateStr.replace(/\./g, '-');
        link.download = `matematikk-losning-${safeDateStr}.png`; 
        link.href = canvas.toDataURL('image/png');
        link.click();
        
        container.classList.remove('export-mode');
        titleEl.remove();
        subtitleEl.remove();
    });
});

window.onload = () => {
    initExamples();
    
    const menu = document.createElement('div');
    menu.id = 'math-context-menu';
    menu.className = 'hidden';
    document.body.appendChild(menu);
    
    document.addEventListener('click', (e) => {
        if (!e.target.closest('#math-context-menu')) {
            menu.classList.add('hidden');
        }
    });

    const undoBtn = document.createElement('button');
    undoBtn.id = 'btn-undo';
    undoBtn.textContent = '↩ Angre siste trekk';
    undoBtn.style.backgroundColor = '#ffc107'; 
    undoBtn.style.color = '#333';
    undoBtn.style.marginLeft = '10px';
    undoBtn.onclick = () => {
        if (state.lines.length > 1) {
            state.lines.pop(); 
            
            let last = state.lines[state.lines.length - 1];
            if (last.pastAction === 'Ferdig forkortet' || last.pastAction === 'Stryker felles faktorer') {
                state.lines.pop();
                last = state.lines[state.lines.length - 1];
            }
            
            last.pastAction = null;
            state.currentStatus = 'WAITING_FOR_ACTION';
            document.getElementById('success-message').classList.add('hidden');
            renderWorkspace();
        }
    };
    
    const manualBtn = document.createElement('button');
    manualBtn.id = 'btn-toggle-manual';
    manualBtn.textContent = '✂ Manuell forkortning';
    manualBtn.style.backgroundColor = '#17a2b8';
    manualBtn.style.color = 'white';
    manualBtn.style.marginLeft = '10px';
    manualBtn.onclick = () => {
        state.manualCancelMode = true;
        state.cancelSelection = [];
        document.getElementById('manual-cancel-panel').classList.remove('hidden');
        renderWorkspace();
    };

    const controlGroup = document.querySelector('.control-group');
    if (controlGroup) {
        controlGroup.appendChild(undoBtn);
        controlGroup.appendChild(manualBtn);
    }

    const manualPanel = document.createElement('div');
    manualPanel.id = 'manual-cancel-panel';
    manualPanel.className = 'hidden';
    manualPanel.innerHTML = `
        <span style="color:red; font-weight:bold;">✂ Strykemodus:</span> Klikk på faktorene for å stryke dem mot hverandre.
        <button id="btn-verify-cancel" class="btn-small">Sjekk forkortning</button>
        <button id="btn-abort-cancel" class="btn-small" style="background-color:#dc3545;">Avbryt</button>
    `;
    document.querySelector('.controls').appendChild(manualPanel);

    document.getElementById('btn-abort-cancel').onclick = () => {
        state.manualCancelMode = false;
        state.cancelSelection = [];
        document.getElementById('manual-cancel-panel').classList.add('hidden');
        renderWorkspace();
    };

    document.getElementById('btn-verify-cancel').onclick = () => {
        if (state.cancelSelection.length === 0) {
            alert("Du har ikke valgt noen ledd å forkorte bort ennå.");
            return;
        }

        let lastLine = state.lines[state.lines.length - 1];
        let astOldL = deepClone(lastLine.mathState.lState);
        let astOldR = deepClone(lastLine.mathState.rState);

        function checkHasCancels(node, selection) {
            if (!node) return false;
            if (selection.includes(node.id)) return true;
            if (node.elements) return node.elements.some(e => checkHasCancels(e.node, selection));
            return checkHasCancels(node.left, selection) || checkHasCancels(node.right, selection) || checkHasCancels(node.inner, selection);
        }

        let hasCancelL = checkHasCancels(astOldL, state.cancelSelection);
        let hasCancelR = checkHasCancels(astOldR, state.cancelSelection);

        function replaceStruckWithOne(node) {
            if (!node) return null;
            if (state.cancelSelection.includes(node.id)) return { type: 'FlatPoly', poly: {0:1}, id: uid() };
            if (node.type === 'Expr') return { ...node, elements: node.elements.map(e => ({ sign: e.sign, node: replaceStruckWithOne(e.node) })) };
            if (node.type === 'Mul' || node.type === 'Div' || node.type === 'Pow') return { ...node, left: replaceStruckWithOne(node.left), right: replaceStruckWithOne(node.right) };
            if (node.type === 'Parens' || node.type === 'Sqrt') return { ...node, inner: replaceStruckWithOne(node.inner) };
            return node;
        }

        let astNewL = replaceStruckWithOne(astOldL);
        let astNewR = replaceStruckWithOne(astOldR);

        function validateSide(oldAST, newAST, hasCancel) {
            if (!hasCancel) return { valid: true, factor: null };
            let oldF = evaluateToFraction(oldAST);
            let newF = evaluateToFraction(newAST);
            try {
                let topDiv = polyDivAlg(oldF.num, newF.num);
                let botDiv = polyDivAlg(oldF.den, newF.den);
                
                if (Object.keys(topDiv.r).length === 0 && Object.keys(botDiv.r).length === 0 && polyEquals(topDiv.q, botDiv.q)) {
                    return { valid: true, factor: topDiv.q };
                }
            } catch(e) {}
            return { valid: false, factor: null };
        }

        let resL = validateSide(astOldL, astNewL, hasCancelL);
        let resR = validateSide(astOldR, astNewR, hasCancelR);

        if (resL.valid && resR.valid) {
            let factorStrL = (hasCancelL && resL.factor) ? polyToText(resL.factor) : "";
            let factorStrR = (hasCancelR && resR.factor) ? polyToText(resR.factor) : "";
            
            let msg = "🎉 Helt riktig! Gyldig forkortning.";
            if (factorStrL && factorStrL !== '1') msg += `\nDu forkortet venstre side med faktoren: ${factorStrL}`;
            if (factorStrR && factorStrR !== '1') msg += `\nDu forkortet høyre side med faktoren: ${factorStrR}`;
            
            alert(msg);

            if (!lastLine.pastAction) {
                lastLine.pastAction = 'Manuell forkorting';
            }

            function applyCancelledStatus(node) {
                if (!node) return null;
                if (state.cancelSelection.includes(node.id)) return { type: 'Cancelled', inner: node, id: uid() };
                if (node.type === 'Expr') return { ...node, elements: node.elements.map(e => ({ sign: e.sign, node: applyCancelledStatus(e.node) })) };
                if (node.type === 'Mul' || node.type === 'Div' || node.type === 'Pow') return { ...node, left: applyCancelledStatus(node.left), right: applyCancelledStatus(node.right) };
                if (node.type === 'Parens' || node.type === 'Sqrt') return { ...node, inner: applyCancelledStatus(node.inner) };
                return node;
            }

            state.lines.push({
                type: 'UNSIMPLIFIED',
                mathState: { lState: applyCancelledStatus(astOldL), rState: applyCancelledStatus(astOldR) },
                pastAction: 'Ferdig forkortet'
            });

            function globalClean(node) {
                if (!node) return null;
                if (node.type === 'Expr') return performLocalSimplification({ ...node, elements: node.elements.map(e => ({ sign: e.sign, node: globalClean(e.node) })) });
                if (node.type === 'Mul' || node.type === 'Div' || node.type === 'Pow') return performLocalSimplification({ ...node, left: globalClean(node.left), right: globalClean(node.right) });
                if (node.type === 'Parens' || node.type === 'Sqrt') return performLocalSimplification({ ...node, inner: globalClean(node.inner) });
                return performLocalSimplification(node);
            }

            state.lines.push({
                type: 'READY',
                mathState: { lState: globalClean(astNewL), rState: globalClean(astNewR) },
                pastAction: null
            });

            state.manualCancelMode = false;
            state.cancelSelection = [];
            state.currentStatus = 'WAITING_FOR_ACTION';
            
            if (state.currentMode === 'equation') {
                let topL = state.lines[state.lines.length-1].mathState.lState;
                let topR = state.lines[state.lines.length-1].mathState.rState;
                if (isSolved(topL, topR)) {
                    state.currentStatus = 'SOLVED';
                    document.getElementById('success-message').classList.remove('hidden');
                }
            }

            document.getElementById('manual-cancel-panel').classList.add('hidden');
            renderWorkspace();
            
        } else {
            alert("❌ Ugyldig forkortning!\n\nHusk:\n1. Du må stryke faktorer som er helt like oppe og nede i brøken.\n2. Du kan IKKE stryke enkeltledd som hører til i et pluss/minus-stykke (for eksempel inne i en parentes).\n\nTips: Har du husket å faktorisere teller og nevner før du begynner å stryke?");
        }
    };

    const eq = examples[0];
    startEquation(eq.left, eq.right, eq.mode);
};
