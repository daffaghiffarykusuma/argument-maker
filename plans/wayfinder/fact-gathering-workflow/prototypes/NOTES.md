# Selected gather-first workspace prototype

> Selected direction: staged workflow with Gather Facts, Construct Argument, and Preview as full-width stages.

## Question

Which interface lets users gather facts first, construct an argument from those facts, and move between both activities without losing context or overcrowding the command-desk layout?

## Run

From the repository root:

```powershell
bunx vite plans/wayfinder/fact-gathering-workflow/prototypes --host 127.0.0.1
```

Open `http://127.0.0.1:5173/gather-first-workspace-prototype.html`.

## Verdict

The user selected **A — Staged workflow**.

It supports the gather-first mental model by making the intended sequence explicit while keeping every stage directly reachable and preserving the no-hard-lock decision. The full-width stage also avoids splitting attention between a dense fact collection and the structured Argument Board.

The losing variants and prototype switcher were removed. The retained artifact remains throwaway reference code; production implementation should rewrite the selected behavior against the real Argument Board state and styles.
