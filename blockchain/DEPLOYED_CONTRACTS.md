# Deployed Contracts

## DIDRegistry Contract

**Network:** Polygon Amoy Testnet  
**Contract Address:** `0x068F84A1FCD1ed4B6376682De85b20d7B654De2C`  
**Chain ID:** 80002  
**Deployed Date:** October 23, 2025  
**Status:** ✅ Verified

**Explorer:**  
https://amoy.polygonscan.com/address/0x068F84A1FCD1ed4B6376682De85b20d7B654De2C#code

**Features:**
- ✅ Create DID with CCCD hash and public key
- ✅ Verify Ethereum signatures
- ✅ Query user's public key and CCCD hash

**Usage in Frontend:**
```javascript
const contractAddress = "0x068F84A1FCD1ed4B6376682De85b20d7B654De2C";
const abi = [...]; // Import từ artifacts/contracts/DIDRegistry.sol/DIDRegistry.json
const contract = new ethers.Contract(contractAddress, abi, signer);
```

**Next Steps:**
1. Integrate with frontend
2. Test createDID and verifySignature functions
3. Deploy to Polygon Mainnet when ready
