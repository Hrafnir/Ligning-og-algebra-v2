/* Version: #18 - Oppdatert med nye tegn og bedre eksport */

// === SEKSJON: Data & Eksempler ===
const examples =[
    // Ligninger - Enkle
    { label: "2x - 4 = x + 4 (Fra bildet)", left: "2x - 4", right: "x + 4", mode: "equation", group: "Ligninger (Lineære)" },
    { label: "5x + 10 = 25", left: "5x + 10", right: "25", mode: "equation", group: "Ligninger (Lineære)" },
    { label: "3x - 7 = 2x + 5", left: "3x - 7", right: "2x + 5", mode: "equation", group: "Ligninger (Lineære)" },
    
    // Ligninger - Parenteser
    { label: "2(x + 3) = 14", left: "2(x + 3)", right: "14", mode: "equation", group: "Ligninger (Parenteser)" },
    { label: "3(x - 2) + 4 = 13", left: "3(x - 2) + 4", right: "13", mode: "equation", group: "Ligninger (Parenteser)" },
    { label: "5(2x - 1) = 3(3x + 2)", left: "5(2x - 1)", right: "3(3x + 2)", mode: "equation", group: "Ligninger (Parenteser)" },
    
    // Ligninger - Brøk & Pythagoras
    { label: "12/x = 4", left: "12/x", right: "4", mode: "equation", group: "Ligninger (Brøk & Potens)" },
    { label: "(x - 2)/(x^2 - 4x + 4) = 12 (Din oppgave!)", left: "(x - 2)/(x^2 - 4x + 4)", right: "12", mode: "equation", group: "Ligninger (Brøk & Potens)" },
    { label: "24 / (x + 2) = 6", left: "24 / (x + 2)", right: "6", mode: "equation", group: "Ligninger (Brøk & Potens)" },
    { label: "x^2 + 6^2 = 10^2 (Pythagoras)", left: "x^2 + 6^2", right: "10^2", mode: "equation", group: "Ligninger (Brøk & Potens)" },
    { label: "x^2 + 5^2 = 13^2 (Pythagoras)", left: "x^2 + 5^2", right: "13^2", mode: "equation", group: "Ligninger (Brøk & Potens)" },
    
    // Algebra - Forenkling & Faktorisering
    { label: "x^2 + 4x + 4 (1. Kvadratsetning)", left: "x^2 + 4x + 4", right: "0", mode: "expression", group: "Algebra (Forenkle & Faktorisere)" },
    { label: "x^2 - 6x + 9 (2. Kvadratsetning)", left: "x^2 - 6x + 9", right: "0", mode: "expression", group: "Algebra (Forenkle & Faktorisere)" },
    { label: "x^2 - 25 (Konjugatsetning)", left: "x^2 - 25", right: "0", mode: "expression", group: "Algebra (Forenkle & Faktorisere)" },
    { label: "(x^2 - 9) / (x - 3) (Forkorting)", left: "(x^2 - 9) / (x - 3)", right: "0", mode: "expression", group: "Algebra (Forenkle & Faktorisere)" },
    { label: "(x^2 + 8x + 16) / (x + 4) (Forkorting)", left: "(x^2 + 8x + 16) / (x + 4)", right: "0", mode: "expression", group: "Algebra (Forenkle & Faktorisere)" },
    { label: "3(x + 2) + 4(x - 1) (Forenkling)", left: "3(x + 2) + 4(x - 1)", right: "0", mode: "expression", group: "Algebra (Forenkle & Faktorisere)" }
];

let state = {
    lines:[], 
    currentStatus: 'IDLE', 
    currentMode: 'equation' // 'equation' eller 'expression'
};

// === SEKSJON: Kjerne-Matematikk (Flate Polynomer & Brøker) ===

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

// NY: Ekte Polynomdivisjon (Langdivisjon for algebra)
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
        if (rKeys.length === 0) break; // Gikk opp i null (Perfekt divisjon!)
        let rDeg = rKeys[0];
        if (rDeg < dDeg) break; // Restens grad er lavere enn nevnerens
        
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


// === SEKSJON: AST (Abstract Syntax Tree) Parser ===

function uid() { return Math.random().toString(36).substr(2, 9); }

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

// === SEKSJON: Evaluering (Ny Brøk-håndtering) ===

// Denne funksjonen knuser et tre ned til teller og nevner (som to polynom)
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

// Henter et flatt polynom. Kaster feil hvis brøken ikke går opp.
function evaluateToPoly(node) {
    let frac = evaluateToFraction(node);
    let div = polyDivAlg(frac.num, frac.den);
    if (Object.keys(div.r).length === 0) return div.q;
    throw "Dette er en brøk som ikke går opp flatt.";
}

// Finner Kvadratsetninger
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

function tryCancelFraction(divNode) {
    function hasCancelled(n) {
        if (!n) return false;
        if (n.type === 'Cancelled') return true;
        if (n.type === 'Mul') return hasCancelled(n.left) || hasCancelled(n.right);
        if (n.type === 'Pow') return hasCancelled(n.left);
        if (n.type === 'Parens') return hasCancelled(n.inner);
        return false;
    }
    
    if (hasCancelled(divNode.left) || hasCancelled(divNode.right)) {
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

// === SEKSJON: Interaktivitet (Klikk) ===

function performLocalSimplification(node) {
    if (node.type === 'Expr' || node.type === 'FlatPoly') {
        try {
            let poly = evaluateToPoly(node);
            let factored = tryFactorize(poly);
            if (factored) return factored;
            if (node.type === 'Expr') return { type: 'FlatPoly', poly: poly, id: uid() };
        } catch(e) {} // Hvis uforenklig brøk, la den være
        return node;
    }
    if (node.type === 'Pow') {
        try { return { type: 'FlatPoly', poly: evaluateToPoly(node), id: uid() }; } catch(e) {}
    }
    if (node.type === 'Mul') {
        let isRightParen = node.right.type === 'Parens' && node.right.inner.type === 'Expr';
        let isLeftParen = node.left.type === 'Parens' && node.left.inner.type === 'Expr';

        if (isRightParen) return { type: 'Expr', elements: node.right.inner.elements.map(e => ({ sign: e.sign, node: { type: 'Mul', left: node.left, right: e.node, implicit: node.implicit, id: uid() } })), id: uid() };
        if (isLeftParen) return { type: 'Expr', elements: node.left.inner.elements.map(e => ({ sign: e.sign, node: { type: 'Mul', left: e.node, right: node.right, implicit: node.implicit, id: uid() } })), id: uid() };
        
        try { return { type: 'FlatPoly', poly: evaluateToPoly(node), id: uid() }; } catch(e) {}
    }
    if (node.type === 'Div') {
        return tryCancelFraction(node);
    }
    if (node.type === 'Parens') return node.inner;
    if (node.type === 'Sqrt') {
        try { return { type: 'FlatPoly', poly: evaluateToPoly(node), id: uid() }; } catch(e) {}
    }
    return node;
}

window.triggerNodeClick = function(e, id) {
    e.stopPropagation(); 
    let lastLine = state.lines[state.lines.length - 1];
    let changed = false;

    function traverseAndReplace(node) {
        if (!node) return node;
        if (node.id === id) { changed = true; return performLocalSimplification(node); }
        if (node.type === 'Expr') return { ...node, elements: node.elements.map(e => ({ sign: e.sign, node: traverseAndReplace(e.node) })) };
        if (node.type === 'Mul' || node.type === 'Div' || node.type === 'Pow') return { ...node, left: traverseAndReplace(node.left), right: traverseAndReplace(node.right) };
        if (node.type === 'Parens' || node.type === 'Sqrt' || node.type === 'Cancelled') return { ...node, inner: traverseAndReplace(node.inner) };
        return node;
    }

    try {
        lastLine.mathState.lState = traverseAndReplace(lastLine.mathState.lState);
        lastLine.mathState.rState = traverseAndReplace(lastLine.mathState.rState);

        if (changed) {
            if (state.currentMode === 'equation') {
                try {
                    let lFlat = evaluateToPoly(lastLine.mathState.lState);
                    let rFlat = evaluateToPoly(lastLine.mathState.rState);
                    if (isSolved(lFlat, rFlat)) {
                        state.currentStatus = 'SOLVED';
                        document.getElementById('success-message').classList.remove('hidden');
                    }
                } catch(ignore) {}
            }
            renderWorkspace();
        }
    } catch(err) { alert("Kan ikke utføre: " + err); }
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
    if (node.type === 'FlatPoly') return renderFlatPoly(node.poly);
    
    let wrap = (inner) => `<span class="interactive-node" onclick="triggerNodeClick(event, '${node.id}')" title="Trykk for å regne/omforme">${inner}</span>`;
    
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

function isSolved(lPoly, rPoly) {
    if (state.currentMode === 'expression') return false; 
    let lKeys = Object.keys(lPoly), rKeys = Object.keys(rPoly);
    const isSingleX = (p, keys) => keys.length === 1 && keys[0] === '1' && p['1'] === 1;
    const isNumOnly = (p, keys) => keys.length === 1 && keys[0] === '0';
    if (lKeys.length === 0) lKeys = ['0'];
    if (rKeys.length === 0) rKeys =['0'];
    
    if (isSingleX(lPoly, lKeys) && isNumOnly(rPoly, rKeys)) return true;
    if (isSingleX(rPoly, rKeys) && isNumOnly(lPoly, lKeys)) return true;
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
        
        let solved = false;
        if (state.currentMode === 'equation') {
            try { solved = isSolved(evaluateToPoly(lParsed), evaluateToPoly(rParsed)); } catch(e){}
        }
        
        state.currentStatus = solved ? 'SOLVED' : 'WAITING_FOR_ACTION';
        document.getElementById('success-message').classList.add('hidden');
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
    
    // NYTT: Bestemmer hvilket tegn som skal vises i UI
    let displayOp = operator;
    if (operator === '*') displayOp = '&middot;';
    if (operator === '/') displayOp = ':';
    
    // Bruker displayOp i stedet for operator i tekststrengen
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
        // En "smart" forenkler som prøver å bygge brøken, og gjør polynomdivisjon hvis mulig
        function simplifyNode(node) {
            let frac = evaluateToFraction(node);
            let div = polyDivAlg(frac.num, frac.den);
            if (Object.keys(div.r).length === 0) {
                return { type: 'FlatPoly', poly: div.q, id: uid() };
            } else {
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
        
        try {
            if (isSolved(evaluateToPoly(newL), evaluateToPoly(newR))) {
                state.currentStatus = 'SOLVED';
                document.getElementById('success-message').classList.remove('hidden');
            } else { state.currentStatus = 'WAITING_FOR_ACTION'; }
        } catch(e) { state.currentStatus = 'WAITING_FOR_ACTION'; }
        
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
                    // NYTT: Select-boksen har fått &middot; for * og : for /
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
}

function bindActionEvents() {
    const btn = document.getElementById('btn-apply-action');
    const input = document.getElementById('action-input');
    const select = document.getElementById('op-select');
    
    if(btn && input && select) {
        select.addEventListener('change', () => {
            if (select.value === '√') { input.style.display = 'none'; input.value = ''; } 
            else { input.style.display = 'inline-block'; }
        });
        btn.addEventListener('click', () => handleActionSubmit(select.value, input.value));
        input.addEventListener('keypress', (e) => { if (e.key === 'Enter') btn.click(); });
        input.focus();
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

// NYTT: Eksportfunksjonen legger nå på klassen export-mode rett før bildet tas
document.getElementById('btn-export-png').addEventListener('click', () => {
    const container = document.getElementById('workspace-container');
    
    container.classList.add('export-mode');
    
    html2canvas(container, { backgroundColor: '#ffffff', scale: 2 }).then(canvas => {
        let link = document.createElement('a');
        link.download = 'matematikk-losning.png';
        link.href = canvas.toDataURL('image/png');
        link.click();
        
        container.classList.remove('export-mode');
    });
});

window.onload = () => {
    initExamples();
    const eq = examples[0];
    startEquation(eq.left, eq.right, eq.mode);
};
