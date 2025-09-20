import { DesignProject, DesignAsset } from '@/models/design-automation';

export interface WireframeElement {
  id: string;
  type: 'rectangle' | 'text' | 'image' | 'button' | 'input' | 'icon' | 'line' | 'circle';
  position: { x: number; y: number };
  size: { width: number; height: number };
  properties: Record<string, any>;
  children?: WireframeElement[];
}

export interface DesignToken {
  name: string;
  value: string | number;
  category: 'color' | 'typography' | 'spacing' | 'border' | 'shadow' | 'animation';
  description?: string;
}

export interface ComponentLibrary {
  name: string;
  version: string;
  components: Array<{
    name: string;
    type: string;
    variants: string[];
    props: Record<string, any>;
    styles: Record<string, any>;
  }>;
}

export interface AccessibilityReport {
  score: number;
  issues: Array<{
    type: 'error' | 'warning' | 'info';
    element: string;
    description: string;
    wcag: string;
    fix: string;
  }>;
  recommendations: string[];
}

export interface ResponsiveBreakpoint {
  name: 'mobile' | 'tablet' | 'desktop' | 'wide';
  minWidth: number;
  maxWidth?: number;
  mediaQuery: string;
}

export interface MicroInteraction {
  name: string;
  trigger: 'hover' | 'click' | 'focus' | 'scroll' | 'load';
  animation: {
    property: string;
    duration: number;
    easing: string;
    keyframes: Array<{
      percentage: number;
      value: string | number;
    }>;
  };
  states: {
    initial: Record<string, any>;
    active: Record<string, any>;
    final: Record<string, any>;
  };
}

export class UIUXGenerator {
  private designTokens: DesignToken[] = [];
  private componentLibrary!: ComponentLibrary;
  private breakpoints: ResponsiveBreakpoint[] = [
    { name: 'mobile', minWidth: 0, maxWidth: 767, mediaQuery: '(max-width: 767px)' },
    { name: 'tablet', minWidth: 768, maxWidth: 1023, mediaQuery: '(min-width: 768px) and (max-width: 1023px)' },
    { name: 'desktop', minWidth: 1024, maxWidth: 1279, mediaQuery: '(min-width: 1024px) and (max-width: 1279px)' },
    { name: 'wide', minWidth: 1280, mediaQuery: '(min-width: 1280px)' },
  ];

  constructor() {
    this.initializeDesignTokens();
    this.initializeComponentLibrary();
  }

  private initializeDesignTokens() {
    // Color tokens
    this.designTokens.push(
      { name: 'primary-50', value: '#f0f9ff', category: 'color', description: 'Primary color lightest shade' },
      { name: 'primary-100', value: '#e0f2fe', category: 'color', description: 'Primary color light shade' },
      { name: 'primary-500', value: '#0ea5e9', category: 'color', description: 'Primary color base' },
      { name: 'primary-900', value: '#0c4a6e', category: 'color', description: 'Primary color dark shade' },
      { name: 'gray-50', value: '#f9fafb', category: 'color', description: 'Gray lightest shade' },
      { name: 'gray-900', value: '#111827', category: 'color', description: 'Gray darkest shade' },
    );

    // Typography tokens
    this.designTokens.push(
      { name: 'font-family-base', value: 'Inter, system-ui, sans-serif', category: 'typography' },
      { name: 'font-size-xs', value: '0.75rem', category: 'typography' },
      { name: 'font-size-base', value: '1rem', category: 'typography' },
      { name: 'font-size-lg', value: '1.125rem', category: 'typography' },
      { name: 'font-weight-normal', value: 400, category: 'typography' },
      { name: 'font-weight-medium', value: 500, category: 'typography' },
      { name: 'font-weight-bold', value: 700, category: 'typography' },
      { name: 'line-height-tight', value: 1.25, category: 'typography' },
      { name: 'line-height-normal', value: 1.5, category: 'typography' },
      { name: 'line-height-relaxed', value: 1.75, category: 'typography' },
    );

    // Spacing tokens
    this.designTokens.push(
      { name: 'space-1', value: '0.25rem', category: 'spacing' },
      { name: 'space-2', value: '0.5rem', category: 'spacing' },
      { name: 'space-4', value: '1rem', category: 'spacing' },
      { name: 'space-8', value: '2rem', category: 'spacing' },
      { name: 'space-16', value: '4rem', category: 'spacing' },
    );

    // Border tokens
    this.designTokens.push(
      { name: 'border-radius-sm', value: '0.25rem', category: 'border' },
      { name: 'border-radius-md', value: '0.375rem', category: 'border' },
      { name: 'border-radius-lg', value: '0.5rem', category: 'border' },
      { name: 'border-width', value: '1px', category: 'border' },
    );

    // Shadow tokens
    this.designTokens.push(
      { name: 'shadow-sm', value: '0 1px 2px 0 rgb(0 0 0 / 0.05)', category: 'shadow' },
      { name: 'shadow-md', value: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)', category: 'shadow' },
      { name: 'shadow-lg', value: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)', category: 'shadow' },
    );

    // Animation tokens
    this.designTokens.push(
      { name: 'duration-fast', value: 150, category: 'animation' },
      { name: 'duration-normal', value: 300, category: 'animation' },
      { name: 'duration-slow', value: 500, category: 'animation' },
      { name: 'easing-ease-in-out', value: 'cubic-bezier(0.4, 0, 0.2, 1)', category: 'animation' },
      { name: 'easing-ease-out', value: 'cubic-bezier(0, 0, 0.2, 1)', category: 'animation' },
    );
  }

  private initializeComponentLibrary() {
    this.componentLibrary = {
      name: 'Shin Design System',
      version: '1.0.0',
      components: [
        {
          name: 'Button',
          type: 'button',
          variants: ['primary', 'secondary', 'outline', 'ghost'],
          props: {
            size: ['sm', 'md', 'lg'],
            disabled: false,
            loading: false,
          },
          styles: {
            base: {
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 'var(--border-radius-md)',
              fontWeight: 'var(--font-weight-medium)',
              transition: 'all var(--duration-fast) var(--easing-ease-out)',
            },
          },
        },
        {
          name: 'Input',
          type: 'input',
          variants: ['default', 'error', 'success'],
          props: {
            type: 'text',
            placeholder: '',
            disabled: false,
            required: false,
          },
          styles: {
            base: {
              width: '100%',
              padding: 'var(--space-2) var(--space-4)',
              border: 'var(--border-width) solid var(--gray-300)',
              borderRadius: 'var(--border-radius-md)',
              fontSize: 'var(--font-size-base)',
              lineHeight: 'var(--line-height-normal)',
            },
          },
        },
        {
          name: 'Card',
          type: 'card',
          variants: ['default', 'elevated', 'outlined'],
          props: {
            padding: 'md',
            shadow: 'md',
          },
          styles: {
            base: {
              backgroundColor: 'white',
              borderRadius: 'var(--border-radius-lg)',
              overflow: 'hidden',
            },
          },
        },
      ],
    };
  }

  // Convert wireframe to high-fidelity design
  async convertWireframeToHighFidelity(
    wireframeData: WireframeElement[],
    options: {
      style?: 'modern' | 'minimal' | 'classic' | 'bold';
      colorScheme?: 'light' | 'dark' | 'auto';
      includeAnimations?: boolean;
    } = {}
  ): Promise<{
    html: string;
    css: string;
    designTokens: DesignToken[];
    components: any[];
  }> {
    const { style = 'modern', colorScheme = 'light', includeAnimations = true } = options;

    // Generate design tokens based on style
    const tokens = this.generateDesignTokensForStyle(style, colorScheme);

    // Convert wireframe elements to components
    const components = this.convertElementsToComponents(wireframeData, style);

    // Generate HTML structure
    const html = this.generateHTML(components, wireframeData);

    // Generate CSS with design system
    const css = this.generateCSS(tokens, components, style, includeAnimations);

    return {
      html,
      css,
      designTokens: tokens,
      components,
    };
  }

  // Generate design system
  async generateDesignSystem(
    brandColors: string[],
    typographyPreferences: any,
    spacingScale: number[] = [4, 8, 16, 24, 32, 48, 64]
  ): Promise<{
    designTokens: DesignToken[];
    componentLibrary: ComponentLibrary;
    styleGuide: any;
  }> {
    // Generate comprehensive design tokens
    const tokens = this.generateComprehensiveDesignTokens(brandColors, typographyPreferences, spacingScale);

    // Update component library with new tokens
    const updatedLibrary = this.updateComponentLibraryWithTokens(tokens);

    // Generate style guide
    const styleGuide = this.generateStyleGuide(tokens, updatedLibrary);

    return {
      designTokens: tokens,
      componentLibrary: updatedLibrary,
      styleGuide,
    };
  }

  // Optimize for accessibility
  async optimizeAccessibility(
    html: string,
    css: string
  ): Promise<{
    optimizedHtml: string;
    optimizedCss: string;
    report: AccessibilityReport;
  }> {
    // Analyze current accessibility
    const issues = this.analyzeAccessibilityIssues(html, css);

    // Generate optimized versions
    const optimizedHtml = this.applyAccessibilityFixes(html, issues);
    const optimizedCss = this.addAccessibilityEnhancements(css);

    // Create comprehensive report
    const report: AccessibilityReport = {
      score: this.calculateAccessibilityScore(issues),
      issues,
      recommendations: this.generateAccessibilityRecommendations(issues),
    };

    return {
      optimizedHtml,
      optimizedCss,
      report,
    };
  }

  // Create responsive layouts
  async generateResponsiveLayout(
    components: any[],
    breakpoints: ResponsiveBreakpoint[] = this.breakpoints
  ): Promise<{
    html: string;
    css: string;
    mediaQueries: string[];
  }> {
    const responsiveComponents = this.makeComponentsResponsive(components);
    const mediaQueries = this.generateMediaQueries(breakpoints);

    const html = this.generateResponsiveHTML(responsiveComponents);
    const css = this.generateResponsiveCSS(responsiveComponents, mediaQueries);

    return {
      html,
      css,
      mediaQueries,
    };
  }

  // Design micro-interactions
  async generateMicroInteractions(
    elements: any[],
    interactionType: 'hover' | 'click' | 'scroll' | 'all' = 'all'
  ): Promise<{
    interactions: MicroInteraction[];
    css: string;
  }> {
    const interactions = this.createMicroInteractions(elements, interactionType);
    const css = this.generateInteractionCSS(interactions);

    return {
      interactions,
      css,
    };
  }

  // Helper methods
  private generateDesignTokensForStyle(style: string, colorScheme: string): DesignToken[] {
    const baseTokens = [...this.designTokens];

    // Add style-specific tokens
    switch (style) {
      case 'modern':
        baseTokens.push(
          { name: 'primary-600', value: '#2563eb', category: 'color' },
          { name: 'accent-500', value: '#8b5cf6', category: 'color' },
        );
        break;
      case 'minimal':
        baseTokens.push(
          { name: 'primary-600', value: '#374151', category: 'color' },
          { name: 'accent-500', value: '#6b7280', category: 'color' },
        );
        break;
      case 'classic':
        baseTokens.push(
          { name: 'primary-600', value: '#1f2937', category: 'color' },
          { name: 'accent-500', value: '#d97706', category: 'color' },
        );
        break;
      case 'bold':
        baseTokens.push(
          { name: 'primary-600', value: '#dc2626', category: 'color' },
          { name: 'accent-500', value: '#7c3aed', category: 'color' },
        );
        break;
    }

    return baseTokens;
  }

  private convertElementsToComponents(elements: WireframeElement[], style: string): any[] {
    return elements.map(element => ({
      id: element.id,
      type: this.mapWireframeTypeToComponent(element.type),
      props: this.generateComponentProps(element, style),
      styles: this.generateComponentStyles(element, style),
      children: element.children ? this.convertElementsToComponents(element.children, style) : [],
    }));
  }

  private mapWireframeTypeToComponent(type: string): string {
    const mapping: Record<string, string> = {
      'rectangle': 'Card',
      'text': 'Text',
      'image': 'Image',
      'button': 'Button',
      'input': 'Input',
      'icon': 'Icon',
      'line': 'Divider',
      'circle': 'Avatar',
    };

    return mapping[type] || 'View';
  }

  private generateComponentProps(element: WireframeElement, style: string): Record<string, any> {
    const props: Record<string, any> = {};

    // Generate props based on element type and properties
    if (element.type === 'button') {
      props.variant = style === 'modern' ? 'primary' : 'secondary';
      props.size = element.size.width > 100 ? 'lg' : 'md';
    }

    if (element.type === 'input') {
      props.placeholder = element.properties.placeholder || 'Enter text...';
    }

    return props;
  }

  private generateComponentStyles(element: WireframeElement, style: string): Record<string, any> {
    return {
      position: 'absolute',
      left: `${element.position.x}px`,
      top: `${element.position.y}px`,
      width: `${element.size.width}px`,
      height: `${element.size.height}px`,
      ...this.getStyleForElementType(element.type, style),
    };
  }

  private getStyleForElementType(type: string, style: string): Record<string, any> {
    const baseStyles: Record<string, Record<string, any>> = {
      'rectangle': {
        backgroundColor: 'var(--primary-50)',
        border: '1px solid var(--primary-200)',
        borderRadius: 'var(--border-radius-md)',
      },
      'text': {
        color: 'var(--gray-900)',
        fontSize: 'var(--font-size-base)',
        fontWeight: 'var(--font-weight-normal)',
        lineHeight: 'var(--line-height-normal)',
      },
      'button': {
        backgroundColor: 'var(--primary-500)',
        color: 'white',
        border: 'none',
        cursor: 'pointer',
        fontSize: 'var(--font-size-sm)',
        fontWeight: 'var(--font-weight-medium)',
      },
    };

    return baseStyles[type] || {};
  }

  private generateHTML(components: any[], elements: WireframeElement[]): string {
    const generateElementHTML = (element: any): string => {
      const style = Object.entries(element.styles)
        .map(([key, value]) => `${key}: ${value}`)
        .join('; ');

      let html = `<div class="${element.type.toLowerCase()}" style="${style}">`;

      if (element.props) {
        const props = Object.entries(element.props)
          .map(([key, value]) => `${key}="${value}"`)
          .join(' ');
        html = `<div class="${element.type.toLowerCase()}" ${props} style="${style}">`;
      }

      if (element.children && element.children.length > 0) {
        html += element.children.map((child: any) => generateElementHTML(child)).join('');
      }

      html += '</div>';
      return html;
    };

    return components.map(comp => generateElementHTML(comp)).join('\n');
  }

  private generateCSS(
    tokens: DesignToken[],
    components: any[],
    style: string,
    includeAnimations: boolean
  ): string {
    let css = ':root {\n';

    // Add design tokens as CSS custom properties
    tokens.forEach(token => {
      const cssName = token.name.replace(/-/g, '-');
      css += `  --${cssName}: ${token.value};\n`;
    });

    css += '}\n\n';

    // Add component styles
    components.forEach(component => {
      css += this.generateComponentCSS(component, style);
    });

    // Add animations if requested
    if (includeAnimations) {
      css += this.generateAnimationCSS();
    }

    return css;
  }

  private generateComponentCSS(component: any, style: string): string {
    const className = component.type.toLowerCase();
    let css = `.${className} {\n`;

    Object.entries(component.styles).forEach(([property, value]) => {
      css += `  ${property}: ${value};\n`;
    });

    css += '}\n\n';
    return css;
  }

  private generateAnimationCSS(): string {
    return `
/* Micro-interactions */
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideUp {
  from {
    transform: translateY(20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

@keyframes scaleIn {
  from {
    transform: scale(0.9);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}

/* Hover effects */
.button:hover {
  transform: translateY(-1px);
  box-shadow: var(--shadow-md);
}

.card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}

/* Focus states for accessibility */
.button:focus,
.input:focus {
  outline: 2px solid var(--primary-500);
  outline-offset: 2px;
}

/* Responsive utilities */
.mobile-only { display: block; }
.tablet-up { display: none; }
.desktop-up { display: none; }

@media (min-width: 768px) {
  .mobile-only { display: none; }
  .tablet-up { display: block; }
}

@media (min-width: 1024px) {
  .desktop-up { display: block; }
}
`;
  }

  private generateComprehensiveDesignTokens(
    brandColors: string[],
    typographyPreferences: any,
    spacingScale: number[]
  ): DesignToken[] {
    const tokens = [...this.designTokens];

    // Add brand colors
    brandColors.forEach((color, index) => {
      tokens.push({
        name: `brand-${index + 1}`,
        value: color,
        category: 'color',
        description: `Brand color ${index + 1}`,
      });
    });

    // Add spacing scale
    spacingScale.forEach((space, index) => {
      tokens.push({
        name: `space-${index + 1}`,
        value: `${space}px`,
        category: 'spacing',
        description: `Spacing scale ${index + 1}`,
      });
    });

    return tokens;
  }

  private updateComponentLibraryWithTokens(tokens: DesignToken[]): ComponentLibrary {
    // Update component library with new design tokens
    return {
      ...this.componentLibrary,
      components: this.componentLibrary.components.map(component => ({
        ...component,
        styles: {
          ...component.styles,
          base: {
            ...component.styles.base,
            ...this.tokensToCSSProperties(tokens),
          },
        },
      })),
    };
  }

  private tokensToCSSProperties(tokens: DesignToken[]): Record<string, string> {
    const cssProps: Record<string, string> = {};

    tokens.forEach(token => {
      const cssName = token.name.replace(/-/g, '-');
      cssProps[cssName] = `var(--${cssName})`;
    });

    return cssProps;
  }

  private generateStyleGuide(tokens: DesignToken[], library: ComponentLibrary): any {
    return {
      name: 'Design System Style Guide',
      version: '1.0.0',
      colors: tokens.filter(t => t.category === 'color'),
      typography: tokens.filter(t => t.category === 'typography'),
      spacing: tokens.filter(t => t.category === 'spacing'),
      components: library.components,
      guidelines: {
        usage: 'Use design tokens consistently across all components',
        accessibility: 'Ensure WCAG 2.1 AA compliance',
        responsive: 'Test on all breakpoints',
      },
    };
  }

  private analyzeAccessibilityIssues(html: string, css: string): any[] {
    const issues = [];

    // Check for missing alt text
    if (html.includes('<img') && !html.includes('alt=')) {
      issues.push({
        type: 'error',
        element: 'img',
        description: 'Image missing alt attribute',
        wcag: '1.1.1',
        fix: 'Add descriptive alt text to all images',
      });
    }

    // Check for color contrast
    if (css.includes('color:') && !css.includes('contrast-ratio')) {
      issues.push({
        type: 'warning',
        element: 'text',
        description: 'Potential color contrast issues',
        wcag: '1.4.3',
        fix: 'Ensure text has sufficient contrast ratio (4.5:1 for normal text)',
      });
    }

    // Check for focus indicators
    if (!css.includes(':focus')) {
      issues.push({
        type: 'warning',
        element: 'interactive elements',
        description: 'Missing focus indicators',
        wcag: '2.4.7',
        fix: 'Add visible focus indicators for keyboard navigation',
      });
    }

    return issues;
  }

  private applyAccessibilityFixes(html: string, issues: any[]): string {
    let fixedHtml = html;

    // Add alt attributes to images
    issues.forEach(issue => {
      if (issue.element === 'img' && issue.type === 'error') {
        fixedHtml = fixedHtml.replace(
          /<img([^>]*)>/g,
          '<img$1 alt="Image description">'
        );
      }
    });

    return fixedHtml;
  }

  private addAccessibilityEnhancements(css: string): string {
    return css + `
/* Accessibility enhancements */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}

/* High contrast mode support */
@media (prefers-contrast: high) {
  :root {
    --primary-500: #0000ff;
    --gray-900: #000000;
    --gray-50: #ffffff;
  }
}

/* Focus management */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

/* Skip link */
.skip-link {
  position: absolute;
  top: -40px;
  left: 6px;
  background: var(--primary-500);
  color: white;
  padding: 8px;
  text-decoration: none;
  z-index: 100;
}

.skip-link:focus {
  top: 6px;
}
`;
  }

  private calculateAccessibilityScore(issues: any[]): number {
    const errorCount = issues.filter(i => i.type === 'error').length;
    const warningCount = issues.filter(i => i.type === 'warning').length;

    const maxScore = 100;
    const errorPenalty = errorCount * 10;
    const warningPenalty = warningCount * 2;

    return Math.max(0, maxScore - errorPenalty - warningPenalty);
  }

  private generateAccessibilityRecommendations(issues: any[]): string[] {
    const recommendations = [];

    if (issues.some(i => i.wcag === '1.1.1')) {
      recommendations.push('Add descriptive alt text to all images');
    }

    if (issues.some(i => i.wcag === '1.4.3')) {
      recommendations.push('Test color contrast ratios and adjust as needed');
    }

    if (issues.some(i => i.wcag === '2.4.7')) {
      recommendations.push('Implement visible focus indicators for all interactive elements');
    }

    recommendations.push('Test with screen readers');
    recommendations.push('Ensure keyboard navigation works throughout the interface');

    return recommendations;
  }

  private makeComponentsResponsive(components: any[]): any[] {
    return components.map(component => ({
      ...component,
      responsive: {
        mobile: this.getMobileStyles(component),
        tablet: this.getTabletStyles(component),
        desktop: this.getDesktopStyles(component),
      },
    }));
  }

  private generateMediaQueries(breakpoints: ResponsiveBreakpoint[]): string[] {
    return breakpoints.map(bp => bp.mediaQuery);
  }

  private generateResponsiveHTML(components: any[]): string {
    // Generate HTML with responsive classes
    return components.map(comp =>
      `<div class="${comp.type.toLowerCase()} ${comp.responsive.mobile.className || ''}">${comp.children || ''}</div>`
    ).join('\n');
  }

  private generateResponsiveCSS(components: any[], mediaQueries: string[]): string {
    let css = '';

    components.forEach(component => {
      css += `.${component.type.toLowerCase()} {\n`;
      css += `  /* Mobile styles */\n`;
      Object.entries(component.responsive.mobile.styles).forEach(([prop, value]) => {
        css += `  ${prop}: ${value};\n`;
      });
      css += '}\n\n';
    });

    // Add media queries
    mediaQueries.forEach((query, index) => {
      css += `@media ${query} {\n`;
      css += `  /* ${this.breakpoints[index].name} styles */\n`;
      css += '}\n\n';
    });

    return css;
  }

  private createMicroInteractions(elements: any[], interactionType: string): MicroInteraction[] {
    const interactions: MicroInteraction[] = [];

    elements.forEach(element => {
      if (element.type === 'button') {
        interactions.push({
          name: `${element.type}-hover`,
          trigger: 'hover',
          animation: {
            property: 'transform',
            duration: 150,
            easing: 'ease-out',
            keyframes: [
              { percentage: 0, value: 'translateY(0)' },
              { percentage: 100, value: 'translateY(-2px)' },
            ],
          },
          states: {
            initial: { transform: 'translateY(0)' },
            active: { transform: 'translateY(-2px)' },
            final: { transform: 'translateY(0)' },
          },
        });
      }
    });

    return interactions;
  }

  private generateInteractionCSS(interactions: MicroInteraction[]): string {
    let css = '/* Micro-interactions */\n';

    interactions.forEach(interaction => {
      css += `.${interaction.name} {\n`;
      css += `  transition: ${interaction.animation.property} ${interaction.animation.duration}ms ${interaction.animation.easing};\n`;
      css += '}\n\n';
    });

    return css;
  }

  private getMobileStyles(component: any): any {
    return {
      className: 'mobile-only',
      styles: {
        width: '100%',
        marginBottom: 'var(--space-4)',
      },
    };
  }

  private getTabletStyles(component: any): any {
    return {
      className: 'tablet-up',
      styles: {
        width: 'calc(50% - var(--space-2))',
        marginBottom: 'var(--space-4)',
      },
    };
  }

  private getDesktopStyles(component: any): any {
    return {
      className: 'desktop-up',
      styles: {
        width: 'calc(33.333% - var(--space-4))',
        marginBottom: 'var(--space-6)',
      },
    };
  }
}