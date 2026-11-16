// The bundled start page: connects the window to the AEGIS workspace, or asks where it is.
const invoke = window.aegisDesktop.invoke;
const status = document.getElementById("status");
const progress = document.getElementById("progress");
const setup = document.getElementById("setup");
const fields = {
  uiUrl: document.getElementById("ui-url"),
  projectRoot: document.getElementById("project-root"),
  autoStart: document.getElementById("auto-start"),
  stopOnExit: document.getElementById("stop-on-exit"),
};
const submit = setup.querySelector("button");

/** Electron prefixes errors from the main process; only the reason is shown. */
const reason = (error) => String(error?.message ?? error).replace(/^Error invoking remote method '[^']*': (Error: )?/, "");

function fill(config) {
  fields.uiUrl.value = config.uiUrl;
  fields.projectRoot.value = config.projectRoot;
  fields.autoStart.checked = config.autoStart;
  fields.stopOnExit.checked = config.stopOnExit;
}

function say(text, failed = false) {
  status.textContent = text;
  status.classList.toggle("failed", failed);
  progress.classList.toggle("done", failed);
}

async function connect() {
  say("Starting AEGIS…");
  submit.disabled = true;
  try {
    // On success the window leaves this page for the workspace.
    await invoke("desktop_boot");
  } catch (error) {
    say(reason(error), true);
    setup.hidden = false;
    submit.disabled = false;
  }
}

setup.addEventListener("submit", async (event) => {
  event.preventDefault();
  try {
    fill(
      await invoke("desktop_save_config", {
        config: {
          uiUrl: fields.uiUrl.value,
          projectRoot: fields.projectRoot.value,
          autoStart: fields.autoStart.checked,
          stopOnExit: fields.stopOnExit.checked,
        },
      }),
    );
  } catch (error) {
    say(reason(error), true);
    return;
  }
  await connect();
});

invoke("desktop_config").then(fill).then(connect, (error) => say(reason(error), true));
