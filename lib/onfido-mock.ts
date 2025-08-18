// Mock Onfido service for development when API token is not available
import { randomUUID } from 'crypto';

export interface MockApplicant {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  created_at: string;
}

export interface MockSdkToken {
  token: string;
  expires_at: string;
}

export interface MockCheck {
  id: string;
  applicant_id: string;
  status: 'in_progress' | 'complete';
  result: 'clear' | 'consider';
  created_at: string;
  report_names: string[];
}

export class MockOnfidoService {
  private static applicants: Map<string, MockApplicant> = new Map();
  private static checks: Map<string, MockCheck> = new Map();

  static createApplicant(data: {
    first_name: string;
    last_name: string;
    email: string;
  }): MockApplicant {
    const applicant: MockApplicant = {
      id: `mock_applicant_${randomUUID()}`,
      first_name: data.first_name,
      last_name: data.last_name,
      email: data.email,
      created_at: new Date().toISOString()
    };

    this.applicants.set(applicant.id, applicant);
    return applicant;
  }

  static generateSdkToken(_applicantId: string): MockSdkToken {
    return {
      token: `mock_token_${randomUUID()}`,
      expires_at: new Date(Date.now() + 90 * 60 * 1000).toISOString() // 90 minutes
    };
  }

  static createCheck(data: {
    applicant_id: string;
    report_names: string[];
  }): MockCheck {
    const check: MockCheck = {
      id: `mock_check_${randomUUID()}`,
      applicant_id: data.applicant_id,
      status: 'in_progress',
      result: 'clear', // Always pass in mock mode
      created_at: new Date().toISOString(),
      report_names: data.report_names
    };

    this.checks.set(check.id, check);
    
    // Simulate processing delay by marking as complete after creation
    setTimeout(() => {
      const existingCheck = this.checks.get(check.id);
      if (existingCheck) {
        existingCheck.status = 'complete';
        this.checks.set(check.id, existingCheck);
      }
    }, 2000); // 2 second delay

    return check;
  }

  static findCheck(checkId: string): MockCheck | null {
    return this.checks.get(checkId) || null;
  }

  static isConfigured(): boolean {
    const apiToken = process.env.ONFIDO_API_TOKEN;
    return !!(apiToken && apiToken !== 'your_onfido_api_token_here' && apiToken !== 'placeholder_token');
  }

  static isMockMode(): boolean {
    return !this.isConfigured() && process.env.NODE_ENV === 'development';
  }
}