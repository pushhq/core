import { machine } from "../../src";
import { interpret } from "xstate";

const projectId = "2a4c33f1-1bef-47e4-b1f9-875edd96fd47";

const VERSION = "version." + projectId;

const action = document.querySelector(".action");
const output = document.querySelector(".output");

const service = interpret(
  machine(
    {
      projectId,
      apiKey:
        "eyJhbGciOiJSUzI1NiJ9.Sm1GVGh2VGlHaDhYbmpYMkkweWdP.e3yPUaQlFKLDzp9GVau4AcH7e0EtHalIKmcKvXFbeh2aVpVz_v6L3jFXSO8KqGUckapPaKqmngjQ-x2ugQLNssF2SKlnxf79UWeC3ra4D2BPjOWwR9K-m-zvzsvmeNDji408tHGngyVkh5G6W4-EfN6bvO8V56UQMeuN6tdiVA8",
    },
    "web"
  ).withConfig({
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

  // state.context.fetcher.subscribe((s) => {
  //   output.innerHTML += JSON.stringify({ fetcher: s.value });
  // });

  if (output) {
    output.innerHTML = JSON.stringify({
      state: state.value,
      context: state.context,
      fetcher: state.context.fetcher.getSnapshot().value,
    });
  }
});

action?.addEventListener("click", () => {
  service.send("RESOLVE");
});

service.start();
