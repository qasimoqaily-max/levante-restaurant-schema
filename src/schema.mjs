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
  ];
}

export function restaurantGraph(site, page, labels) {
  const canonical = abs(site, page.route);
  const restaurant = {
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
    menu: abs(site, '/speisekarte/'),
    hasMenu: { '@id': `${site.baseUrl}/speisekarte/#menu` },
    acceptsReservations: true,
    sameAs: Object.values(site.social),
    areaServed: {
      '@type': 'City',
      name: 'Radolfzell am Bodensee',
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
          name: labels.reserve,
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

  const graph = baseNodes(site, page, labels.home);
  graph.push(restaurant);
  graph.push({
    '@type': 'ImageObject',
    '@id': `${site.baseUrl}/#primaryimage`,
    url: abs(site, '/assets/img/levante-og.jpg'),
    contentUrl: abs(site, '/assets/img/levante-og.jpg'),
    width: 1200,
    height: 630,
    caption: 'Levante Restaurant Radolfzell',
  });
  return { '@context': schema, '@graph': graph };
}

// Exact meat/poultry IDs approved by the owner on 2026-11-04.
// Do not infer halal status for unlisted items or override vegan/vegetarian diets.
const halalItemIds = new Set([
  'kebbeh', 'arays-lahmeh', 'lamb-soup', 'chicken-salad', 'chicken-tajine',
  'lamb-tajine', 'kafta-mishwiyeh', 'shish-taouk', 'mix-grill', 'lahmeh-mishwiyeh',
]);

function dietUri(diet, itemId) {
  if (diet === 'vegan') return `${schema}/VeganDiet`;
  if (diet === 'vegetarian') return `${schema}/VegetarianDiet`;
  if (halalItemIds.has(itemId)) return `${schema}/HalalDiet`;
  return undefined;
}

export function menuGraph(site, page, menu, labels) {
  const canonical = abs(site, page.route);
  const sections = menu.sections.map(section => ({
    '@type': 'MenuSection',
    '@id': `${canonical}#${section.id}`,
    name: section.name[page.lang],
    ...(section.note[page.lang] ? { description: section.note[page.lang] } : {}),
    hasMenuItem: section.items.map(item => ({
      '@type': 'MenuItem',
      '@id': `${canonical}#${item.id}`,
      name: item.name[page.lang],
      ...(item.description[page.lang] ? { description: item.description[page.lang] } : {}),
      ...(dietUri(item.diet, item.id) ? { suitableForDiet: dietUri(item.diet, item.id) } : {}),
      offers: {
        '@type': 'Offer',
        price: item.price,
        priceCurrency: menu.currency,
        availability: `${schema}/InStock`,
        url: canonical,
      },
    })),
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
  graph.push({
    '@type': 'Restaurant',
    '@id': `${site.baseUrl}/#restaurant`,
    name: site.business.name,
    url: `${site.baseUrl}/`,
    menu: canonical,
    hasMenu: { '@id': `${canonical}#menu` },
    servesCuisine: site.business.cuisines,
    acceptsReservations: true,
    telephone: '+49 7732 9589075',
    address: {
      '@type': 'PostalAddress',
      streetAddress: site.business.street,
      postalCode: site.business.postalCode,
      addressLocality: site.business.locality,
      addressRegion: site.business.region,
      addressCountry: site.business.country,
    },
  });
  return { '@context': schema, '@graph': graph };
}

export function pageGraph(site, page, breadcrumbName) {
  return { '@context': schema, '@graph': baseNodes(site, page, breadcrumbName) };
}
