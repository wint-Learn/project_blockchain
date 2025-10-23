import { keccak256, toUtf8Bytes } from 'ethers';

/**
 * Hash QR data từ CCCD bằng keccak256 (giống backend)
 */
export const hashCCCD = (qrData: string): string => {
  return keccak256(toUtf8Bytes(qrData));
};

/**
 * Validate định dạng Ethereum address
 */
export const isValidAddress = (address: string): boolean => {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
};
