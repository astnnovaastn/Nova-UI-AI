# Zero-API simulation

The local simulation loads the production canvas entry and WorkCanvas component. It does not mount the authenticated application shell, API client, live provider, account adapter or native source controller.

Start from astra_ai/ui/frontend:

    node tests/v20-server.cjs

Open:

    http://127.0.0.1:5187/v20-simulation.html?aegisFixture=mixed-result&count=5

The page allows only loopback hosts, blocks API fetches, XHR, WebSockets and beacon calls. The automated browser harness additionally aborts non-loopback requests. Synthetic content is labeled on every run. Fixture results are not saved to research history.

The Design selector exposes all 25 production layout families. Object counts are 5, 8, 20, 50 and 100. Fixtures contain readable code, differences, tables, charts, schedules, diagrams and a supplied reference image. Missing webpage previews remain honest placeholders. Open and selection actions use the existing canvas.

Verification commands:

    cd work-canvas
    npm run sync
    npm test
    npm run build
    cd ..
    npm run build
    node tests/v20-visual.cjs --desktop

Backend tests use injected fake model/search providers. Windows sandbox restrictions can block Python's event-loop socket before any application code executes; run approved offline tests with loopback support and a short temporary directory.

The visual harness captures overview, selection and focused states and logs errors, blocked requests, frame intervals, long tasks and routing events. Electron uses a separate test profile with autoStart disabled, so it never launches a backend or starts research.

All 20 workflows have fake-provider publication tests. Source-stack checks exercise the production PartRow and SourceStackOverlay at 1, 3 and 10 pages, page-two selection, stable anchors, keyboard, emulated touch, reduced motion and narrow bounds. Google UI checks inject a fake adapter into the production Connections component. No real Google account is connected by those tests.

Not yet covered end-to-end: every workflow's complete success/failure/retry/cancellation matrix, archived saved-run reopening under all 25 families, real touch hardware and actual Google consent. Unit fixtures are not proof of those behaviors.

Additional commands from frontend: node tests/v20-stacks.cjs and node tests/v20-google-ui.cjs. Source width screenshots compare 336 and 404 px at the same viewport with no canvas transform. The supplied reference image is labeled as a reference; it is not presented as a webpage capture.
