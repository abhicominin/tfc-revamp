import { create } from "zustand";

const useGlobalStore = create((set) => ({
  loading: true,
  setLoading: (value) => set({ loading: value }),

  playmusic: false,
  setPlayMusic: (value) => set({ playmusic: value }),
}));

export default useGlobalStore;