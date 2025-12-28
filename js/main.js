import { app } from "../../scripts/app.js";

/* -------------------------
   Refresh Prompt
--------------------------- */
let refreshPromptShown = false;
let initialSetupComplete = false;

function showRefreshPrompt() {
    // Don't show prompt during initial page load
    if (!initialSetupComplete) return;
    if (refreshPromptShown) return;
    refreshPromptShown = true;

    const prompt = document.createElement("div");
    prompt.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #2a2a2a;
        color: white;
        padding: 16px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.5);
        z-index: 10000;
        display: flex;
        align-items: center;
        gap: 12px;
        font-family: system-ui, -apple-system, sans-serif;
        font-size: 14px;
    `;

    prompt.innerHTML = `
        <span>Settings changed. Refresh to apply?</span>
        <button style="
            background: #4a9eff;
            color: white;
            border: none;
            padding: 6px 14px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 13px;
            font-weight: 500;
        ">Refresh</button>
        <button style="
            background: transparent;
            color: #aaa;
            border: 1px solid #555;
            padding: 6px 14px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 13px;
        ">Dismiss</button>
    `;

    const refreshBtn = prompt.querySelectorAll("button")[0];
    const dismissBtn = prompt.querySelectorAll("button")[1];

    refreshBtn.addEventListener("click", () => {
        location.reload();
    });

    dismissBtn.addEventListener("click", () => {
        prompt.remove();
    });

    // Auto-dismiss after 10 seconds
    setTimeout(() => {
        if (prompt.parentNode) {
            prompt.style.transition = "opacity 0.3s";
            prompt.style.opacity = "0";
            setTimeout(() => prompt.remove(), 300);
        }
    }, 10000);

    document.body.appendChild(prompt);
}

app.registerExtension({
    name: "frontend.cleanup.ui",
    settings: [
        {
            id: "FrontEndCleanup.UI.Hide Subgraph Breadcrumb",
            name: "Hide subgraph breadcrumb navigation",
            type: "boolean",
            defaultValue: true,
            onChange(value) {
                showRefreshPrompt();
            }
        },
        {
            id: "FrontEndCleanup.UI.Hide Job Progress Panel",
            name: "Hide job progress panel",
            type: "boolean",
            defaultValue: true,
            onChange(value) {
                showRefreshPrompt();
            }
        }
    ],
    async setup() {
        const LOG = "[ComfyUI][FrontEndCleanup]";
        let moved = false;

        // Inject CSS
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = "extensions/ComfyUI_FrontEndCleanup/ui_cleanup.css";
        document.head.appendChild(link);

        // Apply body classes based on user settings
        const hideSubgraph = app.ui.settings.getSettingValue("FrontEndCleanup.UI.Hide Subgraph Breadcrumb", true);
        const hideJobProgress = app.ui.settings.getSettingValue("FrontEndCleanup.UI.Hide Job Progress Panel", true);
        
        if (hideSubgraph) {
            document.body.classList.add("ui_cleanup_hide_subgraph");
        }
        if (hideJobProgress) {
            document.body.classList.add("ui_cleanup_hide_jobprogress");
        }

        /* -------------------------
           Move Actionbar (always)
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

        // Mark initial setup as complete after a short delay
        setTimeout(() => {
            initialSetupComplete = true;
        }, 1000);
    }
});