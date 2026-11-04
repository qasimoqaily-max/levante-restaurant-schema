import { itemDiet } from './diet.mjs';
import { t, routeByLang } from './i18n.mjs';

const schema = 'https://schema.org';

function abs(site, route) {
  return new URL(route, `${site.baseUrl}/`).href;
}

function openingHours(site) {
  return [
    {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday'].map(day => `${schema}/${day}`),
      opens: site.hours.main.monThu[0],
      closes: site.hours.main.monThu[1],
    },
    {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: ['Friday', 'Saturday'].map(day => `${schema}/${day}`),
      opens: site.hours.main.friSat[0],
      closes: site.hours.main.friSat[1],
    },
    {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: `${schema}/Sunday`,
      opens: site.hours.main.sun[0],
      closes: site.hours.main.sun[1],
    },
  ];
}

function baseNodes(site, page, breadcrumbName) {
  const canonical = abs(site, page.route);
  return [
    {
      '@type': 'WebSite',
      '@id': `${site.baseUrl}/#website`,
      url: `${site.baseUrl}/`,
      name: site.business.name,
      inLanguage: ['de', 'en', 'ar'],
      publisher: { '@id': `${site.baseUrl}/#restaurant` },
    },
    {
      '@type': 'WebPage',
      '@id': `${canonical}#webpage`,
      url: canonical,
      name: page.title,
      description: page.description,
      inLanguage: page.lang,
      isPartOf: { '@id': `${site.baseUrl}/#website` },
      about: { '@id': `${site.baseUrl}/#restaurant` },
      breadcrumb: { '@id': `${canonical}#breadcrumb` },
    },
    {
      '@type': 'BreadcrumbList',
      '@id': `${canonical}#breadcrumb`,
      itemListElement: page.route === '/'
        ? [{ '@type': 'ListItem', position: 1, name: breadcrumbName, item: `${site.baseUrl}/` }]
        : [
            { '@type': 'ListItem', position: 1, name: 'Levante Restaurant', item: `${site.baseUrl}/` },
            { '@type': 'ListItem', position: 2, name: breadcrumbName, item: canonical },
          ],
    },
    restaurantNode(site, page),
  ];
}

function restaurantNode(site, page) {
  const canonical = abs(site, page.route);
  const menuUrl = abs(site, routeByLang[page.lang].menu);
  return {
    '@type': 'Restaurant',
    '@id': `${site.baseUrl}/#restaurant`,
    name: site.business.name,
    url: `${site.baseUrl}/`,
    mainEntityOfPage: { '@id': `${canonical}#webpage` },
    image: [
      abs(site, '/assets/img/levante-og.jpg'),
      abs(site, '/assets/img/hero-table.webp'),
      abs(site, '/assets/img/garden-wide.webp'),
    ],
    logo: {
      '@type': 'ImageObject',
      '@id': `${site.baseUrl}/#logo`,
      url: abs(site, '/assets/img/levante-logo.webp'),
      contentUrl: abs(site, '/assets/img/levante-logo.webp'),
      width: 800,
      height: 800,
      caption: 'Levante Restaurant logo',
    },
    telephone: '+49 7732 9589075',
    email: site.business.email,
    priceRange: site.business.priceRange,
    currenciesAccepted: 'EUR',
    paymentAccepted: 'Cash, Debit Card, Credit Card, NFC mobile payment',
    servesCuisine: site.business.cuisines,
    address: {
      '@type': 'PostalAddress',
      streetAddress: site.business.street,
      postalCode: site.business.postalCode,
      addressLocality: site.business.locality,
      addressRegion: site.business.region,
      addressCountry: site.business.country,
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: site.business.geo.latitude,
      longitude: site.business.geo.longitude,
    },
    hasMap: site.actions.maps,
    openingHoursSpecification: openingHours(site),
    menu: menuUrl,
    hasMenu: { '@id': `${menuUrl}#menu` },
    acceptsReservations: true,
    sameAs: Object.values(site.social),
    areaServed: {
      '@type': 'City',
      name: site.business.locality,
    },
    potentialAction: [
      {
        '@type': 'ReserveAction',
        target: {
          '@type': 'EntryPoint',
          urlTemplate: site.actions.reserve,
          actionPlatform: [
            `${schema}/DesktopWebPlatform`,
            `${schema}/MobileWebPlatform`,
          ],
        },
        result: {
          '@type': 'FoodEstablishmentReservation',
          name: t(page.lang).actions.reserve,
        },
      },
      {
        '@type': 'OrderAction',
        target: {
          '@type': 'EntryPoint',
          urlTemplate: site.actions.order,
          actionPlatform: [
            `${schema}/DesktopWebPlatform`,
            `${schema}/MobileWebPlatform`,
          ],
        },
      },
    ],
  };
}

export function restaurantGraph(site, page, labels) {
  const canonical = abs(site, page.route);
  const graph = baseNodes(site, page, labels.home);
  graph.push({
    '@type': 'ImageObject',
    '@id': `${site.baseUrl}/#primaryimage`,
    url: abs(site, '/assets/img/levante-og.jpg'),
    contentUrl: abs(site, '/assets/img/levante-og.jpg'),
    width: 1200,
    height: 630,
    caption: 'Levante Restaurant Radolfzell',
  });
  if (page.kind === 'home') {
    graph.push({
      '@type': 'FAQPage',
      '@id': `${canonical}#faq`,
      inLanguage: page.lang,
      isPartOf: { '@id': `${canonical}#webpage` },
      mainEntity: t(page.lang).faq.map(([question, answer]) => ({
        '@type': 'Question',
        name: question,
        acceptedAnswer: { '@type': 'Answer', text: answer },
      })),
    });
  }
  return { '@context': schema, '@graph': graph };
}

export function menuGraph(site, page, menu, labels) {
  const canonical = abs(site, page.route);
  const sections = menu.sections.map(section => ({
    '@type': 'MenuSection',
    '@id': `${canonical}#${section.id}`,
    name: section.name[page.lang],
    ...(section.note[page.lang] ? { description: section.note[page.lang] } : {}),
    hasMenuItem: section.items.map(item => {
      const diet = itemDiet(item);
      return {
        '@type': 'MenuItem',
        '@id': `${canonical}#${item.id}`,
        name: item.name[page.lang],
        ...(item.description[page.lang] ? { description: item.description[page.lang] } : {}),
        ...(diet ? { suitableForDiet: diet.uri } : {}),
        offers: {
          '@type': 'Offer',
          price: item.price,
          priceCurrency: menu.currency,
          availability: `${schema}/InStock`,
          url: canonical,
        },
      };
    }),
  }));

  const graph = baseNodes(site, page, labels.menu);
  graph.push({
    '@type': 'Menu',
    '@id': `${canonical}#menu`,
    name: page.title,
    url: canonical,
    inLanguage: page.lang,
    mainEntityOfPage: { '@id': `${canonical}#webpage` },
    hasMenuSection: sections,
  });
  return { '@context': schema, '@graph': graph };
}

export function pageGraph(site, page, breadcrumbName) {
  return { '@context': schema, '@graph': baseNodes(site, page, breadcrumbName) };
}
