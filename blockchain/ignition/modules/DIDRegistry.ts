import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const DIDRegistryModule = buildModule("DIDRegistryModule", (m) => {
  const didRegistry = m.contract("DIDRegistry");

  return { didRegistry };
});

export default DIDRegistryModule;
