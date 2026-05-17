const IMMOCG_CONFIG = {
  ville: 'Brazzaville',
  phone: '+242 06 883 4146',
  phoneRaw: '242068834146',
  email: 'contact@immocg.com',
  whatsappMessage: 'Bonjour ImmoCG, je cherche un logement à Brazzaville',
  quartiers: [
    'Bacongo',
    'Poto-Poto',
    'Moungali',
    'Ouenzé',
    'Makélékélé',
    'Centre-ville',
    'Plateau des 15 ans',
    'Tié-Tié',
    'Mfilou',
  ],
}

function normaliserTexte(str) {
  return (str || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}
