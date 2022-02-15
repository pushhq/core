import { assign, createMachine, spawn, ActorRef, send } from "xstate";
import { Version, Platform, Credentials } from "./types";
import fetcher from "./fetcher";
import { choose } from "xstate/lib/actions";

type Ctx = {
  forced?: boolean;
  fetcher: ActorRef<any>;
  version?: Version | null;
};

type Events =
  | { type: "FETCH" | "RESOLVE" }
  | { type: "DATA"; data: Version }
  | { type: "ENABLE_FETCHER"; value: boolean };

type States =
  | { value: "local"; context: Ctx }
  | {
      value: "active" | { active: "idle" | "initial" | "update" };
      context: Ctx;
    };

const mismatch = (oldVersion: Ctx["version"], newVersion: Version) => {
  const { version: b } = newVersion;
  const { version: a } = oldVersion ?? {};
  return b.major !== a?.major || b.minor !== a?.minor || b.patch !== a?.patch;
};

const machine = (credentials: Credentials, platform?: Platform) => {
  return createMachine<Ctx, Events, States>(
    {
      id: "machine",

      initial: "local",

      context: {} as any,

      entry: "spawnFetcher",

      on: {
        DATA: [
          {
            target: "active.update",
            actions: ["setVersion", assign({ forced: (_) => false })],
            cond: ({ version, forced }, { data }) => {
              return forced && mismatch(version, data) ? true : false;
            },
          },
          {
            actions: choose([
              {
                actions: "save",
                cond: ({ version }, { data }) => {
                  return mismatch(version, data);
                },
              },
            ]),
          },
        ],

        ENABLE_FETCHER: {
          actions: "sendFetcherEnable",
        },

        FETCH: {
          actions: ["sendForceFetch", assign({ forced: (_) => true })],
        },
      },

      states: {
        local: {
          invoke: {
            src: "getLocal",
            onDone: [
              {
                actions: "setVersion",
                target: "active.update",
                cond: (_, { data }: { data?: Version }) => {
                  return data && data.type !== "default" ? true : false;
                },
              },
              {
                target: "active",
                actions: "setVersion",
              },
            ],
          },
        },

        active: {
          initial: "idle",

          states: {
            idle: {},

            update: {
              on: {
                RESOLVE: {
                  target: "idle",
                  actions: "resolve",
                },

                // UPDATE: {
                //   actions: ["setVersion", "save"],
                // },
              },
            },
          },
        },
      },
    },
    {
      actions: {
        setVersion: assign({
          version: (_, { data }: any) => data,
        }),

        spawnFetcher: assign({
          fetcher: (_) => {
            return spawn(fetcher({ ...credentials, platform }), "fetcher");
          },
        }),

        sendFetcherEnable: send(
          (_, { value }: any) => ({ value, type: "ENABLE" }),
          { to: "fetcher" }
        ),

        sendForceFetch: send("FORCE_REFRESH", { to: "fetcher" }),
      },
    }
  );
};

export default machine;
