// Gestor centralizado de prompts por idioma
const subjectPrompts = require('./subjectPrompts');
const enhancementPrompts = require('./enhancementPrompts');

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
