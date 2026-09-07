import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = new URL("../", import.meta.url);
const contract = JSON.parse(await readFile(new URL("docs/api/openapi.json", root), "utf8"));
const schemas = contract.components.schemas;
const check = process.argv.includes("--check");

function operationPath(operationId) {
  const matches = Object.entries(contract.paths).filter(([, item]) => (
    Object.values(item).some((operation) => operation.operationId === operationId)
  ));
  if (matches.length !== 1) throw new Error(`Opération absente ou ambiguë : ${operationId}`);
  return matches[0][0];
}

const metadata = {
  version: schemas.PublicConfigV1.properties.apiVersion.const,
  configurationPath: operationPath("getPublicConfigV1"),
  japanExamplePath: operationPath("getJapanExampleV1"),
  tripsPath: operationPath("createTripV1"),
};
const swiftNames = {
  PublicConfigV1: "APIConfiguration",
  PublicConfig: "LegacyAPIConfiguration",
  PublicLimits: "APILimits",
  PublicCapabilitiesV1: "APICapabilities",
};

function swiftType(schema) {
  if (schema.$ref) {
    const name = swiftNames[schema.$ref.split("/").at(-1)];
    if (!name) throw new Error(`Référence Swift non prise en charge : ${schema.$ref}`);
    return name;
  }
  if (Array.isArray(schema.type)) {
    if (schema.type.length !== 2 || !schema.type.includes("null")) throw new Error("Union Swift non prise en charge");
    return `${swiftType({ ...schema, type: schema.type.find((type) => type !== "null") })}?`;
  }
  if (schema.type === "array") return `[${swiftType(schema.items)}]`;
  const type = { string: "String", boolean: "Bool", integer: "Int", number: "Double" }[schema.type];
  if (!type) throw new Error(`Type Swift non pris en charge : ${schema.type}`);
  return type;
}

const swiftStructs = Object.entries(swiftNames).map(([schemaName, typeName]) => {
  const schema = schemas[schemaName];
  const fields = Object.entries(schema.properties).map(([name, property]) => {
    const type = swiftType(property);
    const optional = !schema.required.includes(name) && !type.endsWith("?") ? "?" : "";
    return `    let ${name}: ${type}${optional}`;
  });
  return `struct ${typeName}: Codable, Equatable, Sendable {\n${fields.join("\n")}\n}`;
});
const swift = `// Généré depuis docs/api/openapi.json par scripts/generate-api-clients.mjs.\n// Modifier le contrat puis régénérer.\n\nenum APIContract {\n${Object.entries(metadata).map(([key, value]) => `    static let ${key} = ${JSON.stringify(value)}`).join("\n")}\n}\n\n${swiftStructs.join("\n\n")}\n`;
const javascript = `// Généré depuis docs/api/openapi.json par scripts/generate-api-clients.mjs.\n// Modifier le contrat puis régénérer.\nexport const API_CONTRACT = Object.freeze(${JSON.stringify(metadata, null, 2)});\n`;

for (const [path, content] of [
  ["app/public/api-contract.js", javascript],
  ["ios/MonFlorian/Generated/APIContract.swift", swift],
]) {
  const destination = new URL(path, root);
  if (check) {
    const actual = await readFile(destination, "utf8").catch(() => null);
    if (actual !== content) throw new Error(`${path} diverge du contrat. Exécute node scripts/generate-api-clients.mjs.`);
  } else {
    await mkdir(dirname(fileURLToPath(destination)), { recursive: true });
    await writeFile(destination, content);
  }
}
console.log(JSON.stringify({ event: check ? "api_clients_checked" : "api_clients_generated", version: metadata.version }));
