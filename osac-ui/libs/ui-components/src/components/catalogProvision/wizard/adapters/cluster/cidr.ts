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
