const ipv4ToInt = (octets: string[]): number =>
  octets.reduce((acc, octet) => (acc << 8) + Number(octet), 0) >>> 0;

/** Returns inclusive IPv4 range for a CIDR, or null when not a valid IPv4 CIDR. */
export const parseIpv4CidrRange = (value: string): { start: number; end: number } | null => {
  const trimmed = value.trim();
  if (!trimmed || !isValidCidr(trimmed) || trimmed.includes(':')) {
    return null;
  }
  const slashIndex = trimmed.indexOf('/');
  const address = trimmed.slice(0, slashIndex);
  const prefixLength = Number(trimmed.slice(slashIndex + 1));
  if (!Number.isInteger(prefixLength) || prefixLength < 0 || prefixLength > 32) {
    return null;
  }
  const octets = address.split('.');
  if (octets.length !== 4) {
    return null;
  }
  const ip = ipv4ToInt(octets);
  if (prefixLength === 0) {
    return { start: 0, end: 0xffff_ffff };
  }
  const mask = (~0 << (32 - prefixLength)) >>> 0;
  const start = ip & mask;
  const end = start | (~mask >>> 0);
  return { start, end };
};

export const ipv4CidrsOverlap = (left: string, right: string): boolean => {
  const leftRange = parseIpv4CidrRange(left);
  const rightRange = parseIpv4CidrRange(right);
  if (!leftRange || !rightRange) {
    return false;
  }
  return leftRange.start <= rightRange.end && rightRange.start <= leftRange.end;
};

/** Basic CIDR format check aligned with fulfillment CanonicalizeCIDR expectations. */
export const isValidCidr = (value: string): boolean => {
  const trimmed = value.trim();
  if (!trimmed) {
    return true;
  }
  const slashIndex = trimmed.indexOf('/');
  if (slashIndex <= 0 || slashIndex === trimmed.length - 1) {
    return false;
  }
  const prefixLength = Number(trimmed.slice(slashIndex + 1));
  if (!Number.isInteger(prefixLength) || prefixLength < 0) {
    return false;
  }
  const address = trimmed.slice(0, slashIndex);
  if (!address) {
    return false;
  }
  if (address.includes(':')) {
    return true;
  }
  const octets = address.split('.');
  if (octets.length !== 4) {
    return false;
  }
  return octets.every((octet) => {
    if (!/^\d{1,3}$/.test(octet)) {
      return false;
    }
    const valueOctet = Number(octet);
    return valueOctet >= 0 && valueOctet <= 255;
  });
};
