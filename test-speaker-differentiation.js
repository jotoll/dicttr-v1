// Script de prueba para verificar diferenciación de interlocutores
const TranscriptionService = require('./src/services/transcriptionService');

async function testSpeakerDifferentiation() {
  console.log('🧪 Probando diferenciación de interlocutores...\n');

  // Texto de ejemplo con múltiples interlocutores
  const conversationText = `
  Entrevistador: Buenas tardes, gracias por aceptar esta entrevista.
  Entrevistado: Es un placer estar aquí, gracias por la invitación.
  Entrevistador: Comencemos hablando sobre su experiencia en el sector tecnológico.
  Entrevistado: Llevo más de 10 años trabajando en desarrollo de software.
  Entrevistador: ¿Qué tecnologías considera más importantes actualmente?
  Entrevistado: Sin duda, la inteligencia artificial y el cloud computing.
  `;

  console.log('📝 Texto de conversación original:');
  console.log(conversationText);
  console.log('\n🔄 Mejorando transcripción con diferenciación de interlocutores...\n');

  try {
    // Probar mejora con idioma español
    const enhancedResult = await TranscriptionService.enhanceTranscription(
      conversationText,
      'entrevista',
      'es' // Idioma de traducción
    );

    console.log('✅ Transcripción mejorada obtenida\n');
    
    // Mostrar estructura mejorada
    const enhancedText = enhancedResult.enhanced_text;
    
    console.log('📋 Título:', enhancedText.title || 'Sin título');
    console.log('\n📄 Secciones mejoradas:');
    
    if (enhancedText.sections && Array.isArray(enhancedText.sections)) {
      enhancedText.sections.forEach((section, index) => {
        console.log(`\n--- Sección ${index + 1} ---`);
        console.log('Tipo:', section.type);
        
        if (section.type === 'heading') {
          console.log('Nivel:', section.level);
          console.log('Contenido:', section.content);
        } else if (section.type === 'paragraph') {
          console.log('Contenido:', section.content);
          if (section.speaker) {
            console.log('🎤 Interlocutor:', section.speaker);
          }
        } else if (section.type === 'concept_block') {
          console.log('Término:', section.term);
          console.log('Definición:', section.definition);
          if (section.examples) {
            console.log('Ejemplos:', section.examples);
          }
        }
      });
    }

    // Verificar si se identificaron interlocutores
    const hasSpeakers = enhancedText.sections?.some(section => section.speaker);
    console.log('\n🔍 Resultado de diferenciación:');
    if (hasSpeakers) {
      console.log('✅ ¡Se identificaron y diferenciaron interlocutores!');
      
      // Contar interlocutores únicos
      const uniqueSpeakers = new Set();
      enhancedText.sections?.forEach(section => {
        if (section.speaker) {
          uniqueSpeakers.add(section.speaker);
        }
      });
      
      console.log(`📊 Interlocutores identificados: ${Array.from(uniqueSpeakers).join(', ')}`);
    } else {
      console.log('⚠️ No se identificaron interlocutores claramente');
      console.log('💡 Sugerencia: El texto debe tener indicadores claros de cambio de hablante');
    }

  } catch (error) {
    console.error('❌ Error durante la prueba:', error.message);
    console.error(error.stack);
  }
}

// Ejecutar prueba
testSpeakerDifferentiation().then(() => {
  console.log('\n🧪 Prueba completada');
  process.exit(0);
}).catch(error => {
  console.error('❌ Error fatal:', error);
  process.exit(1);
});
