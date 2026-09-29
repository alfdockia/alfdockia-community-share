# AlfDockia Community Share

Extensión de Alfresco Share que incorpora búsqueda documental por lenguaje
natural al Navegador de nodos y a Búsqueda avanzada.

## Identidad del módulo

- Aplicativo: `alfdockia-community-share`
- Coordenadas Maven: `alfdockia.community.share:alfdockia-community-share:1.0.0`
- Módulo Alfresco: `alfdockia-community-share`
- Paquete Aikau: `alfdockia/community/share`
- Licencia: GNU Affero General Public License v3.0

Este repositorio contiene exclusivamente la capa Share. Search e Indexer son
servicios externos y no se implementan ni empaquetan aquí.

## Funcionamiento

El Navegador de nodos añade `IA-Search` como lenguaje de consulta. Búsqueda
avanzada añade un formulario de lenguaje natural, filtros dinámicos de tipos,
aspectos y propiedades, y navegación por resultados paginados.

La interfaz llama a dos webscripts autenticados de Share:

- `/share/service/alfdockia-community-share/search`
- `/share/service/alfdockia-community-share/dictionary`

El primer webscript obtiene el usuario y las autoridades de la sesión de
Share, normaliza la petición y envía POST `/search` al servicio Search
configurado. El segundo consulta el diccionario de Alfresco para construir los
selectores de metadatos. Share no genera embeddings ni accede directamente a
Qdrant.

## Requisitos

- Java compatible con Alfresco SDK 4.15.
- Maven 3.8 o posterior.
- Node.js 20 o posterior para ejecutar las pruebas JavaScript.
- Alfresco Content Services Community 26.1 y Share 26.1.
- Un servicio Search accesible mediante HTTP y compatible con `/search`.

## Configuración

La configuración filtrada para Docker se encuentra en
`src/main/docker/share-config-custom.xml`. Los valores predeterminados se
declaran en `pom.xml`:

```xml
<alfdockia.community.share.search.url>http://host.docker.internal:8084</alfdockia.community.share.search.url>
<alfdockia.community.share.search.endpointId>alfdockia-community-share-search</alfdockia.community.share.search.endpointId>
<alfdockia.community.share.search.path>/search</alfdockia.community.share.search.path>
<alfdockia.community.share.language.label>IA-Search</alfdockia.community.share.language.label>
<alfdockia.community.share.default.maxItems>25</alfdockia.community.share.default.maxItems>
<alfdockia.community.share.maxItems.limit>100</alfdockia.community.share.maxItems.limit>
```

Para una instalación sin filtrado Maven puede adaptarse
`src/main/resources/META-INF/share-config-custom.xml`.

## Compilación

```bash
mvn clean package
```

El artefacto principal se genera en
`target/alfdockia-community-share-1.0.0.jar` y se copia también a
`target/extensions/alfdockia-community-share-1.0.0.jar` para la imagen Docker.

## Pruebas

```bash
node --test src/test/js/*.test.js
```

La suite comprueba transporte de consultas, filtros de metadatos, cursores,
renderizado, identidad del proyecto y cobertura de copyright. El build Maven
regenera los archivos JavaScript minificados desde sus fuentes.

## Desarrollo con Docker

```bash
./run.sh build_start
```

En Windows:

```powershell
.\run.bat build_start
```

Share queda disponible, por defecto, en `http://localhost:8180/share`.

## Documentación

- [Arquitectura](docs/architecture.md)
- [API JavaScript](docs/javascript-api.md)
- [Webscripts](docs/webscripts.md)
- [Configuración](docs/configuration.md)
- [Licencia y copyright](docs/licensing.md)

---
Copyright (C) 2026 AIgen Technologies S.L.
Licenciado bajo GNU Affero General Public License v3.0 ([LICENSE](LICENSE)).
