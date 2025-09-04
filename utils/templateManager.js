const logger = require('./logger');

// Template definitions with their configurations
const templates = {
  // Blog Templates
  'blog-minimal': {
    id: 'blog-minimal',
    name: 'Minimal Blog',
    type: 'blog',
    description: 'Clean and focused on content',
    features: ['Post feed', 'Categories', 'Comments', 'RSS feed'],
    layout: {
      header: 'minimal',
      sidebar: 'right',
      footer: 'simple'
    },
    colorSchemes: ['default', 'monochrome', 'cool'],
    customCSS: `
      .post-content { line-height: 1.8; }
      .header { border-bottom: 1px solid var(--color-base-300); }
    `
  },
  'blog-magazine': {
    id: 'blog-magazine',
    name: 'Magazine Blog',
    type: 'blog',
    description: 'Rich layout with featured posts',
    features: ['Featured posts', 'Categories', 'Newsletter', 'Social sharing'],
    layout: {
      header: 'magazine',
      sidebar: 'both',
      footer: 'rich'
    },
    colorSchemes: ['default', 'vibrant', 'warm'],
    customCSS: `
      .featured-post { background: linear-gradient(135deg, var(--color-primary), var(--color-secondary)); }
      .post-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); }
    `
  },
  'blog-personal': {
    id: 'blog-personal',
    name: 'Personal Blog',
    type: 'blog',
    description: 'Warm and personal touch',
    features: ['About section', 'Photo gallery', 'Comments', 'Social links'],
    layout: {
      header: 'personal',
      sidebar: 'left',
      footer: 'personal'
    },
    colorSchemes: ['warm', 'default', 'cool'],
    customCSS: `
      .author-bio { border-radius: 12px; padding: 2rem; }
      .post-meta { font-style: italic; }
    `
  },

  // Portfolio Templates
  'portfolio-grid': {
    id: 'portfolio-grid',
    name: 'Grid Portfolio',
    type: 'portfolio',
    description: 'Masonry grid layout',
    features: ['Project gallery', 'Filtering', 'Lightbox', 'Contact form'],
    layout: {
      header: 'minimal',
      sidebar: 'none',
      footer: 'minimal'
    },
    colorSchemes: ['monochrome', 'default', 'cool'],
    customCSS: `
      .portfolio-grid { display: masonry; masonry-template-columns: repeat(auto-fit, minmax(300px, 1fr)); }
      .project-card { transition: transform 0.3s ease; }
      .project-card:hover { transform: translateY(-5px); }
    `
  },
  'portfolio-slider': {
    id: 'portfolio-slider',
    name: 'Slider Portfolio',
    type: 'portfolio',
    description: 'Full-screen project slider',
    features: ['Full-screen slider', 'Project details', 'Skills showcase', 'Contact'],
    layout: {
      header: 'overlay',
      sidebar: 'none',
      footer: 'overlay'
    },
    colorSchemes: ['default', 'vibrant', 'monochrome'],
    customCSS: `
      .portfolio-slider { height: 100vh; }
      .project-slide { background-size: cover; background-position: center; }
    `
  },
  'portfolio-minimal': {
    id: 'portfolio-minimal',
    name: 'Minimal Portfolio',
    type: 'portfolio',
    description: 'Clean and professional',
    features: ['Clean layout', 'Typography focus', 'Case studies', 'Resume'],
    layout: {
      header: 'minimal',
      sidebar: 'none',
      footer: 'minimal'
    },
    colorSchemes: ['monochrome', 'cool', 'default'],
    customCSS: `
      .portfolio-item { margin-bottom: 4rem; }
      .case-study { max-width: 800px; margin: 0 auto; }
    `
  },

  // Business Templates
  'business-corporate': {
    id: 'business-corporate',
    name: 'Corporate Business',
    type: 'business',
    description: 'Professional and trustworthy',
    features: ['Hero section', 'Services', 'Team', 'Testimonials', 'Contact'],
    layout: {
      header: 'corporate',
      sidebar: 'none',
      footer: 'corporate'
    },
    colorSchemes: ['default', 'cool', 'monochrome'],
    customCSS: `
      .hero-section { background: linear-gradient(135deg, var(--color-primary), var(--color-secondary)); }
      .services-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); }
    `
  },
  'business-modern': {
    id: 'business-modern',
    name: 'Modern Business',
    type: 'business',
    description: 'Contemporary design',
    features: ['Modern layout', 'Animations', 'Portfolio', 'Blog', 'Contact'],
    layout: {
      header: 'modern',
      sidebar: 'none',
      footer: 'modern'
    },
    colorSchemes: ['vibrant', 'default', 'warm'],
    customCSS: `
      .modern-card { backdrop-filter: blur(10px); border-radius: 16px; }
      .animate-on-scroll { opacity: 0; transform: translateY(20px); }
    `
  },
  'business-startup': {
    id: 'business-startup',
    name: 'Startup Business',
    type: 'business',
    description: 'Dynamic and innovative',
    features: ['Landing page', 'Product showcase', 'Pricing', 'Blog', 'Contact'],
    layout: {
      header: 'startup',
      sidebar: 'none',
      footer: 'startup'
    },
    colorSchemes: ['vibrant', 'warm', 'default'],
    customCSS: `
      .startup-hero { background: radial-gradient(circle, var(--color-primary), var(--color-secondary)); }
      .pricing-card { transform: scale(1); transition: transform 0.3s; }
      .pricing-card:hover { transform: scale(1.05); }
    `
  },

  // News Templates
  'news-classic': {
    id: 'news-classic',
    name: 'Classic News',
    type: 'news',
    description: 'Traditional newspaper layout',
    features: ['Breaking news', 'Categories', 'Archives', 'Newsletter'],
    layout: {
      header: 'news',
      sidebar: 'right',
      footer: 'news'
    },
    colorSchemes: ['default', 'monochrome', 'cool'],
    customCSS: `
      .breaking-news { background: var(--color-error); color: white; }
      .news-grid { display: grid; grid-template-columns: 2fr 1fr; }
    `
  },
  'news-modern': {
    id: 'news-modern',
    name: 'Modern News',
    type: 'news',
    description: 'Contemporary news design',
    features: ['Live updates', 'Video content', 'Social sharing', 'Comments'],
    layout: {
      header: 'modern',
      sidebar: 'left',
      footer: 'modern'
    },
    colorSchemes: ['vibrant', 'default', 'warm'],
    customCSS: `
      .live-indicator { animation: pulse 2s infinite; }
      .video-player { border-radius: 12px; overflow: hidden; }
    `
  },
  'news-magazine': {
    id: 'news-magazine',
    name: 'Magazine News',
    type: 'news',
    description: 'Rich media layout',
    features: ['Featured stories', 'Photo galleries', 'Interviews', 'Opinion'],
    layout: {
      header: 'magazine',
      sidebar: 'both',
      footer: 'magazine'
    },
    colorSchemes: ['warm', 'vibrant', 'default'],
    customCSS: `
      .featured-story { background-size: cover; min-height: 400px; }
      .photo-gallery { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); }
    `
  },

  // Personal Templates
  'personal-diary': {
    id: 'personal-diary',
    name: 'Personal Diary',
    type: 'personal',
    description: 'Intimate and personal',
    features: ['Journal entries', 'Photo memories', 'Mood tracking', 'Private posts'],
    layout: {
      header: 'personal',
      sidebar: 'right',
      footer: 'simple'
    },
    colorSchemes: ['warm', 'default', 'cool'],
    customCSS: `
      .diary-entry { border-left: 4px solid var(--color-accent); padding-left: 1rem; }
      .mood-indicator { border-radius: 50%; width: 20px; height: 20px; }
    `
  },
  'personal-creative': {
    id: 'personal-creative',
    name: 'Creative Personal',
    type: 'personal',
    description: 'Artistic and expressive',
    features: ['Art gallery', 'Creative writing', 'Inspiration board', 'Contact'],
    layout: {
      header: 'creative',
      sidebar: 'none',
      footer: 'creative'
    },
    colorSchemes: ['vibrant', 'warm', 'default'],
    customCSS: `
      .creative-header { background: linear-gradient(45deg, var(--color-primary), var(--color-accent)); }
      .art-piece { filter: grayscale(0.2); transition: filter 0.3s; }
      .art-piece:hover { filter: grayscale(0); }
    `
  },
  'personal-simple': {
    id: 'personal-simple',
    name: 'Simple Personal',
    type: 'personal',
    description: 'Clean and straightforward',
    features: ['About page', 'Blog posts', 'Contact form', 'Social links'],
    layout: {
      header: 'simple',
      sidebar: 'none',
      footer: 'simple'
    },
    colorSchemes: ['default', 'monochrome', 'cool'],
    customCSS: `
      .simple-layout { max-width: 800px; margin: 0 auto; }
      .post-list { list-style: none; }
    `
  }
};

// Color scheme definitions
const colorSchemes = {
  default: {
    id: 'default',
    name: 'Default',
    colors: {
      primary: '#3B82F6',
      secondary: '#8B5CF6',
      accent: '#06B6D4',
      base100: '#FFFFFF',
      base200: '#F8FAFC',
      base300: '#E2E8F0',
      baseContent: '#1E293B'
    }
  },
  warm: {
    id: 'warm',
    name: 'Warm',
    colors: {
      primary: '#F59E0B',
      secondary: '#EF4444',
      accent: '#F97316',
      base100: '#FFFBEB',
      base200: '#FEF3C7',
      base300: '#FDE68A',
      baseContent: '#92400E'
    }
  },
  cool: {
    id: 'cool',
    name: 'Cool',
    colors: {
      primary: '#10B981',
      secondary: '#06B6D4',
      accent: '#8B5CF6',
      base100: '#F0FDF4',
      base200: '#DCFCE7',
      base300: '#BBF7D0',
      baseContent: '#14532D'
    }
  },
  monochrome: {
    id: 'monochrome',
    name: 'Monochrome',
    colors: {
      primary: '#374151',
      secondary: '#6B7280',
      accent: '#9CA3AF',
      base100: '#FFFFFF',
      base200: '#F9FAFB',
      base300: '#E5E7EB',
      baseContent: '#111827'
    }
  },
  vibrant: {
    id: 'vibrant',
    name: 'Vibrant',
    colors: {
      primary: '#EC4899',
      secondary: '#8B5CF6',
      accent: '#06B6D4',
      base100: '#FDF2F8',
      base200: '#FCE7F3',
      base300: '#F9A8D4',
      baseContent: '#831843'
    }
  }
};

class TemplateManager {
  static getTemplate(templateId) {
    return templates[templateId] || templates['blog-minimal'];
  }

  static getTemplatesByType(type) {
    return Object.values(templates).filter(template => template.type === type);
  }

  static getAllTemplates() {
    return templates;
  }

  static getColorScheme(schemeId) {
    return colorSchemes[schemeId] || colorSchemes.default;
  }

  static getAllColorSchemes() {
    return colorSchemes;
  }

  static generateTemplateCSS(templateId, colorSchemeId) {
    const template = this.getTemplate(templateId);
    const colorScheme = this.getColorScheme(colorSchemeId);
    
    let css = `
      :root {
        --color-primary: ${colorScheme.colors.primary};
        --color-secondary: ${colorScheme.colors.secondary};
        --color-accent: ${colorScheme.colors.accent};
        --color-base-100: ${colorScheme.colors.base100};
        --color-base-200: ${colorScheme.colors.base200};
        --color-base-300: ${colorScheme.colors.base300};
        --color-base-content: ${colorScheme.colors.baseContent};
      }
      
      ${template.customCSS || ''}
    `;
    
    return css;
  }

  static validateTemplate(templateId, siteType) {
    const template = templates[templateId];
    if (!template) {
      logger.warn(`Template ${templateId} not found, using default`);
      return false;
    }
    
    if (template.type !== siteType) {
      logger.warn(`Template ${templateId} type mismatch. Expected: ${siteType}, Got: ${template.type}`);
      return false;
    }
    
    return true;
  }

  static getDefaultTemplate(siteType) {
    const typeTemplates = this.getTemplatesByType(siteType);
    return typeTemplates.length > 0 ? typeTemplates[0] : templates['blog-minimal'];
  }
}

module.exports = {
  TemplateManager,
  templates,
  colorSchemes
};