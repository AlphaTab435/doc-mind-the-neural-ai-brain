/**
 * Logging utilities for API functions
 */

interface LogConfig {
  context: string;
  showInProduction?: boolean;
}

/**
 * Logger for API functions with context awareness
 */
export class Logger {
  private context: string;
  private showInProduction: boolean;

  constructor(config: LogConfig) {
    this.context = config.context;
    this.showInProduction = config.showInProduction ?? true;
  }

  private log(level: 'info' | 'error' | 'warn', message: string, ...args: any[]) {
    const prefix = `[${this.context}]`;
    
    if (level === 'error') {
      console.error(prefix, message, ...args);
    } else if (level === 'warn') {
      console.warn(prefix, message, ...args);
    } else {
      console.log(prefix, message, ...args);
    }
  }

  info(message: string, ...args: any[]) {
    this.log('info', message, ...args);
  }

  error(message: string, ...args: any[]) {
    this.log('error', message, ...args);
  }

  warn(message: string, ...args: any[]) {
    this.log('warn', message, ...args);
  }

  /**
   * Log API key security information for Vercel backend
   */
  securityCheck(hasApiKey: boolean, source: 'env' | 'header' = 'env') {
    if (hasApiKey) {
      this.info(`🔒 API Key verified from ${source.toUpperCase()}`);
    } else {
      this.error('⚠️  SECURITY: No API key found! Request will fail.');
    }
  }

  /**
   * Log model attempt with fallback information
   */
  modelAttempt(model: string, isPrimary: boolean, attemptNumber?: number) {
    const emoji = isPrimary ? '🚀 PRIMARY' : `🔄 FALLBACK #${attemptNumber}`;
    this.info(`${emoji} → Trying: ${model}`);
  }

  /**
   * Log successful model response
   */
  modelSuccess(model: string, statusCode?: number) {
    const status = statusCode ? ` (Status: ${statusCode})` : '';
    this.info(`✅ SUCCESS → Model: ${model}${status}`);
  }

  /**
   * Log model failure
   */
  modelFailure(model: string, reason?: string) {
    this.error(`❌ FAILED → Model: ${model}${reason ? ` - ${reason}` : ''}`);
  }
}
