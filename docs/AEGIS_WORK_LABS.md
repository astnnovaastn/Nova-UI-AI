# AEGIS Work development labs

Both labs render local fixtures without a backend or AI provider. They use the unmodified Zephium Work source at commit `9026a1fffad74d6e201ef97fe8c02c1b01403cd2`. The source checkout and generated lab output are local development dependencies.

From the repository root, prepare a fresh checkout:

```sh
git clone https://github.com/zephium-browser/Zephium.git astra_ai/ui/zephium-source
git -C astra_ai/ui/zephium-source checkout --detach 9026a1fffad74d6e201ef97fe8c02c1b01403cd2
cd astra_ai/ui/frontend
npm ci
npm ci --prefix work-canvas
npm ci --prefix work-canvas/lab
npm run lab:build
npm run lab
```

- [Agent Execution Lab · Explain Code](http://127.0.0.1:5199/dev/agent-execution-lab/?workflow=explain-code)
- [Work Layout Lab · Project architecture](http://127.0.0.1:5199/dev/work-layout-lab/?entry=ws-architecture)

With the server running, run `npm run test:agent-lab` and `npm run test:lab` from the frontend directory. The tests use a local Chrome installation by default.
