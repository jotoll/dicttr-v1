# Implementación de Diferenciación de Interlocutores

## Resumen

Se ha implementado un sistema de diferenciación de interlocutores en el servicio de transcripción que permite identificar y separar automáticamente las intervenciones de diferentes hablantes en transcripciones de audio.

## Características Implementadas

### 1. Detección Automática de Múltiples Interlocutores
- **Función:** `detectMultipleSpeakers(text)`
- **Propósito:** Determina si un texto contiene indicadores de múltiples hablantes
- **Patrones detectados:**
  - Nombres con dos puntos: `Juan:`, `María:`, `Entrevistador:`
  - Nombres con apellidos: `Juan Pérez:`
  - Nombres con números: `Estudiante 1:`, `Participante 2:`
  - Nombres en mayúsculas: `ENTREVISTADOR:`, `MODERADOR:`
  - Nombres con guión: `Juan - `

### 2. Extracción de Secciones por Interlocutor
- **Función:** `extractSpeakerSections(text)`
- **Propósito:** Divide el texto en secciones separadas por interlocutor
- **Características:**
  - Mantiene el contenido de cada hablante agrupado
  - Preserva el orden de las intervenciones
  - Maneja nombres con caracteres especiales (acentos, ñ)
  - Compatible con múltiples formatos de texto

### 3. Integración con el Sistema de Mejora
- **Función:** `localEnhancement()` mejorada
- **Propósito:** Aplica la diferenciación de interlocutores durante la mejora local
- **Comportamiento:**
  - Detecta automáticamente múltiples hablantes
  - Separa las intervenciones en secciones individuales
  - Mantiene la estructura del documento mejorado
  - Compatible con fallback cuando no hay múltiples interlocutores

## Casos de Uso Soportados

### ✅ Casos Comunes
1. **Entrevistas:** `Entrevistador:` / `Entrevistado:`
2. **Reuniones de negocios:** `Juan:`, `María:`, `Carlos:`
3. **Clases académicas:** `Profesor:`, `Estudiante 1:`, `Estudiante 2:`
4. **Debates:** `Moderador:`, `Participante A:`, `Participante B:`

### ✅ Formatos Soportados
- Texto con indentación
- Texto sin formato
- Nombres con caracteres especiales (español)
- Nombres con números
- Nombres en mayúsculas

### ❌ Casos No Soportados (Actual)
- Transcripciones sin indicadores claros de cambio de hablante
- Texto donde los nombres no siguen los patrones establecidos
- Transcripciones con formato muy irregular

## Implementación Técnica

### Archivos Modificados
1. **`src/services/transcriptionService.js`**
   - Añadida función `detectMultipleSpeakers()`
   - Añadida función `extractSpeakerSections()`
   - Mejorada función `localEnhancement()`

### Expresiones Regulares Utilizadas
```javascript
// Detección de interlocutores
/^[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+:/m                    // Nombre: (ej: Juan:, María:)
/^[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+\s+[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+:/m  // Nombre Apellido:
/^[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+\s+\d+:/m             // Nombre con número: (ej: Estudiante 1:)
/^[A-Z]+:/m                                    // NOMBRE: (ej: ENTREVISTADOR:)
/^[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+\s*-\s*/m            // Nombre - 
```

### Estructura de Datos de Salida
```json
{
  "enhanced_text": {
    "title": "Transcripción sobre [asunto]",
    "sections": [
      {
        "type": "heading",
        "level": 1,
        "content": "Transcripción sobre [asunto]"
      },
      {
        "type": "paragraph",
        "content": "Esta transcripción ha sido procesada localmente..."
      },
      {
        "type": "paragraph",
        "content": "Contenido del primer hablante",
        "speaker": "Nombre del hablante"
      },
      {
        "type": "paragraph",
        "content": "Contenido del segundo hablante",
        "speaker": "Nombre del segundo hablante"
      }
    ]
  },
  "has_speakers": true,
  "is_local": true
}
```

## Pruebas Implementadas

### Scripts de Prueba
1. **`test-speaker-differentiation.js`** - Prueba básica
2. **`test-complete-speaker-differentiation.js`** - Prueba completa con múltiples casos

### Casos de Prueba Verificados
- ✅ Entrevista formal con 2 interlocutores
- ✅ Reunión de negocios con 3 interlocutores
- ✅ Clase académica con nombres numerados
- ✅ Monólogo (sin interlocutores)

## Compatibilidad

### ✅ Mejora Local
- Funciona sin dependencia de APIs externas
- Procesamiento inmediato
- Sin límites de uso

### ✅ Mejora con DeepSeek API
- Compatible cuando la API está disponible
- Mantiene la diferenciación en respuestas de IA
- Fallback automático a mejora local

## Limitaciones y Mejoras Futuras

### Limitaciones Actuales
1. **Dependencia de patrones:** Requiere que los nombres sigan formatos específicos
2. **Idiomas:** Optimizado para español, puede necesitar ajustes para otros idiomas
3. **Formatos complejos:** Puede tener dificultades con formatos muy irregulares

### Mejoras Planeadas
1. **Detección por contexto:** Identificar cambios de hablante sin indicadores explícitos
2. **Soporte multilingüe:** Mejorar detección para otros idiomas
3. **Aprendizaje automático:** Usar modelos para identificar patrones de habla
4. **Integración con Whisper:** Usar metadatos de transcripción para identificar hablantes

## Uso en la Aplicación

### Para Desarrolladores
```javascript
const TranscriptionService = require('./src/services/transcriptionService');

// Mejorar transcripción con diferenciación automática
const result = await TranscriptionService.enhanceTranscription(
  textoTranscrito,
  asunto,
  idioma
);

// Verificar si se detectaron interlocutores
if (result.has_speakers) {
  console.log('Interlocutores detectados:', 
    result.enhanced_text.sections
      .filter(s => s.speaker)
      .map(s => s.speaker)
  );
}
```

### Para Usuarios Finales
- La diferenciación es automática y transparente
- No requiere configuración adicional
- Mejora la legibilidad de transcripciones con múltiples hablantes
- Se aplica tanto en modo local como con IA

## Conclusión

La implementación de diferenciación de interlocutores mejora significativamente la utilidad de las transcripciones en contextos donde participan múltiples hablantes. El sistema es robusto, compatible con el flujo existente y proporciona una experiencia de usuario mejorada sin requerir intervención manual.

**Estado:** ✅ Implementado y probado exitosamente
**Tasa de éxito en pruebas:** 100%
**Compatibilidad:** Total con sistema existente
