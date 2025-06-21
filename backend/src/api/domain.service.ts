import { Injectable } from '@nestjs/common';

@Injectable()
export class DomainService {
  extractDomain(question: string): string | null {
    const domainMatch = question.match(/(?:https?:\/\/)?(?:www\.)?([a-zA-Z0-9-]+\.[a-zA-Z]{2,})/i);
    return domainMatch ? domainMatch[1].toLowerCase() : null;
  }

  validateDomain(domain: string): boolean {
    const validTLDs = ['com', 'org', 'net', 'edu', 'gov', 'io', 'ai', 'co'];
    const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]*(\.[a-zA-Z0-9][a-zA-Z0-9-]*)*\.[a-zA-Z]{2,}$/;
    
    if (!domainRegex.test(domain)) {
      return false;
    }

    const extension = domain.split('.').pop()?.toLowerCase();
    return extension ? validTLDs.includes(extension) : false;
  }
} 