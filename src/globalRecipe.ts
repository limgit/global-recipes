import { ComplexStyleRule, globalStyle } from "@vanilla-extract/css";
import { type RuntimeFn } from "@vanilla-extract/recipes";

/* Types excerpted from `@vanilla-extract/recipes`*/
type RecipeStyleRule = ComplexStyleRule | string;
type VariantDefinitions = Record<string, RecipeStyleRule>;
type BooleanMap<T> = T extends "true" | "false" ? boolean : T;
type VariantGroups = Record<string, VariantDefinitions>;
type VariantSelection<Variants extends VariantGroups> = {
  [VariantGroup in keyof Variants]?: BooleanMap<keyof Variants[VariantGroup]> | undefined;
};
/* End of excerption */

type GlobalStyleRule = Parameters<typeof globalStyle>[1];
type ExtractVariantGroups<T> = T extends RuntimeFn<infer V> ? V : never;

type SelectorGenerators = Record<string, (variantSelector: string) => string>;
type StyleRuleWithSelectors<TSelectors extends string> = GlobalStyleRule & {
  selectors?: Partial<Record<Exclude<TSelectors, "&">, GlobalStyleRule>>;
};

export interface GlobalRecipeOptions<TRecipe extends RuntimeFn<VariantGroups>, TGenerators extends SelectorGenerators> {
  /** The vanilla-extract recipe function */
  recipe: TRecipe;
  /**
   * Keyed selector generators - an object mapping selector keys to generator functions.
   * Each function receives the variant class selector and returns the full CSS selector.
   * The "&" key is used for base styles (required).
   *
   * @example
   * // Simple case: styling SVG children
   * selectorGenerators: {
   *   "&": (v) => `${v} svg`,
   * }
   *
   * @example
   * // Complex case: checkbox with pseudo-selectors
   * selectorGenerators: {
   *   "&": (v) => `${v} input + div`,
   *   "&:checked": (v) => `${v} input:checked + div`,
   *   "&:focus": (v) => `${v}:focus input + div`,
   *   "&:disabled": (v) => `${v} input:disabled + div`,
   * }
   */
  selectorGenerators: TGenerators & {
    "&": (variantSelector: string) => string;
  };
  /** Base styles to apply to all elements matching the selectors (uses recipe's base class) */
  base?: StyleRuleWithSelectors<keyof TGenerators & string>;
  /** Array of compound variant definitions with styles */
  compoundVariants?: {
    variants: VariantSelection<ExtractVariantGroups<TRecipe>>;
    style: StyleRuleWithSelectors<keyof TGenerators & string>;
  }[];
}

/**
 * Builds a CSS class name selector string from recipe variant values.
 *
 * @param recipe - The vanilla-extract recipe function
 * @param variants - Object mapping variant names to their values
 * @returns A dot-joined class name string for use in CSS selectors
 *
 * @example
 * const selector = buildVariantSelector(buttonStyle, { size: "md", iconOnly: true });
 * // Returns something like ".button_size_md.button_iconOnly_true"
 */
function buildVariantSelector<TRecipe extends RuntimeFn<VariantGroups>>(
  recipe: TRecipe,
  variants: VariantSelection<ExtractVariantGroups<TRecipe>>,
): string {
  const classNames = recipe.classNames.variants;
  const parts: string[] = [];

  for (const [variantName, variantValue] of Object.entries(variants)) {
    if (variantValue === undefined) continue;

    const variantClassNames = classNames[variantName];
    if (!variantClassNames) continue;

    const key = typeof variantValue === "boolean" ? (variantValue ? "true" : "false") : variantValue;
    const className = variantClassNames[key];
    if (className) {
      parts.push(`.${className}`);
    }
  }

  return parts.join("");
}

/**
 * Applies global CSS styles based on recipe variant classes.
 *
 * Like `globalStyle`, but generates styles for each recipe variant combination.
 * Use selector generators to target any elements - children, siblings, pseudo-states, etc.
 *
 * Features:
 * - Type-safe variant names and values (inferred from recipe)
 * - Type-safe selector keys (constrained to defined generators)
 * - Flexible selector generation for any styling pattern
 *
 * @example
 * // Styling child SVG icons inside buttons
 * globalRecipe({
 *   recipe: buttonStyle,
 *   selectorGenerators: {
 *     "&": (v) => `${v} svg`,
 *   },
 *   base: { pointerEvents: "none", flexShrink: 0 },
 *   compoundVariants: [
 *     { variants: { size: "sm" }, style: { width: "16px", height: "16px" } },
 *     { variants: { size: "md" }, style: { width: "20px", height: "20px" } },
 *   ],
 * });
 *
 * @example
 * // Styling checkbox with input state selectors
 * globalRecipe({
 *   recipe: checkboxRootStyle,
 *   selectorGenerators: {
 *     "&": (v) => `${v} input + div`,
 *     "&:checked": (v) => `${v} input:checked + div`,
 *     "&:focus": (v) => `${v}:focus input + div`,
 *     "&:disabled": (v) => `${v} input:disabled + div`,
 *   },
 *   base: {
 *     display: "flex",
 *     alignItems: "center",
 *     selectors: {
 *       "&:disabled": { opacity: 0.5, cursor: "not-allowed" },
 *     },
 *   },
 *   compoundVariants: [
 *     {
 *       variants: { variant: "checkbox" },
 *       style: {
 *         borderRadius: "4px",
 *         selectors: {
 *           "&:checked": { background: "blue" },  // Type-safe: only defined keys allowed
 *           "&:focus": { boxShadow: "0 0 0 2px blue" },
 *         },
 *       },
 *     },
 *   ],
 * });
 */
export function globalRecipe<TRecipe extends RuntimeFn<VariantGroups>, TGenerators extends SelectorGenerators>({
  recipe,
  selectorGenerators,
  base,
  compoundVariants,
}: GlobalRecipeOptions<TRecipe, TGenerators>): void {
  const applyStyle = (classSelector: string, style: StyleRuleWithSelectors<keyof TGenerators & string>) => {
    const { selectors, ...properties } = style;

    if (Object.keys(properties).length > 0) {
      globalStyle(selectorGenerators["&"](classSelector), properties);
    }

    if (selectors) {
      for (const [selectorKey, selectorStyle] of Object.entries(selectors)) {
        const generator = selectorGenerators[selectorKey];
        if (generator && selectorStyle) {
          globalStyle(generator(classSelector), selectorStyle);
        }
      }
    }
  };

  if (base) {
    applyStyle(`.${recipe.classNames.base}`, base);
  }

  compoundVariants?.forEach(({ variants, style }) => {
    const variantSelector = buildVariantSelector(recipe, variants);
    if (variantSelector) {
      applyStyle(variantSelector, style);
    }
  });
}
