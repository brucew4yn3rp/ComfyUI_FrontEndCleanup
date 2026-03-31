import { app } from "../../scripts/app.js";

/* -------------------------
   Refresh Prompt
--------------------------- */
let refreshPromptShown = false;
let initialSetupComplete = false;

function showRefreshPrompt() {
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
        font-family: system-ui;
        font-size: 14px;
    `;

    prompt.innerHTML = `
        <span>Settings changed. Refresh to apply?</span>
        <button>Refresh</button>
        <button>Dismiss</button>
    `;

    const [refreshBtn, dismissBtn] = prompt.querySelectorAll("button");

    refreshBtn.onclick = () => location.reload();
    dismissBtn.onclick = () => prompt.remove();

    setTimeout(() => {
        prompt.style.opacity = "0";
        setTimeout(() => prompt.remove(), 300);
    }, 10000);

    document.body.appendChild(prompt);
}

/* -------------------------
   Extension
--------------------------- */
app.registerExtension({
    name: "frontend.cleanup.ui",

    settings: [
        {
            id: "FrontEndCleanup.UI.Move Actionbar to Top Bar",
            name: "Move actionbar to top bar",
            type: "boolean",
            defaultValue: true,
            onChange: showRefreshPrompt
        },
        {
            id: "FrontEndCleanup.UI.Hide Subgraph Breadcrumb",
            name: "Hide subgraph breadcrumb navigation",
            type: "boolean",
            defaultValue: false,
            onChange: showRefreshPrompt
        },
        {
            id: "FrontEndCleanup.UI.Hide Job Progress Panel",
            name: "Hide job progress panel",
            type: "boolean",
            defaultValue: false,
            onChange: showRefreshPrompt
        },
        {
            id: "FrontEndCleanup.UI.Hide Error Triangle",
            name: "Hide error triangle icon",
            type: "boolean",
            defaultValue: true,
            onChange: showRefreshPrompt
        }
    ],

    async setup() {
        const LOG = "[ComfyUI][FrontEndCleanup]";

        // Inject CSS
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = "extensions/ComfyUI_FrontEndCleanup/ui_cleanup.css";
        document.head.appendChild(link);

        const moveEnabled = app.ui.settings.getSettingValue(
            "FrontEndCleanup.UI.Move Actionbar to Top Bar",
            true
        );

        const hideSubgraph = app.ui.settings.getSettingValue(
            "FrontEndCleanup.UI.Hide Subgraph Breadcrumb", true
        );
        const hideJobProgress = app.ui.settings.getSettingValue(
            "FrontEndCleanup.UI.Hide Job Progress Panel", true
        );
        const hideErrorTriangle = app.ui.settings.getSettingValue(
            "FrontEndCleanup.UI.Hide Error Triangle", true
        );

        if (hideSubgraph) document.body.classList.add("ui_cleanup_hide_subgraph");
        if (hideJobProgress) document.body.classList.add("ui_cleanup_hide_jobprogress");
        if (hideErrorTriangle) document.body.classList.add("ui_cleanup_hide_error_triangle");

        /* -------------------------
        SINGLE INSTANCE ENFORCER
        -------------------------- */
        function moveActionbar(actionbar) {
            actionbar.classList.add("ui-moving");
            actionbar.classList.remove("ui-mounted");
            if (!moveEnabled) return;

            const tabsContainer = document.querySelector(
                ".workflow-tabs-container > div > .flex.h-full.shrink-0.items-center"
            );

            if (!tabsContainer || !actionbar) return;

            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    if (!document.body.contains(actionbar)) return;
                    // 🔥 REMOVE ALL OTHER ACTIONBARS
                    const all = document.querySelectorAll(".actionbar-container");

                    all.forEach(el => {
                        if (el !== actionbar) {
                            el.remove();
                        }
                    });

                    // Already correct after cleanup
                    if (!tabsContainer.contains(actionbar)) {
                        Object.assign(actionbar.style, {
                            border: "none",
                            boxShadow: "none",
                            background: "transparent",
                            height: "auto",
                            padding: "0 8px",
                        });

                        tabsContainer.appendChild(actionbar);
                        requestAnimationFrame(() => {
                            actionbar.classList.remove("ui-moving");
                            actionbar.classList.add("ui-mounted");
                        });
                        console.log(`${LOG} actionbar moved (deduped)`);
                    }
                });
            });
        }

        /* -------------------------
        OBSERVER
        -------------------------- */
        const observer = new MutationObserver((mutations) => {
            for (const m of mutations) {
                for (const node of m.addedNodes) {
                    if (!(node instanceof HTMLElement)) continue;

                    if (node.matches?.(".actionbar-container")) {
                        moveActionbar(node);
                    }

                    const found = node.querySelector?.(".actionbar-container");
                    if (found) {
                        moveActionbar(found);
                    }
                }
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true,
        });

        /* -------------------------
        INITIAL LOAD
        -------------------------- */
        setTimeout(() => {
            const bars = document.querySelectorAll(".actionbar-container");

            if (bars.length > 0) {
                // Take the LAST one (most recent)
                moveActionbar(bars[bars.length - 1]);
            }
        }, 500);

        /* -------------------------
        SAFETY LOOP
        -------------------------- */
        const interval = setInterval(() => {
            const bars = document.querySelectorAll(".actionbar-container");

            if (bars.length > 1) {
                moveActionbar(bars[bars.length - 1]);
            }
        }, 1000);

        setTimeout(() => clearInterval(interval), 15000);

        setTimeout(() => {
            initialSetupComplete = true;
        }, 1000);
    }

});