import { create } from "zustand";
import useGraph from "../features/editor/views/GraphView/stores/useGraph";
import useFile from "./useFile";

const init_state = {
  json: "{}",
  loading: true,
};

interface JsonActions {
  setJson: (json: string) => void;
  getJson: () => string;
  clear: () => void;
  updateNode: (path: Array<string | number> | undefined, value: any) => void;
}

export type JsonStates = typeof init_state;

const useJson = create<JsonStates & JsonActions>()((set, get) => ({
  ...init_state,
  getJson: () => get().json,
  setJson: json => {
    set({ json, loading: false });
    useGraph.getState().setGraph(json);
  },
  updateNode: (path, value) => {
    try {
      const curr = get().json || "{}";
      let parsed = JSON.parse(curr);

      if (!path || path.length === 0) {
        parsed = value;
      } else {
        let target: any = parsed;
        for (let i = 0; i < path.length; i++) {
          const seg = path[i] as any;
          if (i === path.length - 1) {
            if (Array.isArray(target) && typeof seg === "number") {
              target[seg] = value;
            } else {
              target[seg] = value;
            }
          } else {
            if (typeof target[seg] === "undefined") {
              const nextSeg = path[i + 1];
              target[seg] = typeof nextSeg === "number" ? [] : {};
            }
            target = target[seg];
          }
        }
      }
      const upd = JSON.stringify(parsed, null, 2);
      set({ json: upd, loading: false });
      try {
        useFile.setState({ contents: upd, hasChanges: true });
        if (typeof window !== "undefined") {
          sessionStorage.setItem("content", upd);
          sessionStorage.setItem("format", useFile.getState().format);
        }
      } catch (e) {
        return;
      }
      useGraph.getState().setGraph(upd);
    } catch (e) {
      console.error("Failed:", e);
    }
  },
  clear: () => {
    set({ json: "", loading: false });
    useGraph.getState().clearGraph();
  },
}));

export default useJson;