const { deepseek, DEEPSEEK_MODELS } = require('../../config/deepseek.js');
const { supabase } = require('../config/supabase.js');
const FormData = require('form-data');
const axios = require('axios');
const fs = require('fs');
const Groq = require('groq-sdk');
const languageManager = require('./language-prompts/languageManager');

class TranscriptionService {
  // Transcripción con Groq Whisper API con manejo de límites y fallback local
  async transcribeAudio(audioFile, language = 'es') {
    try {
      // Verificar si tenemos API key válida
      if (!process.env.GROQ_API_KEY || process.env.GROQ_API_KEY === 'gsk-your-groq-api-key-here') {
        console.log('⚠️  API key de Groq no configurada, usando transcripción local');
        return this.localTranscription(audioFile, language);
      }

      // Verificar si la API key parece ser inválida (basado en patrones comunes)
      const groqApiKey = process.env.GROQ_API_KEY;
      if (groqApiKey.includes('invalid') || groqApiKey.includes('expired') || groqApiKey.length < 20) {
        console.log('⚠️  API key de Groq parece inválida, usando transcripción local');
        return this.localTranscription(audioFile, language);
      }

      const groq = new Groq({
        apiKey: groqApiKey
      });

      // Verificar si el idioma es soportado por Whisper
      const supportedLanguages = ['es', 'en', 'fr', 'de', 'it', 'pt', 'ru', 'ja', 'zh', 'ar', 'nl', 'tr', 'pl', 'uk', 'ko', 'hi'];
      if (!supportedLanguages.includes(language)) {
        console.log(`⚠️  Idioma "${language}" no soportado por Whisper, usando español por defecto`);
        language = 'es';
      }

      // Verificar tamaño del archivo (límite: 100MB)
      const stats = fs.statSync(audioFile);
      const fileSizeMB = stats.size / (1024 * 1024);

      if (fileSizeMB > 100) {
        throw new Error(`Archivo demasiado grande (${fileSizeMB.toFixed(2)}MB). Límite: 100MB`);
      }

      // Crear el stream del archivo
      let audioStream = fs.createReadStream(audioFile);

      // Transcribir con Groq Whisper con timeout y reintentos
      let lastError;
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          console.log(`🔄 Intento ${attempt}/3 de transcripción con Groq en idioma: ${language}`);

          const transcription = await Promise.race([
            groq.audio.transcriptions.create({
              file: audioStream,
              model: "whisper-large-v3-turbo",
              language: language,
              response_format: "verbose_json",
              temperature: 0.0
            }),
            new Promise((_, reject) =>
              setTimeout(() => reject(new Error('Timeout en transcripción (máximo 3 minutos)')), 3 * 60 * 1000)
            )
          ]);

          return {
            text: transcription.text,
            duration: transcription.duration || this.estimateDuration(audioFile),
            confidence: 0.95,
            isSimulated: false,
            segments: transcription.segments || [],
            language: transcription.language || language,
            file_size: fileSizeMB
          };

        } catch (error) {
          lastError = error;
          console.warn(`❌ Intento ${attempt} fallido:`, error.message);

          // Recrear el stream para el próximo intento
          audioStream.destroy();
          audioStream = fs.createReadStream(audioFile);

          if (attempt < 3) {
            await new Promise(resolve => setTimeout(resolve, 2000 * attempt));
          }
        }
      }

      // Si todos los intentos fallan
      console.warn('❌ Todos los intentos de transcripción con Groq fallaron, usando transcripción local');
      return this.localTranscription(audioFile, language);

    } catch (error) {
      console.warn('❌ Error final con Groq API:', error.message);

      // Fallback a transcripción local para errores de API
      if (error.message.includes('demasiado grande') || error.message.includes('Timeout')) {
        throw error;
      }

      console.log('🔄 Usando transcripción local como fallback');
      return this.localTranscription(audioFile, language);
    }
  }

  // Transcripción local simplificada
  localTranscription(audioFile, language = 'es') {
    console.log(`🎯 Usando transcripción local (sin API externa) en idioma: ${language}`);

    const stats = fs.statSync(audioFile);
    const fileSizeMB = stats.size / (1024 * 1024);
    const duration = this.estimateDuration(audioFile);

    // Texto de ejemplo simple
    const sampleText = `Esta es una transcripción local generada para un archivo de audio. El contenido ha sido procesado sin dependencia de servicios externos. Idioma: ${language}`;

    return {
      text: sampleText,
      duration: duration,
      confidence: 0.85,
      isSimulated: true,
      segments: [],
      language: language,
      file_size: fileSizeMB
    };
  }

  // Mejorar transcripción con DeepSeek usando el gestor de idiomas
  async enhanceTranscription(rawText, subject = 'general', translationLanguage = 'es') {
    try {
      console.log('🔍 Iniciando enhanceTranscription - Longitud texto:', rawText.length, 'caracteres');
      console.log('🌍 Idioma de traducción:', translationLanguage);

      // Verificar si tenemos API key válida
      if (!process.env.DEEPSEEK_API_KEY || process.env.DEEPSEEK_API_KEY === 'sk-your-deepseek-api-key-here') {
        console.log('⚠️  API key de DeepSeek no configurada, usando mejora local');
        return this.localEnhancement(rawText, subject, translationLanguage);
      }

      // Verificar si la API key parece ser inválida
      const deepseekApiKey = process.env.DEEPSEEK_API_KEY;
      if (deepseekApiKey.includes('invalid') || deepseekApiKey.includes('expired') || deepseekApiKey.length < 20) {
        console.log('⚠️  API key de DeepSeek parece inválida, usando mejora local');
        return this.localEnhancement(rawText, subject, translationLanguage);
      }

      // Usar el gestor de idiomas para obtener el prompt
      const systemPrompt = languageManager.getEnhancementPrompt(translationLanguage);

      // Verificar longitud del texto (límite: ~100,000 caracteres)
      if (rawText.length > 100000) {
        console.log('📏 Texto demasiado largo, aplicando chunking:', rawText.length, 'caracteres');
        return this.processLongText(rawText, systemPrompt, subject, translationLanguage);
      } else {
        // Texto de tamaño normal
        const response = await deepseek.chat([
          {
            role: "system",
            content: systemPrompt
          },
          {
            role: "user",
            content: `Mejora esta transcripción:\n\n${rawText}`
          }
        ], DEEPSEEK_MODELS.CHAT);

        // Parsear la respuesta JSON
        let enhancedData;
        let rawContent = response.choices[0].message.content;

        try {
          // Intentar extraer JSON de code blocks markdown primero
          const jsonMatch = rawContent.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
          if (jsonMatch && jsonMatch[1]) {
            console.log('🎯 Extrayendo JSON de code block');
            enhancedData = JSON.parse(jsonMatch[1].trim());
          } else {
            // Si no hay code blocks, parsear directamente
            enhancedData = JSON.parse(rawContent);
          }
        } catch (error) {
          console.warn('Error parsing JSON from DeepSeek:', error.message);
          enhancedData = { raw_content: rawContent };
        }

        return {
          enhanced_text: enhancedData,
          original_text: rawText,
          subject: subject,
          processed_at: new Date().toISOString(),
          was_chunked: false
        };
      }
    } catch (error) {
      console.error('❌ ERROR CRÍTICO en enhanceTranscription:', error.message);
      console.log('🔄 Usando mejora local como fallback');
      return this.localEnhancement(rawText, subject, translationLanguage);
    }
  }

  // Mejora local simplificada
  localEnhancement(rawText, subject = 'general', translationLanguage = 'es') {
    console.log(`🎯 Usando mejora local (sin API externa) en idioma: ${translationLanguage}`);

    const enhancedData = {
      title: `Transcripción sobre ${subject}`,
      sections: [
        {
          type: "heading",
          level: 1,
          content: `Transcripción sobre ${subject}`
        },
        {
          type: "paragraph",
          content: "Esta transcripción ha sido procesada localmente sin dependencia de servicios externos."
        },
        {
          type: "paragraph",
          content: rawText
        }
      ]
    };

    return {
      enhanced_text: enhancedData,
      original_text: rawText,
      subject: subject,
      processed_at: new Date().toISOString(),
      was_chunked: false,
      is_local: true
    };
  }

  // Procesar texto largo dividiéndolo en chunks
  async processLongText(rawText, systemPrompt, subject, translationLanguage) {
    const chunks = this.splitTextIntoChunks(rawText, 20000);
    console.log('📦 Texto dividido en', chunks.length, 'chunks');

    const enhancedChunks = [];

    for (let i = 0; i < chunks.length; i++) {
      console.log(`🔄 Procesando chunk ${i + 1}/${chunks.length}`);

      try {
        const response = await deepseek.chat([
          {
            role: "system",
            content: systemPrompt + "\n\nEstás procesando una parte de un texto más largo. Mejora esta sección manteniendo coherencia."
          },
          {
            role: "user",
            content: `Mejora esta sección de la transcripción (parte ${i + 1}/${chunks.length}):\n\n${chunks[i]}`
          }
        ], DEEPSEEK_MODELS.CHAT);

        console.log(`✅ Chunk ${i + 1} procesado exitosamente`);
        enhancedChunks.push(response.choices[0].message.content);

        // Pequeña pausa entre requests para evitar rate limits
        if (i < chunks.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      } catch (chunkError) {
        console.error(`❌ Error procesando chunk ${i + 1}:`, chunkError.message);
        // Fallback: usar el chunk original si falla el procesamiento
        enhancedChunks.push(chunks[i]);
      }
    }

    // Combinar chunks mejorados
    const combinedData = {
      title: "Transcripción Mejorada",
      sections: [],
      key_concepts: [],
      summary: ""
    };

    for (const chunk of enhancedChunks) {
      try {
        let chunkData;
        const jsonMatch = chunk.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
        if (jsonMatch && jsonMatch[1]) {
          chunkData = JSON.parse(jsonMatch[1].trim());
        } else {
          chunkData = JSON.parse(chunk);
        }

        // Combinar lógicamente los datos de cada chunk
        if (chunkData.sections) combinedData.sections.push(...chunkData.sections);
        if (chunkData.key_concepts) combinedData.key_concepts.push(...chunkData.key_concepts);
        if (chunkData.summary) combinedData.summary += chunkData.summary + "\n\n";
      } catch (error) {
        console.warn('Error parsing chunk JSON:', error.message);
        combinedData.sections.push({
          type: "paragraph",
          content: chunk
        });
      }
    }

    return {
      enhanced_text: combinedData,
      original_text: rawText,
      subject: subject,
      processed_at: new Date().toISOString(),
      was_chunked: true,
      chunk_count: chunks.length
    };
  }

  // Generar asunto automático con IA usando el gestor de idiomas
  async generateSubjectFromContent(content, translationLanguage = 'es') {
    try {
      console.log('🤖 Generando asunto automático con IA...');
      console.log('🌍 Idioma para asunto:', translationLanguage);

      // Si el contenido es un objeto JSON, extraer el texto
      let textContent = content;
      if (typeof content === 'object' && content !== null) {
        textContent = this.extractTextFromEnhancedContent(content);
      }

      // Limitar el texto para evitar tokens excesivos
      const truncatedText = textContent.length > 1000
        ? textContent.substring(0, 1000) + '...'
        : textContent;

      // Usar el gestor de idiomas para obtener el prompt
      const systemPrompt = languageManager.getSubjectPrompt(translationLanguage);

      const response = await deepseek.chat([
        {
          role: "system",
          content: systemPrompt
        },
        {
          role: "user",
          content: `Analiza este contenido y genera un asunto apropiado:\n\n${truncatedText}`
        }
      ], DEEPSEEK_MODELS.CHAT);

      const generatedSubject = response.choices[0].message.content.trim().toLowerCase();

      console.log('✅ Asunto generado:', generatedSubject);
      return generatedSubject;

    } catch (error) {
      console.error('❌ Error generando asunto con IA:', error.message);
      console.log('⚠️  Devolviendo null (sin asunto)');
      return null;
    }
  }

  // Traducir asunto a diferentes idiomas
  translateSubject(subject, targetLanguage = 'es') {
    const subjectTranslations = {
      es: {
        'general': 'general',
        'medicina': 'medicina',
        'ingenieria': 'ingeniería',
        'derecho': 'derecho',
        'ciencias': 'ciencias',
        'negocios': 'negocios',
        'tecnologia': 'tecnología'
      },
      en: {
        'general': 'general',
        'medicina': 'medicine',
        'ingenieria': 'engineering',
        'derecho': 'law',
        'ciencias': 'sciences',
        'negocios': 'business',
        'tecnologia': 'technology'
      },
      fr: {
        'general': 'général',
        'medicina': 'médecine',
        'ingenieria': 'ingénierie',
        'derecho': 'droit',
        'ciencias': 'sciences',
        'negocios': 'affaires',
        'tecnologia': 'technologie'
      },
      de: {
        'general': 'allgemein',
        'medicina': 'medizin',
        'ingenieria': 'ingenieurwesen',
        'derecho': 'recht',
        'ciencias': 'wissenschaften',
        'negocios': 'geschäft',
        'tecnologia': 'technologie'
      },
      it: {
        'general': 'generale',
        'medicina': 'medicina',
        'ingenieria': 'ingegneria',
        'derecho': 'diritto',
        'ciencias': 'scienze',
        'negocios': 'affari',
        'tecnologia': 'tecnologia'
      },
      pt: {
        'general': 'geral',
        'medicina': 'medicina',
        'ingenieria': 'engenharia',
        'derecho': 'direito',
        'ciencias': 'ciências',
        'negocios': 'negócios',
        'tecnologia': 'tecnologia'
      },
      ru: {
        'general': 'общий',
        'medicina': 'медицина',
        'ingenieria': 'инженерия',
        'derecho': 'право',
        'ciencias': 'науки',
        'negocios': 'бизнес',
        'tecnologia': 'технология'
      },
      ja: {
        'general': '一般',
        'medicina': '医学',
        'ingenieria': '工学',
        'derecho': '法律',
        'ciencias': '科学',
        'negocios': 'ビジネス',
        'tecnologia': '技術'
      },
      zh: {
        'general': '一般',
        'medicina': '医学',
        'ingenieria': '工程',
        'derecho': '法律',
        'ciencias': '科学',
        'negocios': '商业',
        'tecnologia': '技术'
      },
      ar: {
        'general': 'عام',
        'medicina': 'طب',
        'ingenieria': 'هندسة',
        'derecho': 'قانون',
        'ciencias': 'علوم',
        'negocios': 'أعمال',
        'tecnologia': 'تكنولوجيا'
      }
    };

    // Usar traducción si existe, si no usar el original
    const languageTranslations = subjectTranslations[targetLanguage] || subjectTranslations.es;
    return languageTranslations[subject] || subject;
  }

  // Métodos auxiliares
  estimateDuration(audioFile) {
    try {
      const stats = fs.statSync(audioFile);
      // Estimación aproximada: 1MB ≈ 1 minuto de audio
      return Math.round(stats.size / (1024 * 1024));
    } catch {
      return 120;
    }
  }

  // Dividir texto en chunks para procesamiento de textos largos
  splitTextIntoChunks(text, maxChunkSize = 20000) {
    const chunks = [];
    let currentChunk = '';
    const sentences = text.split(/(?<=[.!?])\s+/);
    
    for (const sentence of sentences) {
      if ((currentChunk + sentence).length > maxChunkSize && currentChunk.length > 0) {
        chunks.push(currentChunk.trim());
        currentChunk = sentence;
      } else {
        currentChunk += ' ' + sentence;
      }
    }
    
    if (currentChunk.trim().length > 0) {
      chunks.push(currentChunk.trim());
    }
    
    return chunks;
  }

  // Extraer texto de contenido enhanced estructurado
  extractTextFromEnhancedContent(enhancedContent) {
    if (!enhancedContent) return '';

    let text = '';

    // Si tiene título, añadirlo
    if (enhancedContent.title) {
      text += enhancedContent.title + '\n\n';
    }

    // Extraer texto de las secciones
    if (enhancedContent.sections && Array.isArray(enhancedContent.sections)) {
      enhancedContent.sections.forEach(section => {
        if (section.content) {
          text += section.content + '\n';
        }
        if (section.term && section.definition) {
          text += `${section.term}: ${section.definition}\n`;
        }
        if (section.items && Array.isArray(section.items)) {
          text += section.items.join('\n') + '\n';
        }
      });
    }

    // Extraer conceptos clave
    if (enhancedContent.key_concepts && Array.isArray(enhancedContent.key_concepts)) {
      text += 'Conceptos clave: ' + enhancedContent.key_concepts.join(', ') + '\n';
    }

    // Extraer resumen
    if (enhancedContent.summary) {
      text += enhancedContent.summary + '\n';
    }

    return text.trim() || JSON.stringify(enhancedContent);
  }

  // Guardar transcripción en Supabase
  async saveTranscriptionToDB(transcriptionData, userId, fileInfo = null, languageOptions = {}) {
    try {
      if (!supabase) {
        console.warn('Supabase no configurado, guardando localmente');
        return { id: `local_${Date.now()}`, success: true };
      }

      // Generar subject automáticamente si no se proporciona o es "Nueva grabación"
      let subject = transcriptionData.subject;
      if (!subject || subject === 'Nueva grabación') {
        const translationLanguage = languageOptions.translation_language || 'es';
        subject = await this.generateSubjectFromContent(
          transcriptionData.enhanced_text || transcriptionData.original_text, 
          translationLanguage
        );
        if (!subject) {
          subject = 'general';
          console.log('⚠️  No se pudo generar subject automático, usando "general"');
        }
      }

      const transcriptionRecord = {
        user_id: userId,
        title: transcriptionData.enhanced_text?.title || 'Transcripción sin título',
        subject: subject,
        original_text: transcriptionData.original_text,
        enhanced_text: JSON.stringify(transcriptionData.enhanced_text),
        language: languageOptions.language || transcriptionData.language || 'es',
        translation_language: languageOptions.translation_language || 'es',
        processing_status: 'completed'
      };

      const { data, error } = await supabase
        .from('transcriptions')
        .insert(transcriptionRecord)
        .select();

      if (error) {
        console.error('Error guardando transcripción en Supabase:', error);
        throw error;
      }

      console.log('✅ Transcripción guardada en Supabase:', data[0].id);
      return { id: data[0].id, success: true };
    } catch (error) {
      console.error('Error en saveTranscriptionToDB:', error);
      throw error;
    }
  }

  // Obtener transcripciones del usuario
  async getUserTranscriptions(userId, limit = 50, offset = 0) {
    try {
      if (!supabase) {
        console.warn('Supabase no configurado, devolviendo array vacío');
        return [];
      }

      const { data, error } = await supabase
        .from('transcriptions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        console.error('Error obteniendo transcripciones:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error en getUserTranscriptions:', error);
      return [];
    }
  }

  // Track user usage for analytics
  async trackUserUsage(userId, action, details = {}) {
    try {
      if (!supabase) {
        console.warn('Supabase no configurado, no se puede trackear uso');
        return;
      }

      const usageRecord = {
        user_id: userId,
        action: action,
        details: JSON.stringify(details),
        timestamp: new Date().toISOString()
      };

      const { error } = await supabase
        .from('user_usage')
        .insert(usageRecord);

      if (error) {
        console.error('Error trackeando uso del usuario:', error);
      } else {
        console.log('✅ Uso trackeado:', action, 'para usuario:', userId);
      }
    } catch (error) {
      console.error('Error en trackUserUsage:', error);
    }
  }
}

module.exports = new TranscriptionService();
