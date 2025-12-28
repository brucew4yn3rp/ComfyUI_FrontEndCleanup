import { app } from "../../scripts/app.js";

app.registerExtension({
  name: "frontend.cleanup.ui",

  async setup() {
    const LOG = "[ComfyUI][FrontEndCleanup]";
    let moved = false;

    /* -------------------------
       Inject CSS
    -------------------------- */
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "extensions/ComfyUI_FrontEndCleanup/ui_cleanup.css";
    document.head.appendChild(link);

    /* -------------------------
       Move Actionbar
    -------------------------- */
    function moveActionbar() {
      if (moved) return true;

      const actionbar = document.querySelector(".actionbar-container");
      const tabsContainer = document.querySelector(
        ".workflow-tabs-container > div > .flex.h-full.shrink-0.items-center"
      );

      if (!actionbar || !tabsContainer) return false;

      if (tabsContainer.contains(actionbar)) {
        moved = true;
        return true;
      }

      console.log(`${LOG} moving actionbar`);

      Object.assign(actionbar.style, {
        border: "none",
        boxShadow: "none",
        background: "transparent",
        height: "auto",
        padding: "0 8px",
      });

      tabsContainer.appendChild(actionbar);
      moved = true;

      console.log(`${LOG} done`);
      return true;
    }

    // Try immediately
    if (moveActionbar()) return;

    // Observe async UI hydration
    const observer = new MutationObserver(() => {
      if (moveActionbar()) observer.disconnect();
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    // Safety timeout
    setTimeout(() => {
      observer.disconnect();
      if (!moved) console.warn(`${LOG} timeout`);
    }, 10000);
  },
});
