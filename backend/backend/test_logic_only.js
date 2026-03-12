/**
 * Isolated logic check for printing calculation.
 */
function calculateEntryQty(entry) {
  const p = parseFloat(String(entry.pages || 0));
  const c = parseFloat(String(entry.copies || 0));
  const q = parseFloat(String(entry.quantite || 0));

  let entryQty = 1;
  if (p > 0 && c > 0) {
    entryQty = p * c;
  } else if (p > 0) {
    entryQty = p;
  } else if (c > 0) {
    entryQty = c;
  } else if (q > 0) {
    entryQty = q;
  }
  return entryQty;
}

const testCases = [
  { input: { pages: 10, copies: 3 }, expected: 30, desc: "Pages and copies" },
  { input: { pages: 10 }, expected: 10, desc: "Pages only" },
  { input: { copies: 5 }, expected: 5, desc: "Copies only" },
  { input: { quantite: 7 }, expected: 7, desc: "Quantite only" },
  { input: {}, expected: 1, desc: "Empty entry" },
  { input: { pages: 0, copies: 3 }, expected: 3, desc: "Pages=0, copies=3" },
  { input: { pages: 5, copies: 0 }, expected: 5, desc: "Pages=5, copies=0" }
];

console.log("--- LOGIC TEST ---");
testCases.forEach(tc => {
  const result = calculateEntryQty(tc.input);
  if (result === tc.expected) {
    console.log(`✅ [PASS] ${tc.desc}: Result=${result}`);
  } else {
    console.log(`❌ [FAIL] ${tc.desc}: Got ${result}, expected ${tc.expected}`);
  }
});
console.log("------------------");
