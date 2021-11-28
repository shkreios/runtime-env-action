import { addPath, debug, getInput, setFailed } from "@actions/core";
import { exec } from "@actions/exec";
import {
  cacheDir,
  cacheFile,
  downloadTool,
  extractTar,
  find,
} from "@actions/tool-cache";
import {
  Binary,
  GO_ARCH_MAPPING,
  GO_PLATFORM_MAPPING,
} from "binary-cli-install";

export async function setup() {
  try {
    // Get version of tool to be installed
    const version = getInput("version", { required: true });

    const cacheName = "runtime-env";

    const bin = new Binary(
      {
        binary: {
          name: cacheName,
          url: "https://github.com/shkreios/runtime-env/releases/download/v{{version}}/runtime-env_{{version}}_{{platform}}_{{arch}}.tar.gz",
        },
        version,
      },
      GO_ARCH_MAPPING,
      GO_PLATFORM_MAPPING,
      false
    );

    const { url, name } = bin.getPlatformMetadata();

    let pathToCLI = find(cacheName, version);
    if (!pathToCLI) {
      // Download the specific version of the tool, e.g. as a tarball
      const pathToTarball = await downloadTool(url);

      // Extract the tarball onto the runner
      const extractPath = await extractTar(pathToTarball);

      pathToCLI = await cacheDir(extractPath, name, version);
    }

    debug(pathToCLI);

    // Expose the tool by adding it to the PATH
    addPath(pathToCLI);

    const mapper: Record<string, (value: string) => string> = {
      envFile: (value) => `-f=${value}`,
      prefix: (value) => `-p=${value}`,
      output: (value) => `-o=${value}`,
      typeDeclarationsFile: (value) => `--dts=${value}`,
      globalKey: (value) => `--key=${value}`,
      removePrefix: (value) =>
        value.toLowerCase() === "true" ? "--remove-prefix=true" : "",
      noEnvs: (value) =>
        value.toLowerCase() === "true" ? "--no-envs=true" : "",
      disableLogs: (value) =>
        value.toLowerCase() === "true" ? "--disable-logs=true" : "",
    };

    const args = Object.entries(mapper).reduce((acc, [key, fn]) => {
      const value = getInput(key);
      if (value) {
        const flag = fn(value);
        if (flag) acc.push(flag);
      }
      return acc;
    }, new Array<string>());

    debug(args.toString());

    exec(name, args);
  } catch (error) {
    console.log(error);
    debug(`${error}`);
    setFailed(error instanceof Error ? error.message : new Error(`${error}`));
    process.exit(1);
  }
}
