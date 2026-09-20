# Slide Engine

A tiny, dependency-free slide engine. Write slides in plain HTML, add `data-*` attributes, and the JS builds the rest.

## Files

```
index.html
css/colors.css   # palette (CSS variables)
css/style.css    # layout + effects
index.js         # engine
```

Load the script at the end of `<body>` or with `defer`, otherwise the queries find nothing:

```html
<link href="./css/colors.css" rel="stylesheet">
<link href="./css/style.css" rel="stylesheet">
<script src="./index.js" defer></script>
```

## Controls

| Key | Action |
|---|---|
| `→` or `Space` | Next slide |
| `←` | Previous slide |
| `↑` | Reveal the next step on the current slide |
| `↓` | Hide the last revealed step |

Leaving a slide resets all its steps, so it starts fresh when you come back.

## Slides

Every slide is a `<section class="slide">`. Only the one with `.active` is shown. The first slide is activated on load.

```html
<section class="slide center">
  <h2 class="visually-hidden">Title for screen readers</h2>
  ...
</section>
```

- Slides lay out their content as centered, wrapping rows automatically. Full-width blocks (titles, paragraphs, rows) take their own line, and cards sit side by side. `center` is only needed on individual elements like cards.
- `visually-hidden` hides an element visually but keeps it for screen readers.

## Transitions

Slides animate in and out. Direction follows the key: forward slides come in from the right, backward from the left. Set a style per slide with `data-transition`:

```html
<section class="slide" data-transition="zoom">
```

| Value | Effect |
|---|---|
| `slide` (default) | Slides sideways |
| `fade` | Cross-fade |
| `zoom` | Forward zooms in, backward zooms out |
| `up` | Slides vertically |

Each style applies to the slide it is set on, both when it enters and when it leaves. Other things you get automatically:

- **Staggered entrance:** the top-level elements of a slide (titles, charts, tables) rise in one after another. Steps are excluded, so they still wait for `↑`.
- **Progress bar and counter:** a bar at the top and `3 / 8` in the corner.
- **Steps reset after the slide has left**, so nothing flips back while it fades out.
- **Reduced motion:** users who set "reduce motion" in their OS get no animation.

To change the speed, edit `LEAVE_MS` in `index.js` and the `.6s` / `.5s` durations in the transition keyframes rules in `style.css`.

## Steps

A **step** is anything that appears when you press `↑`. Steps reveal in document order by getting the class `.revealed`.

Steps are anything matching `STEP_SELECTOR` in `index.js`:

```js
const STEP_SELECTOR = "[data-flip], [data-fade], .timeline-element, .graph-element";
```

To add a new kind of step, add its selector here and write CSS for `.revealed`.

## Elements

### Card

```html
<div class="card center" data-width="128px" data-height="256px">Text</div>
```

| Attribute | Meaning |
|---|---|
| `data-width` / `data-height` | Copied to `--width` / `--height`. **Include the unit** (`px`, `%`, `rem`). |

### Text (`data-content`)

Any empty element with `data-content` gets that text. Combine it with a text class:

```html
<div data-content="Big title" class="main-title"></div>
```

| Class | Look |
|---|---|
| `main-title` | Huge bold title |
| `quote-title` | Italic accent-colored line |
| `sub-title` | Small muted text |
| `medium-title` | Section heading |
| `normal-paragraph` | Body text |

`data-content` is only applied when the element is empty and has no child elements. It also works with `data-flip` and `card` (the text becomes the front face). Timeline events use `data-content` for their own description.

If a flip element has no `data-back`, its back is invisible, so it simply flips into view. That's handy for paragraphs.

### Rows and containers

```html
<div data-spacing="12px" class="sepratared-row">
  <div data-content="One" class="sub-title"></div>
  <div data-content="Two" class="sub-title"></div>
</div>

<div data-fade class="nosep-container">
  <div data-content="Heading" class="medium-title"></div>
  <div data-content="Text right under it" class="normal-paragraph"></div>
</div>
```

| Class | Meaning |
|---|---|
| `sepratared-row` (or `separated-row`) | Horizontal row with a divider between items. `data-spacing` sets the gap on both sides of each divider (needs a unit). |
| `nosep-container` | Vertical stack with no gap between items. |

Always close your `<div>`s. An unclosed one nests everything after it, and `data-content` would then be skipped.

### Line graph

Each `↑` draws the next segment and counts the point's label up. If every `data-name` is a number (years), points are spaced proportionally, otherwise evenly.

```html
<div data-linegraph data-unit="%" data-max="100" data-xlabel="Year" data-ylabel="% of adults who can read">
  <div class="line-point" data-name="1820" data-value="12"></div>
  <div class="line-point" data-name="1900" data-value="21"></div>
</div>
```

| Attribute | On | Meaning |
|---|---|---|
| `data-unit` | `data-linegraph` | Appended to labels and y ticks |
| `data-max` | `data-linegraph` | Top of the y axis. Defaults to the largest value. |
| `data-xlabel` / `data-ylabel` | `data-linegraph` | Optional axis titles |
| `data-name` | `.line-point` | x label under the point |
| `data-value` | `.line-point` | y value |

### Table

Each `↑` reveals the next row (`.table-row`). The header is always visible.

```html
<table data-table>
  <thead><tr><th></th><th>Then</th><th>Now</th></tr></thead>
  <tbody>
    <tr class="table-row"><th scope="row">Teacher</th><td>Answers</td><td>Guide</td></tr>
  </tbody>
</table>
```

### Slide title, caption, bullets

| Markup | Meaning |
|---|---|
| `class="slide-title"` | Heading at the top of a slide, with an accent underline |
| `class="sub-title caption"` | Small centered line (axis notes, sources) |
| `<ul class="bullets">` with `<li data-fade>` | Bullets that appear one per `↑`. Add `class="callout"` to an `li` to highlight it. |

Bar graphs are now as wide as their number of bars (2 bars give a narrow chart), and numbers get thousands separators (`1,600`).

### Fade

```html
<div data-fade class="card">Fades in on ↑</div>
```

### Flip

Turns from the back face to the front face on ↑.

```html
<div data-flip data-back="?" class="card">Answer</div>
```

| Attribute | Meaning |
|---|---|
| `data-back` | Optional text shown on the back face. Empty by default. |

The engine wraps the content in `.flip-front` and adds a `.flip-back`.

### Timeline

Each `↑` reveals an event. The dot slides to it, the bar fills up to it, and the glow grows with progress. Events alternate above and below the bar.

```html
<div data-timeline>
  <div class="timeline-element" data-year="1999" data-title="Start"  data-content="Where it began"></div>
  <div class="timeline-element" data-year="2005" data-title="Growth" data-content="Things picked up"></div>
</div>
```

| Attribute | Meaning |
|---|---|
| `data-year` | Big label |
| `data-title` | Heading |
| `data-content` | Description |

Events are evenly spaced, not proportional to the years.

### Graph

Each `↑` grows the next bar and counts its label from 0 up to the value.

```html
<div data-graph data-unit="%" data-max="100">
  <div class="graph-element" data-name="Mon" data-value="40"></div>
  <div class="graph-element" data-name="Tue" data-value="65"></div>
</div>
```

| Attribute | On | Meaning |
|---|---|---|
| `data-unit` | `data-graph` | Appended to labels (`40%`). Optional. |
| `data-max` | `data-graph` | Value that fills the full height. Defaults to the largest value. |
| `data-name` | `.graph-element` | Label under the bar |
| `data-value` | `.graph-element` | The number. Decimals are kept (`12.5` counts with one decimal). Negatives are clamped to 0. |

## Colors

Defined in `css/colors.css`. The engine uses:

| Variable | Used for |
|---|---|
| `--bg1` | Slide background |
| `--bg2` | Card background |
| `--bg3` | Empty bar and baseline tracks |
| `--fg1` | Main text |
| `--fg2` | Secondary text |
| `--ac1` | Accent fills and glows (bars, timeline fill, dot) |
| `--ac2` | Accent text (timeline year) |
| `--border` | Card borders (light gray) |

If a variable is missing, the property that uses it is silently dropped and the element goes transparent or invisible.

## Troubleshooting

- **Numbers never count up:** `updateGraphs()` must be called in both `switchSlides()` and `forwardProgress()`, next to `updateTimelines()`.
- **A `slide center` is always visible:** `.center` sets `display: flex`, which overrides `display: none`. Use `.slide:not(.active) { display: none; }` and `.slide.active.center { display: flex; }`.
- **Nothing happens on ↑:** the element isn't matched by `STEP_SELECTOR`.
- **Timeline or graph is empty:** check the class names (`timeline-element`, `graph-element`) and that the script runs after the HTML.
- **Card size ignored:** `data-width="128"` needs a unit, `data-width="128px"`.
- **Bar or glow invisible:** the accent is `--ac1`, not `--border`.resentations
