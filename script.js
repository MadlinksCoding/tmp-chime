tailwind.config = {
  darkMode: "class",
  theme: {
    screens: {
      sm: "30rem",
      md: "48rem",
      lg: "64rem",
      xl: "80rem",
      "2xl": "96rem",
    },
 
    fontFamily: {
      primary: ["var(--font-primary)"],
    },
 
    fontSize: {
      xs: "var(--font-size-xs)",
      sm: "var(--font-size-sm)",
      base: "var(--font-size-base)",
      lg: "var(--font-size-lg)",
      xl: "var(--font-size-xl)",
      "2xl": "var(--font-size-2xl)",
    },
 
    fontWeight: {
      normal: "var(--font-weight-normal)",
      medium: "var(--font-weight-medium)",
      semibold: "var(--font-weight-semibold)",
      bold: "var(--font-weight-bold)",
    },
 
    lineHeight: {
      tight: "var(--line-height-tight)",
      base: "var(--line-height-base)",
      relaxed: "var(--line-height-relaxed)",
    },
 
    spacing: {
      0: "var(--space-0)",
      1: "var(--space-1)",
      2: "var(--space-2)",
      3: "var(--space-3)",
      4: "var(--space-4)",
      5: "var(--space-5)",
      6: "var(--space-6)",
      8: "var(--space-8)",
      10: "var(--space-10)",
      12: "var(--space-12)",
      16: "var(--space-16)",
      20: "var(--space-20)",
      24: "var(--space-24)",
 
      17: "6.8rem",
      40: "40rem",
      11: "4.4rem",
    },
 
    container: {
      center: true,
      padding: "var(--space-4)",
      screens: {
        sm: "30rem",
        md: "48rem",
        lg: "64rem",
        xl: "80rem",
        "2xl": "var(--container-max-width)",
      },
    },
 
    extend: {

      screens: {
        // name: 'mobile-landscape' (use any name you like)
        'mobile-landscape': { 'raw': '(max-width: 932px) and (orientation: landscape)' }
      },
      // ===== COLOR SYSTEM =====
      colors: {
        // Brand colors
        brand: {
          primary: "hsl(var(--color-brand-primary))",
          dark: "hsl(var(--color-brand-dark))",
        },
 
        // Neutral colors
        white: "hsl(var(--color-white))",
        black: "hsl(var(--color-black))",
        gray: {
          50: "hsl(var(--color-gray-50))",
          200: "hsl(var(--color-gray-200))",
          600: "hsl(var(--color-gray-600))",
          950: "hsl(var(--color-gray-950))",
        },
 
        border: "hsl(var(--border))",
        input: "hsl(var(--border))",
        ring: "hsl(var(--color-brand-primary))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--color-gray-200))",
          foreground: "hsl(var(--color-gray-950))",
        },
        muted: {
          DEFAULT: "hsl(var(--color-gray-200))",
          foreground: "hsl(var(--color-gray-600))",
        },
        accent: {
          DEFAULT: "hsl(var(--color-gray-200))",
          foreground: "hsl(var(--color-gray-950))",
        },
        popover: {
          DEFAULT: "hsl(var(--background))",
          foreground: "hsl(var(--foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--background))",
          foreground: "hsl(var(--foreground))",
        },
      },
 
      // ===== BORDER RADIUS =====
      borderRadius: {
        card: "var(--card-radius)",
        "card-sm": "var(--card-radius-sm)",
        "card-xs": "var(--card-radius-xs)",
        pill: "var(--btn-radius)",
        control: "var(--control-radius)",
        'blob-1': '25% 75% 50% 51% / 45% 65% 36% 55%',
        // Legacy
        lg: "var(--radius)",
        md: "calc(var(--radius) - 0.2rem)",
        sm: "calc(var(--radius) - 0.4rem)",
      },
 
      // ===== SHADOWS =====
      boxShadow: {
        control: "var(--shadow-control)",
        button: "var(--shadow-button)",
        'soft-black': '0 0 6.776px 0 rgba(0, 0, 0, 0.25)',
      },
 
      dropShadow: {
        icon: "var(--shadow-icon)",
      },
 
      backdropBlur: {
        sm: "var(--backdrop-blur-sm)",
        lg: "var(--backdrop-blur-lg)",
      },
 
      width: {
        sidebar: "var(--sidebar-width)",
      },
 
      height: {
        control: "var(--control-size)",
      },
 
      keyframes: {
        "accordion-down": {
          from: {
            height: "0",
          },
          to: {
            height: "var(--radix-accordion-content-height)",
          },
        },
        "accordion-up": {
          from: {
            height: "var(--radix-accordion-content-height)",
          },
          to: {
            height: "0",
          },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
};