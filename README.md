<img align="left" alt="triton logo" src="assets/logo.png" width=200px />

# triton

triton is an SVG based JS library for drawing tree diagrams (forked from [treant-js](https://github.com/fperucic/treant-js)). It relies on [Raphaël](http://raphaeljs.com) for SVG rendering and animations.

## Quick start

```html
<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Example Graph</title>

    <link rel="stylesheet" href="https://iamlostshe.github.io/triton/triton.css">
</head>

<body>
    <div class="chart" id="graph"></div>
    <script src="https://iamlostshe.github.io/triton/vendor/raphael.js"></script>
    <script src="https://iamlostshe.github.io/triton/triton.min.js"></script>
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
