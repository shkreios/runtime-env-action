import core from "@actions/core";
import exec from "@actions/exec";
import cache from "@actions/tool-cache";
import { setup } from "./setup";

const mockedCore = core as jest.Mocked<typeof core>;
const mockedExec = exec as jest.Mocked<typeof exec>;
const mockedCache = cache as jest.Mocked<typeof cache>;

jest.mock("@actions/exec", () => ({
  exec: jest.fn(),
}));

jest.mock("@actions/tool-cache", () => ({
  cacheFile: jest.fn(() => ""),
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
  version: string;
  envFile?: string;
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
  (inputs: Input) =>
  (key: string, options?: { required: boolean }): string => {
    if (isKey(key, inputs)) {
      return inputs[key] || "";
    } else {
      if (options?.required) throw `${key} was required but is not set.`;
      return "";
    }
  };

describe("run runtime-env", () => {
  it("should run without cache", async () => {
    (<jest.Mock>core.getInput).mockImplementation(
      createMockedgetInput({ version: "v1.2.0" })
    );

    (<jest.Mock>mockedCache.cacheFile).mockImplementation(() => "path");

    await setup();

    expect(mockedCore.setFailed).toHaveBeenCalledTimes(0);

    expect(mockedCache.downloadTool).toHaveBeenCalledTimes(1);
    expect(mockedCache.extractTar).toHaveBeenCalledTimes(1);
    expect(mockedCache.cacheFile).toHaveBeenCalledTimes(1);

    expect(mockedCore.addPath).toHaveBeenCalledWith("path");

    expect(mockedExec.exec).toHaveBeenCalledTimes(1);
    expect(mockedExec.exec).toHaveBeenCalledWith("runtime-env", []);
  });

  it("should run with cache", async () => {
    (<jest.Mock>core.getInput).mockImplementation(
      createMockedgetInput({ version: "v1.2.0" })
    );

    (<jest.Mock>mockedCache.find).mockImplementation(() => "path");

    await setup();

    expect(mockedCore.setFailed).toHaveBeenCalledTimes(0);

    expect(mockedCache.downloadTool).toHaveBeenCalledTimes(0);
    expect(mockedCache.extractTar).toHaveBeenCalledTimes(0);
    expect(mockedCache.cacheFile).toHaveBeenCalledTimes(0);

    expect(mockedCore.addPath).toHaveBeenCalledWith("path");

    expect(mockedExec.exec).toHaveBeenCalledTimes(1);
    expect(mockedExec.exec).toHaveBeenCalledWith("runtime-env", []);
  });

  it("should run with envfile", async () => {
    (<jest.Mock>core.getInput).mockImplementation(
      createMockedgetInput({ version: "v1.2.0", envFile: "./.env" })
    );

    await setup();

    expect(mockedCore.setFailed).toHaveBeenCalledTimes(0);
    expect(mockedExec.exec).toHaveBeenCalledTimes(1);
    expect(mockedExec.exec).toHaveBeenCalledWith("runtime-env", ["-f=./.env"]);
  });

  it("should run with envfile", async () => {
    (<jest.Mock>core.getInput).mockImplementation(
      createMockedgetInput({ version: "v1.2.0", globalKey: "TEST" })
    );

    await setup();

    expect(mockedCore.setFailed).toHaveBeenCalledTimes(0);
    expect(mockedExec.exec).toHaveBeenCalledTimes(1);
    expect(mockedExec.exec).toHaveBeenCalledWith("runtime-env", ["--key=TEST"]);
  });

  it("should run with envfile", async () => {
    (<jest.Mock>core.getInput).mockImplementation(
      createMockedgetInput({ version: "v1.2.0", noEnvs: "true" })
    );

    await setup();

    expect(mockedCore.setFailed).toHaveBeenCalledTimes(0);
    expect(mockedExec.exec).toHaveBeenCalledTimes(1);
    expect(mockedExec.exec).toHaveBeenCalledWith("runtime-env", [
      "--no-envs=true",
    ]);
  });
  it("should run with envfile", async () => {
    (<jest.Mock>core.getInput).mockImplementation(
      createMockedgetInput({ version: "v1.2.0", output: "./build/env.js" })
    );

    await setup();

    expect(mockedCore.setFailed).toHaveBeenCalledTimes(0);
    expect(mockedExec.exec).toHaveBeenCalledTimes(1);
    expect(mockedExec.exec).toHaveBeenCalledWith("runtime-env", [
      "-o=./build/env.js",
    ]);
  });
  it("should run with envfile", async () => {
    (<jest.Mock>core.getInput).mockImplementation(
      createMockedgetInput({ version: "v1.2.0", prefix: "REACT_APP_" })
    );

    await setup();

    expect(mockedCore.setFailed).toHaveBeenCalledTimes(0);
    expect(mockedExec.exec).toHaveBeenCalledTimes(1);
    expect(mockedExec.exec).toHaveBeenCalledWith("runtime-env", [
      "-p=REACT_APP_",
    ]);
  });
  it("should run with envfile", async () => {
    (<jest.Mock>core.getInput).mockImplementation(
      createMockedgetInput({ version: "v1.2.0", removePrefix: "true" })
    );

    await setup();

    expect(mockedCore.setFailed).toHaveBeenCalledTimes(0);
    expect(mockedExec.exec).toHaveBeenCalledTimes(1);
    expect(mockedExec.exec).toHaveBeenCalledWith("runtime-env", [
      "--remove-prefix=true",
    ]);
  });
  it("should run with envfile", async () => {
    (<jest.Mock>core.getInput).mockImplementation(
      createMockedgetInput({
        version: "v1.2.0",
        typeDeclarationsFile: "./types/env.d.ts",
      })
    );

    await setup();

    expect(mockedCore.setFailed).toHaveBeenCalledTimes(0);
    expect(mockedExec.exec).toHaveBeenCalledTimes(1);
    expect(mockedExec.exec).toHaveBeenCalledWith("runtime-env", [
      "--dts=./types/env.d.ts",
    ]);
  });
  it("should run with envfile", async () => {
    (<jest.Mock>core.getInput).mockImplementation(
      createMockedgetInput({ version: "v1.2.0", disableLogs: "true" })
    );

    await setup();

    expect(mockedCore.setFailed).toHaveBeenCalledTimes(0);
    expect(mockedExec.exec).toHaveBeenCalledTimes(1);
    expect(mockedExec.exec).toHaveBeenCalledWith("runtime-env", [
      "--disable-logs=true",
    ]);
  });
});
