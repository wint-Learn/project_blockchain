import { expect } from "chai";
import hre from "hardhat";

// Resolve ethers utils at runtime (try multiple locations to handle ESM/CJS differences)
const { keccak256: keccakBuffer } = require("ethereumjs-util");

function arrayify(hexStr: string) {
  if (hexStr.startsWith("0x")) hexStr = hexStr.slice(2);
  return Buffer.from(hexStr, "hex");
}

function hexlify(buf: Buffer) {
  return "0x" + buf.toString("hex");
}

function toUtf8Bytes(s: string) {
  return Buffer.from(s, "utf8");
}

function keccak256(buf: Buffer) {
  return "0x" + keccakBuffer(buf).toString("hex");
}

describe("DIDRegistry", function () {
  it("allows a user to create a DID and emits an event", async function () {
  const [user] = await hre.ethers.getSigners();

  const DID = await hre.ethers.getContractFactory("DIDRegistry");
  const did = await DID.deploy();

    const cccdHash = "QmHashExample";
  const publicKey = arrayify("0x" + "11".repeat(33)); // 33 bytes example

    await expect(did.connect(user).createDID(cccdHash, publicKey))
      .to.emit(did, "DIDCreated")
      .withArgs(user.address, cccdHash);

  const stored = await did.publicKeys(user.address);
  // stored is a hex string; compute expected hex using Buffer
  const expectedHex = hexlify(Buffer.from(publicKey));
  expect(stored).to.equal(expectedHex);
  });

  it("should verify a signature produced by a user", async function () {
  const [user] = await hre.ethers.getSigners();

  const DID = await hre.ethers.getContractFactory("DIDRegistry");
  const did = await DID.deploy();

    const message = "Hello DID";
  const messageHash = keccak256(toUtf8Bytes(message));

  // Sign the message hash using the user's signer
  const flatSig = await user.signMessage(arrayify(messageHash));

  // Ethers returns a flat signature hex string; convert to bytes
  const sigBytes = arrayify(flatSig);

  const ok = await did.verifySignature(user.address, messageHash, sigBytes);
    expect(ok).to.equal(true);
  });

  it("should reject signatures from other users", async function () {
  const [user, attacker] = await hre.ethers.getSigners();

  const DID = await hre.ethers.getContractFactory("DIDRegistry");
  const did = await DID.deploy();

    const message = "Attack"
  const messageHash = keccak256(toUtf8Bytes(message));

  // Attacker signs the message
  const flatSig = await attacker.signMessage(arrayify(messageHash));
  const sigBytes = arrayify(flatSig);

  const ok = await did.verifySignature(user.address, messageHash, sigBytes);
    expect(ok).to.equal(false);
  });

  it("should revert when signature length is not 65 bytes", async function () {
  const [user] = await hre.ethers.getSigners();

  const DID = await hre.ethers.getContractFactory("DIDRegistry");
  const did = await DID.deploy();

  const badSig = arrayify("0x1234");
  const messageHash = keccak256(toUtf8Bytes("x"));

  await expect(did.verifySignature(user.address, messageHash, badSig)).to.be.revertedWith("invalid signature length");
  });
});
