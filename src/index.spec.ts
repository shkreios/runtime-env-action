import core from "@actions/core";
import exec from "@actions/exec";
import cache from "@actions/tool-cache";
import { setup } from "./setup";
import { mocked } from "jest-mock";

jest.mock("@actions/exec", () => ({
  exec: jest.fn(),
}));

jest.mock("@actions/tool-cache", () => ({
  cacheDir: jest.fn(() => ""),
  downloadTool: jest.fn(() => ""),
  extractTar: jest.fn(() => ""),
  find: jest.fn(() => ""),
}));

jest.mock("@actions/core", () => ({
  setOutput: jest.fn(),
  getInput: jest.fn(),
  setFailed: jest.fn(),
  addPath: jest.fn(),
  debug: jest.fn((msg) => console.log(msg)),
}));

jest.spyOn(process, "exit").mockImplementation((code?: number): never => {
  throw new Error(`${code}`);
});

interface Input {
  version?: string;
  envFile?: string;
  schemaFile?: string;
  prefix?: string;
  output?: string;
  typeDeclarationsFile?: string;
  globalKey?: string;
  removePrefix?: string;
  noEnvs?: string;
  disableLogs?: string;
}

const isKey = <T extends object>(
  key: string | symbol | number,
  obj: T
): key is keyof T => key in obj;

const createMockedgetInput =
  (inputs: Input): typeof core.getInput =>
  (key, options) => {
    if (isKey(key, inputs)) {
      return inputs[key] || "";
    } else {
      if (options?.required)
        throw new Error(`Input required and not supplied: ${key}`);
      return "";
    }
  };

const mockgetInput = (inputs: Input) =>
  mocked(core.getInput).mockImplementation(createMockedgetInput(inputs));

describe("run runtime-env", () => {
  describe("Running without cache", () => {
    beforeEach(async () => {
      mockgetInput({ version: "v1.2.0" });
      mocked(cache.cacheDir).mockReturnValue(Promise.resolve("path"));
      await setup();
    });

    it("should not fail", () =>
      expect(core.setFailed).toHaveBeenCalledTimes(0));

    it("should download the cli", () => {
      expect(cache.downloadTool).toHaveBeenCalledTimes(1);
      expect(cache.extractTar).toHaveBeenCalledTimes(1);
      expect(cache.cacheDir).toHaveBeenCalledTimes(1);
    });

    it("should be added to path", () =>
      expect(core.addPath).toHaveBeenCalledWith("path"));

    it("should run runtime-env with no args", () => {
      expect(exec.exec).toHaveBeenCalledTimes(1);
      expect(exec.exec).toHaveBeenCalledWith("runtime-env", []);
    });
  });

  describe("running with cache", () => {
    beforeEach(async () => {
      mockgetInput({ version: "v1.2.0" });
      mocked(cache.find).mockReturnValue("path");
      await setup();
    });

    it("should not fail", () =>
      expect(core.setFailed).toHaveBeenCalledTimes(0));

    expect(cache.downloadTool).toHaveBeenCalledTimes(0);
    expect(cache.extractTar).toHaveBeenCalledTimes(0);
    expect(cache.cacheDir).toHaveBeenCalledTimes(0);

    it("should be added to path", () =>
      expect(core.addPath).toHaveBeenCalledWith("path"));

    it("should run runtime-env with no args", () => {
      expect(exec.exec).toHaveBeenCalledTimes(1);
      expect(exec.exec).toHaveBeenCalledWith("runtime-env", []);
    });
  });

  describe("running without version", () => {
    beforeEach(async () => {
      mockgetInput({});
      mocked(cache.find).mockReturnValue("path");
      await setup();
    });

    it("should  fail", () => {
      expect(core.setFailed).toHaveBeenCalledTimes(1);
      expect(core.setFailed).toHaveBeenCalledWith(
        new Error(`Input required and not supplied: version`)
      );
    });

    it("Action should exit with 1", () =>
      expect(process.exit).toHaveBeenCalledTimes(1));
  });

  describe("running with envfile set", () => {
    beforeEach(async () => {
      mockgetInput({ version: "v1.2.0", envFile: "./.env" });
      await setup();
    });

    it("should not fail", () =>
      expect(core.setFailed).toHaveBeenCalledTimes(0));
    it("should run runtime-env with args --env-file set to ../env", () => {
      expect(exec.exec).toHaveBeenCalledTimes(1);
      expect(exec.exec).toHaveBeenCalledWith("runtime-env", ["-f=./.env"]);
    });
  });

  describe("run with gloablKey set", () => {
    beforeEach(async () => {
      mockgetInput({ version: "v1.2.0", globalKey: "TEST" });
      await setup();
    });

    it("should not fail", () =>
      expect(core.setFailed).toHaveBeenCalledTimes(0));
    it("should run runtime-env with args --key set to TEST", () => {
      expect(exec.exec).toHaveBeenCalledTimes(1);
      expect(exec.exec).toHaveBeenCalledWith("runtime-env", ["--key=TEST"]);
    });
  });

  describe("runing with noEnvs set", () => {
    beforeEach(async () => {
      mockgetInput({ version: "v1.2.0", noEnvs: "true" });
      await setup();
    });

    it("should not fail", () =>
      expect(core.setFailed).toHaveBeenCalledTimes(0));

    it("should run runtime-env with args --no-envs set to true", () => {
      expect(exec.exec).toHaveBeenCalledTimes(1);
      expect(exec.exec).toHaveBeenCalledWith("runtime-env", ["--no-envs=true"]);
    });
  });
  describe("running with output set", () => {
    beforeEach(async () => {
      mockgetInput({ version: "v1.2.0", output: "./build/env.js" });
      await setup();
    });

    it("should not fail", () =>
      expect(core.setFailed).toHaveBeenCalledTimes(0));

    it("should run runtime-env with args --output set to ./build/env.js", () => {
      expect(exec.exec).toHaveBeenCalledTimes(1);
      expect(exec.exec).toHaveBeenCalledWith("runtime-env", [
        "-o=./build/env.js",
      ]);
    });
  });
  describe("running with prefix set", () => {
    beforeEach(async () => {
      mockgetInput({ version: "v1.2.0", prefix: "REACT_APP_" });
      await setup();
    });

    it("should not fail", () =>
      expect(core.setFailed).toHaveBeenCalledTimes(0));

    it("should run runtime-env with args --prefix set to REACT_APP_", () => {
      expect(exec.exec).toHaveBeenCalledTimes(1);
      expect(exec.exec).toHaveBeenCalledWith("runtime-env", ["-p=REACT_APP_"]);
    });
  });
  describe("running with remove prefix set", () => {
    beforeEach(async () => {
      mockgetInput({ version: "v1.2.0", removePrefix: "true" });
      await setup();
    });

    it("should not fail", () =>
      expect(core.setFailed).toHaveBeenCalledTimes(0));

    it("should run runtime-env with args --remove-prefix set to true", () => {
      expect(exec.exec).toHaveBeenCalledTimes(1);
      expect(exec.exec).toHaveBeenCalledWith("runtime-env", [
        "--remove-prefix=true",
      ]);
    });
  });
  describe("running with dts set", () => {
    beforeEach(async () => {
      mockgetInput({
        version: "v1.2.0",
        typeDeclarationsFile: "./types/env.d.ts",
      });
      await setup();
    });

    it("should not fail", () =>
      expect(core.setFailed).toHaveBeenCalledTimes(0));

    it("should run runtime-env with args --dts set to ./types/env.d.t", () => {
      expect(exec.exec).toHaveBeenCalledTimes(1);
      expect(exec.exec).toHaveBeenCalledWith("runtime-env", [
        "--dts=./types/env.d.ts",
      ]);
    });
  });
  describe("running run disablelogs set", () => {
    beforeEach(async () => {
      mockgetInput({ version: "v1.2.0", disableLogs: "true" });
      await setup();
    });

    it("should not fail", () =>
      expect(core.setFailed).toHaveBeenCalledTimes(0));

    it("should run runtime-env with args --disable-logs set to true", () => {
      expect(exec.exec).toHaveBeenCalledTimes(1);
      expect(exec.exec).toHaveBeenCalledWith("runtime-env", [
        "--disable-logs=true",
      ]);
    });
  });

  describe("running with schemaFile set", () => {
    beforeEach(async () => {
      mockgetInput({ version: "v1.2.0", schemaFile: "schema.env" });
      await setup();
    });

    it("should not fail", () =>
      expect(core.setFailed).toHaveBeenCalledTimes(0));

    it("should run runtime-env with args -s set to schema.env", () => {
      expect(exec.exec).toHaveBeenCalledTimes(1);
      expect(exec.exec).toHaveBeenCalledWith("runtime-env", ["-s=schema.env"]);
    });
  });
});
