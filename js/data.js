/* ============================================================
   CHUKARO — Datos del sitio (semilla)
   Secciones y videos extraídos del portafolio de Vimeo:
   https://vimeo.com/user80994707  (chukaro films)
   El panel de administración puede editar/ocultar/agregar videos;
   los cambios se guardan en localStorage y sobreescriben esta semilla.
   ============================================================ */
(function () {
  'use strict';

  var VIMEO_USER = 'https://vimeo.com/user80994707';

  // Video principal (reel de apertura, fondo del hero)
  var HERO_VIDEO = {
    id: '1237336294',
    title: 'Gustavo Bezek — Reel 2022',
    duration: 91,
    thumb: 'https://i.vimeocdn.com/video/2214065090-587a0c5e62b4ec75e5850d7755006a3790b3558074736851655d1e9b72ff65c6-d_640'
  };

  function v(id, title, duration, thumb, desc, featured) {
    return {
      id: id,
      title: title,
      duration: duration,
      thumb: thumb,
      desc: desc || '',
      featured: !!featured,
      visible: true
    };
  }

  var SEED = {
    version: 1,
    vimeoUser: VIMEO_USER,
    heroVideo: HERO_VIDEO,
    settings: {
      email: 'hola@chukaro.com',
      location: 'Buenos Aires · Argentina',
      instagram: '' // opcional, ej: 'https://instagram.com/chukaro'
    },
    ui: {
      reel: true,      // carrusel de destacados
      estudio: true,   // sección "estudio"
      contacto: true   // sección "contacto"
    },
    sections: [
      {
        id: 'vfx',
        num: '01',
        visible: true,
        videos: [
          v('1237333294', '¿Que pasaría si no te Bañas', 46,
            'https://i.vimeocdn.com/video/2214061236-80b0b388032cde2599b13ef5b92dbafa47788cb4786c8228bfa3416ccce7b8fc-d_640',
            'Composición integral: integración de efectos y acabado final.', true),
          v('1237317538', 'Rotoscopia UPD', 12,
            'https://i.vimeocdn.com/video/2214041334-8c446f14ce7e5544a3489c35c68abc9178a1edc3bb5cb0b513343f5c382ae1ea-d_640',
            'Rotoscopía y clean plate en resolución nativa 4K+.', true),
          v('1237316829', 'UNICEF', 34,
            'https://i.vimeocdn.com/video/2214040444-5258bbd614b1a76ac03ba5cf4dd11f667860b56354c16995e60aaf279976cf78-d_640',
            'Pieza institucional con composición y retoque digital.', false),
          v('1237316828', 'Yogurisimo — Proceso', 6,
            'https://i.vimeocdn.com/video/2214040463-4b642168ca1c1993815f3463cb1e88c3c129c14e4d0ef64926172d2ea96248a1-d_640',
            'Breakdown de proceso: de placa original a plano final.', false),
          v('1237316825', 'Papas', 9,
            'https://i.vimeocdn.com/video/2214040450-26085152965fa1296a635aed58543521274fd2d69da66ab643df17f3448a4a4f-d_640',
            'Integración de elementos y matching de luz.', false),
          v('277372170', 'Videoclip', 34,
            'https://i.vimeocdn.com/video/710128366-861dda2dfb1f8067d230fa5f843d893c0c2702b002682eb9021d8babc0fba6f7-d_640',
            'Efectos y acabado para videoclip en 4K.', false)
        ]
      },
      {
        id: 'motion',
        num: '02',
        visible: true,
        videos: [
          v('259765453', 'Apertura MOTIVADOS', 87,
            'https://i.vimeocdn.com/video/688496129-2db0e00c0fa4593a887d3c930e7b50871a9bcf4fa5a7429208dca0794a4925c7-d_640',
            'Diseño en movimiento: apertura y sistema gráfico animado.', true),
          v('1237333343', 'HA-ASH — Eso No Va a Suceder · Lyric Video', 226,
            'https://i.vimeocdn.com/video/2214061321-0ea2fd48e0a2fa39e04eae7efdd6a30ea7df5da109a51228e57b9635c2b3c0ae-d_640',
            'Lyric video: tipografía animada sincronizada al tema.', true),
          v('301071828', 'Apertura Rugby Sevens 2019', 10,
            'https://i.vimeocdn.com/video/739550529-8553f1889f112fe568ae8c8ea233b0739e3cf5da74bef012b449d93a7432bd60-d_640',
            'Apertura deportiva con animación 2D/3D.', false),
          v('301074046', 'Agenda Polo 2018', 31,
            'https://i.vimeocdn.com/video/739556610-e23a0beb62c1d925396d33dd5fb8d836e0d601f03b15f8662c3da29c1fc5e63e-d_640',
            'Campaña animada para agenda institucional.', false),
          v('260141624', 'Infiora', 24,
            'https://i.vimeocdn.com/video/688786282-6236eb6519a0cda3c6f0ba83d4dd1ea43b41dd41556d5d40fde44e5d7db30b6e-d_640',
            'Pieza cuadrada para redes con motion de producto.', false),
          v('260143671', 'Juanita Jo', 14,
            'https://i.vimeocdn.com/video/688788560-2dd0a52eefb0d1a9faa434a72fb0cdfce635b74bec0e1835a40b130f0a1dfec6-d_640',
            'Animación de marca para contenido social.', false)
        ]
      },
      {
        id: 'edicion',
        num: '03',
        visible: true,
        videos: [
          v('1237333341', 'Crímenes de Familia — Tráiler', 110,
            'https://i.vimeocdn.com/video/2214061277-6fc45cac802811c2f8c6968262d771b9f4d4628c3eadb04079bb2d93ae85b189-d_640',
            'Montaje y conformado de tráiler de largometraje.', true),
          v('1237333346', 'HA-ASH — Llueve Sobre Mojado', 208,
            'https://i.vimeocdn.com/video/2214061325-6a5ab1668e1f72c2577902935366b39e2bf81fb268bd96c6f75c3f6b50d6626c-d_640',
            'Edición y etalonaje de videoclip.', true),
          v('1237333297', 'Burger King — Halloween', 35,
            'https://i.vimeocdn.com/video/2214061222-0650a419dc057386cc9111646b148f692649fab4676c9bc763dec632b2bbb71e-d_640',
            'Spot publicitario: edición y ritmo.', true),
          v('1237333298', 'Budweiser — Lollapalooza', 30,
            'https://i.vimeocdn.com/video/2214061216-b5cf5b26b08883a648f94f76fc4856d87d33e68bc427f9ae5d81b3cf88d9e651-d_640',
            'Contenido de marca para evento, formato cuadrado.', false),
          v('1237333377', 'NIKE — Voces en Movimiento', 1827,
            'https://i.vimeocdn.com/video/2214061499-478b957f94780a8be6f9abf101ddea97ad60786075af607fc17c5f3a6f15d117-d_640',
            'Programa completo: edición y postproducción integral.', false),
          v('262271886', 'Johnson & Johnson', 80,
            'https://i.vimeocdn.com/video/691500436-e4a61e58c5255309663f8b2385297887ca93384884d96b7a3677dc5566a7f6bb-d_640',
            'Pieza corporativa de marca.', false),
          v('1237333295', 'Alicante — Mix Brasas', 6,
            'https://i.vimeocdn.com/video/2214061221-5585bb09de5ea31dfa420a6bfc4906fe8314a3ead0109f1a225f91b4620994c5-d_640',
            'Corte rápido de contenido gastronómico.', false),
          v('277371362', 'Panamá Viejo', 15,
            'https://i.vimeocdn.com/video/710128209-e84c00a3bd60bbcb4835c8cb9e757c51600c41b9c3cf13fa2af24aa18cac9323-d_640',
            'Pieza documental en 4K.', false),
          v('301081319', 'Informe Irlanda', 7,
            'https://i.vimeocdn.com/video/739565529-c908f6a5b6abe922a3349065cb8a2d764c5502e967ec9c26d30a0fb7f111d0fe-d_640',
            'Nota de informe con edición de archivo.', false)
        ]
      },
      {
        id: 'ia',
        num: '04',
        visible: true,
        videos: [
          v('1237333384', 'VERANO PARA BRAHMEALA', 30,
            'https://i.vimeocdn.com/video/2214061324-2c566f32ad18975a098c473cdd4cb2308d8ffc7944c4554fcda40c7200e3434d-d_640',
            'Pieza generada y finalizada con herramientas de IA.', true),
          v('1237333339', 'EuReKa!', 30,
            'https://i.vimeocdn.com/video/2214061291-8353cbd87b86dd9ebd6e2d3e896972a37a75a74941619a5109374f823e8d64de-d_640',
            'Exploración audiovisual con video generativo.', true)
        ]
      }
    ]
  };

  window.CHUKARO_SEED = SEED;
})();
