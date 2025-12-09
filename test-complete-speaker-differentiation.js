// Script de prueba completo para diferenciación de interlocutores
const TranscriptionService = require('./src/services/transcriptionService');

async function testCompleteSpeakerDifferentiation() {
  console.log('🧪 Prueba completa de diferenciación de interlocutores\n');

  // Casos de prueba
  const testCases = [
    {
      name: 'Entrevista formal',
      text: `Entrevistador: Buenas tardes, gracias por aceptar esta entrevista.
Entrevistado: Es un placer estar aquí, gracias por la invitación.
Entrevistador: Comencemos hablando sobre su experiencia en el sector tecnológico.
Entrevistado: Llevo más de 10 años trabajando en desarrollo de software.
Entrevistador: ¿Qué tecnologías considera más importantes actualmente?
Entrevistado: Sin duda, la inteligencia artificial y el cloud computing.`,
      expectedSpeakers: ['Entrevistador', 'Entrevistado']
    },
    {
      name: 'Reunión de negocios',
      text: `Juan: Creo que deberíamos aumentar el presupuesto de marketing.
María: Estoy de acuerdo, pero necesitamos ver los números primero.
Carlos: Podemos revisar el ROI del último trimestre.
Juan: Eso sería ideal para tomar una decisión informada.`,
      expectedSpeakers: ['Juan', 'María', 'Carlos']
    },
    {
      name: 'Clase académica',
      text: `Profesor: Hoy vamos a estudiar los fundamentos de la inteligencia artificial.
Estudiante 1: ¿Podría explicar la diferencia entre ML y AI?
Profesor: Claro, el machine learning es un subconjunto de la inteligencia artificial.
Estudiante 2: ¿Y el deep learning?
Profesor: El deep learning es a su vez un subconjunto del machine learning.`,
      expectedSpeakers: ['Profesor', 'Estudiante 1', 'Estudiante 2']
    },
    {
      name: 'Monólogo (sin interlocutores)',
      text: `Esta es una presentación sobre los avances tecnológicos en el sector salud. 
La telemedicina ha revolucionado la forma en que los pacientes acceden a servicios médicos.
Los wearables permiten monitoreo continuo de signos vitales.
La inteligencia artificial ayuda en diagnósticos tempranos.`,
      expectedSpeakers: []
    }
  ];

  let totalTests = 0;
  let passedTests = 0;

  for (const testCase of testCases) {
    totalTests++;
    console.log(`\n📋 Caso de prueba: ${testCase.name}`);
    console.log('📝 Texto de prueba:');
    console.log(testCase.text.substring(0, 150) + (testCase.text.length > 150 ? '...' : ''));
    
    try {
      // Probar mejora con idioma español
      const enhancedResult = await TranscriptionService.enhanceTranscription(
        testCase.text,
        'test',
        'es'
      );

      const enhancedText = enhancedResult.enhanced_text;
      const hasSpeakers = enhancedText.sections?.some(section => section.speaker);
      
      // Extraer interlocutores identificados
      const identifiedSpeakers = [];
      if (enhancedText.sections) {
        enhancedText.sections.forEach(section => {
          if (section.speaker && !identifiedSpeakers.includes(section.speaker)) {
            identifiedSpeakers.push(section.speaker);
          }
        });
      }

      console.log(`\n🔍 Resultado:`);
      console.log(`- ¿Se detectaron interlocutores? ${hasSpeakers ? '✅ Sí' : '❌ No'}`);
      console.log(`- Interlocutores identificados: ${identifiedSpeakers.length > 0 ? identifiedSpeakers.join(', ') : 'Ninguno'}`);
      
      // Verificar si el resultado coincide con lo esperado
      let testPassed = true;
      let reason = '';
      
      if (testCase.expectedSpeakers.length === 0) {
        // Caso sin interlocutores
        if (hasSpeakers) {
          testPassed = false;
          reason = 'Se detectaron interlocutores cuando no debería haberlos';
        }
      } else {
        // Caso con interlocutores
        if (!hasSpeakers) {
          testPassed = false;
          reason = 'No se detectaron interlocutores cuando debería haberlos';
        } else {
          // Verificar que se identificaron los interlocutores esperados
          const missingSpeakers = testCase.expectedSpeakers.filter(speaker => 
            !identifiedSpeakers.includes(speaker)
          );
          if (missingSpeakers.length > 0) {
            testPassed = false;
            reason = `Faltan interlocutores: ${missingSpeakers.join(', ')}`;
          }
        }
      }

      if (testPassed) {
        console.log(`✅ Prueba PASADA`);
        passedTests++;
      } else {
        console.log(`❌ Prueba FALLIDA: ${reason}`);
      }

      // Mostrar estructura de secciones si hay interlocutores
      if (hasSpeakers && identifiedSpeakers.length > 0) {
        console.log(`\n📊 Estructura de secciones:`);
        let speakerCount = 0;
        enhancedText.sections?.forEach((section, index) => {
          if (section.speaker) {
            speakerCount++;
            console.log(`  ${speakerCount}. ${section.speaker}: "${section.content.substring(0, 50)}${section.content.length > 50 ? '...' : ''}"`);
          }
        });
      }

    } catch (error) {
      console.error(`❌ Error en la prueba: ${error.message}`);
      console.error(error.stack);
    }
  }

  // Resumen final
  console.log('\n' + '='.repeat(50));
  console.log('📊 RESUMEN DE PRUEBAS');
  console.log('='.repeat(50));
  console.log(`Total de pruebas: ${totalTests}`);
  console.log(`Pruebas pasadas: ${passedTests}`);
  console.log(`Pruebas fallidas: ${totalTests - passedTests}`);
  console.log(`Tasa de éxito: ${((passedTests / totalTests) * 100).toFixed(1)}%`);

  if (passedTests === totalTests) {
    console.log('\n🎉 ¡Todas las pruebas pasaron exitosamente!');
  } else {
    console.log('\n⚠️  Algunas pruebas fallaron. Revisar los casos de prueba.');
  }

  // Información adicional sobre la implementación
  console.log('\n' + '='.repeat(50));
  console.log('ℹ️  INFORMACIÓN DE IMPLEMENTACIÓN');
  console.log('='.repeat(50));
  console.log('✅ Diferenciación de interlocutores implementada en:');
  console.log('   - src/services/transcriptionService.js');
  console.log('   - Función localEnhancement() con detectMultipleSpeakers()');
  console.log('   - Función extractSpeakerSections()');
  console.log('\n✅ Patrones detectados:');
  console.log('   - Nombre: (ej: Juan:)');
  console.log('   - NOMBRE: (ej: ENTREVISTADOR:)');
  console.log('   - Nombre Apellido: (ej: Juan Pérez:)');
  console.log('   - Nombre - (ej: Juan - )');
  console.log('\n✅ Compatibilidad con:');
  console.log('   - Mejora local (sin API)');
  console.log('   - Mejora con DeepSeek API (cuando está disponible)');
}

// Ejecutar prueba
testCompleteSpeakerDifferentiation().then(() => {
  console.log('\n🧪 Prueba completa finalizada');
  process.exit(0);
}).catch(error => {
  console.error('❌ Error fatal:', error);
  process.exit(1);
});
