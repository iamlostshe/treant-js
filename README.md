# Treant-js

Treant-js is an SVG based JS library for drawing tree diagrams. It relies on [Raphaël](http://raphaeljs.com) for SVG rendering and animations.

---

## Quick start

```html
<!DOCTYPE html>
<html>
<head>
  <link rel="stylesheet" href="Treant.css">
  <style>
    #graph { height: 500px; width: 800px; }
    .Treant > .node {
      padding: 8px 12px; border-radius: 4px;
      background: #fff; border: 1px solid #ccc;
      width: 160px; text-align: center;
    }
    .node-text { margin: 0; font-size: 13px; font-weight: bold; }
  </style>
</head>
<body>
  <div class="chart" id="graph"></div>
  <script src="vendor/raphael.js"></script>
  <script src="Treant.js"></script>
  <script>
    new Treant({
      nodes: [
        { id: 1, text: "Root",       children: [2, 3] },
        { id: 2, text: "Child A",    parent: 1 },
        { id: 3, text: "Child B",    parent: 1, children: [4] },
        { id: 4, text: "Grandchild", parent: 3 },
      ]
    });
  </script>
</body>
</html>
```

---

## Config format (flat, ID-based)

Instead of the original hierarchical `nodeStructure`, this fork uses a flat **`nodes` array** where every node declares its own `id` and refers to parents/children by ID.

```js
new Treant({
  container: "#graph",           // optional, default "#graph"
  target: "_blank",              // optional link target, default "_self"

  connectors: {
    type: "step",                // "step" | "curve" | "bCurve" | "straight"
    style: { "stroke-width": 2, stroke: "#888" }
  },

  nodes: [
    // Each node:
    { id: "a",  text: "Node A",  link: "https://example.com" },
    { id: "b",  text: "Node B",  parent: "a" },
    { id: "c",  text: "Node C",  parent: "a", children: ["d"] },
    { id: "d",  text: "Node D",  parent: "c" },
  ]
});
```

### Node fields

| Field | Type | Description |
|---|---|---|
| `id` | `string \| number` | Unique identifier. Required. |
| `text` | `string` | Node label text. |
| `link` | `string` | URL the node links to (renders as `<a>`). |
| `parent` | `id \| id[]` | Parent ID(s). Array for converging edges (DAG). |
| `children` | `id \| id[]` | Child ID(s). |
| `HTMLclass` | `string` | Extra CSS class added to the node. |
| `HTMLid` | `string` | Custom HTML id attribute. |
| `innerHTML` | `string` | Custom HTML content (instead of `text`). |
| `collapsable` | `boolean` | Allow collapse/expand toggle. |
| `collapsed` | `boolean` | Start collapsed. |
| `pseudo` | `boolean` | Invisible placeholder node. |
| `connectors` | `object` | Per-node connector style override. |

---

## Examples

### Basic tree

Simple parent-child hierarchy with a single root:

```js
new Treant({
  nodes: [
    { id: "programming", text: "Programming",
      children: ["syntax", "paradigms", "tools"] },

    { id: "syntax",    text: "Syntax",     parent: "programming",
      children: ["variables", "functions"] },
    { id: "variables", text: "Variables",  parent: "syntax" },
    { id: "functions", text: "Functions",  parent: "syntax" },

    { id: "paradigms",   text: "Paradigms",  parent: "programming",
      children: ["oop", "functional"] },
    { id: "oop",         text: "OOP",        parent: "paradigms" },
    { id: "functional",  text: "Functional", parent: "paradigms" },

    { id: "tools",    text: "Tools",         parent: "programming",
      children: ["editor", "compiler"] },
    { id: "editor",   text: "Code editor",   parent: "tools" },
    { id: "compiler", text: "Compiler",      parent: "tools" },
  ]
});
```

### Converging edges (DAG)

A child can have multiple parents. The first parent determines tree layout; the rest are rendered as extra connector lines:

```js
new Treant({
  connectors: { type: "step", style: { "stroke-width": 2, stroke: "#999" } },
  nodes: [
    { id: "frontend", text: "Frontend",  children: ["html", "css", "js"] },
    { id: "backend",  text: "Backend",   children: ["db", "api", "js"] },
    { id: "html",     text: "HTML",      parent: "frontend" },
    { id: "css",      text: "CSS",       parent: "frontend" },
    { id: "db",       text: "Database",  parent: "backend" },
    { id: "api",      text: "API",       parent: "backend" },
    {
      id: "js",       text: "JavaScript",
      parent: ["frontend", "backend"],   // two parents!
      children: ["ecma", "dom"],
    },
    { id: "ecma",     text: "ECMAScript", parent: "js" },
    { id: "dom",      text: "DOM API",    parent: "js" },
  ]
});
```

Here **JavaScript** sits under *Frontend* in the tree layout, but an extra connector is drawn from *Backend* as well.

### Multiple independent roots

If no single root is found, a hidden virtual root is created automatically. Each top-level node is rendered at the same level:

```js
new Treant({
  connectors: { type: "step", style: { "stroke-width": 2, stroke: "#aaa" } },
  nodes: [
    { id: "langs",    text: "Languages",  children: ["python", "rust"] },
    { id: "python",   text: "Python",     parent: "langs" },
    { id: "rust",     text: "Rust",       parent: "langs" },
    { id: "concepts", text: "Concepts",   children: ["types", "patterns"] },
    { id: "types",    text: "Type system", parent: "concepts" },
    { id: "patterns", text: "Patterns",    parent: "concepts" },
    { id: "tools",    text: "Tools",       children: ["git", "docker"] },
    { id: "git",      text: "Git",         parent: "tools" },
    { id: "docker",   text: "Docker",      parent: "tools" },
  ]
});
```

---

## Building to `Treant.min.js`

```sh
npm install
npx terser Treant.js --compress --mangle -o Treant.min.js
```
