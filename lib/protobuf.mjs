// Resilient wire reader for the local Antigravity protobuf schema.
// Unknown fields and deprecated groups are skipped; truncated trailing bytes preserve earlier fields.
export function fields(bytes) {
  const data = Buffer.from(bytes || []);
  const result = new Map();
  let offset = 0;
  const varint = () => {
    let value = 0n;
    for (let shift = 0n; shift < 70n && offset < data.length; shift += 7n) {
      const byte = data[offset++];
      value |= BigInt(byte & 127) << shift;
      if (!(byte & 128)) return value;
    }
    throw new Error('Invalid protobuf varint');
  };
  const skipGroup = endField => {
    let depth = 0;
    while (offset < data.length) {
      const tag = Number(varint());
      const num = tag >>> 3;
      const w = tag & 7;
      if (!num) throw new Error('Invalid protobuf field');
      if (w === 0) varint();
      else if (w === 1) { if (offset + 8 > data.length) throw new Error('Truncated protobuf'); offset += 8; }
      else if (w === 2) { const len = Number(varint()); if (len < 0 || offset + len > data.length) throw new Error('Truncated protobuf'); offset += len; }
      else if (w === 5) { if (offset + 4 > data.length) throw new Error('Truncated protobuf'); offset += 4; }
      else if (w === 3) depth++;
      else if (w === 4) {
        if (depth === 0 && num === endField) return;
        if (depth === 0) throw new Error('Mismatched protobuf end group');
        depth--;
      } else throw new Error('Unsupported protobuf wire type');
    }
    throw new Error('Unterminated protobuf group');
  };
  while (offset < data.length) {
    let key;
    try { key = Number(varint()); } catch (err) { if (result.size > 0) break; throw err; }
    const number = key >>> 3;
    const wire = key & 7;
    if (!number) { if (result.size > 0) break; throw new Error('Invalid protobuf field'); }
    let value;
    try {
      if (wire === 0) value = Number(BigInt.asIntN(64, varint()));
      else if ([1, 2, 5].includes(wire)) {
        const length = wire === 2 ? Number(varint()) : wire === 1 ? 8 : 4;
        if (length < 0 || offset + length > data.length) throw new Error('Truncated protobuf');
        value = data.subarray(offset, offset + length);
        offset += length;
      } else if (wire === 3) {
        const start = offset;
        skipGroup(number);
        value = data.subarray(start, offset);
      } else if (wire === 4) {
        break;
      } else {
        if (result.size > 0) break;
        throw new Error('Unsupported protobuf wire type');
      }
    } catch (err) {
      if (result.size > 0) break;
      throw err;
    }
    if (!result.has(number)) result.set(number, []);
    result.get(number).push(value);
  }
  return result;
}

export const first = (map, number, fallback = null) => map.get(number)?.[0] ?? fallback;
export const nested = (map, number) => {
  try { return fields(first(map, number)); } catch { return new Map(); }
};
export const string = (map, number) => {
  try { return Buffer.from(first(map, number, [])).toString('utf8'); } catch { return ''; }
};
export function milliseconds(bytes) {
  if (!bytes) return null;
  try {
    const map = fields(bytes);
    return first(map, 1, 0) * 1000 + first(map, 2, 0) / 1e6;
  } catch { return null; }
}
