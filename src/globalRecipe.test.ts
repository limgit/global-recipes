import { describe, it, expect, vi, beforeEach } from "vitest";
import { globalRecipe } from "./globalRecipe";
import type { RuntimeFn } from "@vanilla-extract/recipes";

// Mock globalStyle function to capture and test the passed arguments
vi.mock("@vanilla-extract/css", () => ({
  globalStyle: vi.fn(),
}));

import { globalStyle } from "@vanilla-extract/css";

const mockGlobalStyle = vi.mocked(globalStyle);

// Instead of style rule, class names will be defined
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

describe("globalRecipe", () => {
  beforeEach(() => {
    mockGlobalStyle.mockClear();
  });

  describe("base styles", () => {
    it("applies base styles using the & selector generator", () => {
      const buttonRecipe = createMockRecipe({
        base: "button_base",
        variants: {
          size: { sm: "button_size_sm", md: "button_size_md" },
        },
      });

      globalRecipe({
        recipe: buttonRecipe,
        selectorGenerators: {
          "&": (v) => `${v} svg`,
        },
        base: {
          pointerEvents: "none",
          flexShrink: 0,
        },
      });

      expect(mockGlobalStyle).toHaveBeenCalledWith(".button_base svg", {
        pointerEvents: "none",
        flexShrink: 0,
      });
    });

    it("applies base styles with selectors", () => {
      const checkboxRecipe = createMockRecipe({
        base: "checkbox_base",
        variants: {},
      });

      globalRecipe({
        recipe: checkboxRecipe,
        selectorGenerators: {
          "&": (v) => `${v} input + div`,
          "&:disabled": (v) => `${v} input:disabled + div`,
        },
        base: {
          display: "flex",
          selectors: {
            "&:disabled": { opacity: 0.5 },
          },
        },
      });

      expect(mockGlobalStyle).toHaveBeenCalledTimes(2);
      expect(mockGlobalStyle).toHaveBeenCalledWith(".checkbox_base input + div", { display: "flex" });
      expect(mockGlobalStyle).toHaveBeenCalledWith(".checkbox_base input:disabled + div", { opacity: 0.5 });
    });

    it("does not call globalStyle when base is not provided", () => {
      const buttonRecipe = createMockRecipe({
        base: "button_base",
        variants: {
          size: { sm: "button_size_sm" },
        },
      });

      globalRecipe({
        recipe: buttonRecipe,
        selectorGenerators: {
          "&": (v) => `${v} svg`,
        },
      });

      expect(mockGlobalStyle).not.toHaveBeenCalled();
    });
  });

  describe("compound variants", () => {
    it("applies styles for single variant", () => {
      const buttonRecipe = createMockRecipe({
        base: "button_base",
        variants: {
          size: { sm: "button_size_sm", md: "button_size_md" },
        },
      });

      globalRecipe({
        recipe: buttonRecipe,
        selectorGenerators: {
          "&": (v) => `${v} svg`,
        },
        compoundVariants: [
          { variants: { size: "sm" }, style: { width: "16px" } },
          { variants: { size: "md" }, style: { width: "20px" } },
        ],
      });

      expect(mockGlobalStyle).toHaveBeenCalledTimes(2);
      expect(mockGlobalStyle).toHaveBeenCalledWith(".button_size_sm svg", {
        width: "16px",
      });
      expect(mockGlobalStyle).toHaveBeenCalledWith(".button_size_md svg", {
        width: "20px",
      });
    });

    it("applies styles for multiple variants combined", () => {
      const buttonRecipe = createMockRecipe({
        base: "button_base",
        variants: {
          size: { sm: "button_size_sm", md: "button_size_md" },
          variant: { primary: "button_variant_primary" },
        },
      });

      globalRecipe({
        recipe: buttonRecipe,
        selectorGenerators: {
          "&": (v) => `${v} svg`,
        },
        compoundVariants: [
          {
            variants: { size: "sm", variant: "primary" },
            style: { fill: "white" },
          },
        ],
      });

      expect(mockGlobalStyle).toHaveBeenCalledWith(".button_size_sm.button_variant_primary svg", { fill: "white" });
    });

    it("applies compound variant styles with selectors", () => {
      const checkboxRecipe = createMockRecipe({
        base: "checkbox_base",
        variants: {
          variant: { checkbox: "checkbox_variant_checkbox" },
        },
      });

      globalRecipe({
        recipe: checkboxRecipe,
        selectorGenerators: {
          "&": (v) => `${v} input + div`,
          "&:checked": (v) => `${v} input:checked + div`,
        },
        compoundVariants: [
          {
            variants: { variant: "checkbox" },
            style: {
              borderRadius: "4px",
              selectors: {
                "&:checked": { background: "blue" },
              },
            },
          },
        ],
      });

      expect(mockGlobalStyle).toHaveBeenCalledTimes(2);
      expect(mockGlobalStyle).toHaveBeenCalledWith(".checkbox_variant_checkbox input + div", { borderRadius: "4px" });
      expect(mockGlobalStyle).toHaveBeenCalledWith(".checkbox_variant_checkbox input:checked + div", {
        background: "blue",
      });
    });

    it("handles boolean variants", () => {
      const buttonRecipe = createMockRecipe({
        base: "button_base",
        variants: {
          disabled: {
            true: "button_disabled_true",
            false: "button_disabled_false",
          },
        },
      });

      globalRecipe({
        recipe: buttonRecipe,
        selectorGenerators: {
          "&": (v) => `${v} svg`,
        },
        compoundVariants: [
          { variants: { disabled: true }, style: { opacity: 0.5 } },
          { variants: { disabled: false }, style: { opacity: 1 } },
        ],
      });

      expect(mockGlobalStyle).toHaveBeenCalledWith(".button_disabled_true svg", {
        opacity: 0.5,
      });
      expect(mockGlobalStyle).toHaveBeenCalledWith(".button_disabled_false svg", { opacity: 1 });
    });

    it("skips variants with undefined values", () => {
      const buttonRecipe = createMockRecipe({
        base: "button_base",
        variants: {
          size: { sm: "button_size_sm" },
          variant: { primary: "button_variant_primary" },
        },
      });

      globalRecipe({
        recipe: buttonRecipe,
        selectorGenerators: {
          "&": (v) => `${v} svg`,
        },
        compoundVariants: [
          {
            variants: { size: "sm", variant: undefined },
            style: { width: "16px" },
          },
        ],
      });

      expect(mockGlobalStyle).toHaveBeenCalledWith(".button_size_sm svg", {
        width: "16px",
      });
    });

    it("skips compound variants with empty selector result", () => {
      const buttonRecipe = createMockRecipe({
        base: "button_base",
        variants: {
          size: { sm: "button_size_sm" },
        },
      });

      globalRecipe({
        recipe: buttonRecipe,
        selectorGenerators: {
          "&": (v) => `${v} svg`,
        },
        compoundVariants: [{ variants: {}, style: { width: "16px" } }],
      });

      expect(mockGlobalStyle).not.toHaveBeenCalled();
    });
  });

  describe("base and compound variants together", () => {
    it("applies both base and compound variant styles", () => {
      const buttonRecipe = createMockRecipe({
        base: "button_base",
        variants: {
          size: { sm: "button_size_sm", md: "button_size_md" },
        },
      });

      globalRecipe({
        recipe: buttonRecipe,
        selectorGenerators: {
          "&": (v) => `${v} svg`,
        },
        base: {
          pointerEvents: "none",
        },
        compoundVariants: [{ variants: { size: "sm" }, style: { width: "16px" } }],
      });

      expect(mockGlobalStyle).toHaveBeenCalledTimes(2);
      expect(mockGlobalStyle).toHaveBeenCalledWith(".button_size_sm svg", {
        width: "16px",
      });
      expect(mockGlobalStyle).toHaveBeenCalledWith(".button_base svg", {
        pointerEvents: "none",
      });
    });
  });

  describe("advanced globalStyle properties", () => {
    it("passes through at-rules (@layer, @media, @supports, etc.)", () => {
      const buttonRecipe = createMockRecipe({
        base: "button_base",
        variants: {
          size: { sm: "button_size_sm" },
        },
      });

      globalRecipe({
        recipe: buttonRecipe,
        selectorGenerators: {
          "&": (v) => `${v} svg`,
          "&:hover": (v) => `${v}:hover svg`,
        },
        base: {
          width: "20px",
          "@layer": {
            utilities: {
              fill: "currentColor",
            },
          },
          "@media": {
            "(prefers-reduced-motion: reduce)": {
              transition: "none",
            },
          },
          "@supports": {
            "(aspect-ratio: 1)": {
              aspectRatio: "1",
            },
          },
          selectors: {
            "&:hover": {
              fill: "blue",
              "@media": {
                "(prefers-reduced-motion: no-preference)": {
                  transition: "fill 0.2s",
                },
              },
            },
          },
        },
        compoundVariants: [
          {
            variants: { size: "sm" },
            style: {
              width: "16px",
              "@media": {
                "(min-width: 768px)": {
                  width: "20px",
                },
              },
              selectors: {
                "&:hover": {
                  transform: "scale(1.1)",
                },
              },
            },
          },
        ],
      });

      expect(mockGlobalStyle).toHaveBeenCalledTimes(4);
      expect(mockGlobalStyle).toHaveBeenCalledWith(".button_base svg", {
        width: "20px",
        "@layer": {
          utilities: {
            fill: "currentColor",
          },
        },
        "@media": {
          "(prefers-reduced-motion: reduce)": {
            transition: "none",
          },
        },
        "@supports": {
          "(aspect-ratio: 1)": {
            aspectRatio: "1",
          },
        },
      });
      expect(mockGlobalStyle).toHaveBeenCalledWith(".button_base:hover svg", {
        fill: "blue",
        "@media": {
          "(prefers-reduced-motion: no-preference)": {
            transition: "fill 0.2s",
          },
        },
      });
      expect(mockGlobalStyle).toHaveBeenCalledWith(".button_size_sm svg", {
        width: "16px",
        "@media": {
          "(min-width: 768px)": {
            width: "20px",
          },
        },
      });
      expect(mockGlobalStyle).toHaveBeenCalledWith(".button_size_sm:hover svg", {
        transform: "scale(1.1)",
      });
    });
  });
});
