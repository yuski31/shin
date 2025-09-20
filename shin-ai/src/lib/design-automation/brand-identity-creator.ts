import { IBrandIdentity, IBrandColor, IBrandTypography } from '@/models/design-automation';

export interface BrandConcept {
  name: string;
  description: string;
  industry: string;
  targetAudience: string[];
  personality: string[];
  values: string[];
  competitors: string[];
}

export interface LogoConcept {
  name: string;
  style: 'minimal' | 'modern' | 'classic' | 'bold' | 'playful' | 'elegant';
  elements: string[];
  colors: string[];
  typography: string;
  description: string;
}

export interface ColorTheoryResult {
  primary: string;
  secondary: string;
  accent: string;
  palette: Array<{
    name: string;
    hex: string;
    usage: 'primary' | 'secondary' | 'accent' | 'neutral' | 'semantic';
  }>;
  harmony: 'complementary' | 'analogous' | 'triadic' | 'monochromatic' | 'tetradic';
  reasoning: string;
}

export interface TypographyPairing {
  primary: {
    family: string;
    weights: number[];
    styles: string[];
  };
  secondary: {
    family: string;
    weights: number[];
    styles: string[];
  };
  pairing: 'serif-sans' | 'sans-serif' | 'serif-serif' | 'display-body' | 'monospace-accent';
  reasoning: string;
}

export interface BrandGuidelineTemplate {
  sections: Array<{
    title: string;
    content: string;
    type: 'text' | 'image' | 'color' | 'typography' | 'usage';
  }>;
  dos: string[];
  donts: string[];
  usageRules: Record<string, any>;
}

export class BrandIdentityCreator {
  private colorTheories = {
    complementary: this.generateComplementaryPalette,
    analogous: this.generateAnalogousPalette,
    triadic: this.generateTriadicPalette,
    monochromatic: this.generateMonochromaticPalette,
    tetradic: this.generateTetradicPalette,
  };

  private typographyPairings = {
    'serif-sans': {
      primary: { family: 'Playfair Display', weights: [400, 700], styles: ['normal', 'italic'] },
      secondary: { family: 'Inter', weights: [300, 400, 500, 600], styles: ['normal'] },
    },
    'sans-serif': {
      primary: { family: 'Inter', weights: [300, 400, 500, 600, 700], styles: ['normal'] },
      secondary: { family: 'Inter', weights: [300, 400, 500, 600], styles: ['normal'] },
    },
    'serif-serif': {
      primary: { family: 'Playfair Display', weights: [400, 700], styles: ['normal', 'italic'] },
      secondary: { family: 'Crimson Text', weights: [400, 600], styles: ['normal', 'italic'] },
    },
    'display-body': {
      primary: { family: 'Space Grotesk', weights: [400, 500, 600, 700], styles: ['normal'] },
      secondary: { family: 'Inter', weights: [300, 400, 500], styles: ['normal'] },
    },
    'monospace-accent': {
      primary: { family: 'JetBrains Mono', weights: [400, 500, 600], styles: ['normal'] },
      secondary: { family: 'Inter', weights: [300, 400, 500, 600], styles: ['normal'] },
    },
  };

  // Generate complete brand identity
  async generateBrandIdentity(
    concept: BrandConcept,
    options: {
      includeLogo?: boolean;
      includeGuidelines?: boolean;
      colorHarmony?: keyof typeof this.colorTheories;
      typographyPairing?: keyof typeof this.typographyPairings;
    } = {}
  ): Promise<{
    brandIdentity: Partial<IBrandIdentity>;
    logoConcepts: LogoConcept[];
    colorTheory: ColorTheoryResult;
    typography: TypographyPairing;
    guidelines: BrandGuidelineTemplate;
  }> {
    const {
      includeLogo = true,
      includeGuidelines = true,
      colorHarmony = 'complementary',
      typographyPairing = 'serif-sans',
    } = options;

    // Generate color palette using color theory
    const colorTheory = this.generateColorPalette(concept, colorHarmony as keyof typeof this.colorTheories);

    // Generate typography pairing
    const typography = this.generateTypographyPairing(concept, typographyPairing as keyof typeof this.typographyPairings);

    // Generate logo concepts
    const logoConcepts = includeLogo ? await this.generateLogoConcepts(concept, colorTheory) : [];

    // Generate brand guidelines
    const guidelines = includeGuidelines ? this.generateBrandGuidelines(concept, colorTheory, typography) : this.getEmptyGuidelines();

    // Create brand identity object
    const brandIdentity: Partial<IBrandIdentity> = {
      name: concept.name,
      description: concept.description,
      colors: colorTheory.palette.map(color => ({
        name: color.name,
        hex: color.hex,
        rgb: this.hexToRgb(color.hex),
        hsl: this.hexToHsl(color.hex),
        usage: color.usage,
        description: `${color.name} color for ${color.usage} use`,
      })),
      primaryColors: {
        primary: colorTheory.primary,
        secondary: colorTheory.secondary,
        accent: colorTheory.accent,
      },
      typography: this.convertTypographyPairingToBrandTypography(typography),
      brandGuidelines: {
        voice: this.generateBrandVoice(concept),
        personality: concept.personality,
        dos: guidelines.dos,
        donts: guidelines.donts,
        usageRules: guidelines.usageRules,
      },
      assets: {
        logoFiles: [],
        brandBook: '',
        styleGuide: '',
        templates: [],
      },
      metadata: {
        industry: concept.industry,
        targetAudience: concept.targetAudience,
        brandValues: concept.values,
        competitors: concept.competitors,
        inspiration: [],
        tags: concept.personality.concat(concept.values),
      },
      aiMetadata: {
        generated: true,
        prompt: `Generate brand identity for ${concept.name} in ${concept.industry}`,
        model: 'brand-identity-creator',
        parameters: {
          colorHarmony,
          typographyPairing,
          includeLogo,
          includeGuidelines,
        },
        confidence: 0.92,
      },
      versions: [],
      isPublished: false,
    };

    return {
      brandIdentity,
      logoConcepts,
      colorTheory,
      typography,
      guidelines,
    };
  }

  // Generate logo concepts
  async generateLogoConcepts(
    concept: BrandConcept,
    colorTheory: ColorTheoryResult
  ): Promise<LogoConcept[]> {
    const styles = ['minimal', 'modern', 'classic', 'bold', 'playful', 'elegant'];
    const concepts: LogoConcept[] = [];

    styles.forEach(style => {
      concepts.push({
        name: `${concept.name} ${style} logo`,
        style: style as any,
        elements: this.generateLogoElements(concept, style),
        colors: [colorTheory.primary, colorTheory.secondary],
        typography: this.selectTypographyForLogo(concept, style),
        description: this.generateLogoDescription(concept, style),
      });
    });

    return concepts;
  }

  // Generate color palette using color theory
  private generateColorPalette(
    concept: BrandConcept,
    harmony: keyof typeof this.colorTheories
  ): ColorTheoryResult {
    // Generate base color based on brand concept
    const baseColor = this.generateBaseColor(concept);

    // Apply color theory
    const palette = this.colorTheories[harmony].call(this, baseColor);

    return {
      primary: palette.find(c => c.usage === 'primary')?.hex || baseColor,
      secondary: palette.find(c => c.usage === 'secondary')?.hex || this.adjustColor(baseColor, 30),
      accent: palette.find(c => c.usage === 'accent')?.hex || this.adjustColor(baseColor, 60),
      palette,
      harmony,
      reasoning: this.getColorTheoryReasoning(harmony, concept),
    };
  }

  // Generate typography pairing
  private generateTypographyPairing(
    concept: BrandConcept,
    pairing: keyof typeof this.typographyPairings
  ): TypographyPairing {
    const basePairing = this.typographyPairings[pairing];

    return {
      primary: basePairing.primary,
      secondary: basePairing.secondary,
      pairing,
      reasoning: this.getTypographyReasoning(pairing, concept),
    };
  }

  // Generate brand guidelines
  private generateBrandGuidelines(
    concept: BrandConcept,
    colorTheory: ColorTheoryResult,
    typography: TypographyPairing
  ): BrandGuidelineTemplate {
    const sections = [
      {
        title: 'Brand Overview',
        content: `${concept.name} is a ${concept.industry} brand focused on ${concept.values.join(', ')}.`,
        type: 'text' as const,
      },
      {
        title: 'Color Palette',
        content: `Primary: ${colorTheory.primary}, Secondary: ${colorTheory.secondary}, Accent: ${colorTheory.accent}`,
        type: 'color' as const,
      },
      {
        title: 'Typography',
        content: `Primary font: ${typography.primary.family}, Secondary font: ${typography.secondary.family}`,
        type: 'typography' as const,
      },
    ];

    const dos = [
      'Use brand colors consistently across all materials',
      'Maintain proper contrast ratios for accessibility',
      'Use typography hierarchy to guide user attention',
      'Keep logo proportions consistent',
      'Use brand voice in all communications',
    ];

    const donts = [
      'Do not alter brand colors without approval',
      'Do not use competing color schemes',
      'Do not mix font families inappropriately',
      'Do not distort or modify the logo',
      'Do not use inconsistent brand messaging',
    ];

    const usageRules = {
      minimumLogoSize: '24px',
      clearSpace: 'Equal to logo height',
      allowedBackgrounds: ['white', 'light gray', 'brand colors'],
      prohibitedModifications: ['color changes', 'proportional distortion', 'rotation'],
    };

    return {
      sections,
      dos,
      donts,
      usageRules,
    };
  }

  // Helper methods
  private generateBaseColor(concept: BrandConcept): string {
    // Simple color generation based on brand characteristics
    const colorMap: Record<string, string> = {
      'technology': '#0066CC',
      'healthcare': '#10B981',
      'finance': '#059669',
      'education': '#3B82F6',
      'food': '#F59E0B',
      'fashion': '#8B5CF6',
      'sports': '#EF4444',
      'entertainment': '#F97316',
      'default': '#6B7280',
    };

    const industryColor = colorMap[concept.industry.toLowerCase()] || colorMap.default;

    // Adjust based on personality
    if (concept.personality.includes('innovative')) {
      return this.adjustColor(industryColor, 20);
    } else if (concept.personality.includes('trustworthy')) {
      return this.adjustColor(industryColor, -20);
    }

    return industryColor;
  }

  private generateComplementaryPalette(baseColor: string): any[] {
    const complement = this.getComplementaryColor(baseColor);
    return [
      { name: 'Primary', hex: baseColor, usage: 'primary' },
      { name: 'Secondary', hex: complement, usage: 'secondary' },
      { name: 'Accent', hex: this.adjustColor(baseColor, 40), usage: 'accent' },
      { name: 'Light', hex: this.lightenColor(baseColor, 60), usage: 'neutral' },
      { name: 'Dark', hex: this.darkenColor(baseColor, 40), usage: 'neutral' },
    ];
  }

  private generateAnalogousPalette(baseColor: string): any[] {
    return [
      { name: 'Primary', hex: baseColor, usage: 'primary' },
      { name: 'Secondary', hex: this.adjustColor(baseColor, 30), usage: 'secondary' },
      { name: 'Accent', hex: this.adjustColor(baseColor, -30), usage: 'accent' },
      { name: 'Light', hex: this.lightenColor(baseColor, 60), usage: 'neutral' },
      { name: 'Dark', hex: this.darkenColor(baseColor, 40), usage: 'neutral' },
    ];
  }

  private generateTriadicPalette(baseColor: string): any[] {
    const color1 = this.adjustColor(baseColor, 120);
    const color2 = this.adjustColor(baseColor, 240);
    return [
      { name: 'Primary', hex: baseColor, usage: 'primary' },
      { name: 'Secondary', hex: color1, usage: 'secondary' },
      { name: 'Accent', hex: color2, usage: 'accent' },
      { name: 'Light', hex: this.lightenColor(baseColor, 60), usage: 'neutral' },
      { name: 'Dark', hex: this.darkenColor(baseColor, 40), usage: 'neutral' },
    ];
  }

  private generateMonochromaticPalette(baseColor: string): any[] {
    return [
      { name: 'Primary', hex: baseColor, usage: 'primary' },
      { name: 'Light', hex: this.lightenColor(baseColor, 40), usage: 'secondary' },
      { name: 'Lighter', hex: this.lightenColor(baseColor, 60), usage: 'accent' },
      { name: 'Dark', hex: this.darkenColor(baseColor, 20), usage: 'neutral' },
      { name: 'Darker', hex: this.darkenColor(baseColor, 40), usage: 'neutral' },
    ];
  }

  private generateTetradicPalette(baseColor: string): any[] {
    const color1 = this.adjustColor(baseColor, 90);
    const color2 = this.adjustColor(baseColor, 180);
    const color3 = this.adjustColor(baseColor, 270);
    return [
      { name: 'Primary', hex: baseColor, usage: 'primary' },
      { name: 'Secondary', hex: color1, usage: 'secondary' },
      { name: 'Accent', hex: color2, usage: 'accent' },
      { name: 'Support', hex: color3, usage: 'neutral' },
      { name: 'Dark', hex: this.darkenColor(baseColor, 40), usage: 'neutral' },
    ];
  }

  private getComplementaryColor(color: string): string {
    const hsl = this.hexToHsl(color);
    return this.hslToHex({
      h: (hsl.h + 180) % 360,
      s: hsl.s,
      l: hsl.l,
    });
  }

  private adjustColor(color: string, degrees: number): string {
    const hsl = this.hexToHsl(color);
    return this.hslToHex({
      h: (hsl.h + degrees) % 360,
      s: hsl.s,
      l: hsl.l,
    });
  }

  private lightenColor(color: string, percent: number): string {
    const hsl = this.hexToHsl(color);
    return this.hslToHex({
      h: hsl.h,
      s: hsl.s,
      l: Math.min(100, hsl.l + percent),
    });
  }

  private darkenColor(color: string, percent: number): string {
    const hsl = this.hexToHsl(color);
    return this.hslToHex({
      h: hsl.h,
      s: hsl.s,
      l: Math.max(0, hsl.l - percent),
    });
  }

  private hexToRgb(hex: string): { r: number; g: number; b: number } {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16),
    } : { r: 0, g: 0, b: 0 };
  }

  private hexToHsl(hex: string): { h: number; s: number; l: number } {
    const rgb = this.hexToRgb(hex);
    const r = rgb.r / 255;
    const g = rgb.g / 255;
    const b = rgb.b / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0;
    let s = 0;
    const l = (max + min) / 2;

    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      h /= 6;
    }

    return { h: h * 360, s: s * 100, l: l * 100 };
  }

  private hslToHex(hsl: { h: number; s: number; l: number }): string {
    const h = hsl.h / 360;
    const s = hsl.s / 100;
    const l = hsl.l / 100;

    const hue2rgb = (p: number, q: number, t: number): number => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1/6) return p + (q - p) * 6 * t;
      if (t < 1/2) return q;
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
      return p;
    };

    let r: number, g: number, b: number;

    if (s === 0) {
      r = g = b = l;
    } else {
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      r = hue2rgb(p, q, h + 1/3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1/3);
    }

    const toHex = (c: number): string => {
      const hex = Math.round(c * 255).toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    };

    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  }

  private getColorTheoryReasoning(harmony: string, concept: BrandConcept): string {
    const reasonings = {
      complementary: `Complementary colors create high contrast and vibrant energy, perfect for ${concept.personality.join(', ')} brands.`,
      analogous: `Analogous colors create harmony and cohesion, ideal for ${concept.industry} brands that want to appear unified.`,
      triadic: `Triadic colors offer balance and variety, suitable for creative ${concept.industry} brands.`,
      monochromatic: `Monochromatic colors convey simplicity and elegance, perfect for minimalist brand approaches.`,
      tetradic: `Tetradic colors provide rich color variety while maintaining balance, ideal for complex brand ecosystems.`,
    };

    return reasonings[harmony as keyof typeof reasonings] || 'Balanced color palette for brand consistency.';
  }

  private getTypographyReasoning(pairing: string, concept: BrandConcept): string {
    const reasonings = {
      'serif-sans': `Classic serif for headings with modern sans-serif for body text, combining tradition with readability.`,
      'sans-serif': `Clean, modern typography that works well across all digital platforms.`,
      'serif-serif': `Elegant serif pairing for premium brand positioning and sophisticated appeal.`,
      'display-body': `Bold display font for impact with readable body font for content.`,
      'monospace-accent': `Technical monospace for credibility with clean sans-serif for modern appeal.`,
    };

    return reasonings[pairing as keyof typeof reasonings] || 'Professional typography pairing for brand consistency.';
  }

  private generateLogoElements(concept: BrandConcept, style: string): string[] {
    const elements: Record<string, string[]> = {
      minimal: ['geometric shapes', 'simple lines', 'negative space'],
      modern: ['clean lines', 'geometric forms', 'asymmetric balance'],
      classic: ['traditional symbols', 'heraldic elements', 'symmetric design'],
      bold: ['strong shapes', 'high contrast', 'dynamic composition'],
      playful: ['organic shapes', 'curved lines', 'whimsical elements'],
      elegant: ['refined details', 'graceful curves', 'sophisticated forms'],
    };

    return elements[style] || ['abstract symbol', 'letterform', 'geometric shape'];
  }

  private selectTypographyForLogo(concept: BrandConcept, style: string): string {
    const typography: Record<string, string> = {
      minimal: 'Clean sans-serif',
      modern: 'Geometric sans-serif',
      classic: 'Traditional serif',
      bold: 'Heavy sans-serif',
      playful: 'Rounded sans-serif',
      elegant: 'Refined serif',
    };

    return typography[style] || 'Modern sans-serif';
  }

  private generateLogoDescription(concept: BrandConcept, style: string): string {
    return `${style} logo design for ${concept.name}, featuring ${concept.personality.join(' and ')} elements that appeal to ${concept.targetAudience.join(' and ')} audiences in the ${concept.industry} sector.`;
  }

  private generateBrandVoice(concept: BrandConcept): string {
    if (concept.personality.includes('innovative')) {
      return 'Forward-thinking and cutting-edge';
    } else if (concept.personality.includes('trustworthy')) {
      return 'Reliable and professional';
    } else if (concept.personality.includes('friendly')) {
      return 'Warm and approachable';
    } else if (concept.personality.includes('bold')) {
      return 'Confident and daring';
    } else if (concept.personality.includes('elegant')) {
      return 'Sophisticated and refined';
    }

    return 'Professional and consistent';
  }

  private convertTypographyPairingToBrandTypography(pairing: TypographyPairing): IBrandTypography {
    return {
      family: pairing.primary.family,
      weights: pairing.primary.weights,
      styles: pairing.primary.styles as ('normal' | 'italic')[],
      sizes: {
        display: '3rem',
        heading1: '2.5rem',
        heading2: '2rem',
        heading3: '1.5rem',
        heading4: '1.25rem',
        heading5: '1rem',
        heading6: '0.875rem',
        body: '1rem',
        caption: '0.75rem',
        button: '0.875rem',
      },
      lineHeights: {
        display: 1.2,
        heading1: 1.2,
        heading2: 1.3,
        heading3: 1.4,
        heading4: 1.4,
        heading5: 1.5,
        heading6: 1.5,
        body: 1.6,
        caption: 1.4,
        button: 1.2,
      },
      letterSpacing: {
        display: '-0.02em',
        heading1: '-0.02em',
        heading2: '-0.01em',
        heading3: '0em',
        heading4: '0em',
        heading5: '0em',
        heading6: '0em',
        body: '0em',
        caption: '0.05em',
        button: '0.05em',
      },
    };
  }

  private getEmptyGuidelines(): BrandGuidelineTemplate {
    return {
      sections: [],
      dos: [],
      donts: [],
      usageRules: {},
    };
  }
}