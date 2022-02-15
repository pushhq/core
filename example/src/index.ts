import { machine } from "../../src";
import { interpret } from "xstate";

const appId = "rJxJ5HwgvBBaNKFpgYip";

const VERSION = "version." + appId;

const action = document.querySelector(".action");
const output = document.querySelector(".output");

const service = interpret(
  machine("web", { appId, apiKey: "w-mBLYl118W5VF2pWWlLY" }).withConfig({
    actions: {
      save: (_, { data }: any) => {
        localStorage.setItem(VERSION, JSON.stringify(data));
      },
      resolve: () => {
        localStorage.removeItem(VERSION);
      },
    },
    services: {
      getLocal: async () => {
        const version = localStorage.getItem(VERSION);
        return version ? JSON.parse(version) : null;
      },
    },
  })
);

service.subscribe((state) => {
  if (state.matches({ active: "update" })) {
    action?.classList.add("available");
  } else {
    action?.classList.remove("available");
  }

  if (output) {
    output.innerHTML = JSON.stringify({
      state: state.value,
      context: state.context,
    });
  }
});

action?.addEventListener("click", () => {
  service.send("RESOLVE");
});

service.start();
