// Design System Constants
// Color Palette and Typography Standards

export const colors = {
  primary: {
    dark: '#1b5b40',
    darker: '#0e321e',
    forest: '#0d3a27',
  },
  neutral: {
    beige: '#d2cbb8',
    light: '#ebe7dc',
  },
  accent: {
    gold: '#b39a5b',
    teal: '#4ab7a7',
  },
} as const;

export const fonts = {
  rubriker: ['Helvetica Neue', 'Arial', 'sans-serif'],
  underrubriker: ['Open Sans', 'sans-serif'],
  textPrimary: ['Playfair Display', 'serif'],
  textSecondary: ['Cormorant Garamond', 'serif'],
} as const;

export const typography = {
  // Headers (Rubriker)
  heading: {
    primary: 'font-rubriker text-2xl font-bold text-primary-dark leading-tight',
    secondary: 'font-rubriker text-xl font-semibold text-primary-forest leading-tight',
  },
  // Subheaders (Underrubriker)
  subheading: {
    default: 'font-underrubriker text-base font-medium text-primary-dark leading-relaxed',
    small: 'font-underrubriker text-sm font-medium text-primary-forest leading-relaxed',
  },
  // Body text
  body: {
    primary: 'font-text-primary text-sm text-primary-dark leading-relaxed',
    secondary: 'font-text-secondary text-sm text-primary-forest leading-relaxed',
  },
} as const;

export const components = {
  // Button styles
  button: {
    primary: 'btn-primary',
    secondary: 'btn-secondary',
    accent: 'btn-accent',
    gold: 'btn-gold',
  },
  // Card styles
  card: {
    container: 'card',
    header: 'card-header',
    body: 'card-body',
    footer: 'card-footer',
  },
  // Alert styles
  alert: {
    success: 'alert-success',
    warning: 'alert-warning',
    error: 'alert-error',
    info: 'alert-info',
  },
  // Form styles
  form: {
    group: 'form-group',
    label: 'form-label',
    input: 'form-input',
  },
} as const;

export const spacing = {
  xs: '0.25rem',
  sm: '0.5rem',
  md: '1rem',
  lg: '1.5rem',
  xl: '2rem',
  '2xl': '3rem',
  '3xl': '4rem',
} as const;

export const shadows = {
  sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  default: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
  md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
} as const;

// Utility functions
export const getColor = (path: string) => {
  const keys = path.split('.');
  let result: any = colors;
  for (const key of keys) {
    result = result[key];
  }
  return result;
};

export const getTypographyClass = (type: 'heading' | 'subheading' | 'body', variant?: string) => {
  const typeObj = typography[type] as any;
  return variant ? typeObj[variant] : typeObj.default || typeObj.primary;
};