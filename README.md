<img align="left" alt="triton logo" src="assets/logo.png" style="max-width: 200px; padding: 20px 20px 0 0"/>

# triton

triton is an SVG based JS library for drawing tree diagrams (forked from [treant-js](https://github.com/fperucic/treant-js)). It relies on [Raphaël](http://raphaeljs.com) for SVG rendering and animations.

## Quick start

```html
<!DOCTYPE html>
<html>
<head>
  <link rel="stylesheet" href="triton.css">
  <style>
    #graph { height: 500px; width: 800px; }
    .triton > .node {
      padding: 8px 12px; border-radius: 4px;
      background: #fff; border: 1px solid #ccc;
      width: 160px; text-align: center;
    }
    .node-text { margin: 0; font-size: 13px; font-weight: bold; }
  </style>
</head>
<body>
  <div class="chart" id="graph"></div>
  <script src="https://raw.githubusercontent.com/iamlostshe/treant-js/refs/heads/master/vendor/raphael.js"></script>
  <script src="https://raw.githubusercontent.com/iamlostshe/treant-js/refs/heads/master/triton.min.js"></script>
  <script>
    new triton({
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

## Config format (flat, ID-based)

Instead of the original hierarchical `nodeStructure`, this fork uses a flat **`nodes` array** where every node declares its own `id` and refers to parents/children by ID.

```js
new triton({
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

## Dev: Building to `triton.min.js`

```sh
bun build triton.js --minify --outfile triton.min.js
```
