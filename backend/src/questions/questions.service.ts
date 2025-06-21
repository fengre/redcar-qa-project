import { Injectable } from '@nestjs/common';

@Injectable()
export class QuestionsService {
  extractDomain(question: string): string | null {
    const domainMatch = question.match(/(?:https?:\/\/)?(?:www\.)?([a-zA-Z0-9-]+\.[a-zA-Z]{2,})/i);
    return domainMatch ? domainMatch[1].toLowerCase() : null;
  }

  validateDomain(domain: string): boolean {
    // List of valid TLDs (Top Level Domains)
    const validTLDs = ['com', 'org', 'net', 'edu', 'gov', 'io', 'ai', 'co'];
    
    // Updated regex to support subdomains
    const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]*(\.[a-zA-Z0-9][a-zA-Z0-9-]*)*\.[a-zA-Z]{2,}$/;
    if (!domainRegex.test(domain)) {
      return false;
    }

    // Get the TLD (last part of the domain)
    const extension = domain.split('.').pop()?.toLowerCase();
    return extension ? validTLDs.includes(extension) : false;
  }
} 