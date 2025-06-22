import { Injectable } from '@nestjs/common';

@Injectable()
export class DomainService {
  extractDomain(question: string): string | null {
    const domainMatch = question.match(/(?:https?:\/\/)?(?:www\.)?([a-zA-Z0-9-]+\.[a-zA-Z]{2,})/i);
    return domainMatch ? domainMatch[1].toLowerCase() : null;
  }

  validateDomain(domain: string): boolean {
    const validTLDs = [
      // Generic TLDs
      'com', 'org', 'net', 'info', 'biz', 'gov', 'edu', 'mil', 'int',
      // Country-code TLDs (selection)
      'us', 'uk', 'ca', 'de', 'fr', 'au', 'jp', 'cn', 'in', 'br', 'ru', 'za', 'nl', 'se', 'no', 'es', 'it', 'ch', 'be', 'dk', 'fi', 'pl', 'tr', 'mx', 'kr', 'ar', 'at', 'cz', 'gr', 'hu', 'ie', 'il', 'nz', 'pt', 'ro', 'sg', 'sk', 'th', 'ua', 'vn',
      // Popular new gTLDs
      'io', 'ai', 'co', 'app', 'dev', 'online', 'site', 'tech', 'store', 'blog', 'me', 'cloud', 'space', 'website', 'live', 'fun', 'world', 'today', 'news', 'agency', 'solutions', 'digital', 'company', 'group', 'life', 'center', 'media', 'systems', 'network', 'services', 'academy', 'support', 'email', 'finance', 'consulting', 'design', 'events', 'institute', 'marketing', 'software', 'tools', 'ventures', 'works', 'zone', 'shop', 'team', 'capital', 'city', 'club', 'express', 'global', 'health', 'host', 'law', 'partners', 'press', 'school', 'social', 'studio', 'tips', 'university', 'vip', 'wiki', 'gallery', 'graphics', 'photo', 'photos', 'pictures', 'video', 'audio', 'film', 'tv', 'radio', 'music', 'games', 'game', 'play', 'run', 'coach', 'fitness', 'care', 'clinic', 'dental', 'doctor', 'healthcare', 'hospital', 'surgery', 'vision', 'fashion', 'jewelry', 'shoes', 'toys', 'travel', 'vacations', 'flights', 'cruise', 'holiday', 'hotel', 'apartments', 'rentals', 'restaurant', 'cafe', 'bar', 'pub', 'pizza', 'wine', 'beer', 'coffee', 'kitchen', 'recipes', 'menu', 'food', 'organic', 'farm', 'garden', 'flowers', 'green', 'energy', 'solar', 'eco', 'earth', 'water', 'science', 'technology', 'engineering', 'education', 'courses', 'study', 'degree', 'mba', 'phd', 'lawyer', 'legal', 'attorney', 'accountant', 'bank', 'insurance', 'mortgage', 'loans', 'credit', 'fund', 'investments', 'exchange', 'market', 'trade', 'money', 'pay', 'cash', 'gold', 'silver', 'diamond', 'luxury', 'estate', 'property', 'realty', 'homes', 'house', 'apartments', 'rentals', 'lease', 'construction', 'builders', 'contractors', 'repair', 'cleaning', 'plumbing', 'electric', 'security', 'safety', 'fire', 'alarm', 'guard', 'protection', 'defense', 'army', 'navy', 'airforce', 'police', 'gov', 'mil', 'int'
    ];
    const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]*(\.[a-zA-Z0-9][a-zA-Z0-9-]*)*\.[a-zA-Z]{2,}$/;
    
    if (!domainRegex.test(domain)) {
      return false;
    }

    const extension = domain.split('.').pop()?.toLowerCase();
    return extension ? validTLDs.includes(extension) : false;
  }
} 