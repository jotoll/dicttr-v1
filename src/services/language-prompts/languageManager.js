// Gestor centralizado de prompts por idioma
const subjectPrompts = require('./subjectPrompts');
const enhancementPrompts = require('./enhancementPrompts');
const blockGenerationPrompts = require('./blockGenerationPrompts');

class LanguageManager {
  constructor() {
    this.supportedLanguages = ['es', 'en', 'fr', 'de', 'it', 'pt', 'ru', 'ja', 'zh', 'ar'];
  }

  // Verificar si un idioma es soportado
  isLanguageSupported(language) {
    return this.supportedLanguages.includes(language);
  }

  // Obtener prompt para generación de asuntos
  getSubjectPrompt(language = 'es') {
    const targetLanguage = this.isLanguageSupported(language) ? language : 'es';
    return subjectPrompts[targetLanguage] || subjectPrompts.es;
  }

  // Obtener prompt para mejora de transcripción
  getEnhancementPrompt(language = 'es') {
    const targetLanguage = this.isLanguageSupported(language) ? language : 'es';
    return enhancementPrompts[targetLanguage] || enhancementPrompts.es;
  }

  // Obtener prompt para generación de bloques específicos
  getBlockGenerationPrompt(blockType, language = 'es') {
    const targetLanguage = this.isLanguageSupported(language) ? language : 'es';
    const languagePrompts = blockGenerationPrompts[targetLanguage] || blockGenerationPrompts.es;
    
    // Verificar si el tipo de bloque está soportado
    const supportedBlockTypes = ['heading', 'paragraph', 'concept_block', 'list', 'summary_block', 'key_concepts_block'];
    if (!supportedBlockTypes.includes(blockType)) {
      console.warn(`⚠️  Tipo de bloque no soportado: ${blockType}, usando 'paragraph' como fallback`);
      blockType = 'paragraph';
    }
    
    return languagePrompts[blockType] || languagePrompts.paragraph;
  }

  // Obtener todos los idiomas soportados
  getSupportedLanguages() {
    return this.supportedLanguages;
  }

  // Obtener idioma por defecto
  getDefaultLanguage() {
    return 'es';
  }

  // Validar y normalizar idioma
  normalizeLanguage(language) {
    if (!language || !this.isLanguageSupported(language)) {
      return this.getDefaultLanguage();
    }
    return language;
  }

  // Obtener información de idioma
  getLanguageInfo(language) {
    const normalizedLanguage = this.normalizeLanguage(language);
    
    const languageNames = {
      es: 'Español',
      en: 'English',
      fr: 'Français',
      de: 'Deutsch',
      it: 'Italiano',
      pt: 'Português',
      ru: 'Русский',
      ja: '日本語',
      zh: '中文',
      ar: 'العربية'
    };

    return {
      code: normalizedLanguage,
      name: languageNames[normalizedLanguage] || 'Español',
      isSupported: this.isLanguageSupported(language)
    };
  }

  // Obtener todos los idiomas con información
  getAllLanguagesInfo() {
    return this.supportedLanguages.map(lang => this.getLanguageInfo(lang));
  }
}

module.exports = new LanguageManager();
