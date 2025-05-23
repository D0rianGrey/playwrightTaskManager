/**
 * JSON Schema Validator
 * Provides validation of API responses against JSON schemas
 */
import Ajv, { ValidateFunction, ErrorObject, Options } from 'ajv';
import addFormats from 'ajv-formats';
import { Logger } from '@utils/Logger';

export interface ValidationResult {
  valid: boolean;
  errors?: ErrorObject[];
}

/**
 * SchemaValidator class for validating data against JSON Schema
 */
export class SchemaValidator {
  private readonly ajv: Ajv;
  private readonly schemas: Map<string, object>;
  private readonly validators: Map<string, ValidateFunction>;
  private readonly logger: Logger;

  /**
   * Create a new SchemaValidator
   * @param options Ajv options
   */
  constructor(options: Options = {}) {
    // Default options with some sensible defaults
    const defaultOptions: Options = {
      allErrors: true,              // Return all errors, not just the first one
      verbose: true,                // Include validated data in errors
      $data: true,                  // Enable $data references
      strict: false,                // Don't fail on unknown formats/keywords
      ...options
    };

    this.ajv = new Ajv(defaultOptions);
    this.logger = new Logger('SchemaValidator');

    // Add common formats like date, email, uri, etc.
    addFormats(this.ajv);

    this.schemas = new Map();
    this.validators = new Map();
  }

  /**
   * Register a schema for later use
   * @param name Schema name/identifier
   * @param schema JSON Schema object
   */
  registerSchema(name: string, schema: object): void {
    this.logger.debug(`Registering schema: ${name}`);

    // Store the schema
    this.schemas.set(name, schema);

    // Compile a validator function
    try {
      const validate = this.ajv.compile(schema);
      this.validators.set(name, validate);
    } catch (error) {
      this.logger.error(`Failed to compile schema ${name}:`, error);
      throw new Error(`Failed to compile schema ${name}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Validate data against a registered schema
   * @param data Data to validate
   * @param schemaName Name of the schema to validate against
   */
  validate<T>(data: T, schemaName: string): ValidationResult {
    this.logger.debug(`Validating data against schema: ${schemaName}`);

    // Get the validator function
    const validate = this.validators.get(schemaName);
    if (!validate) {
      throw new Error(`Schema '${schemaName}' not found. Make sure to register it first.`);
    }

    // Validate the data
    const valid = validate(data);

    if (!valid) {
      this.logger.debug(`Validation failed for schema ${schemaName}:`, validate.errors);
      return {
        valid: false,
        errors: validate.errors
      };
    }

    return { valid: true };
  }

  /**
   * Get a registered schema
   * @param name Schema name
   */
  getSchema(name: string): object | undefined {
    return this.schemas.get(name);
  }

  /**
   * Check if a schema is registered
   * @param name Schema name
   */
  hasSchema(name: string): boolean {
    return this.schemas.has(name);
  }

  /**
   * Get all registered schema names
   */
  getSchemaNames(): string[] {
    return Array.from(this.schemas.keys());
  }

  /**
   * Format validation errors in a human-readable way
   * @param errors Validation errors
   */
  formatErrors(errors: ErrorObject[] | undefined): string[] {
    if (!errors || errors.length === 0) {
      return [];
    }

    return errors.map(error => {
      const path = error.instancePath || '';
      const property = error.params.property || '';

      switch (error.keyword) {
        case 'required':
          return `Missing required property: ${property}`;
        case 'type':
          return `${path} should be ${error.params.type}`;
        case 'format':
          return `${path} should match format: ${error.params.format}`;
        case 'enum':
          return `${path} should be one of: ${(error.params.allowedValues as []).join(', ')}`;
        case 'minimum':
        case 'maximum':
        case 'minLength':
        case 'maxLength':
        case 'minItems':
        case 'maxItems':
          return `${path} ${error.message}`;
        default:
          return `${path} ${error.message}`;
      }
    });
  }
}
