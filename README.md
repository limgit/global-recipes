# global-recipes

Apply global CSS styles based on [`@vanilla-extract/recipes`](https://vanilla-extract.style/documentation/packages/recipes/) variant classes — style children, pseudo-states, and siblings by variant.

## Why?

Vanilla Extract by default [only allows selectors that target the element itself](https://vanilla-extract.style/documentation/styling/#complex-selectors). To style other elements (children, siblings, pseudo-states), you must use `globalStyle` with interpolated class selectors:

```ts
// Without global-recipes: verbose and hard to maintain
const button = recipe({
  variants: {
    size: {
      sm: { fontSize: "14px" },
      md: { fontSize: "16px" },
      lg: { fontSize: "18px" },
    },
  },
});

// Each variant needs its own globalStyle call
globalStyle(`${button.classNames.variants.size.sm} svg`, { width: "16px", height: "16px" });
globalStyle(`${button.classNames.variants.size.md} svg`, { width: "20px", height: "20px" });
globalStyle(`${button.classNames.variants.size.lg} svg`, { width: "24px", height: "24px" });
// ...and this grows with every variant combination
```

While this approach works, `.css.ts` files quickly become bloated with many `globalStyle` calls — especially when dealing with multiple variants, states, and targets.

**global-recipes** solves this by letting you define these `globalStyle` rules in the same declarative way as `recipe`, providing better readability and maintainability:

```ts
// With global-recipes: declarative and scalable
globalRecipe({
  recipe: button,
  selectorGenerators: { "&": (v) => `${v} svg` },
  compoundVariants: [
    { variants: { size: "sm" }, style: { width: "16px", height: "16px" } },
    { variants: { size: "md" }, style: { width: "20px", height: "20px" } },
    { variants: { size: "lg" }, style: { width: "24px", height: "24px" } },
  ],
});
```

## Installation

```bash
npm install global-recipes @vanilla-extract/css @vanilla-extract/recipes
```

```bash
yarn add global-recipes @vanilla-extract/css @vanilla-extract/recipes
```

```bash
pnpm add global-recipes @vanilla-extract/css @vanilla-extract/recipes
```

```bash
bun add global-recipes @vanilla-extract/css @vanilla-extract/recipes
```

## Usage

### Basic: Style child elements by variant

```ts
// button.css.ts
import { recipe } from "@vanilla-extract/recipes";
import { globalRecipe } from "global-recipes";

const buttonStyle = recipe({
  base: { padding: "8px 16px" },
  variants: {
    size: {
      sm: { fontSize: "14px" },
      md: { fontSize: "16px" },
      lg: { fontSize: "18px" },
    },
  },
  defaultVariants: { size: "md" },
});

// Style SVG icons inside buttons based on size variant
globalRecipe({
  recipe: buttonStyle,
  selectorGenerators: {
    "&": (v) => `${v} svg`,
  },
  base: {
    pointerEvents: "none",
    flexShrink: 0,
  },
  compoundVariants: [
    { variants: { size: "sm" }, style: { width: "16px", height: "16px" } },
    { variants: { size: "md" }, style: { width: "20px", height: "20px" } },
    { variants: { size: "lg" }, style: { width: "24px", height: "24px" } },
  ],
});
```

### Advanced: Multiple selector generators

```ts
// checkbox.css.ts
import { recipe } from "@vanilla-extract/recipes";
import { globalRecipe } from "global-recipes";

const checkboxStyle = recipe({
  base: { display: "inline-flex" },
  variants: {
    variant: {
      checkbox: {},
      radio: {},
    },
    size: {
      sm: {},
      md: {},
    },
  },
  defaultVariants: { variant: "checkbox", size: "md" },
});

// Style the visual indicator (div after hidden input) with state-based selectors
globalRecipe({
  recipe: checkboxStyle,
  selectorGenerators: {
    "&": (v) => `${v} input + div`,
    "&:checked": (v) => `${v} input:checked + div`,
    "&:focus": (v) => `${v}:focus-within input + div`,
    "&:disabled": (v) => `${v} input:disabled + div`,
  },
  base: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    border: "2px solid gray",
    selectors: {
      "&:disabled": { opacity: 0.5, cursor: "not-allowed" },
    },
  },
  compoundVariants: [
    {
      variants: { variant: "checkbox" },
      style: {
        borderRadius: "4px",
        selectors: {
          "&:checked": { background: "blue", borderColor: "blue" },
          "&:focus": { boxShadow: "0 0 0 2px rgba(0, 0, 255, 0.3)" },
        },
      },
    },
    {
      variants: { variant: "radio" },
      style: {
        borderRadius: "50%",
        selectors: {
          "&:checked": { background: "green", borderColor: "green" },
        },
      },
    },
    {
      variants: { size: "sm" },
      style: { width: "16px", height: "16px" },
    },
    {
      variants: { size: "md" },
      style: { width: "20px", height: "20px" },
    },
  ],
});
```

## API

### `globalRecipe(options)`

Applies global CSS styles based on recipe variant class combinations.

#### Options

| Option               | Type                                    | Required | Description                                                                       |
| -------------------- | --------------------------------------- | -------- | --------------------------------------------------------------------------------- |
| `recipe`             | `RuntimeFn`                             | Yes      | The vanilla-extract recipe function                                               |
| `selectorGenerators` | `Record<string, (v: string) => string>` | Yes      | Functions that generate CSS selectors. Must include `"&"` key.                    |
| `base`               | `StyleRuleWithSelectors`                | No       | Base styles applied to all elements (supports `selectors` for state-based styles) |
| `compoundVariants`   | `Array<{ variants, style }>`            | No       | Variant-specific styles                                                           |

#### Selector Generators

The `selectorGenerators` object maps keys to functions that generate CSS selectors:

```ts
selectorGenerators: {
  // Required: base selector
  '&': (v) => `${v} svg`,

  // Optional: additional state/pseudo selectors
  '&:hover': (v) => `${v}:hover svg`,
  '&:disabled': (v) => `${v}:disabled svg`,
}
```

The `v` parameter is the variant class selector (e.g., `.button_size_md`).

#### Base Style

The `base` applies to all elements matching the recipe's base class. It can include a `selectors` object:

```ts
base: {
  pointerEvents: 'none',
  selectors: {
    '&:disabled': { opacity: 0.5 },  // Applied to all disabled states
  },
}
```

#### Compound Variants

Each compound variant can include a `selectors` object for state-specific styles:

```ts
{
  variants: { size: 'md' },
  style: {
    width: '20px',
    selectors: {
      '&:hover': { transform: 'scale(1.1)' },  // Only keys from selectorGenerators allowed
    },
  },
}
```

## Type Safety

- **Variant names and values** are inferred from your recipe — typos are caught at compile time
- **Selector keys** in `style.selectors` are constrained to keys defined in `selectorGenerators`

## Edge Cases

### Empty compoundVariants

If you only need base styles without variant-specific styles, pass an empty array or omit `compoundVariants`:

```ts
globalRecipe({
  recipe: buttonStyle,
  selectorGenerators: { "&": (v) => `${v} svg` },
  base: { fill: "currentColor" },
  compoundVariants: [], // or just omit this property
});
```

### Multiple variants in one compound

When specifying multiple variants, the generated selector combines all variant classes:

```ts
compoundVariants: [
  {
    variants: { size: "sm", variant: "primary" },
    style: {
      /* applies to .size_sm.variant_primary */
    },
  },
];
```

### Undefined variant values

Variant values set to `undefined` are ignored when building selectors:

```ts
compoundVariants: [
  {
    variants: { size: "sm", variant: undefined },
    style: {
      /* applies only to .size_sm */
    },
  },
];
```

## How It Works

1. Reads the recipe's internal `classNames.variants` map
2. Builds CSS class selectors from variant combinations (e.g., `.button_size_md.button_hierarchy_primary`)
3. Passes these to your selector generators to create full selectors
4. Calls vanilla-extract's `globalStyle` for each selector/style pair

## License

MIT
