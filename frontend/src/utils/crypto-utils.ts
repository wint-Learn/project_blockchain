import { sha256 } from 'ethers';

/**
 * Hash QR data từ CCCD bằng SHA256 (giống backend)
 */
export const hashCCCD = (qrData: string): string => {
  // Convert string to bytes then hash with SHA256
  const encoder = new TextEncoder();
  const data = encoder.encode(qrData);
  return sha256(data);
};

/**
 * Validate định dạng Ethereum address
 */
export const isValidAddress = (address: string): boolean => {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
};
