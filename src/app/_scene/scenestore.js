import { create } from "zustand";

const useSceneStore = create((set) => ({
  textHovered: false,
  setTextHovered: (textHovered) => set({ textHovered }),

  groupHovered: false,
  setGroupHovered: (groupHovered) => set({ groupHovered }),

  menutextClicked: null,
  setMenutextClicked: (menutextClicked) => set({ menutextClicked }),
}));

export default useSceneStore;