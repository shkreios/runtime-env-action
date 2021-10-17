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
      envFile: (value) => `--env-file ${value}`,
      prefix: (value) => `--prefix ${value}`,
      output: (value) => `--output ${value}`,
      typeDeclarationsFile: (value) => `--type-declarations-file ${value}`,
      globalKey: (value) => `--global-key ${value}`,
      removePrefix: (value) => "--remove-prefix",
      noEnvs: (value) => "--no-envs",
      disableLogs: (value) => "--disable-logs",
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
