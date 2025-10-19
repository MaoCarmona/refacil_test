## 📚 Respuestas a Preguntas Conceptuales

### 1. ¿Cómo manejarías picos altos de transacciones para garantizar escalabilidad?

Para manejar picos altos de transacciones, implementaría una estrategia multicapa:

**Arquitectura de Microservicios:**
- Separar responsabilidades en servicios independientes (transacciones, usuarios, notificaciones)
- Usar colas de mensajes (Redis/RabbitMQ) para desacoplar procesamiento

**Escalabilidad Horizontal:**
- Auto-scaling basado en métricas de CPU/memoria
- Load balancing con algoritmos round-robin o least-connections
- Configuración de Kubernetes HPA (Horizontal Pod Autoscaler)

**Optimización de Base de Datos:**
- Uso de índices compuestos para consultas frecuentes
- Particionamiento de tablas por fecha/rango
- Read replicas para consultas de solo lectura

**Caching Estratégico:**
- Redis para sesiones de usuario y datos frecuentes
- Cache de saldos para reducir consultas a BD
- Invalidación inteligente de cache

**Monitoreo y Alertas:**
- Métricas con Prometheus/Grafana
- Alertas automáticas por thresholds
- Circuit breakers para fallos en cascada

### 2. ¿Qué estrategias usarías para prevenir fraudes en un sistema de billetera digital?

**Estrategias de Prevención:**

**Autenticación y Autorización:**
- Multi-factor authentication (MFA)
- Verificación biométrica para transacciones grandes
- Límites por dispositivo/geolocalización

**Monitoreo de Patrones:**
- Machine Learning para detectar anomalías
- Análisis de comportamiento del usuario
- Detección de dispositivos/ubicaciones sospechosas

**Límites y Controles:**
- Límites progresivos por monto/tiempo/frecuencia
- Bloqueo temporal por intentos fallidos
- Verificación manual para transacciones atípicas

**Sistema de Alertas:**
- Alertas en tiempo real para actividades sospechosas
- Notificaciones push a usuarios afectados
- Integración con sistemas externos de prevención de fraude

**Auditoría Completa:**
- Logging inmutable de todas las operaciones
- Cadena de custodia para investigaciones
- Cumplimiento con regulaciones (PCI DSS, GDPR)

### 3. Si detectas lentitud en el procesamiento de transacciones por alta concurrencia, ¿cómo procederías para mejorar el rendimiento?

**Diagnóstico Inicial:**
- Profiling de aplicación con herramientas como Clinic.js
- Análisis de métricas de sistema (CPU, memoria, I/O)
- Identificación de cuellos de botella específicos

**Optimizaciones de Base de Datos:**
- Optimización de consultas lentas con EXPLAIN ANALYZE
- Índices adicionales en columnas frecuentemente consultadas
- Configuración de connection pooling

**Mejoras de Código:**
- Implementación de caching para datos estáticos
- Uso de promesas en lugar de callbacks anidados
- Optimización de algoritmos y estructuras de datos

**Estrategias de Concurrencia:**
- Uso de workers/threads para procesamiento paralelo
- Implementación de colas para operaciones no críticas
- Circuit breakers para servicios externos

**Monitoreo Continuo:**
- Métricas de rendimiento en tiempo real
- Alertas automáticas por degradación
- Dashboards para visualización de KPIs

**Escalabilidad Dinámica:**
- Auto-scaling basado en métricas personalizadas
- Configuración de recursos mínimos/máximos
- Estrategias de fallback para picos extremos

## 📘 Swagger / OpenAPI

- UI disponible en `/docs` cuando la app está corriendo.
- Esquema OpenAPI se genera automáticamente desde DTOs y decoradores.
- Ejecución local:


**Desarrollado con ❤️ por Kevin Mauricio Carmona Loaiza - Software Engineer**