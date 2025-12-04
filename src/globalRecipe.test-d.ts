import { describe, it } from "vitest";
import { globalRecipe } from "./globalRecipe";
import type { RuntimeFn } from "@vanilla-extract/recipes";

// Mock recipe type helper
type VariantDefinitions = Record<string, string>;
type VariantGroups = Record<string, VariantDefinitions>;

const createMockRecipe = <Variants extends VariantGroups>(options: { base: string; variants: Variants }) => {
  const fn = () => "";
  fn.variants = () => Object.keys(options.variants);
  fn.classNames = {
    base: options.base,
    variants: options.variants,
  };
  return fn as RuntimeFn<Variants>;
};

describe("globalRecipe types", () => {
  describe("variant type safety", () => {
    it("accepts valid variant names", () => {
      const buttonRecipe = createMockRecipe({
        base: "button",
        variants: {
          size: { sm: "size_sm", md: "size_md", lg: "size_lg" },
          color: { primary: "color_primary", secondary: "color_secondary" },
        },
      });

      // This should compile without errors
      globalRecipe({
        recipe: buttonRecipe,
        selectorGenerators: { "&": (v) => `${v} svg` },
        compoundVariants: [
          { variants: { size: "sm" }, style: {} },
          { variants: { color: "primary" }, style: {} },
          { variants: { size: "md", color: "secondary" }, style: {} },
        ],
      });
    });

    it("rejects invalid variant names", () => {
      const buttonRecipe = createMockRecipe({
        base: "button",
        variants: {
          size: { sm: "size_sm", md: "size_md" },
        },
      });

      globalRecipe({
        recipe: buttonRecipe,
        selectorGenerators: { "&": (v) => `${v} svg` },
        compoundVariants: [
          {
            variants: {
              // @ts-expect-error - "invalid" is not a valid variant name
              invalid: "value",
            },
            style: {},
          },
        ],
      });
    });

    it("rejects invalid variant values", () => {
      const buttonRecipe = createMockRecipe({
        base: "button",
        variants: {
          size: { sm: "size_sm", md: "size_md" },
        },
      });

      globalRecipe({
        recipe: buttonRecipe,
        selectorGenerators: { "&": (v) => `${v} svg` },
        compoundVariants: [
          {
            variants: {
              // @ts-expect-error - "xl" is not a valid size value
              size: "xl",
            },
            style: {},
          },
        ],
      });
    });

    it("accepts boolean variants with boolean values", () => {
      const buttonRecipe = createMockRecipe({
        base: "button",
        variants: {
          disabled: { true: "disabled_true", false: "disabled_false" },
        },
      });

      // Boolean values should work for "true"/"false" variant keys
      globalRecipe({
        recipe: buttonRecipe,
        selectorGenerators: { "&": (v) => `${v} svg` },
        compoundVariants: [
          { variants: { disabled: true }, style: {} },
          { variants: { disabled: false }, style: {} },
        ],
      });
    });
  });

  describe("selector type safety", () => {
    it("accepts valid selector keys", () => {
      const buttonRecipe = createMockRecipe({
        base: "button",
        variants: {
          size: { sm: "size_sm" },
        },
      });

      globalRecipe({
        recipe: buttonRecipe,
        selectorGenerators: {
          "&": (v) => `${v} svg`,
          "&:hover": (v) => `${v}:hover svg`,
          "&:disabled": (v) => `${v}:disabled svg`,
        },
        base: {
          fill: "currentColor",
          selectors: {
            "&:hover": { fill: "blue" },
            "&:disabled": { opacity: 0.5 },
          },
        },
        compoundVariants: [
          {
            variants: { size: "sm" },
            style: {
              width: "16px",
              selectors: {
                "&:hover": { transform: "scale(1.1)" },
              },
            },
          },
        ],
      });
    });

    it("rejects invalid selector keys", () => {
      const buttonRecipe = createMockRecipe({
        base: "button",
        variants: {
          size: { sm: "size_sm" },
        },
      });

      globalRecipe({
        recipe: buttonRecipe,
        selectorGenerators: {
          "&": (v) => `${v} svg`,
          "&:hover": (v) => `${v}:hover svg`,
        },
        base: {
          selectors: {
            // @ts-expect-error - "&:focus" is not defined in selectorGenerators
            "&:focus": { outline: "none" },
          },
        },
        compoundVariants: [
          {
            variants: { size: "sm" },
            style: {
              selectors: {
                // @ts-expect-error - "&:disabled" is not defined in selectorGenerators
                "&:disabled": { outline: "solid" },
              },
            },
          },
        ],
      });
    });

    it("does not allow & in selectors (it is the base selector)", () => {
      const buttonRecipe = createMockRecipe({
        base: "button",
        variants: {
          size: { sm: "size_sm" },
        },
      });

      globalRecipe({
        recipe: buttonRecipe,
        selectorGenerators: {
          "&": (v) => `${v} svg`,
          "&:hover": (v) => `${v}:hover svg`,
        },
        base: {
          selectors: {
            // @ts-expect-error - "&" should not be allowed in selectors
            "&": { fill: "red" },
          },
        },
        compoundVariants: [
          {
            variants: { size: "sm" },
            style: {
              selectors: {
                // @ts-expect-error - "&" should not be allowed in selectors
                "&": { fill: "blue" },
              },
            },
          },
        ],
      });
    });
  });

  describe("selectorGenerators type safety", () => {
    it("requires & selector generator", () => {
      const buttonRecipe = createMockRecipe({
        base: "button",
        variants: {},
      });

      globalRecipe({
        recipe: buttonRecipe,
        // @ts-expect-error - missing required "&" selector generator
        selectorGenerators: {
          "&:hover": (v) => `${v}:hover svg`,
        },
      });
    });
  });
});
