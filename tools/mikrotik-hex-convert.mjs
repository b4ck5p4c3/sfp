/**
 * Converts Mikrotik SFP hex dump to binary.
 */

import { readFileSync } from "fs";

const BLOCK_SIZE = 16;

const contents = readFileSync(0, "utf8");
const lines = contents
  .split("\n")
  .map((line) => line.trim())
  .filter((l) => l.length > 0);

function parseDataLine(line) {
  const [address, content] = line.split(": ");
  const bytes = content
    .split("  ")
    .slice(0, 2)
    .map((block) => block.replaceAll(" ", ""))
    .join("");

  return { address, bytes };
}

const buffer = []; // [ { address, bytes } ]
for (const line of lines) {
  // Skip truncates
  if (line === "*") {
    continue;
  }

  const { address, bytes } = parseDataLine(line);

  // Resolve truncates
  if (buffer.length > 0) {
    const previousAddress = parseInt(buffer[buffer.length - 1].address, 16);
    const currentAddress = parseInt(address, 16);
    const diff = currentAddress - previousAddress;

    if (diff > BLOCK_SIZE) {
      const data = buffer[buffer.length - 1].bytes;
      for (let i = 1; i < diff / BLOCK_SIZE; i++) {
        buffer.push({
          address: (previousAddress + i * BLOCK_SIZE).toString(16),
          bytes: data,
        });
      }
    }
  }

  buffer.push({ address, bytes });
}

process.stdout.write(Buffer.from(buffer.map((b) => b.bytes).join(""), "hex"));
