import { Address4, Address6 } from 'ip-address';
import * as Yup from 'yup';

/**
 * Yup schema for validating IPv4 or IPv6 CIDR notation.
 */
export const cidrSchema = Yup.string()
  .required('CIDR is required')
  .test('valid-cidr', 'Invalid CIDR notation', (value) => {
    if (!value) {
      return false;
    }

    // CIDR must have a slash and prefix length
    if (!value.includes('/')) {
      return false;
    }

    try {
      // Try parsing as IPv4 first
      const addr4 = new Address4(value);
      return addr4.isCorrect();
    } catch {
      try {
        // Try parsing as IPv6
        const addr6 = new Address6(value);
        return addr6.isCorrect();
      } catch {
        return false;
      }
    }
  });

/**
 * Check if a subnet CIDR is within a parent VirtualNetwork CIDR.
 */
export const isSubnetWithinVN = (subnetCidr: string, vnCidr: string): boolean => {
  try {
    const subnet = new Address4(subnetCidr);
    const vn = new Address4(vnCidr);

    if (!subnet.isCorrect() || !vn.isCorrect()) {
      return false;
    }

    // Subnet must have a prefix length >= VN prefix length (smaller or equal range)
    if (subnet.subnetMask < vn.subnetMask) {
      return false;
    }

    // Check if subnet's start address is within VN's range
    const subnetStart = subnet.startAddress().bigInt();
    const subnetEnd = subnet.endAddress().bigInt();
    const vnStart = vn.startAddress().bigInt();
    const vnEnd = vn.endAddress().bigInt();

    return subnetStart >= vnStart && subnetEnd <= vnEnd;
  } catch {
    return false;
  }
};

/**
 * Check if a new subnet CIDR overlaps with any existing subnet CIDRs.
 */
export const hasSubnetOverlap = (newCidr: string, existingCidrs: string[]): boolean => {
  if (existingCidrs.length === 0) {
    return false;
  }

  try {
    const newSubnet = new Address4(newCidr);
    if (!newSubnet.isCorrect()) {
      return false;
    }

    const newStart = newSubnet.startAddress().bigInt();
    const newEnd = newSubnet.endAddress().bigInt();

    for (const existingCidr of existingCidrs) {
      try {
        const existing = new Address4(existingCidr);
        if (!existing.isCorrect()) {
          continue;
        }

        const existingStart = existing.startAddress().bigInt();
        const existingEnd = existing.endAddress().bigInt();

        // Check if ranges overlap
        // Overlap occurs if: newStart <= existingEnd && newEnd >= existingStart
        if (newStart <= existingEnd && newEnd >= existingStart) {
          return true;
        }
      } catch {
        // Skip invalid CIDR in existing list
        continue;
      }
    }

    return false;
  } catch {
    return false;
  }
};
