import { create } from "zustand";

const useSceneStore = create((set) => ({
  textHovered: null,
  setTextHovered: (textHovered) => set({ textHovered }),

  groupHovered: false,
  setGroupHovered: (groupHovered) => set({ groupHovered }),

  menutextClicked: null,
  setMenutextClicked: (menutextClicked) => set({ menutextClicked }),

  servicePageScrollOffset: 0,
  setServicePageScrollOffset: (servicePageScrollOffset) => set({ servicePageScrollOffset }),
}));

export default useSceneStore;