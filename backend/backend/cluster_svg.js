const fs = require("fs");
const readline = require("readline");
const svgPath =
  "c:/Users/Nwres/Documents/GitHub/pfe/frontend/react-app/public/plan_v2.svg";

async function processLineByLine() {
  const fileStream = fs.createReadStream(svgPath);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity,
  });

  const elements = [];
  for await (const line of rl) {
    const idMatch = line.match(/id="(bureau_[^"]+)"/);
    if (idMatch) {
      const id = idMatch[1];
      let x, y;

      // Try transform rotate(angle x y)
      const transMatch = line.match(
        /transform="rotate\([^ ]+ ([-0-9.]+) ([-0-9.]+)\)"/,
      );
      if (transMatch) {
        x = parseFloat(transMatch[1]);
        y = parseFloat(transMatch[2]);
      } else {
        const xMatch = line.match(/x="([-0-9.]+)"/);
        const yMatch = line.match(/y="([-0-9.]+)"/);
        if (xMatch && yMatch) {
          x = parseFloat(xMatch[1]);
          y = parseFloat(yMatch[2]);
        } else {
          const dMatch =
            line.match(/d="[ML] ([-0-9.]+)[ ,]([-0-9.]+)/) ||
            line.match(/d="([-0-9.]+)[ ,]([-0-9.]+)/);
          if (dMatch) {
            x = parseFloat(dMatch[1]);
            y = parseFloat(dMatch[2]);
          }
        }
      }
      if (x !== undefined && y !== undefined) {
        elements.push({ id, x, y });
      }
    }
  }

  console.log(`Extracted ${elements.length} elements.`);

  const dist = (a, b) => Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
  const threshold = 200;

  const clusters = [];
  const visited = new Set();
  for (let i = 0; i < elements.length; i++) {
    if (visited.has(i)) continue;
    const cluster = [elements[i]];
    visited.add(i);
    let changed = true;
    while (changed) {
      changed = false;
      for (let j = 0; j < elements.length; j++) {
        if (visited.has(j)) continue;
        if (cluster.some((c) => dist(c, elements[j]) < threshold)) {
          cluster.push(elements[j]);
          visited.add(j);
          changed = true;
        }
      }
    }
    clusters.push(cluster);
  }

  clusters.sort((a, b) => b.length - a.length);
  clusters.forEach((c, idx) => {
    if (c.length < 2) return;
    // Group by common prefix or range
    const ids = c
      .map((e) => e.id)
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
    console.log(
      `\nCluster ${idx + 1} (${c.length} nodes): ${ids[0]} to ${ids[ids.length - 1]}`,
    );
    console.log(ids.join(", "));
  });
}

processLineByLine();
