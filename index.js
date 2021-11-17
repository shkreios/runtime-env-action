const core = require("@actions/core");
const tc = require("@actions/tool-cache");
const {
  Binary,
  GO_ARCH_MAPPING,
  GO_PLATFORM_MAPPING,
} = require("binary-cli-install");
const exec = require("@actions/exec");

async function setup() {
  try {
    // Get version of tool to be installed
    const version = core.getInput("version");

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
    const pathToTarball = await tc.downloadTool(url);

    // Extract the tarball onto the runner
    const pathToCLI = await tc.extractTar(pathToTarball);

    // Expose the tool by adding it to the PATH
    core.addPath(pathToCLI);

    const mapper = {
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
      const value = core.getInput(key);
      return value ? fn(value) : "";
    });

    exec.exec(name, args);
  } catch (error) {
    core.setFailed(error.message);
  }
}

setup();
