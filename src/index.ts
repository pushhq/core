import fetcher from "./fetcher";
import machine from "./machine";
import { interpret } from "xstate";
import { Credentials, Platform, Version } from "./types";

export * from "./types";
export { fetcher, machine };

export type StorageAdapter = {
  remove: () => void;
  get: () => Promise<Version>;
  set: (data: Version) => void;
};

export type Options = Credentials & {
  platfrom?: Platform;
  storageAdapter: StorageAdapter;
};

export const connect = ({
  platfrom,
  storageAdapter,
  ...credentials
}: Options) => {
  const service = interpret(
    machine(credentials, platfrom).withConfig({
      actions: {
        resolve: () => storageAdapter.remove(),
        save: (_, { data }: any) => storageAdapter.set(data),
      },
      services: {
        getLocal: () => storageAdapter.get(),
      },
    })
  );

  const check = () => service.send("FETCH");

  const resolve = () => service.send("RESOLVE");

  const enable = () => {
    service.send({ type: "ENABLE_FETCHER", value: true });
  };

  const disable = () => {
    service.send({ type: "ENABLE_FETCHER", value: false });
  };

  return { check, enable, disable, service, resolve };
};
