# Mint API Skill

## Bring 3D creation into your app.

![A sunlit workspace with a retro computer generated with Mint](assets/platform-mint-landing.webp)

Give coding agents the service-specific Mint API workflow for generation,
review, polling, retries, assets, derivatives, file delivery, rate limits, and Credits.

## Install

```bash
# Codex
npx skills add mintdotgg/mint-api-skill -a codex -g -y

# Claude Code
npx skills add mintdotgg/mint-api-skill -a claude-code -g -y

# Cursor
npx skills add mintdotgg/mint-api-skill -a cursor -g -y

# Other compatible agents
npx skills add mintdotgg/mint-api-skill -g -y
```

Set `MINT_API_KEY` in the agent's environment, then ask:

```text
Use the mint-api skill to add Mint model generation to this application.
Use the default auto workflow, poll with bounded backoff, and retrieve the model files.
```

Documentation: [docs.mint.gg/developers/quickstart](https://docs.mint.gg/developers/quickstart)
