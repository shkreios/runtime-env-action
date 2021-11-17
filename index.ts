import { getInput, addPath, debug, setFailed } from "@actions/core";
import { downloadTool, extractTar } from "@actions/tool-cache";
import {
  Binary,
  GO_ARCH_MAPPING,
  GO_PLATFORM_MAPPING,
} from "binary-cli-install";
import { exec } from "@actions/exec";

async function setup() {
  // Get version of tool to be installed
  const version = getInput("version");

  const bin = new Binary(
    {
      binary: {
        name: "runtime-env",
        url: "https://github.com/shkreios/runtime-env/releases/download/v{{version}}/runtime-env_{{version}}_{{platform}}_{{arch}}.tar.gz",
      },
      version,
    },
    GO_ARCH_MAPPING,
    GO_PLATFORM_MAPPING,
    false
  );

  const { url, name } = bin.getPlatformMetadata();

  // Download the specific version of the tool, e.g. as a tarball
  const pathToTarball = await downloadTool(url);

  // Extract the tarball onto the runner
  const pathToCLI = await extractTar(pathToTarball);

  // Expose the tool by adding it to the PATH
  addPath(pathToCLI);

  const mapper: Record<string, (value: string) => string> = {
    envFile: (value) => `-f ${value}`,
    prefix: (value) => `-p ${value}`,
    output: (value) => `-o ${value}`,
    typeDeclarationsFile: (value) => `--dts ${value}`,
    globalKey: (value) => `--key ${value}`,
    removePrefix: (value) =>
      value.toLowerCase() === "true" ? "--remove-prefix" : "",
    noEnvs: (value) => (value.toLowerCase() === "true" ? "--no-envs" : ""),
    disableLogs: (value) =>
      value.toLowerCase() === "true" ? "--disable-logs" : "",
  };

  const args = Object.entries(mapper).map(([key, fn]) => {
    const value = getInput(key);
    return value ? fn(value) : "";
  });

  debug(args.toString());

  exec(name, args);
}

try {
  setup();
} catch (error) {
  debug(`${error}`);
  setFailed(error instanceof Error ? error.message : new Error(`${error}`));
}
