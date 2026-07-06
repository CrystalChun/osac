import { Address4, Address6 } from 'ip-address';
import * as Yup from 'yup';

/**
 * Yup schema for validating IPv4 or IPv6 CIDR notation.
 * Use .required() when the field is mandatory.
 */
export const cidrSchema = Yup.string().test('valid-cidr', 'Invalid CIDR notation', (value) => {
  if (!value) {
    return true; // Allow empty for optional fields
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
 * Supports both IPv4 and IPv6.
 */
export const isSubnetWithinVN = (subnetCidr: string, vnCidr: string): boolean => {
  // Try IPv4 first
  try {
    const subnet = new Address4(subnetCidr);
    const vn = new Address4(vnCidr);

    if (!subnet.isCorrect() || !vn.isCorrect()) {
      throw new Error('Not valid IPv4');
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
    // Try IPv6
    try {
      const subnet = new Address6(subnetCidr);
      const vn = new Address6(vnCidr);

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
  }
};

/**
 * Check if a new subnet CIDR overlaps with any existing subnet CIDRs.
 * Supports both IPv4 and IPv6.
 */
export const hasSubnetOverlap = (newCidr: string, existingCidrs: string[]): boolean => {
  if (existingCidrs.length === 0) {
    return false;
  }

  // Try IPv4 first
  try {
    const newSubnet = new Address4(newCidr);
    if (!newSubnet.isCorrect()) {
      throw new Error('Not valid IPv4');
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
        if (newStart <= existingEnd && newEnd >= existingStart) {
          return true;
        }
      } catch {
        continue;
      }
    }

    return false;
  } catch {
    // Try IPv6
    try {
      const newSubnet = new Address6(newCidr);
      if (!newSubnet.isCorrect()) {
        return false;
      }

      const newStart = newSubnet.startAddress().bigInt();
      const newEnd = newSubnet.endAddress().bigInt();

      for (const existingCidr of existingCidrs) {
        try {
          const existing = new Address6(existingCidr);
          if (!existing.isCorrect()) {
            continue;
          }

          const existingStart = existing.startAddress().bigInt();
          const existingEnd = existing.endAddress().bigInt();

          // Check if ranges overlap
          if (newStart <= existingEnd && newEnd >= existingStart) {
            return true;
          }
        } catch {
          continue;
        }
      }

      return false;
    } catch {
      return false;
    }
  }
};
