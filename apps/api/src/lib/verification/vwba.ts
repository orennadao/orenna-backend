import { EvidenceFile } from '@orenna/db';
import { MethodologyHandler, VerificationRequest, VerificationCalculation } from '../verification.js';

export interface VWBACalculationInputs {
  waterVolumeBaseline: number; // Baseline water volume (liters)
  waterVolumeProject: number;  // Project water volume (liters)
  projectArea: number;         // Project area (hectares)
  measurementPeriod: number;   // Measurement period (days)
  waterSource: string;         // Source of water benefit
  location: {
    latitude: number;
    longitude: number;
    watershed?: string;
  };
  methodology: {
    version: string;
    calculationMethod: string;
    uncertaintyFactor: number;
  };
}

export interface VWBAValidationCriteria {
  minimumMeasurementPeriod: number; // Minimum days of measurement
  maximumUncertainty: number;       // Maximum allowed uncertainty (%)
  requiredDataQuality: number;      // Minimum data quality score (0-1)
  spatialAccuracy: number;          // Required GPS accuracy (meters)
}

/**
 * Volumetric Water Benefit Accounting (VWBA) Implementation
 * Based on WRI VWBA 2.0 methodology
 */
export class VWBAMethodologyHandler implements MethodologyHandler {
  public readonly methodId = 'vwba-v2';
  
  private readonly defaultCriteria: VWBAValidationCriteria = {
    minimumMeasurementPeriod: 30,  // 30 days minimum
    maximumUncertainty: 20,        // 20% maximum uncertainty
    requiredDataQuality: 0.8,      // 80% data quality minimum
    spatialAccuracy: 10            // 10 meter GPS accuracy
  };

  getRequiredEvidenceTypes(): string[] {
    return [
      'WATER_MEASUREMENT_DATA',
      'BASELINE_ASSESSMENT',
      'SITE_VERIFICATION',
      'GPS_COORDINATES',
      'METHODOLOGY_DOCUMENTATION'
    ];
  }

  getMinimumConfidence(): number {
    return 0.8; // 80% confidence minimum for VWBA
  }

  /**
   * Validate VWBA verification request
   */
  async validate(
    request: VerificationRequest, 
    evidence: EvidenceFile[]
  ): Promise<VerificationCalculation> {
    
    // Check required evidence types
    const providedTypes = new Set(evidence.map(e => e.evidenceType));
    const requiredTypes = this.getRequiredEvidenceTypes();
    const missingTypes = requiredTypes.filter(type => !providedTypes.has(type));
    
    if (missingTypes.length > 0) {
      return {
        verified: false,
        confidenceScore: 0,
        calculationData: {
          error: 'Missing required evidence types',
          missingTypes,
          providedTypes: Array.from(providedTypes)
        },
        evidenceHash: this.calculateEvidenceHash(evidence),
        notes: `Missing required evidence: ${missingTypes.join(', ')}`
      };
    }

    try {
      // Extract and validate calculation inputs
      const inputs = await this.extractCalculationInputs(evidence);
      const validationResult = this.validateInputs(inputs);
      
      if (!validationResult.valid) {
        return {
          verified: false,
          confidenceScore: validationResult.confidence || 0,
          calculationData: {
            inputs,
            validationErrors: validationResult.errors,
            criteria: this.defaultCriteria
          },
          evidenceHash: this.calculateEvidenceHash(evidence),
          notes: validationResult.errors?.join('; ')
        };
      }

      // Perform VWBA calculation
      const calculation = this.calculateVWBA(inputs);
      
      // Determine verification status
      const verified = calculation.confidenceScore >= this.getMinimumConfidence();
      
      return {
        verified,
        confidenceScore: calculation.confidenceScore,
        calculationData: {
          inputs,
          calculation: calculation.results,
          methodology: 'VWBA v2.0',
          criteria: this.defaultCriteria,
          waterBenefitVolume: calculation.results.volumetricWaterBenefit,
          units: 'liters'
        },
        evidenceHash: this.calculateEvidenceHash(evidence),
        notes: calculation.notes
      };

    } catch (error) {
      return {
        verified: false,
        confidenceScore: 0,
        calculationData: {
          error: error instanceof Error ? error.message : 'Unknown calculation error',
          providedTypes: Array.from(providedTypes)
        },
        evidenceHash: this.calculateEvidenceHash(evidence),
        notes: `Calculation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Extract calculation inputs from evidence files
   */
  private async extractCalculationInputs(evidence: EvidenceFile[]): Promise<VWBACalculationInputs> {
    // Find water measurement data
    const waterMeasurementEvidence = evidence.find(e => e.evidenceType === 'WATER_MEASUREMENT_DATA');
    const baselineEvidence = evidence.find(e => e.evidenceType === 'BASELINE_ASSESSMENT');
    const siteEvidence = evidence.find(e => e.evidenceType === 'SITE_VERIFICATION');
    const gpsEvidence = evidence.find(e => e.evidenceType === 'GPS_COORDINATES');
    const methodologyEvidence = evidence.find(e => e.evidenceType === 'METHODOLOGY_DOCUMENTATION');

    if (!waterMeasurementEvidence || !baselineEvidence || !siteEvidence || !gpsEvidence) {
      throw new Error('Missing required evidence files for VWBA calculation');
    }

    // Extract data from evidence metadata
    // In a real implementation, this would parse actual file contents
    const inputs: VWBACalculationInputs = {
      waterVolumeBaseline: this.extractNumericValue(baselineEvidence, 'baselineWaterVolume', 0),
      waterVolumeProject: this.extractNumericValue(waterMeasurementEvidence, 'projectWaterVolume', 0),
      projectArea: this.extractNumericValue(siteEvidence, 'projectArea', 0),
      measurementPeriod: this.extractNumericValue(waterMeasurementEvidence, 'measurementPeriod', 0),
      waterSource: this.extractStringValue(siteEvidence, 'waterSource', 'groundwater'),
      location: {
        latitude: this.extractNumericValue(gpsEvidence, 'latitude', 0),
        longitude: this.extractNumericValue(gpsEvidence, 'longitude', 0),
        watershed: this.extractStringValue(gpsEvidence, 'watershed')
      },
      methodology: {
        version: '2.0',
        calculationMethod: this.extractStringValue(methodologyEvidence, 'calculationMethod', 'direct_measurement'),
        uncertaintyFactor: this.extractNumericValue(methodologyEvidence, 'uncertaintyFactor', 0.15)
      }
    };

    return inputs;
  }

  /**
   * Validate VWBA calculation inputs
   */
  private validateInputs(inputs: VWBACalculationInputs): {
    valid: boolean;
    confidence?: number;
    errors?: string[];
  } {
    const errors: string[] = [];
    let confidence = 1.0;

    // Validate measurement period
    if (inputs.measurementPeriod < this.defaultCriteria.minimumMeasurementPeriod) {
      errors.push(`Measurement period (${inputs.measurementPeriod} days) below minimum (${this.defaultCriteria.minimumMeasurementPeriod} days)`);
      confidence *= 0.5;
    }

    // Validate water volume data
    if (inputs.waterVolumeBaseline <= 0) {
      errors.push('Invalid baseline water volume');
      confidence *= 0.3;
    }

    if (inputs.waterVolumeProject <= 0) {
      errors.push('Invalid project water volume');
      confidence *= 0.3;
    }

    // Validate project area
    if (inputs.projectArea <= 0) {
      errors.push('Invalid project area');
      confidence *= 0.7;
    }

    // Validate coordinates
    if (Math.abs(inputs.location.latitude) > 90 || Math.abs(inputs.location.longitude) > 180) {
      errors.push('Invalid GPS coordinates');
      confidence *= 0.6;
    }

    // Validate uncertainty factor
    if (inputs.methodology.uncertaintyFactor > this.defaultCriteria.maximumUncertainty / 100) {
      errors.push(`Uncertainty factor (${inputs.methodology.uncertaintyFactor * 100}%) exceeds maximum (${this.defaultCriteria.maximumUncertainty}%)`);
      confidence *= 0.8;
    }

    return {
      valid: errors.length === 0,
      confidence: confidence >= this.getMinimumConfidence() ? confidence : undefined,
      errors: errors.length > 0 ? errors : undefined
    };
  }

  /**
   * Perform VWBA calculation
   */
  private calculateVWBA(inputs: VWBACalculationInputs): {
    confidenceScore: number;
    results: {
      volumetricWaterBenefit: number;
      baselineVolume: number;
      projectVolume: number;
      netBenefit: number;
      benefitPerHectare: number;
      annualizedBenefit: number;
      uncertaintyRange: {
        lower: number;
        upper: number;
      };
    };
    notes: string;
  } {
    // Core VWBA calculation
    const netBenefit = inputs.waterVolumeProject - inputs.waterVolumeBaseline;
    const benefitPerHectare = netBenefit / inputs.projectArea;
    
    // Annualize the benefit (assuming measurement period represents annual conditions)
    const annualizedBenefit = netBenefit * (365 / inputs.measurementPeriod);
    
    // Calculate uncertainty range
    const uncertaintyFactor = inputs.methodology.uncertaintyFactor;
    const uncertaintyRange = {
      lower: netBenefit * (1 - uncertaintyFactor),
      upper: netBenefit * (1 + uncertaintyFactor)
    };

    // Calculate confidence score based on data quality factors
    let confidenceScore = 1.0;
    
    // Adjust for measurement period completeness
    const periodCompleteness = Math.min(inputs.measurementPeriod / 365, 1.0);
    confidenceScore *= (0.8 + 0.2 * periodCompleteness);
    
    // Adjust for uncertainty
    confidenceScore *= (1 - uncertaintyFactor);
    
    // Adjust for data consistency
    if (netBenefit <= 0) {
      confidenceScore *= 0.5; // Lower confidence for negative benefits
    }

    // Quality checks
    const qualityNotes: string[] = [];
    
    if (inputs.measurementPeriod < 90) {
      qualityNotes.push('Short measurement period may affect accuracy');
    }
    
    if (netBenefit <= 0) {
      qualityNotes.push('Negative water benefit detected - verify baseline calculations');
    }
    
    if (uncertaintyFactor > 0.2) {
      qualityNotes.push('High uncertainty factor - consider additional measurements');
    }

    return {
      confidenceScore: Math.max(0, Math.min(1, confidenceScore)),
      results: {
        volumetricWaterBenefit: Math.max(0, netBenefit), // VWBA doesn't count negative benefits
        baselineVolume: inputs.waterVolumeBaseline,
        projectVolume: inputs.waterVolumeProject,
        netBenefit,
        benefitPerHectare,
        annualizedBenefit,
        uncertaintyRange
      },
      notes: qualityNotes.length > 0 
        ? `Quality notes: ${qualityNotes.join('; ')}` 
        : 'VWBA calculation completed successfully'
    };
  }

  /**
   * Extract numeric value from evidence metadata
   */
  private extractNumericValue(evidence: EvidenceFile, key: string, defaultValue?: number): number {
    if (!evidence.metadata || typeof evidence.metadata !== 'object') {
      if (defaultValue !== undefined) return defaultValue;
      throw new Error(`No metadata found in evidence file ${evidence.fileName}`);
    }

    const value = (evidence.metadata as any)[key];
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
      const parsed = parseFloat(value);
      if (!isNaN(parsed)) return parsed;
    }

    if (defaultValue !== undefined) return defaultValue;
    throw new Error(`Missing or invalid numeric value for ${key} in ${evidence.fileName}`);
  }

  /**
   * Extract string value from evidence metadata
   */
  private extractStringValue(evidence: EvidenceFile, key: string, defaultValue?: string): string {
    if (!evidence.metadata || typeof evidence.metadata !== 'object') {
      if (defaultValue !== undefined) return defaultValue;
      throw new Error(`No metadata found in evidence file ${evidence.fileName}`);
    }

    const value = (evidence.metadata as any)[key];
    if (typeof value === 'string') return value;

    if (defaultValue !== undefined) return defaultValue;
    throw new Error(`Missing or invalid string value for ${key} in ${evidence.fileName}`);
  }

  /**
   * Calculate hash of evidence files for integrity verification
   */
  private calculateEvidenceHash(evidence: EvidenceFile[]): string {
    const crypto = require('crypto');
    const hashes = evidence
      .sort((a, b) => a.id - b.id)
      .map(e => e.fileHash);
    
    return crypto
      .createHash('sha256')
      .update(hashes.join(''))
      .digest('hex');
  }
}