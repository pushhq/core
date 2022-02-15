import { assign, createMachine, sendParent } from "xstate";
import { choose } from "xstate/lib/actions";
import { Credentials, Platform } from "./types";

export type Context = {
  retries: number;
  enabled: boolean;
  lastRefresh: number;
};

export type Events =
  | { type: "FORCE_REFRESH" }
  | { type: "ENABLE"; value: boolean };

const baseURL = "http://localhost:4000/api";

const maxBackoff = 60 * 1000; // default 1 minute
const autoRefreshPeriod = 60 * 60 * 1000; // default 1 hour

// const autoRefreshPeriod = 1000; // default 1 hour

const machine = ({
  appId,
  apiKey,
  platform,
}: Credentials & {
  platform?: Platform;
}) => {
  const url = `${baseURL}/${appId}/latest?apiKey=${apiKey}&platform=${platform}`;

  return createMachine<Context, Events>(
    {
      initial: "maybeStart",

      context: {
        retries: 0,
        enabled: true,
        lastRefresh: 0,
      },

      on: {
        ENABLE: {
          target: "maybeStart",
          actions: "updateEnabled",
        },
      },
      states: {
        disabled: {
          on: {
            FORCE_REFRESH: "refreshing",
          },
        },

        maybeStart: {
          always: [
            { cond: "canRefresh", target: "waitingForRefresh" },
            { target: "disabled" },
          ],
        },

        waitingForRefresh: {
          on: {
            FORCE_REFRESH: "refreshing",
          },

          after: {
            nextRefreshDelay: "refreshing",
          },
        },

        refreshing: {
          on: {
            ENABLE: {
              actions: "updateEnabled",
            },
          },

          invoke: {
            src: "fetcher",
            onError: "errorBackoff",
            onDone: {
              target: "maybeStart",
              actions: [
                "refreshDone",
                choose([
                  {
                    cond: (_, { data }) => !!data,
                    actions: sendParent((_, { data }) => {
                      return { data, type: "DATA" };
                    }),
                  },
                ]),
              ],
            },
          },
        },
        errorBackoff: {
          entry: "incrementRetry",

          after: {
            errorBackoffDelay: "refreshing",
          },
        },
      },
    },
    {
      guards: {
        canRefresh: ({ enabled }) => enabled,
      },
      delays: {
        errorBackoffDelay: ({ retries }) => {
          const baseDelay = 200;
          const delay = baseDelay * 2 ** Math.min(retries, 20);
          return Math.min(delay, maxBackoff);
        },
        nextRefreshDelay: ({ lastRefresh }) => {
          let timeSinceRefresh = Date.now() - lastRefresh;
          let remaining = autoRefreshPeriod - timeSinceRefresh;
          return Math.max(remaining, 0);
        },
      },
      actions: {
        clearLastRefresh: assign({
          lastRefresh: (_) => 0,
        }),

        updateEnabled: assign({
          enabled: (_, { value }: any) => value,
        }),

        incrementRetry: assign({
          retries: ({ retries }) => retries + 1,
        }),

        refreshDone: assign((_) => {
          return { retries: 0, lastRefresh: Date.now() };
        }),
      },
      services: {
        fetcher: async () => {
          const res = await fetch(url);

          if (res.status === 200) return res.json();

          // if (res.status === 429) {
          //   const after = res.headers.get("Retry-Afte");
          //   const reset = res.headers.get("RateLimit-Reset");
          //   const limit = res.headers.get("RateLimit-Limit");
          // }
        },
      },
    }
  );
};

export default machine;
